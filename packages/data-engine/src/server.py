from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import yfinance as yf
import json

from .fetcher import IDX_TICKERS, fetch_stock_history, get_stock_info
from .indicators import calculate_all_indicators, detect_signals
from .signals import compute_composite_score, get_composite_direction

app = FastAPI(title="Akademitrading Data Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

@app.get("/api/stocks")
def list_stocks():
    results = []
    for ticker in IDX_TICKERS:
        info = get_stock_info(ticker)
        if info.get("name"):
            results.append(info)
    return {"data": results, "total": len(results)}

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
                "price": float(latest.get("Close", 0)),
                "open": float(latest.get("Open", 0)),
                "high": float(latest.get("High", 0)),
                "low": float(latest.get("Low", 0)),
                "volume": int(latest.get("Volume", 0)),
                "change": float(latest.get("Close", 0) - df.iloc[-2].get("Close", 0)) if len(df) > 1 else 0,
                "change_percent": float((latest.get("Close", 0) - df.iloc[-2].get("Close", 0)) / df.iloc[-2].get("Close", 0) * 100) if len(df) > 1 and df.iloc[-2].get("Close", 0) else 0,
                "indicators": {k: _safe_float(latest.get(k)) for k in ["rsi", "macd", "macd_signal", "macd_hist", "sma_20", "sma_50", "sma_200", "bb_upper", "bb_lower", "bb_middle", "atr"]},
                "signals": signals,
                "composite_score": compute_composite_score(signals),
                "composite_direction": get_composite_direction(signals),
            }
        }
    return {"data": info}

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
    results = []
    for ticker in IDX_TICKERS:
        code = ticker.replace(".JK", "")
        info = get_stock_info(ticker)
        df = fetch_stock_history(ticker, "3mo")
        if df is None or df.empty:
            continue
        df = calculate_all_indicators(df)
        signals = detect_signals(df)
        latest = df.iloc[-1]

        chg_pct = 0.0
        if len(df) > 1 and df.iloc[-2].get("Close", 0):
            chg_pct = float((latest["Close"] - df.iloc[-2]["Close"]) / df.iloc[-2]["Close"] * 100)

        item = {
            "code": code,
            "name": info.get("name", ""),
            "sector": info.get("sector", ""),
            "price": _safe_float(latest.get("Close")),
            "change_percent": round(chg_pct, 2),
            "volume": int(latest.get("Volume", 0)),
            "market_cap": info.get("market_cap", ""),
            "pe": _safe_float(info.get("pe")),
            "pbv": _safe_float(info.get("pbv")),
            "rsi": _safe_float(latest.get("rsi")),
            "macd": "bullish" if _safe_float(latest.get("macd", 0)) > _safe_float(latest.get("macd_signal", 0)) else "bearish",
            "signals": [s["type"] for s in signals],
            "composite_score": compute_composite_score(signals),
            "composite_direction": get_composite_direction(signals),
        }

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
    if sort_by in results[0] if results else []:
        results.sort(key=lambda x: x.get(sort_by, 0) or 0, reverse=reverse)

    total = len(results)
    start = (page - 1) * limit
    end = start + limit
    return {"data": results[start:end], "total": total, "page": page, "limit": limit}

@app.get("/api/signals/today")
def today_signals():
    results = []
    for ticker in IDX_TICKERS:
        code = ticker.replace(".JK", "")
        df = fetch_stock_history(ticker, "3mo")
        if df is None or df.empty:
            continue
        df = calculate_all_indicators(df)
        signals = detect_signals(df)
        if not signals:
            continue
        latest = df.iloc[-1]
        chg_pct = 0.0
        if len(df) > 1 and df.iloc[-2].get("Close", 0):
            chg_pct = float((latest["Close"] - df.iloc[-2]["Close"]) / df.iloc[-2]["Close"] * 100)
        for s in signals:
            results.append({
                "code": code,
                "name": get_stock_info(ticker).get("name", ""),
                **s,
                "price": _safe_float(latest.get("Close")),
                "change_percent": round(chg_pct, 2),
            })

    results.sort(key=lambda x: x.get("score", 0), reverse=True)
    return {"data": results, "total": len(results)}

def _safe_float(val, default=0.0):
    if val is None:
        return default
    try:
        return float(val)
    except (ValueError, TypeError):
        return default
