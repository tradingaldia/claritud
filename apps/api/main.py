from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import os

app = FastAPI(title="Claritud API", version="0.1.0")

# En producción lo pondrás como: CORS_ORIGINS="https://claritudpro.com"
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in cors_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ScoreInput(BaseModel):
    monthly_income: float = Field(..., ge=0, description="Ingreso mensual aproximado")
    fixed_expenses: float = Field(..., ge=0, description="Gastos fijos mensuales")
    variable_expenses: float = Field(..., ge=0, description="Gastos variables mensuales")
    monthly_debt_payments: float = Field(..., ge=0, description="Pago mensual total de deudas")
    total_savings: float = Field(..., ge=0, description="Ahorros disponibles hoy")

class ScoreOutput(BaseModel):
    score: int
    level: str
    highlights: list[str]
    recommendations: list[str]

def clamp(n: float, min_n: float, max_n: float) -> float:
    return max(min_n, min(max_n, n))

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/v1/score", response_model=ScoreOutput)
def compute_score(data: ScoreInput):
    monthly_expenses = data.fixed_expenses + data.variable_expenses

    # Evitar divisiones por cero y dar feedback claro
    if data.monthly_income <= 0:
        return ScoreOutput(
            score=0,
            level="Frágil",
            highlights=["No podemos calcular sin ingreso mensual."],
            recommendations=["Ingresa un aproximado de tu ingreso mensual, aunque varíe."]
        )

    # 1) Liquidez: meses de colchón = ahorros / gastos
    months_buffer = (data.total_savings / monthly_expenses) if monthly_expenses > 0 else 0
    liquidity = clamp((months_buffer / 6) * 100, 0, 100)  # 6 meses => 100

    # 2) Deuda: pago mensual de deuda / ingreso mensual
    debt_ratio = data.monthly_debt_payments / data.monthly_income
    if debt_ratio <= 0.15:
        debt = 100
    elif debt_ratio <= 0.30:
        debt = 70
    elif debt_ratio <= 0.45:
        debt = 40
    else:
        debt = 15

    # 3) Ahorro: cashflow libre / ingreso; 20% => 100
    free_cashflow = data.monthly_income - monthly_expenses - data.monthly_debt_payments
    savings_rate = free_cashflow / data.monthly_income
    savings = clamp((savings_rate / 0.20) * 100, 0, 100)

    # Score final ponderado
    score = int(round(0.45 * liquidity + 0.35 * debt + 0.20 * savings))
    score = int(clamp(score, 0, 100))

    if score < 35:
        level = "Frágil"
    elif score < 70:
        level = "Estable"
    else:
        level = "Fuerte"

    highlights: list[str] = []
    if liquidity < 50:
        highlights.append("Tu colchón de emergencia es bajo (objetivo: 3–6 meses).")
    if debt < 70:
        highlights.append("Tu carga de deuda es alta vs tu ingreso.")
    if savings < 50:
        highlights.append("Tu tasa de ahorro mensual puede mejorar.")

    recommendations = [
        "Hoy: anota tus 5 gastos más grandes del mes (solo claridad).",
        "Esta semana: define un tope semanal para 1 categoría recortable.",
        "En 14 días: crea un mini-fondo de emergencia (meta: 1 semana de gastos).",
        "En 30 días: prioriza tu deuda más cara (interés) o la más pequeña (momentum)."
    ]

    return ScoreOutput(
        score=score,
        level=level,
        highlights=highlights[:3],
        recommendations=recommendations
    )
