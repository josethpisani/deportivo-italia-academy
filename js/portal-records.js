import { escapeHtml } from "./utils.js";

export function uniformPayments(athlete) {
  if (athlete.becado) return [["Uniforme", { monto: 0, estado: "Becado" }]];
  const source = athlete.uniformes || athlete.pagosUniformes || athlete.pagoUniforme || {};
  if (Array.isArray(source)) {
    return source.map((payment, index) => [payment.concepto || payment.nombre || `Uniforme ${index + 1}`, payment]);
  }
  if (["monto", "estado", "fecha"].some(key => key in source)) {
    return [[source.concepto || source.nombre || "Uniforme", source]];
  }
  return Object.entries(source).filter(([, payment]) => payment && typeof payment === "object");
}

export function renderUniformPayments(athlete) {
  return uniformPayments(athlete).map(([label, payment]) => {
    const amount = payment.monto == null || payment.monto === "" ? "—" :
      new Intl.NumberFormat("es-PA", { style: "currency", currency: "USD" }).format(Number(payment.monto));
    const status = payment.estado || "No registrado";
    return `<tr><td>${escapeHtml(label)}</td><td>${escapeHtml(athlete.becado ? "Becado" : amount)}</td>
      <td><span class="portal-status ${["pagado", "becado"].includes(status.toLowerCase()) ? "" : "negative"}">${escapeHtml(status)}</span></td>
      <td>${escapeHtml(payment.fecha || "—")}</td></tr>`;
  }).join("") || '<tr><td colspan="4">No hay pagos de uniformes registrados.</td></tr>';
}

export function renderParentEvaluations(athlete) {
  const evaluations = Array.isArray(athlete.evaluaciones) ? athlete.evaluaciones : Object.values(athlete.evaluaciones || {});
  const groups = {};
  for (const evaluation of evaluations) {
    const month = String(evaluation.periodo || evaluation.fecha || "").slice(0, 7);
    const period = /^\d{4}-(0[1-9]|1[0-2])$/.test(month) ? month : "Sin mes";
    (groups[period] ||= []).push(evaluation);
  }
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a)).map(([period, entries]) => {
    const month = period === "Sin mes" ? period : new Date(`${period}-15T12:00:00`)
      .toLocaleDateString("es-PA", { month: "long", year: "numeric" });
    return `<section class="portal-evaluation-month"><h4>${escapeHtml(month)}</h4>${entries.map(evaluation => {
      const metrics = Object.entries(evaluation.items || {});
      const values = metrics.map(([, value]) => value === "" || value == null ? NaN : Number(value))
        .filter(value => Number.isFinite(value) && value >= 0 && value <= 10);
      const average = values.length ? (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1) : "—";
      const notes = evaluation.observaciones || evaluation.observacion || evaluation.notas || "";
      return `<article class="portal-evaluation">
        <header class="portal-evaluation-heading"><div><strong>${escapeHtml(evaluation.descripcion || "Evaluación deportiva")}</strong>
          <span>${escapeHtml(evaluation.fecha || period)}</span></div>
          <div class="portal-evaluation-score"><span>Promedio</span><b>${average}<small> / 10</small></b></div></header>
        <details class="portal-evaluation-breakdown" open><summary>Detalle de habilidades <span>${metrics.length} criterios</span></summary>
          <div class="portal-evaluation-details">${metrics.map(([name, value], index) => {
            const score = Number(value);
            const valid = value !== "" && value != null && Number.isFinite(score) && score >= 0 && score <= 10;
            return `<div class="portal-evaluation-skill skill-tone-${index % 5}">
              <div><strong>${escapeHtml(name)}</strong><b>${escapeHtml(valid ? score : "—")}<small> / 10</small></b></div>
              ${valid ? `<meter min="0" max="10" value="${score}" aria-label="${escapeHtml(name)}">${score} de 10</meter>` : ""}
            </div>`;
          }).join("") || '<p class="portal-empty">Sin criterios registrados.</p>'}</div>
        </details>
        <div class="portal-evaluation-notes"><h5>Observaciones del entrenador</h5><p>${escapeHtml(notes || "Sin observaciones registradas.")}</p></div>
      </article>`;
    }).join("")}</section>`;
  }).join("") || '<p class="portal-empty">No hay evaluaciones publicadas.</p>';
}
