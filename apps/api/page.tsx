"use client";

import { useMemo, useState } from "react";

type Result = {
  score: number;
  level: string;
  highlights: string[];
  recommendations: string[];
};

export default function Page() {
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [fixedExpenses, setFixedExpenses] = useState("");
  const [variableExpenses, setVariableExpenses] = useState("");
  const [monthlyDebtPayments, setMonthlyDebtPayments] = useState("");
  const [totalSavings, setTotalSavings] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);

  // En local: http://localhost:8000
  // En producción: https://api.claritudpro.com (o la URL de Render)
  const apiBase = useMemo(
    () => process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000",
    []
  );

  async function onCalculate() {
    setLoading(true);
    setResult(null);

    const payload = {
      monthly_income: Number(monthlyIncome || 0),
      fixed_expenses: Number(fixedExpenses || 0),
      variable_expenses: Number(variableExpenses || 0),
      monthly_debt_payments: Number(monthlyDebtPayments || 0),
      total_savings: Number(totalSavings || 0)
    };

    const res = await fetch(`${apiBase}/v1/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    setResult(data);
    setLoading(false);
  }

  return (
    <main style={{ maxWidth: 860, margin: "40px auto", padding: 16, fontFamily: "system-ui" }}>
      <header style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0 }}>Claritud</h1>
        <p style={{ marginTop: 8 }}>
          Calcula tu resiliencia financiera en 3 minutos y recibe un plan simple para mejorar.
        </p>
      </header>

      <section style={{ display: "grid", gap: 12 }}>
        <label>
          Ingreso mensual aproximado
          <input
            inputMode="decimal"
            value={monthlyIncome}
            onChange={(e) => setMonthlyIncome(e.target.value)}
            style={{ width: "100%", padding: 10 }}
            placeholder="Ej: 2500"
          />
        </label>

        <label>
          Gastos fijos mensuales (alquiler, servicios, transporte)
          <input
            inputMode="decimal"
            value={fixedExpenses}
            onChange={(e) => setFixedExpenses(e.target.value)}
            style={{ width: "100%", padding: 10 }}
            placeholder="Ej: 900"
          />
        </label>

        <label>
          Gastos variables mensuales (comida, ocio, otros)
          <input
            inputMode="decimal"
            value={variableExpenses}
            onChange={(e) => setVariableExpenses(e.target.value)}
            style={{ width: "100%", padding: 10 }}
            placeholder="Ej: 600"
          />
        </label>

        <label>
          Pago mensual total de deudas
          <input
            inputMode="decimal"
            value={monthlyDebtPayments}
            onChange={(e) => setMonthlyDebtPayments(e.target.value)}
            style={{ width: "100%", padding: 10 }}
            placeholder="Ej: 200"
          />
        </label>

        <label>
          Ahorros disponibles hoy
          <input
            inputMode="decimal"
            value={totalSavings}
            onChange={(e) => setTotalSavings(e.target.value)}
            style={{ width: "100%", padding: 10 }}
            placeholder="Ej: 1200"
          />
        </label>

        <button
          onClick={onCalculate}
          disabled={loading}
          style={{ padding: 12, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}
        >
          {loading ? "Calculando..." : "Ver mi Claritud Score"}
        </button>
      </section>

      {result && (
        <section style={{ marginTop: 24, padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
          <h2 style={{ marginTop: 0 }}>
            Tu score: {result.score}/100 — {result.level}
          </h2>

          {result.highlights?.length > 0 && (
            <>
              <h3>Lo más importante</h3>
              <ul>
                {result.highlights.map((h, idx) => (
                  <li key={idx}>{h}</li>
                ))}
              </ul>
            </>
          )}

          <h3>Plan recomendado</h3>
          <ol>
            {result.recommendations.map((r, idx) => (
              <li key={idx}>{r}</li>
            ))}
          </ol>

          <p style={{ marginTop: 16, color: "#555" }}>
            Siguiente mejora (viral): botón de compartir + tarjeta con tu score.
          </p>
        </section>
      )}
    </main>
  );
}
