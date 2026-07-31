import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta

from .cache import get_cached, set_cached

HISTORY_TTL = 900
INFO_TTL = 3600

IDX_TICKERS = [
    "BBCA.JK", "BBRI.JK", "BMRI.JK", "BBNI.JK", "BTPS.JK",
    "TLKM.JK", "EXCL.JK", "ISAT.JK",
    "ASII.JK", "UNTR.JK",
    "ADRO.JK", "PTBA.JK", "ITMG.JK",
    "GGRP.JK", "SMGR.JK", "INTP.JK",
    "KLBF.JK", "UNVR.JK", "ICBP.JK", "INDF.JK",
    "CPIN.JK", "JPFA.JK",
    "AKRA.JK", "PGEO.JK",
    "BREN.JK", "TPIA.JK",
    "ARTO.JK", "BBTN.JK",
    "MEDC.JK", "PGAS.JK",
    "JSMR.JK", "ADHI.JK", "PTPP.JK",
    "MNCN.JK", "SCMA.JK",
    "HRUM.JK", "ANTM.JK",
    "TOWR.JK", "TBIG.JK",
    "MTEL.JK", "KEEN.JK",
    "CUAN.JK", "BUKA.JK",
    "GOTO.JK", "BYAN.JK",
]

IHSG_TICKER = "^JKSE"

def fetch_stock_history(ticker: str, period: str = "6mo") -> pd.DataFrame | None:
    cache_key = f"hist:{ticker}:{period}"
    cached = get_cached(cache_key, HISTORY_TTL)
    if cached is not None:
        return cached.copy()
    try:
        stock = yf.Ticker(ticker)
        df = stock.history(period=period)
        if df.empty:
            return None
        df.reset_index(inplace=True)
        df["Ticker"] = ticker
        set_cached(cache_key, df, HISTORY_TTL)
        return df
    except Exception as e:
        print(f"Error fetching {ticker}: {e}")
        return None

def fetch_all_stocks(period: str = "6mo") -> list[pd.DataFrame]:
    results = []
    for ticker in IDX_TICKERS:
        df = fetch_stock_history(ticker, period)
        if df is not None:
            results.append(df)
    return results

def get_stock_info(ticker: str) -> dict:
    cache_key = f"info:{ticker}"
    cached = get_cached(cache_key, INFO_TTL)
    if cached is not None:
        return cached
    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        result = {
            "code": ticker.replace(".JK", ""),
            "name": info.get("longName", ""),
            "sector": _map_sector(info.get("sector", "")),
            "market_cap": _categorize_market_cap(info.get("marketCap", 0)),
            "market_cap_value": info.get("marketCap", 0),
            "total_shares": info.get("sharesOutstanding", 0),
            "pe": info.get("trailingPE"),
            "pbv": info.get("priceToBook"),
            "eps": info.get("trailingEps"),
            "roe": _safe_divide(info.get("netIncomeToCommon", 0), info.get("totalStockholderEquity", 1)) * 100,
            "der": _safe_divide(info.get("totalDebt", 0), info.get("totalStockholderEquity", 1)),
            "dividend_yield": info.get("dividendYield", 0),
        }
        set_cached(cache_key, result, INFO_TTL)
        return result
    except Exception as e:
        print(f"Error fetching info for {ticker}: {e}")
        return {"code": ticker.replace(".JK", "")}

def _map_sector(sector: str) -> str:
    mapping = {
        "Financial Services": "Financials", "Banks": "Financials",
        "Communication Services": "Technology", "Technology": "Technology",
        "Consumer Cyclical": "Consumer Cyclicals", "Consumer Defensive": "Consumer Non-Cyclicals",
        "Energy": "Energy", "Basic Materials": "Basic Materials",
        "Industrials": "Industrials", "Healthcare": "Healthcare",
        "Real Estate": "Property & Real Estate", "Utilities": "Infrastructure",
    }
    return mapping.get(sector, "Others")

def _categorize_market_cap(market_cap: float) -> str:
    if market_cap >= 50_000_000_000_000:
        return "Large Cap"
    elif market_cap >= 10_000_000_000_000:
        return "Mid Cap"
    else:
        return "Small Cap"

def _safe_divide(a: float, b: float) -> float:
    return a / b if b != 0 else 0.0
