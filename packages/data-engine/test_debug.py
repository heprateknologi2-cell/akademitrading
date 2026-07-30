from src.fetcher import fetch_stock_history

df = fetch_stock_history("BBCA.JK", "3mo")
if df is not None:
    print("Columns:", list(df.columns))
    print("Shape:", df.shape)
    print("Types:\n", df.dtypes)
    print("\nFirst 2 rows:\n", df.head(2))
    print("\nLast 2 rows:\n", df.tail(2))
