import pandas as pd
import numpy as np
import ta

def calculate_all_indicators(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty or "Close" not in df.columns:
        return df

    df = df.copy()
    df.sort_values("Date" if "Date" in df.columns else "date", inplace=True)

    df.dropna(subset=["Close"], inplace=True)
    if df.empty:
        return df

    close = df["Close"]
    high = df["High"]
    low = df["Low"]
    volume = df["Volume"]

    df["rsi"] = ta.momentum.RSIIndicator(close, window=14).rsi()

    macd = ta.trend.MACD(close)
    df["macd"] = macd.macd()
    df["macd_signal"] = macd.macd_signal()
    df["macd_hist"] = macd.macd_diff()

    df["sma_20"] = ta.trend.SMAIndicator(close, window=20).sma_indicator()
    df["sma_50"] = ta.trend.SMAIndicator(close, window=50).sma_indicator()
    df["sma_200"] = ta.trend.SMAIndicator(close, window=200).sma_indicator()

    bb = ta.volatility.BollingerBands(close, window=20, window_dev=2)
    df["bb_upper"] = bb.bollinger_hband()
    df["bb_lower"] = bb.bollinger_lband()
    df["bb_middle"] = bb.bollinger_mavg()

    df["atr"] = ta.volatility.AverageTrueRange(high, low, close, window=14).average_true_range()

    df["obv"] = ta.volume.OnBalanceVolumeIndicator(close, volume).on_balance_volume()

    df["mfi"] = ta.volume.MFIIndicator(high, low, close, volume, window=14).money_flow_index()

    return df

def detect_signals(df: pd.DataFrame) -> list[dict]:
    signals = []
    if df.empty or len(df) < 50:
        return signals

    latest = df.iloc[-1]
    prev = df.iloc[-2] if len(df) > 1 else latest

    rsi = latest.get("rsi")
    if pd.notna(rsi) and 0 < rsi < 100:
        if rsi < 30:
            signals.append({"type": "rsi_oversold", "direction": "buy", "strength": 2, "score": 85.0,
                          "description": f"RSI {rsi:.1f} — Oversold, potensi reversal naik"})
        elif rsi > 70:
            signals.append({"type": "rsi_overbought", "direction": "sell", "strength": 2, "score": 75.0,
                          "description": f"RSI {rsi:.1f} — Overbought, waspada koreksi"})

    if pd.notna(latest.get("sma_20")) and pd.notna(latest.get("sma_50")):
        prev_golden = prev.get("sma_20", 0) <= prev.get("sma_50", 0)
        curr_golden = latest["sma_20"] > latest["sma_50"]
        if prev_golden and curr_golden:
            signals.append({"type": "golden_cross", "direction": "buy", "strength": 3, "score": 90.0,
                          "description": "SMA 20 cross above SMA 50 — Golden Cross, bullish trend"})
        prev_death = prev.get("sma_20", 0) >= prev.get("sma_50", 0)
        curr_death = latest["sma_20"] < latest["sma_50"]
        if prev_death and curr_death:
            signals.append({"type": "death_cross", "direction": "sell", "strength": 3, "score": 85.0,
                          "description": "SMA 20 cross below SMA 50 — Death Cross, bearish trend"})

    if pd.notna(latest.get("macd")) and pd.notna(latest.get("macd_signal")):
        prev_macd = prev.get("macd", 0) <= prev.get("macd_signal", 0)
        curr_macd = latest["macd"] > latest["macd_signal"]
        if prev_macd and curr_macd:
            signals.append({"type": "macd_bullish", "direction": "buy", "strength": 2, "score": 80.0,
                          "description": "MACD line cross above Signal — bullish momentum"})
        prev_macd2 = prev.get("macd", 0) >= prev.get("macd_signal", 0)
        curr_macd2 = latest["macd"] < latest["macd_signal"]
        if prev_macd2 and curr_macd2:
            signals.append({"type": "macd_bearish", "direction": "sell", "strength": 2, "score": 75.0,
                          "description": "MACD line cross below Signal — bearish momentum"})

    if pd.notna(latest.get("Volume")) and len(df) > 20:
        avg_vol = df["Volume"].tail(20).mean()
        if avg_vol > 0 and latest["Volume"] > 2 * avg_vol:
            signals.append({"type": "volume_spike", "direction": "neutral", "strength": 1, "score": 70.0,
                          "description": f"Volume spike: {latest['Volume']:.0f} vs avg {avg_vol:.0f} ({(latest['Volume']/avg_vol):.1f}x)"})

    if pd.notna(latest.get("Close")) and len(df) > 20:
        high_20 = df["High"].tail(20).max()
        if high_20 > 0 and latest["Close"] >= high_20:
            signals.append({"type": "breakout", "direction": "buy", "strength": 3, "score": 85.0,
                          "description": f"Breakout! Price at highest in 20 days ({latest['Close']:.0f})"})

    if pd.notna(latest.get("Close")) and pd.notna(latest.get("sma_20")) and len(df) > 5:
        low_5 = df["Low"].tail(5).min()
        sma_20 = latest["sma_20"]
        if sma_20 > 0 and abs(latest["Close"] - sma_20) / sma_20 < 0.01:
            signals.append({"type": "support_bounce", "direction": "buy", "strength": 1, "score": 70.0,
                          "description": f"Price near SMA 20 ({sma_20:.0f}) — support bounce potential"})

    return signals
