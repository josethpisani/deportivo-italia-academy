import { matchesStaffYear, staffYearAthletes } from "../js/utils.js";

export function adminReport({ report, year, category, month, sede, athletes, tournaments, config, registrations, representatives }) {
  const scoped = staffYearAthletes(athletes, year).filter(a => category === "Todos" || a.categoria === category);
  const identity = a => [[a.nombre, a.apellido].filter(Boolean).join(" "), a.categoria || ""];
  const payment = (a, record, amount) => [
    ...identity(a), a.becado ? 0 : Number(record?.monto ?? amount ?? 0),
    a.becado ? "Becado" : (record?.estado || "pendiente"), record?.fecha || "",
  ];
  const paymentHeaders = ["Atleta", "Categoría", "Monto (USD)", "Estado", "Fecha registrada"];
  const details = new Map(registrations.filter(r => r.athlete_id).map(r => [r.athlete_id, r]));
  const contacts = new Map();
  for (const person of representatives) {
    if (!contacts.has(person.athlete_id)) contacts.set(person.athlete_id, []);
    contacts.get(person.athlete_id).push(person);
  }

  const reports = {
    atletas: ["Atletas y representantes", ["Atleta", "Categoría", "Edad", "Nacimiento", "Ingreso", "Representante", "Teléfono registrado", "Correo", "Dirección registrada"],
      () => scoped.flatMap(a => {
        const registration = details.get(a.id);
        const linked = contacts.get(a.id) || [];
        const registered = { full_name: a.representante, email: registration?.email };
        const people = linked.some(person => registered.email
          ? person.email.toLowerCase() === registered.email.toLowerCase()
          : person.full_name.trim().toLowerCase() === String(registered.full_name || "").trim().toLowerCase())
          ? linked
          : [registered, ...linked];
        return people.map(person => [
          ...identity(a), a.edad ?? "", a.fechaNacimiento || "", a.fechaIngreso || "",
          person.full_name || "", a.telefono || "", person.email || "", a.direccion || "",
        ]);
      })],
    matriculas: ["Pagos de matrícula", paymentHeaders,
      () => scoped.map(a => payment(a, a.matricula, config[a.categoria]?.matricula))],
    mensualidades: ["Mensualidades", paymentHeaders,
      () => scoped.map(a => payment(a, a.mensualidades?.[month], a._mensualidadMonto ?? config[a.categoria]?.mensualidad ?? 20))],
    uniformes: ["Pagos de uniformes", paymentHeaders,
      () => scoped.map(a => payment(a, a.uniformes))],
    torneos: ["Torneos y pagos", ["Torneo", "Fecha del torneo", "Categoría del torneo", ...paymentHeaders],
      () => tournaments.filter(t => matchesStaffYear(t.fecha || t.anio || t.year, year)).flatMap(t => {
        const rows = scoped.flatMap(a => {
          const enrollment = a.torneos?.find(item => item.torneoId === t.id);
          if (!enrollment) return [];
          const record = a.pagosTorneos?.[t.id];
          return [payment(a, { ...record, estado: record?.estado || "Inscrito", fecha: record?.fecha || enrollment.fecha }, t.monto)];
        });
        return (rows.length ? rows : [["", "", "", "Sin inscritos en el filtro", ""]])
          .map(row => [t.nombre || "", t.fecha || "", t.categoria || "", ...row]);
      })],
  };
  const [title, headers, getRows] = reports[report];
  return { title, headers, rows: getRows(), scope: [sede, report === "mensualidades" ? month : year, category].join(" · ") };
}

export async function reportFile({ title, scope, headers, rows }, format) {
  if (format === "xlsx") {
    const { default: ExcelJS } = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(title, { views: [{ state: "frozen", ySplit: 3 }] });
    sheet.addRow([title]);
    sheet.addRow([scope]);
    sheet.addRow(headers).font = { bold: true };
    sheet.addRows(rows);
    sheet.autoFilter = { from: { row: 3, column: 1 }, to: { row: Math.max(3, sheet.rowCount), column: headers.length } };
    sheet.columns.forEach(column => { column.width = 24; });
    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  const [{ jsPDF }, { autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const doc = new jsPDF({ orientation: "landscape", format: "a4", compress: true });
  doc.text(title, 14, 15);
  doc.setFontSize(11);
  doc.text(scope, 14, 22);
  autoTable(doc, {
    startY: 27,
    head: [headers],
    body: rows.length ? rows : [["Sin registros para los filtros seleccionados"]],
    styles: { fontSize: 8, overflow: "linebreak" },
    headStyles: { fillColor: [11, 32, 73] },
    rowPageBreak: "avoid",
  });
  return Buffer.from(doc.output("arraybuffer"));
}
