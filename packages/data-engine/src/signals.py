import pandas as pd
import numpy as np

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
