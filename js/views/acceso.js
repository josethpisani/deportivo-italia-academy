import { state } from '../state.js';
import { ic } from '../icons.js';
import { escapeHtml } from '../utils.js';

export function renderAcceso() {
  const sedes = state.sedes.filter(s => s.estado === 'activa');
  const urlParams = new URLSearchParams(window.location.search);
  const preselectedSede = urlParams.get('sede');
  
  const getCreds = (codigo) => {
    const isPV = codigo === 'PV';
    return { user: isPV ? 'acceso pv' : 'acceso br', pass: isPV ? 'pv12345' : 'br12345' };
  };

  return `
    <div class="acceso-page">
      <!-- Header -->
      <header class="acceso-header">
        <div class="container">
          <a href="/" class="acceso-back-btn" title="Volver al inicio">
            ${ic.arrowLeft}
          </a>
          <a href="/" class="acceso-logo">
            <img src="/img/logo-deportivoitalia.png" alt="Deportivo Italia Academy">
            <span>DEPORTIVO ITALIA ACADEMY</span>
          </a>
        </div>
      </header>

      <!-- Main Content -->
      <main class="acceso-main">
        <div class="container">
          <!-- Hero -->
          <section class="acceso-hero">
            <div class="acceso-hero-content">
              <div class="acceso-badge">${ic.shield} Acceso al Sistema STAFF</div>
              <h1 class="acceso-title">Selecciona tu sede</h1>
              <p class="acceso-subtitle">Ingresa tus credenciales directamente en la tarjeta de tu sede</p>
            </div>
          </section>

          <!-- Sedess Cards with Inline Login -->
          <section class="acceso-sedes">
            <div class="sedes-grid-acceso">
              ${sedes.map(sede => {
                const creds = getCreds(sede.codigo);
                return `
                <article class="sede-card-acceso ${preselectedSede === sede.codigo ? 'preselected' : ''}" data-sede-codigo="${sede.codigo}">
                  <div class="sede-card-bg">
                    ${sede.imagen_principal 
                      ? `<img src="${escapeHtml(sede.imagen_principal)}" alt="${escapeHtml(sede.nombre)}" class="sede-bg-img">`
                      : `<div class="sede-bg-placeholder">${ic.mapPin}</div>`
                    }
                    <div class="sede-card-overlay"></div>
                  </div>
                  <div class="sede-card-content">
                    <div class="sede-icon-wrapper">
                      <span class="sede-icon">${ic.mapPin}</span>
                    </div>
                    <h2 class="sede-name">${escapeHtml(sede.nombre)}</h2>
                    <p class="sede-code">Código: ${escapeHtml(sede.codigo)}</p>
                    
                    <!-- Inline Login Form -->
                    <form class="sede-login-form" data-sede-codigo="${sede.codigo}">
                      <div class="login-fields">
                        <div class="form-row">
                          <div class="form-group">
                            <label for="user-${sede.codigo}">${ic.user} Usuario</label>
                            <input type="text" id="user-${sede.codigo}" name="email" placeholder="${creds.user}" required autocomplete="username" value="${creds.user}">
                          </div>
                          <div class="form-group">
                            <label for="pass-${sede.codigo}">${ic.lock} Contraseña</label>
                            <input type="password" id="pass-${sede.codigo}" name="password" placeholder="${creds.pass}" required autocomplete="current-password" value="${creds.pass}">
                          </div>
                        </div>
                        <button type="submit" class="btn-sede-login">
                          ${ic.logIn} ACCEDER A ${escapeHtml(sede.nombre).toUpperCase()}
                        </button>
                      </div>
                      <div class="login-hint">
                        ${ic.info} Credenciales prellenadas para prueba
                      </div>
                    </form>
                    
                    <div class="sede-meta-acceso">
                      <span class="sede-status ${sede.estado === 'activa' ? 'active' : 'inactive'}">
                        <span class="status-dot"></span>
                        ${sede.estado === 'activa' ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>
                    <div class="sede-location">
                      ${ic.mapPin} ${escapeHtml(sede.direccion || "Dirección no disponible")}
                    </div>
                  </div>
                </article>
              `}).join("")}
            </div>
          </section>

          <!-- Info Section -->
          <section class="acceso-info">
            <div class="info-cards">
              <div class="info-card">
                <div class="info-icon">${ic.users}</div>
                <h3>Administradores</h3>
                <p>Gestión completa de atletas, pagos, torneos y estadísticas</p>
              </div>
              <div class="info-card">
                <div class="info-icon">${ic.clipboard}</div>
                <h3>Entrenadores</h3>
                <p>Registro de asistencias, evaluaciones y seguimiento de jugadores</p>
              </div>
              <div class="info-card">
                <div class="info-icon">${ic.shield}</div>
                <h3>Acceso Seguro</h3>
                <p>Cada sede tiene su base de datos aislada y protegida</p>
              </div>
            </div>
          </section>

          <!-- Back to Public Site -->
          <section class="acceso-back">
            <a href="/" class="btn-back-home">
              ${ic.home} Volver al sitio público
            </a>
          </section>
        </div>
      </main>

      <!-- Footer -->
      <footer class="acceso-footer">
        <div class="container">
          <p>&copy; 2026 Deportivo Italia Academy. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  `;
}
