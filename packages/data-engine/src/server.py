from fastapi import FastAPI, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import JSONResponse
from datetime import date, datetime, timedelta
import json
import math
import os
import psycopg2

from .fetcher import IDX_TICKERS, IHSG_TICKER, fetch_stock_history, get_stock_info
from .indicators import calculate_all_indicators, detect_signals
from .signals import compute_composite_score, compute_confluence_score, get_composite_direction
from .cache import run_parallel, clear_cache, cache_ttl_status, get_cached


class SafeJSONResponse(JSONResponse):
    def render(self, content):
        return json.dumps(self._clean(content), ensure_ascii=False, allow_nan=False).encode("utf-8")

    @staticmethod
    def _clean(obj):
        if isinstance(obj, float):
            if math.isnan(obj) or math.isinf(obj):
                return None
            return obj
        if isinstance(obj, dict):
            return {k: SafeJSONResponse._clean(v) for k, v in obj.items()}
        if isinstance(obj, (list, tuple)):
            return [SafeJSONResponse._clean(v) for v in obj]
        return obj


app = FastAPI(title="Akademitrading Data Engine", version="1.1.0", default_response_class=SafeJSONResponse)


class SignalConnectionManager:
    def __init__(self):
        self.connections = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.connections.add(websocket)

    def disconnect(self, websocket: WebSocket):
        self.connections.discard(websocket)

    async def broadcast(self, payload):
        disconnected = []
        for websocket in self.connections:
            try:
                await websocket.send_json(payload)
            except Exception:
                disconnected.append(websocket)
        for websocket in disconnected:
            self.disconnect(websocket)


signal_manager = SignalConnectionManager()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def _safe_float(val, default=0.0):
    if val is None:
        return default
    try:
        f = float(val)
    except (ValueError, TypeError):
        return default
    if math.isnan(f) or math.isinf(f):
        return default
    return f

def _enrich_stock(ticker: str, period: str = "3mo", benchmark_return_20: float = 0.0) -> dict | None:
    code = ticker.replace(".JK", "")
    info = get_stock_info(ticker)
    df = fetch_stock_history(ticker, period)
    if df is None or df.empty:
        return None
    df = calculate_all_indicators(df)
    signals = detect_signals(df)
    latest = df.iloc[-1]

    chg_pct = 0.0
    if len(df) > 1 and df.iloc[-2].get("Close", 0):
        chg_pct = _safe_float((latest["Close"] - df.iloc[-2]["Close"]) / df.iloc[-2]["Close"] * 100)

    recent_volume = df["Volume"].tail(20) if "Volume" in df.columns else []
    avg_volume_20 = int(_safe_float(recent_volume.mean())) if len(recent_volume) else 0
    price = _safe_float(latest.get("Close"))
    atr = _safe_float(latest.get("atr"))
    atr_percent = round((atr / price * 100), 2) if price > 0 else 0.0
    confluence = compute_confluence_score(df, signals, benchmark_return_20)

    return {
        "code": code,
        "name": info.get("name", ""),
        "sector": info.get("sector", ""),
        "price": price,
        "change_percent": round(chg_pct, 2),
        "volume": int(_safe_float(latest.get("Volume", 0))),
        "avg_volume_20": avg_volume_20,
        "avg_value_20": round(avg_volume_20 * price),
        "market_cap": info.get("market_cap", ""),
        "market_cap_value": _safe_float(info.get("market_cap_value")),
        "pe": _safe_float(info.get("pe")),
        "pbv": _safe_float(info.get("pbv")),
        "dividend_yield": _safe_float(info.get("dividend_yield")),
        "rsi": _safe_float(latest.get("rsi")),
        "atr": atr,
        "atr_percent": atr_percent,
        "macd": "bullish" if _safe_float(latest.get("macd", 0)) > _safe_float(latest.get("macd_signal", 0)) else "bearish",
        "signals": [s["type"] for s in signals],
        "signals_full": signals,
        "composite_score": compute_composite_score(signals),
        "composite_direction": get_composite_direction(signals),
        "confluence_score": confluence["score"],
        "confluence_category": confluence["category"],
        "confluence_components": confluence["components"],
        "latest": latest,
    }

@app.get("/health")
def health():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

@app.get("/api/cache/status")
def cache_status():
    return cache_ttl_status()

