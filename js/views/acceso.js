import { state } from "../state.js";
import { escapeHtml, sedeDisplayName } from "../utils.js";

function describeSede(sede) {
  const displayName = sedeDisplayName(sede);
  const [, name, venue = ""] = /^(.*) \(([^()]+)\)$/.exec(displayName) ?? ["", displayName];
  const photo = { PV: "/img/panama-viejo.jpg", BR: "/img/sede-brisas.jpg" }[sede.codigo];
  return { ...sede, name, venue, photo: photo || sede.imagen_principal, caption: [name, venue].filter(Boolean).join(" · ") };
}

export function renderAcceso() {
  const sedes = state.sedes.filter(sede => sede.estado === "activa").map(describeSede);
  const requested = new URLSearchParams(window.location.search).get("sede");
  const selected = sedes.find(sede => sede.codigo === requested) ?? sedes[0];

  function choice(sede, photo) {
    return `
      <button type="button" class="${photo ? "staff-login-photo" : "staff-login-choice"}"
        data-login-choice="${escapeHtml(sede.codigo)}" aria-pressed="${sede === selected}">
        ${photo && sede.photo ? `<img src="${escapeHtml(sede.photo)}" alt="" class="staff-login-photo-image">` : ""}
        <strong>${escapeHtml(sede.name)}</strong>
        ${photo && sede.venue ? `<span>${escapeHtml(sede.venue)}</span>` : ""}
      </button>`;
  }

  return `
    <div class="staff-login">
      <header class="staff-login-header">
        <a href="/" class="staff-login-brand"><img src="/img/logo-deportivoitalia.png" alt="">Deportivo Italia Academy</a>
        <a href="/">← Volver al inicio</a>
      </header>
      <main class="staff-login-main">
        <h1>Sistema Staff</h1>
        <p>Selecciona tu sede para iniciar sesión.</p>
        ${selected ? `
          <div class="staff-login-layout">
            <div class="staff-login-photos" role="group" aria-label="Fotos de las sedes">
              ${sedes.map(sede => choice(sede, true)).join("")}
            </div>
            <form class="sede-login-form staff-login-form" data-sede-codigo="${escapeHtml(selected.codigo)}">
              <h2>Iniciar sesión</h2>
              <p data-login-caption aria-live="polite">${escapeHtml(selected.caption)}</p>
              <div class="staff-login-choices" role="group" aria-label="Seleccionar sede">
                ${sedes.map(sede => choice(sede, false)).join("")}
              </div>
              <label for="staff-login-user">Usuario</label>
              <input id="staff-login-user" type="text" name="email" placeholder="Usuario" required autocomplete="username">
              <label for="staff-login-password">Contraseña</label>
              <div class="staff-login-password">
                <input id="staff-login-password" type="password" name="password" placeholder="Contraseña" required autocomplete="current-password">
                <button type="button" data-login-toggle aria-controls="staff-login-password">Mostrar</button>
              </div>
              <button type="submit" id="btnLogin" class="staff-login-submit">Entrar a ${escapeHtml(selected.name)} →</button>
              <p class="staff-login-error" role="alert"></p>
            </form>
          </div>` : '<p role="status">No hay sedes disponibles en este momento.</p>'}
      </main>
    </div>`;
}

export function handleAccesoClick(event) {
  const button = event.target.closest("[data-login-choice], [data-login-toggle]");
  if (!button) return;

  const page = button.closest(".staff-login");
  const form = page.querySelector(".staff-login-form");
  const password = form.elements.password;
  const toggle = form.querySelector("[data-login-toggle]");

  if (button === toggle) {
    const show = password.type === "password";
    password.type = show ? "text" : "password";
    toggle.textContent = show ? "Ocultar" : "Mostrar";
    return;
  }

  const code = button.dataset.loginChoice;
  if (form.dataset.sedeCodigo === code || form.querySelector("#btnLogin").disabled) return;

  const sede = describeSede(state.sedes.find(item => item.codigo === code));
  form.dataset.sedeCodigo = code;
  for (const choice of page.querySelectorAll("[data-login-choice]")) {
    choice.setAttribute("aria-pressed", String(choice.dataset.loginChoice === code));
  }
  form.querySelector("[data-login-caption]").textContent = sede.caption;
  form.querySelector("#btnLogin").textContent = `Entrar a ${sede.name} →`;
  form.querySelector(".staff-login-error").textContent = "";
  password.value = "";
  password.type = "password";
  toggle.textContent = "Mostrar";
}
