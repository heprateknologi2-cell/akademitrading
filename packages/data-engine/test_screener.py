import pandas as pd
import sys, time
sys.path.insert(0, ".")
from src.fetcher import IDX_TICKERS, fetch_stock_history, get_stock_info
from src.indicators import calculate_all_indicators, detect_signals
from src.signals import compute_composite_score, get_composite_direction

start = time.time()
results = []
signal_counts = {}

for ticker in IDX_TICKERS:
    code = ticker.replace(".JK", "")
    info = get_stock_info(ticker)
    df = fetch_stock_history(ticker, "3mo")
    if df is None or df.empty:
        continue
    df = calculate_all_indicators(df)
    latest = df.iloc[-1]
    signals = detect_signals(df)
    score = compute_composite_score(signals)
    direction = get_composite_direction(signals)

    for s in signals:
        stype = s["type"]
        signal_counts[stype] = signal_counts.get(stype, 0) + 1

    results.append({
        "code": code, "name": info.get("name", ""), "sector": info.get("sector", ""),
        "price": float(latest.get("Close", 0)),
        "rsi": float(latest.get("rsi", 0)) if latest.get("rsi") and not pd.isna(latest.get("rsi")) else None,
        "score": score, "direction": direction, "signal_count": len(signals),
        "signal_types": [s["type"] for s in signals],
    })

results.sort(key=lambda x: x["score"], reverse=True)
elapsed = time.time() - start

print(f"\nProcessed {len(results)} stocks in {elapsed:.1f}s")
print(f"\nSignal Distribution:")
for stype, count in sorted(signal_counts.items(), key=lambda x: x[1], reverse=True):
    print(f"  {stype:20s}: {count}")
print(f"\nTop 15 by Composite Score:")
print(f"{'CODE':6s} {'SCORE':>6s} {'DIR':>6s} {'RSI':>6s} {'SIG':>4s} {'SECTOR':20s} {'PRICE':>10s}")
print("-" * 80)
for r in results[:15]:
    rsi_str = f"{r['rsi']:.1f}" if r['rsi'] else "-"
    sig_str = ",".join(r["signal_types"][:2]) if r["signal_types"] else "-"
    print(f"{r['code']:6s} {r['score']:6.1f} {r['direction']:>6s} {rsi_str:>6s} {r['signal_count']:4d} {r['sector']:20s} {r['price']:>10.0f}")