@app.post("/api/cache/clear")
def cache_clear():
    clear_cache()
    return {"status": "cleared"}

@app.websocket("/ws/signals")
async def signals_websocket(websocket: WebSocket):
    await signal_manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        signal_manager.disconnect(websocket)

@app.post("/api/signals/broadcast")
async def broadcast_signals(payload: dict):
    signals = payload.get("signals", payload.get("data", []))
    await signal_manager.broadcast({"type": "signals", "data": signals})
    return {"status": "broadcast", "clients": len(signal_manager.connections)}

@app.get("/api/stocks")
def list_stocks(search: str = Query(None)):
    def _get(t):
        return get_stock_info(t)
    results = [info for info in run_parallel(_get, IDX_TICKERS) if info.get("name")]
    if search:
        term = search.strip().lower()
        results = [info for info in results if term in info.get("code", "").lower() or term in info.get("name", "").lower()]
    return {"data": results, "total": len(results)}

@app.get("/api/stocks/codes")
def list_stock_codes():
    codes = [t.replace(".JK", "") for t in IDX_TICKERS]
    return {"data": codes}

@app.get("/api/stocks/prices")
def stocks_prices(codes: str = Query("")):
    wanted = set(c for c in codes.split(",") if c)
    if not wanted:
        return {"data": {}}
    tickers = [f"{c}.JK" for c in wanted if f"{c}.JK" in IDX_TICKERS]
    enriched = [e for e in run_parallel(lambda t: _enrich_stock(t, "1mo"), tickers) if e]
    return {"data": {e["code"]: {"price": e["price"], "change_percent": e["change_percent"]} for e in enriched}}

@app.get("/api/stocks/{code}")
def stock_detail(code: str):
    ticker = f"{code}.JK"
    info = get_stock_info(ticker)
    df = fetch_stock_history(ticker, "6mo")
    if df is not None:
        df = calculate_all_indicators(df)
        signals = detect_signals(df)
        latest = df.iloc[-1]
        return {
            "data": {
                **info,
                "price": _safe_float(latest.get("Close")),
                "open": _safe_float(latest.get("Open")),
                "high": _safe_float(latest.get("High")),
                "low": _safe_float(latest.get("Low")),
                "volume": int(_safe_float(latest.get("Volume", 0))),
                "change": _safe_float(latest.get("Close", 0) - df.iloc[-2].get("Close", 0)) if len(df) > 1 else 0,
                "change_percent": _safe_float((latest.get("Close", 0) - df.iloc[-2].get("Close", 0)) / df.iloc[-2].get("Close", 0) * 100) if len(df) > 1 and df.iloc[-2].get("Close", 0) else 0,
                "indicators": {k: _safe_float(latest.get(k)) for k in ["rsi", "macd", "macd_signal", "macd_hist", "sma_20", "sma_50", "sma_200", "bb_upper", "bb_lower", "bb_middle", "atr", "mfi", "obv"]},
                "signals": signals,
                "composite_score": compute_composite_score(signals),
                "composite_direction": get_composite_direction(signals),
            }
        }
    return {"data": info}

@app.get("/api/stocks/{code}/history")
def stock_history(code: str, range: str = Query("6mo")):
    ticker = f"{code}.JK"
    df = fetch_stock_history(ticker, range)
    if df is None or df.empty:
        return {"data": []}
    df = calculate_all_indicators(df)
    rows = []
    for _, row in df.iterrows():
        rows.append({
            "date": row["Date"].strftime("%Y-%m-%d") if hasattr(row["Date"], "strftime") else str(row["Date"]),
            "open": _safe_float(row.get("Open")),
            "high": _safe_float(row.get("High")),
            "low": _safe_float(row.get("Low")),
            "close": _safe_float(row.get("Close")),
            "volume": int(_safe_float(row.get("Volume", 0))),
            "sma_20": _safe_float(row.get("sma_20"), None),
            "sma_50": _safe_float(row.get("sma_50"), None),
            "sma_200": _safe_float(row.get("sma_200"), None),
            "bb_upper": _safe_float(row.get("bb_upper"), None),
            "bb_lower": _safe_float(row.get("bb_lower"), None),
        })
    return {"data": rows, "total": len(rows)}

