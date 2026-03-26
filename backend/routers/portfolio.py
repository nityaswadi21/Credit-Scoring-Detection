import os
import json
import hashlib
import requests
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv
import anthropic

load_dotenv()

router = APIRouter(prefix="/portfolio", tags=["portfolio"])

KITE_API_KEY     = os.getenv("KITE_API_KEY", "")
KITE_API_SECRET  = os.getenv("KITE_API_SECRET", "")
KITE_ACCESS_TOKEN = os.getenv("KITE_ACCESS_TOKEN", "")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
USE_MOCK_DATA    = os.getenv("USE_MOCK_DATA", "true").lower() == "true"
KITE_BASE_URL    = "https://api.kite.trade"

# ---------------------------------------------------------------------------
# Mock data — 6 realistic Indian equity holdings (NSE, CNC product)
# Fields mirror the Zerodha Kite Connect GET /portfolio/holdings response:
#   https://kite.trade/docs/connect/v3/portfolio/#holdings
# ---------------------------------------------------------------------------
MOCK_HOLDINGS = [
    {
        "tradingsymbol":       "INFY",
        "exchange":            "NSE",
        "isin":                "INE009A01021",
        "quantity":            15,
        "average_price":       1420.50,   # avg buy price per share
        "last_price":          1567.80,   # current market price
        "pnl":                 2209.50,   # unrealised P&L = (last - avg) * qty
        "day_change":          12.30,     # price change vs yesterday's close
        "day_change_percentage": 0.79,
        "product":             "CNC",
    },
    {
        "tradingsymbol":       "TCS",
        "exchange":            "NSE",
        "isin":                "INE467B01029",
        "quantity":            8,
        "average_price":       3210.00,
        "last_price":          3485.60,
        "pnl":                 2204.80,
        "day_change":          23.60,
        "day_change_percentage": 0.68,
        "product":             "CNC",
    },
    {
        "tradingsymbol":       "RELIANCE",
        "exchange":            "NSE",
        "isin":                "INE002A01018",
        "quantity":            12,
        "average_price":       2780.00,
        "last_price":          2612.50,
        "pnl":                 -2010.00,
        "day_change":          -17.50,
        "day_change_percentage": -0.66,
        "product":             "CNC",
    },
    {
        "tradingsymbol":       "HDFCBANK",
        "exchange":            "NSE",
        "isin":                "INE040A01034",
        "quantity":            20,
        "average_price":       1540.00,
        "last_price":          1698.30,
        "pnl":                 3166.00,
        "day_change":          6.30,
        "day_change_percentage": 0.37,
        "product":             "CNC",
    },
    {
        "tradingsymbol":       "BAJFINANCE",
        "exchange":            "NSE",
        "isin":                "INE296A01024",
        "quantity":            5,
        "average_price":       6200.00,
        "last_price":          7145.00,
        "pnl":                 4725.00,
        "day_change":          55.00,
        "day_change_percentage": 0.78,
        "product":             "CNC",
    },
    {
        "tradingsymbol":       "WIPRO",
        "exchange":            "NSE",
        "isin":                "INE075A01022",
        "quantity":            30,
        "average_price":       480.00,
        "last_price":          445.20,
        "pnl":                 -1044.00,
        "day_change":          -3.80,
        "day_change_percentage": -0.84,
        "product":             "CNC",
    },
]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _kite_headers():
    return {
        "X-Kite-Version": "3",
        "Authorization": f"token {KITE_API_KEY}:{KITE_ACCESS_TOKEN}",
    }


