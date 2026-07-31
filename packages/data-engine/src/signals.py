import pandas as pd
import numpy as np

CONFLUENCE_WEIGHTS = {
    "trend": 25,
    "momentum": 20,
    "setup": 20,
    "volume": 15,
    "relative_strength": 10,
    "liquidity": 10,
}


def compute_confluence_score(
    df: pd.DataFrame,
    signals: list[dict],
    benchmark_return_20: float = 0.0,
) -> dict:
    """Score a stock setup from independent confirmations (maximum 100)."""
    empty = {key: 0 for key in CONFLUENCE_WEIGHTS}
    if df is None or df.empty or "Close" not in df.columns:
        return {"score": 0, "category": "ignored", "components": empty}

    latest = df.iloc[-1]
    close = float(latest.get("Close", 0) or 0)
    components = empty.copy()

    sma20, sma50, sma200 = (latest.get(name) for name in ("sma_20", "sma_50", "sma_200"))
    if pd.notna(sma20) and close > sma20:
        components["trend"] += 8
    if pd.notna(sma20) and pd.notna(sma50) and sma20 > sma50:
        components["trend"] += 9
    if pd.notna(sma200):
        if close > sma200:
            components["trend"] += 8
    elif pd.notna(sma50) and close > sma50:
        components["trend"] += 8  # fallback when history is shorter than 200 sessions

    rsi = latest.get("rsi")
    if pd.notna(rsi):
        if 50 <= rsi <= 65:
            components["momentum"] += 10
        elif 45 <= rsi < 70:
            components["momentum"] += 6
    macd, macd_signal, macd_hist = (latest.get(name) for name in ("macd", "macd_signal", "macd_hist"))
    if pd.notna(macd) and pd.notna(macd_signal) and macd > macd_signal:
        components["momentum"] += 6
    if pd.notna(macd_hist) and macd_hist > 0:
        components["momentum"] += 4

    signal_types = {signal.get("type") for signal in signals if signal.get("direction") == "buy"}
    if "breakout" in signal_types:
        components["setup"] = 20
    elif "golden_cross" in signal_types:
        components["setup"] = 17
    elif "support_bounce" in signal_types:
        components["setup"] = 14
    elif signal_types:
        components["setup"] = 8

    if "Volume" in df.columns and len(df) > 1:
        baseline = df["Volume"].iloc[-21:-1].mean()
        ratio = float(latest.get("Volume", 0) or 0) / baseline if pd.notna(baseline) and baseline > 0 else 0
        components["volume"] = 15 if ratio >= 2 else 12 if ratio >= 1.5 else 8 if ratio >= 1 else 0

    if len(df) >= 21 and float(df.iloc[-21].get("Close", 0) or 0) > 0:
        stock_return = (close / float(df.iloc[-21]["Close"]) - 1) * 100
        excess = stock_return - benchmark_return_20
        components["relative_strength"] = 10 if excess >= 5 else 7 if excess >= 0 else 3 if excess >= -3 else 0

    avg_value = 0.0
    if "Volume" in df.columns:
        avg_value = float((df["Volume"].tail(20) * df["Close"].tail(20)).mean() or 0)
    components["liquidity"] = 10 if avg_value >= 10_000_000_000 else 7 if avg_value >= 2_000_000_000 else 3 if avg_value >= 500_000_000 else 0

    score = min(100, sum(components.values()))
    category = "primary" if score >= 75 else "watchlist" if score >= 60 else "ignored"
    return {"score": score, "category": category, "components": components}

def compute_composite_score(signals: list[dict]) -> float:
    if not signals:
        return 0.0
    weighted = sum(s.get("score", 0) * s.get("strength", 1) for s in signals)
    total_weight = sum(s.get("strength", 1) for s in signals)
    return round(weighted / total_weight, 2) if total_weight > 0 else 0.0

def get_composite_direction(signals: list[dict]) -> str:
    buys = sum(1 for s in signals if s.get("direction") == "buy")
    sells = sum(1 for s in signals if s.get("direction") == "sell")
    if buys > sells:
        return "buy"
    elif sells > buys:
        return "sell"
    return "neutral"

def get_bandarmology_signal(broker_data: dict) -> dict | None:
    total_buy = sum(b.get("buy_vol", 0) for b in broker_data.get("brokers", []))
    total_sell = sum(b.get("sell_vol", 0) for b in broker_data.get("brokers", []))
    total = total_buy + total_sell
    if total == 0:
        return None

    sorted_buyers = sorted(broker_data["brokers"], key=lambda x: x.get("buy_vol", 0), reverse=True)
    sorted_sellers = sorted(broker_data["brokers"], key=lambda x: x.get("sell_vol", 0), reverse=True)

    top5_buy = sum(b.get("buy_vol", 0) for b in sorted_buyers[:5])
    top5_sell = sum(b.get("sell_vol", 0) for b in sorted_sellers[:5])

    net = top5_buy - top5_sell
    net_ratio = (net / total) * 100

    if net_ratio > 30:
        label, direction, strength = "BIG ACCUMULATION", "buy", 3
    elif net_ratio > 10:
        label, direction, strength = "ACCUMULATION", "buy", 2
    elif net_ratio > 0:
        label, direction, strength = "SMALL ACCUMULATION", "buy", 1
    elif net_ratio > -10:
        label, direction, strength = "SMALL DISTRIBUTION", "sell", 1
    elif net_ratio > -30:
        label, direction, strength = "DISTRIBUTION", "sell", 2
    else:
        label, direction, strength = "BIG DISTRIBUTION", "sell", 3

    return {
        "type": "bandarmology",
        "direction": direction,
        "strength": strength,
        "score": min(100, max(0, 50 + net_ratio)),
        "description": f"Top-5 broker: {label} (Net Ratio: {net_ratio:.1f}%)",
        "metadata": {"net_ratio": net_ratio, "label": label, "top5_buy": top5_buy, "top5_sell": top5_sell}
    }