@app.get("/api/stocks/{code}/rating")
def stock_rating(code: str):
    enriched = _enrich_stock(f"{code.upper()}.JK", "6mo")
    signals = enriched.get("signals_full", []) if enriched else []
    buy_count = sum(1 for signal in signals if signal.get("direction") == "buy")
    sell_count = sum(1 for signal in signals if signal.get("direction") == "sell")
    neutral_count = len(signals) - buy_count - sell_count
    difference = buy_count - sell_count
    if difference >= 3:
        rating = "Strong Buy"
    elif difference >= 2:
        rating = "Buy"
    elif difference <= -3:
        rating = "Strong Sell"
    elif difference <= -2:
        rating = "Sell"
    else:
        rating = "Neutral"
    total = len(signals)
    confidence = round(max(buy_count, sell_count, neutral_count) / total * 100, 1) if total else 0
    return {"data": {"rating": rating, "buy_count": buy_count, "sell_count": sell_count, "neutral_count": neutral_count, "total_signals": total, "confidence": confidence}}

@app.get("/api/market/overview")
def market_overview():
    index_df = fetch_stock_history(IHSG_TICKER, "1mo")
    ihsg = {}
    if index_df is not None and not index_df.empty:
        last = index_df.iloc[-1]
        prev = index_df.iloc[-2] if len(index_df) > 1 else last
        chg_pct = 0.0
        if prev.get("Close", 0):
            chg_pct = _safe_float((last["Close"] - prev["Close"]) / prev["Close"] * 100)
        ihsg = {
            "name": "IHSG",
            "price": _safe_float(last.get("Close")),
            "change_percent": round(chg_pct, 2),
            "volume": int(_safe_float(last.get("Volume", 0))),
        }

    enriched = [e for e in run_parallel(lambda t: _enrich_stock(t, "3mo"), IDX_TICKERS) if e]
    if not enriched:
        return {"data": {"ihsg": ihsg, "breadth": {"advancers": 0, "decliners": 0, "unchanged": 0}, "top_gainers": [], "top_losers": [], "most_active": []}}

    advancers = sum(1 for e in enriched if e["change_percent"] > 0)
    decliners = sum(1 for e in enriched if e["change_percent"] < 0)
    unchanged = len(enriched) - advancers - decliners

    top_gainers = sorted(enriched, key=lambda e: e["change_percent"], reverse=True)[:5]
    top_losers = sorted(enriched, key=lambda e: e["change_percent"])[:5]
    most_active = sorted(enriched, key=lambda e: e["volume"], reverse=True)[:5]

    def _trim(item):
        return {k: v for k, v in item.items() if k != "latest"}

    return {
        "data": {
            "ihsg": ihsg,
            "breadth": {"advancers": advancers, "decliners": decliners, "unchanged": unchanged, "total": len(enriched)},
            "top_gainers": [_trim(e) for e in top_gainers],
            "top_losers": [_trim(e) for e in top_losers],
            "most_active": [_trim(e) for e in most_active],
        }
    }

@app.get("/api/market/heatmap")
def market_heatmap():
    enriched = [e for e in run_parallel(lambda t: _enrich_stock(t, "1mo"), IDX_TICKERS) if e]
    grouped = {}
    for item in enriched:
        sector = item.get("sector") or "Others"
        grouped.setdefault(sector, []).append(item)

    data = []
    for sector, items in grouped.items():
        tickers = [{
            "code": item["code"],
            "name": item["name"],
            "price": item["price"],
            "change_percent": item["change_percent"],
            "market_cap": item["market_cap_value"],
        } for item in items]
        data.append({
            "sector": sector,
            "avg_change": round(sum(item["change_percent"] for item in items) / len(items), 2),
            "market_cap": sum(item["market_cap_value"] for item in items),
            "count": len(items),
            "tickers": tickers,
        })

    data.sort(key=lambda item: item["market_cap"], reverse=True)
    return {"data": data}

