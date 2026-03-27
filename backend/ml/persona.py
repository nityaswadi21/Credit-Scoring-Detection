def build_persona_prompt(persona: dict) -> str:
    """Build a persona-specific system prompt prefix from saved persona config."""
    style   = persona.get("investment_style", "General Trader")
    risk    = persona.get("risk_tolerance",   "Adaptable")
    time_h  = persona.get("investment_time",  "Medium-term")
    weights = persona.get("analysis_weights", "Balanced")
    name    = persona.get("name", "AI Advisor")

    style_desc = {
        "General Trader":   "a well-rounded trader who balances various strategies",
        "Day Trader":       (
            "an aggressive day trader focused on intraday price action, short-term momentum, "
            "and technical levels. Prioritise quick entries/exits, intraday catalysts, and volume signals."
        ),
        "Momentum Trader":  (
            "a momentum trader who chases high-relative-strength stocks, breakouts, and trending moves. "
            "Focus on trend continuation, 52-week highs, and sector rotation."
        ),
        "Value Investor":   (
            "a disciplined value investor in the style of Warren Buffett — focused on fundamentals, "
            "margin of safety, P/E, earnings quality, and long-term compounding. Avoid speculation."
        ),
    }.get(style, "a balanced portfolio analyst")

    risk_desc = {
        "Conservative": "Emphasise capital preservation, downside protection, and low-volatility picks.",
        "Adaptable":    "Balance risk and reward; adjust recommendations based on market conditions.",
        "Aggressive":   "Prioritise maximum returns; accept higher volatility and drawdown risk.",
    }.get(risk, "")

    time_desc = {
        "Short-term":  "All advice should target near-term (days to weeks) price moves and catalysts.",
        "Medium-term": "Focus on 1–3 month outlooks and upcoming earnings/events.",
        "Long-term":   "Take a multi-year perspective; ignore short-term noise and focus on durable moats.",
    }.get(time_h, "")

    weight_desc = {
        "Technical":   "Rely primarily on chart patterns, moving averages, RSI, MACD, and support/resistance levels.",
        "Fundamental": "Rely primarily on earnings, revenue growth, valuations, ROE, and management quality.",
        "Balanced":    "Combine technical signals with fundamental analysis equally.",
    }.get(weights, "")

    return (
        f"You are '{name}', {style_desc}. "
        f"{risk_desc} {time_desc} {weight_desc} "
        f"Always tailor your advice to this persona and make it clearly reflect your trading style."
    )