def _compute_overview(holdings: list[dict]) -> dict:
    total_invested   = sum(h["quantity"] * h["average_price"] for h in holdings)
    current_value    = sum(h["quantity"] * h["last_price"]    for h in holdings)
    total_pnl        = current_value - total_invested
    total_pnl_pct    = (total_pnl / total_invested * 100) if total_invested else 0
    day_change       = sum(h["quantity"] * h["day_change"]    for h in holdings)
    day_change_pct   = (day_change / (current_value - day_change) * 100) if current_value else 0

    gainers = sorted(holdings, key=lambda h: h["pnl"], reverse=True)
    losers  = sorted(holdings, key=lambda h: h["pnl"])

    # Synthetic XIRR — mock a plausible annualised return
    xirr = round(total_pnl_pct * 1.4, 2)

    return {
        "total_invested":   round(total_invested, 2),
        "current_value":    round(current_value, 2),
        "total_pnl":        round(total_pnl, 2),
        "total_pnl_pct":    round(total_pnl_pct, 2),
        "day_change":       round(day_change, 2),
        "day_change_pct":   round(day_change_pct, 2),
        "xirr":             xirr,
        "top_gainer":       gainers[0]["tradingsymbol"] if gainers else None,
        "top_loser":        losers[0]["tradingsymbol"]  if losers  else None,
        "holdings_count":   len(holdings),
    }


