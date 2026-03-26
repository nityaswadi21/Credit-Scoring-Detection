from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import score
from routers import portfolio

app = FastAPI(title="CreditAI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(score.router)
app.include_router(portfolio.router)

@app.get("/")
def root():
    return {"message": "Credit Scoring API is running"}
