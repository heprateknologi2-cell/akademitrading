from datetime import date, timedelta
import os
import time

import psycopg2
import schedule
import yfinance as yf

from ..fetcher import IDX_TICKERS, get_stock_info


def fetch_dividends():
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL belum dikonfigurasi")
    start = date.today() - timedelta(days=365)
    rows = []
    for ticker in IDX_TICKERS:
        code = ticker.replace(".JK", "")
        name = get_stock_info(ticker).get("name", "")
        try:
            actions = yf.Ticker(ticker).actions
            for action_date, action in actions.iterrows():
                if action_date.date() < start:
                    continue
                dividend = float(action.get("Dividends", 0) or 0)
                split = float(action.get("Stock Splits", 0) or 0)
                if dividend > 0:
                    rows.append((code, name, action_date.to_pydatetime(), dividend, None, "cash", "yfinance"))
                if split > 0:
                    rows.append((code, name, action_date.to_pydatetime(), None, str(split), "split", "yfinance"))
        except Exception:
            continue

    with psycopg2.connect(database_url) as connection:
        with connection.cursor() as cursor:
            cursor.executemany("""
                INSERT INTO dividends (code, name, ex_date, amount_per_share, ratio, type, source)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (code, ex_date) DO UPDATE SET
                  name = EXCLUDED.name, amount_per_share = EXCLUDED.amount_per_share,
                  ratio = EXCLUDED.ratio, type = EXCLUDED.type, source = EXCLUDED.source
            """, rows)
    return len(rows)


def run_scheduler():
    schedule.every().day.at("06:00").do(fetch_dividends)
    while True:
        schedule.run_pending()
        time.sleep(60)


if __name__ == "__main__":
    run_scheduler()