@app.get("/api/market/sectors")
def market_sectors():
    enriched = [e for e in run_parallel(lambda t: _enrich_stock(t, "1mo"), IDX_TICKERS) if e]
    grouped = {}
    for item in enriched:
        sector = item.get("sector") or "Others"
        grouped.setdefault(sector, []).append(item)

    data = []
    for sector, items in grouped.items():
        top_gainer = max(items, key=lambda item: item["change_percent"])
        top_loser = min(items, key=lambda item: item["change_percent"])
        data.append({
            "sector": sector,
            "avg_change": round(sum(item["change_percent"] for item in items) / len(items), 2),
            "advancers": sum(1 for item in items if item["change_percent"] > 0),
            "decliners": sum(1 for item in items if item["change_percent"] < 0),
            "top_gainer": {"code": top_gainer["code"], "change": top_gainer["change_percent"]},
            "top_loser": {"code": top_loser["code"], "change": top_loser["change_percent"]},
            "total_market_cap": sum(item["market_cap_value"] for item in items),
        })

    data.sort(key=lambda item: item["avg_change"], reverse=True)
    return {"data": data}

@app.get("/api/calendar")
def market_calendar(
    type: str = Query(None),
    from_date: date = Query(None, alias="from"),
    to_date: date = Query(None, alias="to"),
):
    from .scripts.fetch_calendar import CALENDAR_CACHE_KEY, CALENDAR_TTL, fetch_calendar

    events = get_cached(CALENDAR_CACHE_KEY, CALENDAR_TTL)
    if events is None:
        events = fetch_calendar(365)
    start = from_date or date.today()
    end = to_date or start + timedelta(days=365)
    filtered = [event for event in events if start.isoformat() <= event["date"] <= end.isoformat()]
    if type:
        filtered = [event for event in filtered if event["type"] == type]
    return {"data": filtered}

@app.get("/api/dividends")
def list_dividends(
    code: str = Query(None),
    from_date: date = Query(None, alias="from"),
    to_date: date = Query(None, alias="to"),
    upcoming: bool = Query(False),
    days: int = Query(30, ge=1, le=365),
):
    start = from_date or (date.today() if upcoming else date.today() - timedelta(days=365))
    end = to_date or (date.today() + timedelta(days=days) if upcoming else date.today() + timedelta(days=365))
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        try:
            query = "SELECT code, name, ex_date, payment_date, amount_per_share, ratio, type FROM dividends WHERE ex_date BETWEEN %s AND %s"
            params = [start, end]
            if code:
                query += " AND code = %s"
                params.append(code.upper())
            query += " ORDER BY ex_date"
            with psycopg2.connect(database_url) as connection:
                with connection.cursor() as cursor:
                    cursor.execute(query, params)
                    rows = cursor.fetchall()
            return {"data": [{"code": row[0], "name": row[1], "ex_date": row[2].isoformat(), "payment_date": row[3].isoformat() if row[3] else None, "amount": _safe_float(row[4], None), "ratio": row[5], "type": row[6]} for row in rows]}
        except Exception:
            pass
    from .scripts.fetch_calendar import CALENDAR_CACHE_KEY, CALENDAR_TTL, fetch_calendar
    events = get_cached(CALENDAR_CACHE_KEY, CALENDAR_TTL) or fetch_calendar(365)
    data = [{"code": event["code"], "name": event["name"], "ex_date": event["date"], "payment_date": None, "amount": event.get("amount"), "ratio": event.get("ratio"), "type": "cash" if event["type"] == "dividend" else event["type"]} for event in events if event["type"] in ("dividend", "split") and start.isoformat() <= event["date"] <= end.isoformat() and (not code or event["code"] == code.upper())]
    return {"data": data}

