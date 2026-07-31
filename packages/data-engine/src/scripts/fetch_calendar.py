from datetime import date, datetime, timedelta
import time

import schedule
import yfinance as yf

from ..cache import set_cached
from ..fetcher import IDX_TICKERS, get_stock_info

CALENDAR_CACHE_KEY = "market:calendar"
CALENDAR_TTL = 86400


def _iso_date(value):
    if hasattr(value, "date"):
        return value.date().isoformat()
    return str(value)[:10]


def fetch_calendar(days=365):
    today = date.today()
    end = today + timedelta(days=days)
    events = []

    for ticker in IDX_TICKERS:
        code = ticker.replace(".JK", "")
        name = get_stock_info(ticker).get("name", "")
        stock = yf.Ticker(ticker)
        try:
            actions = stock.actions
            if actions is not None and not actions.empty:
                for action_date, row in actions.iterrows():
                    event_date = action_date.date()
                    if event_date < today - timedelta(days=365) or event_date > end:
                        continue
                    dividend = float(row.get("Dividends", 0) or 0)
                    split = float(row.get("Stock Splits", 0) or 0)
                    if dividend > 0:
                        events.append({"date": event_date.isoformat(), "code": code, "name": name, "type": "dividend", "amount": dividend})
                    if split > 0:
                        events.append({"date": event_date.isoformat(), "code": code, "name": name, "type": "split", "ratio": str(split)})
        except Exception:
            pass

        try:
            calendar = stock.calendar
            if isinstance(calendar, dict):
                earnings = calendar.get("Earnings Date") or calendar.get("EarningsDate")
                if earnings:
                    values = earnings if isinstance(earnings, (list, tuple)) else [earnings]
                    for value in values:
                        event_date = _iso_date(value)
                        if today.isoformat() <= event_date <= end.isoformat():
                            events.append({"date": event_date, "code": code, "name": name, "type": "earnings"})
        except Exception:
            pass

    unique = {(event["date"], event["code"], event["type"]): event for event in events}
    result = sorted(unique.values(), key=lambda event: (event["date"], event["code"]))
    set_cached(CALENDAR_CACHE_KEY, result, CALENDAR_TTL)
    return result


def fetch_daily():
    return fetch_calendar(365)


def run_scheduler():
    schedule.every().day.at("06:00").do(fetch_daily)
    fetch_daily()
    while True:
        schedule.run_pending()
        time.sleep(60)


if __name__ == "__main__":
    run_scheduler()
