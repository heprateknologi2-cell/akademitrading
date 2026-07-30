from src.fetcher import fetch_stock_history, get_stock_info
from src.indicators import calculate_all_indicators, detect_signals
from src.signals import compute_composite_score, get_composite_direction

ticker = "BBCA.JK"
print(f"=== Testing Pipeline for {ticker} ===")

info = get_stock_info(ticker)
print(f"Name: {info.get('name', '')}")
print(f"Sector: {info.get('sector', '')}")
print(f"Market Cap: {info.get('market_cap', '')}")
print(f"PE: {info.get('pe', '')}")

df = fetch_stock_history(ticker, "3mo")
print(f"Data rows: {len(df) if df is not None else 0}")
if df is None or df.empty:
    print("No data fetched!")
    exit(1)

df = calculate_all_indicators(df)
print(f"Indicators: {[c for c in df.columns if c in ['rsi','macd','sma_20','sma_50','bb_upper','atr']]}")

latest = df.iloc[-1]
print(f"Latest - Close: {latest['Close']}, RSI: {latest.get('rsi', 'N/A')}, MACD: {latest.get('macd', 'N/A')}")
print(f"SMA20: {latest.get('sma_20', 'N/A')}, SMA50: {latest.get('sma_50', 'N/A')}")

signals = detect_signals(df)
print(f"Signals detected: {len(signals)}")
for s in signals:
    print(f"  [{s['direction']}] {s['type']} (strength={s['strength']}, score={s['score']})")
    print(f"    {s['description']}")

composite = compute_composite_score(signals)
direction = get_composite_direction(signals)
print(f"\nComposite Score: {composite} ({direction})")
print("\n=== Pipeline OK ===")