@app.get("/api/dividends/notifications")
def dividend_notifications(days: int = Query(3, ge=1, le=30)):
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        return {"data": []}
    try:
        with psycopg2.connect(database_url) as connection:
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT DISTINCT u.telegram_id, d.code, d.name, d.ex_date, d.amount_per_share
                    FROM users u
                    JOIN (
                      SELECT user_id, stock_code AS code FROM watchlists
                      UNION SELECT user_id, code FROM positions WHERE status = 'open'
                    ) holdings ON holdings.user_id = u.id::text OR holdings.user_id = u.email
                    JOIN dividends d ON d.code = holdings.code
                    WHERE u.telegram_id IS NOT NULL AND d.ex_date BETWEEN CURRENT_DATE AND CURRENT_DATE + %s
                    ORDER BY d.ex_date
                """, (days,))
                rows = cursor.fetchall()
        return {"data": [{"telegram_id": row[0], "code": row[1], "name": row[2], "ex_date": row[3].isoformat(), "amount": _safe_float(row[4], None)} for row in rows]}
    except Exception:
        return {"data": []}

@app.get("/api/screener")
def screener(
    search: str = Query(None),
    sector: str = Query(None),
    min_price: float = Query(None),
    max_price: float = Query(None),
    min_pe: float = Query(None),
    max_pe: float = Query(None),
    min_pbv: float = Query(None),
    max_pbv: float = Query(None),
    min_dividend_yield: float = Query(None),
    min_avg_value: float = Query(None),
    max_atr_percent: float = Query(None),
    rsi_filter: str = Query(None),
    macd_filter: str = Query(None),
    signal_filter: str = Query(None),
    sort_by: str = Query("change_percent"),
    sort_order: str = Query("desc"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    enriched = [e for e in run_parallel(lambda t: _enrich_stock(t, "3mo"), IDX_TICKERS) if e]
    results = []
    for item in enriched:
        if search and search.lower() not in f'{item["code"]} {item["name"]}'.lower():
            continue
        if sector and item["sector"] != sector:
            continue
        if min_price is not None and (item["price"] is None or item["price"] < min_price):
            continue
        if max_price is not None and (item["price"] is None or item["price"] > max_price):
            continue
        if min_pe is not None and (item["pe"] is None or item["pe"] < min_pe):
            continue
        if max_pe is not None and (item["pe"] is None or item["pe"] > max_pe):
            continue
        if min_pbv is not None and (item["pbv"] is None or item["pbv"] < min_pbv):
            continue
        if max_pbv is not None and (item["pbv"] is None or item["pbv"] > max_pbv):
            continue
        if min_dividend_yield is not None and (item.get("dividend_yield") is None or item["dividend_yield"] < min_dividend_yield):
            continue
        if min_avg_value is not None and item.get("avg_value_20", 0) < min_avg_value:
            continue
        if max_atr_percent is not None and item.get("atr_percent", 0) > max_atr_percent:
            continue
        if rsi_filter == "oversold" and (item["rsi"] is None or item["rsi"] >= 30):
            continue
        if rsi_filter == "overbought" and (item["rsi"] is None or item["rsi"] <= 70):
            continue
        if macd_filter and item["macd"] != macd_filter:
            continue
        if signal_filter and signal_filter not in item["signals"]:
            continue
        results.append(item)

    reverse = sort_order == "desc"
    if results and sort_by in results[0]:
        results.sort(key=lambda x: x.get(sort_by, 0) or 0, reverse=reverse)

    total = len(results)
    start = (page - 1) * limit
    end = start + limit
    trimmed = [{k: v for k, v in r.items() if k != "latest"} for r in results[start:end]]
    return {"data": trimmed, "total": total, "page": page, "limit": limit}

@app.get("/api/signals/today")
def today_signals():
    results = []
    benchmark_return_20 = 0.0
    benchmark = fetch_stock_history(IHSG_TICKER, "3mo")
    if benchmark is not None and len(benchmark) >= 21 and benchmark.iloc[-21].get("Close", 0):
        benchmark_return_20 = (benchmark.iloc[-1]["Close"] / benchmark.iloc[-21]["Close"] - 1) * 100
    for e in [x for x in run_parallel(lambda t: _enrich_stock(t, "3mo", benchmark_return_20), IDX_TICKERS) if x]:
        signals = e["signals_full"]
        if not signals or e["confluence_category"] == "ignored":
            continue
        for s in signals:
            results.append({
                "code": e["code"],
                "name": e["name"],
                "signalType": s["type"],
                "direction": s.get("direction", "neutral"),
                "strength": s.get("strength", 1),
                "score": e["confluence_score"],
                "indicator_score": s.get("score", 0),
                "category": e["confluence_category"],
                "components": e["confluence_components"],
                "description": s.get("description", ""),
                "price": e["price"],
                "change_percent": e["change_percent"],
                "atr": e["atr"],
                "stop_loss": round(e["price"] + 1.5 * e["atr"], 2) if s.get("direction") == "sell" else round(e["price"] - 1.5 * e["atr"], 2),
                "take_profit": round(e["price"] - 3 * e["atr"], 2) if s.get("direction") == "sell" else round(e["price"] + 3 * e["atr"], 2),
            })

    results.sort(key=lambda x: x.get("score", 0), reverse=True)
    return {"data": results, "total": len(results)}
