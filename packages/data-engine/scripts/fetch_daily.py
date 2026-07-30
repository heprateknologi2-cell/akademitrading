import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.fetcher import fetch_all_stocks
from src.indicators import calculate_all_indicators, detect_signals
from src.signals import compute_composite_score
import json
import schedule
import time

def run_daily_update():
    print("[Scheduler] Fetching all IDX stocks...")
    dfs = fetch_all_stocks("3mo")
    print(f"[Scheduler] Fetched {len(dfs)} stocks")

    all_signals = []
    for df in dfs:
        if df.empty:
            continue
        df = calculate_all_indicators(df)
        signals = detect_signals(df)
        if signals:
            ticker = df.iloc[0].get("Ticker", "UNKNOWN")
            code = ticker.replace(".JK", "")
            latest = df.iloc[-1]
            all_signals.append({
                "code": code,
                "signals": signals,
                "composite_score": compute_composite_score(signals),
                "price": float(latest.get("Close", 0)),
            })

    all_signals.sort(key=lambda x: x["composite_score"], reverse=True)

    path = Path(__file__).parent.parent / "data"
    path.mkdir(exist_ok=True)
    with open(path / "daily_signals.json", "w") as f:
        json.dump({"date": time.strftime("%Y-%m-%d"), "signals": all_signals}, f, indent=2)

    print(f"[Scheduler] Saved {len(all_signals)} signal results")

if __name__ == "__main__":
    run_daily_update()
    schedule.every(6).hours.do(run_daily_update)
    print("[Scheduler] Running every 6 hours...")
    while True:
        schedule.run_pending()
        time.sleep(60)
