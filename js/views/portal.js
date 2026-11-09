import { ic } from "../icons.js";

export function renderParentPortal() {
  return `<div class="parent-portal">
    <header class="portal-header"><a href="/" class="portal-brand"><img src="/img/logo-deportivoitalia.png" alt="Deportivo Italia Academy"><span>Deportivo Italia<br><small>Portal de padres</small></span></a></header>
    <main class="portal-main">
      <section id="portalLoginView" class="portal-card">
        <div class="portal-kicker">${ic.shield} Deportivo Italia Academy</div>
        <h1>Portal de padres</h1><p class="portal-lead">Consulta de forma privada la información de los atletas vinculados a tu cuenta.</p>
        <form id="parentLoginForm" class="portal-form"><label>Correo electrónico<input type="email" name="email" autocomplete="email" required></label><label>Contraseña<input type="password" name="password" autocomplete="current-password" required></label><button class="btn-portal" type="submit">${ic.logIn} Iniciar sesión</button><p class="portal-message" id="parentLoginMessage" role="alert"></p></form>
        <div class="portal-links"><button type="button" id="showParentActivation">Activar cuenta por primera vez</button><a href="/">Volver al sitio público</a></div>
      </section>
      <section id="parentActivationView" class="portal-card" style="display:none"><div class="portal-kicker">${ic.checkCircle} Activación segura</div><h1>Activar cuenta</h1><p class="portal-lead">Introduce el código que te entregue la administración y crea tu contraseña.</p><form id="parentActivationForm" class="portal-form"><label>Correo electrónico<input type="email" name="email" required></label><label>Código de activación<input type="text" name="activation_code" required></label><label>Nombre completo<input type="text" name="full_name" required></label><label>Contraseña<input type="password" name="password" minlength="8" autocomplete="new-password" required></label><button class="btn-portal" type="submit">${ic.check} Activar cuenta</button><p class="portal-message" id="parentActivationMessage" role="alert"></p></form><div class="portal-links"><button type="button" id="showParentLogin">Volver al inicio de sesión</button></div></section>
      <section id="parentDashboardView" class="portal-dashboard" style="display:none"><div class="portal-dashboard-head"><div><div class="portal-kicker">${ic.users} Área privada</div><h1 id="parentWelcome">Portal de padres</h1></div><button class="btn-portal secondary" id="parentLogout">Cerrar sesión</button></div><p class="portal-lead">Atletas vinculados a tu cuenta</p><div id="parentAthletesList" class="portal-athletes"></div></section>
    </main>
  </div>`;
}