# ---------------------------------------------------------------------------
# GET /portfolio/holdings
# ---------------------------------------------------------------------------
@router.get("/holdings")
def get_holdings(mock: Optional[bool] = Query(None)):
    use_mock = mock if mock is not None else USE_MOCK_DATA
    if use_mock:
        return {"source": "mock", "holdings": MOCK_HOLDINGS}

    if not KITE_ACCESS_TOKEN or not KITE_API_KEY:
        raise HTTPException(
            status_code=400,
            detail="Kite credentials not configured. Set KITE_API_KEY and KITE_ACCESS_TOKEN.",
        )

    # ── REAL KITE API CALL ──────────────────────────────────────────────────
    # Replace the mock block above with this section once you have live
    # credentials. The Kite Connect endpoint returns holdings in data["data"].
    # Docs: https://kite.trade/docs/connect/v3/portfolio/#holdings
    #
    #   GET https://api.kite.trade/portfolio/holdings
    #   Headers:
    #     X-Kite-Version: 3
    #     Authorization: token {api_key}:{access_token}
    #
    # The response shape matches MOCK_HOLDINGS above so no other code changes.
    # ────────────────────────────────────────────────────────────────────────
    try:
        resp = requests.get(
            f"{KITE_BASE_URL}/portfolio/holdings",
            headers=_kite_headers(),
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
        return {"source": "live", "holdings": data.get("data", [])}
    except requests.HTTPError as e:
        raise HTTPException(status_code=e.response.status_code, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Kite API error: {e}")


# ---------------------------------------------------------------------------
# GET /portfolio/overview
# ---------------------------------------------------------------------------
@router.get("/overview")
def get_overview(mock: Optional[bool] = Query(None)):
    holdings_resp = get_holdings(mock=mock)
    return {
        "source":   holdings_resp["source"],
        "overview": _compute_overview(holdings_resp["holdings"]),
    }


# ---------------------------------------------------------------------------
# POST /portfolio/analyze  — Claude AI analysis
# ---------------------------------------------------------------------------
class AnalyzeRequest(BaseModel):
    mock: Optional[bool] = None


@router.post("/analyze")
def analyze_portfolio(body: AnalyzeRequest = AnalyzeRequest()):
    if not ANTHROPIC_API_KEY:
        raise HTTPException(
            status_code=400,
            detail="ANTHROPIC_API_KEY is not set. Add it to backend/.env.",
        )

    holdings_resp = get_holdings(mock=body.mock)
    holdings      = holdings_resp["holdings"]

    # Build a compact summary for Claude
    holdings_summary = []
    for h in holdings:
        invested = h["quantity"] * h["average_price"]
        current  = h["quantity"] * h["last_price"]
        pnl_pct  = ((current - invested) / invested * 100) if invested else 0
        holdings_summary.append({
            "symbol":          h["tradingsymbol"],
            "exchange":        h["exchange"],
            "quantity":        h["quantity"],
            "avg_buy_price":   round(h["average_price"], 2),
            "current_price":   round(h["last_price"], 2),
            "pnl_inr":         round(h["pnl"], 2),
            "pnl_pct":         round(pnl_pct, 2),
            "day_change_pct":  round(h["day_change_percentage"], 2),
        })

    overview = _compute_overview(holdings)

    prompt = f"""You are an expert Indian equity portfolio analyst.

Portfolio summary:
- Total invested: ₹{overview['total_invested']:,.0f}
- Current value: ₹{overview['current_value']:,.0f}
- Overall P&L: ₹{overview['total_pnl']:,.0f} ({overview['total_pnl_pct']:.1f}%)
- Today's change: ₹{overview['day_change']:,.0f} ({overview['day_change_pct']:.2f}%)

Individual holdings:
{json.dumps(holdings_summary, indent=2)}

Provide your analysis as ONLY valid JSON (no markdown, no explanation outside the JSON) in this exact structure:
{{
  "stock_recommendations": [
    {{
      "symbol": "SYMBOL",
      "recommendation": "Buy|Hold|Sell",
      "reason": "concise one-line reason based on P&L, momentum, and valuation"
    }}
  ],
  "portfolio_health": "2–3 sentence overall health summary covering diversification, risk, and performance",
  "suggestions": [
    "specific actionable suggestion 1",
    "specific actionable suggestion 2",
    "specific actionable suggestion 3"
  ]
}}"""

    try:
        client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2048,
            messages=[{"role": "user", "content": prompt}],
        )
        raw_text = response.content[0].text.strip()

        # Strip optional markdown code fences
        if raw_text.startswith("```"):
            raw_text = raw_text.split("```")[1]
            if raw_text.startswith("json"):
                raw_text = raw_text[4:]
        raw_text = raw_text.strip()

        analysis = json.loads(raw_text)
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=502, detail=f"Claude returned non-JSON: {e}")
    except anthropic.APIError as e:
        raise HTTPException(status_code=502, detail=f"Anthropic API error: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Merge recommendations back onto holdings
    rec_map = {r["symbol"]: r for r in analysis.get("stock_recommendations", [])}
    for h in holdings:
        sym = h["tradingsymbol"]
        h["recommendation"] = rec_map.get(sym, {}).get("recommendation", "Hold")
        h["rec_reason"]     = rec_map.get(sym, {}).get("reason", "")

    return {
        "source":   holdings_resp["source"],
        "holdings": holdings,
        "overview": overview,
        "analysis": {
            "portfolio_health": analysis.get("portfolio_health", ""),
            "suggestions":      analysis.get("suggestions", []),
        },
    }


# ---------------------------------------------------------------------------
# GET /portfolio/auth/login-url  — Zerodha OAuth step 1
# ---------------------------------------------------------------------------
@router.get("/auth/login-url")
def get_login_url():
    if not KITE_API_KEY:
        raise HTTPException(status_code=400, detail="KITE_API_KEY not configured.")
    url = f"https://kite.zerodha.com/connect/login?api_key={KITE_API_KEY}&v=3"
    return {"login_url": url}


# ---------------------------------------------------------------------------
# POST /portfolio/auth/callback  — exchange request_token → access_token
# ---------------------------------------------------------------------------
class CallbackRequest(BaseModel):
    request_token: str


@router.post("/auth/callback")
def auth_callback(body: CallbackRequest):
    if not KITE_API_KEY or not KITE_API_SECRET:
        raise HTTPException(status_code=400, detail="Kite credentials not configured.")

    checksum = hashlib.sha256(
        f"{KITE_API_KEY}{body.request_token}{KITE_API_SECRET}".encode()
    ).hexdigest()

    try:
        resp = requests.post(
            f"{KITE_BASE_URL}/session/token",
            data={
                "api_key":       KITE_API_KEY,
                "request_token": body.request_token,
                "checksum":      checksum,
            },
            headers={"X-Kite-Version": "3"},
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
        access_token = data["data"]["access_token"]
        return {"access_token": access_token, "status": "connected"}
    except requests.HTTPError as e:
        raise HTTPException(status_code=e.response.status_code, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
