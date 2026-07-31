from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import JSONResponse
from datetime import datetime
import json
import math

from .fetcher import IDX_TICKERS, IHSG_TICKER, fetch_stock_history, get_stock_info
from .indicators import calculate_all_indicators, detect_signals
from .signals import compute_composite_score, get_composite_direction
from .cache import run_parallel, clear_cache, cache_ttl_status


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

def _enrich_stock(ticker: str, period: str = "3mo") -> dict | None:
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

    return {
        "code": code,
        "name": info.get("name", ""),
        "sector": info.get("sector", ""),
        "price": _safe_float(latest.get("Close")),
        "change_percent": round(chg_pct, 2),
        "volume": int(_safe_float(latest.get("Volume", 0))),
        "market_cap": info.get("market_cap", ""),
        "pe": _safe_float(info.get("pe")),
        "pbv": _safe_float(info.get("pbv")),
        "rsi": _safe_float(latest.get("rsi")),
        "macd": "bullish" if _safe_float(latest.get("macd", 0)) > _safe_float(latest.get("macd_signal", 0)) else "bearish",
        "signals": [s["type"] for s in signals],
        "signals_full": signals,
        "composite_score": compute_composite_score(signals),
        "composite_direction": get_composite_direction(signals),
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

@app.get("/api/stocks")
def list_stocks():
    def _get(t):
        return get_stock_info(t)
    results = [info for info in run_parallel(_get, IDX_TICKERS) if info.get("name")]
    return {"data": results, "total": len(results)}

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

@app.get("/api/screener")
def screener(
    sector: str = Query(None),
    min_price: float = Query(None),
    max_price: float = Query(None),
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
        if sector and item["sector"] != sector:
            continue
        if min_price is not None and (item["price"] is None or item["price"] < min_price):
            continue
        if max_price is not None and (item["price"] is None or item["price"] > max_price):
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
    for e in [x for x in run_parallel(lambda t: _enrich_stock(t, "3mo"), IDX_TICKERS) if x]:
        signals = e["signals_full"]
        if not signals:
            continue
        for s in signals:
            results.append({
                "code": e["code"],
                "name": e["name"],
                "signalType": s["type"],
                "direction": s.get("direction", "neutral"),
                "strength": s.get("strength", 1),
                "score": s.get("score", 0),
                "description": s.get("description", ""),
                "price": e["price"],
                "change_percent": e["change_percent"],
            })

    results.sort(key=lambda x: x.get("score", 0), reverse=True)
    return {"data": results, "total": len(results)}
