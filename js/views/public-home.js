import { state } from "/js/views/state.js";
import { ic } from "/js/views/icons.js";
import { escapeHtml } from "/js/views/utils.js";

// Trial request modal state
let trialModalOpen = false;
let selectedDate = null;
let selectedTimeSlot = null;

export function renderPublicHome() {
  const c = state.siteContent.hero;
  const sedes = state.sedes.filter(s => s.estado === 'activa');
  
  return `
    <div class="public-site">
      <!-- Hero Section -->
      <section class="hero-section">
        <div class="hero-bg pitch-bg"></div>
        <div class="hero-content">
          <div class="hero-logo">
            <img src="/img/logo-deportivoitalia.png" alt="Deportivo Italia Academy" class="logo-img">
          </div>
          <h1 class="hero-title">${escapeHtml(c.title || "DEPORTIVO ITALIA ACADEMY")}</h1>
          <p class="hero-subtitle">${escapeHtml(c.subtitle || "Formando futbolistas, desarrollando talentos y construyendo valores.")}</p>
          <div class="hero-ctas">
            <a href="#nosotros" class="btn-hero btn-hero-primary">${ic.users} ${escapeHtml(c.ctaPrimary || "Conoce nuestra academia")}</a>
            <a href="/acceso" class="btn-hero btn-hero-secondary">${ic.shield} ${escapeHtml(c.ctaSecondary || "Acceder al sistema STAFF")}</a>
            <button type="button" class="btn-hero btn-hero-trial" id="btnTrialRequest">${ic.calendar} Solicita tu Entrenamiento de Prueba</button>
          </div>
        </div>
        <div class="hero-scroll">${ic.chevronDown}</div>
      </section>

      <!-- Trial Request Modal -->
      <div class="modal-overlay" id="trialModal" style="display: none;" role="dialog" aria-modal="true" aria-labelledby="trialModalTitle">
        <div class="modal modal-trial">
          <button class="modal-close" id="closeTrialModal" aria-label="Cerrar">${ic.x}</button>
          <div class="modal-header">
            <h2 id="trialModalTitle">${ic.calendar} Solicitar Entrenamiento de Prueba</h2>
            <p class="modal-subtitle">Selecciona día, horario y completa tus datos</p>
          </div>
          <form id="trialForm" class="modal-body">
            <div class="form-step" id="stepCalendar">
              <h3>${ic.calendar} Paso 1: Selecciona día y horario</h3>
              <div class="calendar-info">
                <div class="info-badge">${ic.info} Disponible solo lunes y miércoles</div>
                <div class="info-badge">${ic.users} Turno 16:30 - U4 y U6 (hasta 6 años)</div>
                <div class="info-badge">${ic.users} Turno 17:00-18:30 - U8, U10, U12 (7+ años)</div>
              </div>
              <div class="calendar-container" id="calendarContainer"></div>
              <div class="time-slots" id="timeSlots" style="display: none;">
                <h4>${ic.clock} Horarios disponibles para el día seleccionado:</h4>
                <div class="slot-options" id="slotOptions"></div>
              </div>
              <button type="button" class="btn-next" id="btnNextToForm" disabled>${ic.arrowRight} Continuar</button>
            </div>
            <div class="form-step" id="stepForm" style="display: none;">
              <h3>${ic.user} Paso 2: Datos del representante y atleta</h3>
              <div class="form-row">
                <div class="form-group">
                  <label for="repName">${ic.user} Nombre del Representante *</label>
                  <input type="text" id="repName" name="repName" required placeholder="Juan Pérez">
                </div>
                <div class="form-group">
                  <label for="athleteName">${ic.user} Nombre del Atleta *</label>
                  <input type="text" id="athleteName" name="athleteName" required placeholder="Carlos Pérez">
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label for="trialEmail">${ic.mail} Correo Electrónico *</label>
                  <input type="email" id="trialEmail" name="email" required placeholder="juan@email.com">
                </div>
                <div class="form-group">
                  <label for="trialPhone">${ic.phone} Teléfono *</label>
                  <input type="tel" id="trialPhone" name="phone" required placeholder="+507 6000-0000">
                </div>
              </div>
              <div class="form-group">
                <label for="trialSede">${ic.mapPin} Sede para la Práctica *</label>
                <select id="trialSede" name="sede_id" required>
                  <option value="">Selecciona una sede</option>
                  ${sedes.map(s => `<option value="${escapeHtml(s.id)}">${escapeHtml(s.nombre)}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label>${ic.info} Categoría según edad (se asigna automática según horario)</label>
                <div class="age-info">
                  <span class="age-badge u4">16:30 → U4/U6 (≤6 años)</span>
                  <span class="age-badge u8">17:00 → U8/U10/U12 (7+ años)</span>
                </div>
              </div>
              <button type="submit" class="btn-submit-trial">${ic.send} Enviar Solicitud</button>
            </div>
          </form>
          <div class="modal-success" id="modalSuccess" style="display: none;">
            <div class="success-icon">${ic.checkCircle}</div>
            <h3>¡Solicitud Enviada!</h3>
            <p>Te contactaremos pronto para confirmar tu entrenamiento de prueba.</p>
            <button type="button" class="btn-close-success" id="btnCloseSuccess">${ic.check} Cerrar</button>
          </div>
        </div>
      </div>
  const c = state.siteContent.hero;
  const sedes = state.sedes.filter(s => s.estado === 'activa');
  
  return `
    <div class="public-site">
      <!-- Hero Section -->
      <section class="hero-section">
        <div class="hero-bg pitch-bg"></div>
        <div class="hero-content">
          <div class="hero-logo">
            <img src="/img/logo-deportivoitalia.png" alt="Deportivo Italia Academy" class="logo-img">
          </div>
          <h1 class="hero-title">${escapeHtml(c.title || "DEPORTIVO ITALIA ACADEMY")}</h1>
          <p class="hero-subtitle">${escapeHtml(c.subtitle || "Formando futbolistas, desarrollando talentos y construyendo valores.")}</p>
          <div class="hero-ctas">
            <a href="#nosotros" class="btn-hero btn-hero-primary">${ic.users} ${escapeHtml(c.ctaPrimary || "Conoce nuestra academia")}</a>
            <a href="/acceso" class="btn-hero btn-hero-secondary">${ic.shield} ${escapeHtml(c.ctaSecondary || "Acceder al sistema STAFF")}</a>
          </div>
        </div>
        <div class="hero-scroll">${ic.chevronDown}</div>
      </section>

      <!-- About Section -->
      <section id="nosotros" class="section-nosotros">
        <div class="container">
          <header class="section-header">
            <h2 class="dia-title">¿Quiénes Somos?</h2>
            <p class="section-subtitle">Conoce la historia y filosofía de nuestra academia</p>
          </header>
          <div class="nosotros-grid">
            <div class="nosotros-card">
              <div class="nosotros-icon">${ic.book}</div>
              <h3>Historia</h3>
              <p>${escapeHtml(state.siteContent.nosotros.historia || "Deportivo Italia Academy nace con la pasión por el fútbol y el compromiso de formar no solo jugadores, sino personas íntegras.")}</p>
            </div>
            <div class="nosotros-card">
              <div class="nosotros-icon">${ic.target}</div>
              <h3>Misión</h3>
              <p>${escapeHtml(state.siteContent.nosotros.mision || "Desarrollar el talento futbolístico de niños y jóvenes a través de una metodología integral que combine técnica, táctica, física y valores.")}</p>
            </div>
            <div class="nosotros-card">
              <div class="nosotros-icon">${ic.eye}</div>
              <h3>Visión</h3>
              <p>${escapeHtml(state.siteContent.nosotros.vision || "Ser la academia de fútbol de referencia en Panamá, reconocida por la excelencia deportiva y la formación humana de nuestros atletas.")}</p>
            </div>
            <div class="nosotros-card">
              <div class="nosotros-icon">${ic.heart}</div>
              <h3>Valores</h3>
              <p>${escapeHtml(state.siteContent.nosotros.valores || "Disciplina, Respeto, Trabajo en Equipo, Humildad, Pasión, Honestidad.")}</p>
            </div>
            <div class="nosotros-card">
              <div class="nosotros-icon">${ic.brain}</div>
              <h3>Filosofía</h3>
              <p>${escapeHtml(state.siteContent.nosotros.filosofia || "El fútbol como herramienta de transformación social. Cada entrenamiento es una oportunidad de crecer como persona.")}</p>
            </div>
            <div class="nosotros-card">
              <div class="nosotros-icon">${ic.activity}</div>
              <h3>Metodología</h3>
              <p>${escapeHtml(state.siteContent.nosotros.metodologia || "Entrenamiento basado en el juego, progresión por etapas, individualización y toma de decisiones.")}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Our Work Section -->
      <section class="section-trabajo">
        <div class="container">
          <header class="section-header">
            <h2 class="dia-title">Nuestro Trabajo</h2>
            <p class="section-subtitle">Áreas de desarrollo en nuestra academia</p>
          </header>
          <div class="trabajo-grid">
            <div class="trabajo-card">
              <div class="trabajo-icon">${ic.activity}</div>
              <h3>Entrenamientos</h3>
              <p>Sesiones técnicas y tácticas adaptadas por categoría</p>
            </div>
            <div class="trabajo-card">
              <div class="trabajo-icon">${ic.zap}</div>
              <h3>Desarrollo Técnico</h3>
              <p>Control, pase, conducción, tiro y habilidad individual</p>
            </div>
            <div class="trabajo-card">
              <div class="trabajo-icon">${ic.trendingUp}</div>
              <h3>Preparación Física</h3>
              <p>Velocidad, resistencia, fuerza y prevención de lesiones</p>
            </div>
            <div class="trabajo-card">
              <div class="trabajo-icon">${ic.shield}</div>
              <h3>Partidos</h3>
              <p>Competición regular para aplicar lo aprendido</p>
            </div>
            <div class="trabajo-card">
              <div class="trabajo-icon">${ic.trophy}</div>
              <h3>Torneos</h3>
              <p>Participación en torneos locales e internacionales</p>
            </div>
            <div class="trabajo-card">
              <div class="trabajo-icon">${ic.brain}</div>
              <h3>Formación Táctica</h3>
              <p>Sistemas de juego, posicionamiento y lectura de partido</p>
            </div>
            <div class="trabajo-card">
              <div class="trabajo-icon">${ic.users}</div>
              <h3>Trabajo en Equipo</h3>
              <p>Comunicación, liderazgo y cohesión grupal</p>
            </div>
            <div class="trabajo-card">
              <div class="trabajo-icon">${ic.award}</div>
              <h3>Formación Integral</h3>
              <p>Valores, disciplina, nutrición y psicología deportiva</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Gallery Section -->
      <section id="galeria" class="section-galeria">
        <div class="container">
          <header class="section-header">
            <h2 class="dia-title">Galería</h2>
            <p class="section-subtitle">Momentos de nuestra academia</p>
          </header>
          <div class="galeria-grid" id="galeriaGrid">
            ${renderGaleria()}
          </div>
        </div>
      </section>

      <!-- Branches Section -->
      <section id="sedes" class="section-sedes">
        <div class="container">
          <header class="section-header">
            <h2 class="dia-title">Nuestras Sedes</h2>
            <p class="section-subtitle">Dos ubicaciones para servirte mejor</p>
          </header>
          <div class="sedes-grid-public">
            ${sedes.map(sede => `
              <article class="sede-card-public">
                <div class="sede-img-wrapper">
                  ${sede.imagen_principal 
                    ? `<img src="${escapeHtml(sede.imagen_principal)}" alt="${escapeHtml(sede.nombre)}" class="sede-img">`
                    : `<div class="sede-img-placeholder">${ic.mapPin}</div>`
                  }
                </div>
                <div class="sede-info">
                  <h3>${escapeHtml(sede.nombre)}</h3>
                  <p class="sede-desc">${escapeHtml(sede.descripcion || "")}</p>
                  <div class="sede-meta">
                    <span>${ic.mapPin} ${escapeHtml(sede.direccion || "")}</span>
                    <span>${ic.phone} ${escapeHtml(sede.telefono || "")}</span>
                    <span>${ic.mail} ${escapeHtml(sede.email || "")}</span>
                  </div>
                  <a href="/acceso?sede=${sede.codigo}" class="btn-sede-access">
                    ${ic.arrowRight} Acceder al sistema
                  </a>
                </div>
              </article>
            `).join("")}
          </div>
        </div>
      </section>

      <!-- Contact Section -->
      <section id="contacto" class="section-contacto">
        <div class="container">
          <header class="section-header">
            <h2 class="dia-title">Contacto</h2>
            <p class="section-subtitle">Estamos aquí para ayudarte</p>
          </header>
          <div class="contacto-grid">
            <div class="contacto-info">
              <h3>Información de Contacto</h3>
              <div class="contacto-items">
                <div class="contacto-item">
                  <span class="contacto-icon">${ic.phone}</span>
                  <div>
                    <strong>Teléfono</strong>
                    <p>${escapeHtml(state.siteContent.contacto.telefono || "+507 000-0000")}</p>
                  </div>
                </div>
                <div class="contacto-item">
                  <span class="contacto-icon">${ic.messageSquare}</span>
                  <div>
                    <strong>WhatsApp</strong>
                    <p>${escapeHtml(state.siteContent.contacto.whatsapp || "+507 000-0000")}</p>
                  </div>
                </div>
                <div class="contacto-item">
                  <span class="contacto-icon">${ic.mail}</span>
                  <div>
                    <strong>Email</strong>
                    <p>${escapeHtml(state.siteContent.contacto.email || "info@deportivoitalia.com")}</p>
                  </div>
                </div>
              </div>
              <div class="redes-sociales">
                <h4>Síguenos</h4>
                <div class="social-links">
                  <a href="#" class="social-link" aria-label="Facebook">${ic.facebook}</a>
                  <a href="#" class="social-link" aria-label="Instagram">${ic.instagram}</a>
                  <a href="#" class="social-link" aria-label="YouTube">${ic.youtube}</a>
                  <a href="#" class="social-link" aria-label="Twitter">${ic.twitter}</a>
                </div>
              </div>
            </div>
            <form class="contacto-form" id="contactForm">
              <h3>Escríbenos</h3>
              <div class="form-row">
                <input type="text" name="nombre" placeholder="Nombre completo" required>
                <input type="email" name="email" placeholder="Correo electrónico" required>
              </div>
              <input type="text" name="asunto" placeholder="Asunto" required>
              <textarea name="mensaje" placeholder="Tu mensaje..." rows="5" required></textarea>
              <button type="submit" class="btn-submit">${ic.send} Enviar mensaje</button>
            </form>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="public-footer">
        <div class="container">
          <div class="footer-grid">
            <div class="footer-brand">
              <img src="/img/logo-deportivoitalia.png" alt="Deportivo Italia Academy" class="footer-logo">
              <p>Formando futbolistas, desarrollando talentos y construyendo valores.</p>
            </div>
            <div class="footer-links">
              <h4>Enlaces Rápidos</h4>
              <ul>
                <li><a href="#nosotros">Nosotros</a></li>
                <li><a href="#galeria">Galería</a></li>
                <li><a href="#sedes">Sedes</a></li>
                <li><a href="/acceso">Acceso al Sistema</a></li>
              </ul>
            </div>
            <div class="footer-links">
              <h4>Sedes</h4>
              <ul>
                <li><a href="/acceso?sede=PV">Panamá Viejo</a></li>
                <li><a href="/acceso?sede=BR">Brisas</a></li>
              </ul>
            </div>
            <div class="footer-contact">
              <h4>Contacto</h4>
              <p>${ic.mapPin} Ciudad de Panamá</p>
              <p>${ic.phone} +507 000-0000</p>
              <p>${ic.mail} info@deportivoitalia.com</p>
            </div>
          </div>
          <div class="footer-bottom">
            <p>&copy; 2026 Deportivo Italia Academy. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  `;
}

function renderGaleria() {
  const galeria = state.siteContent.galeria || [];
  const categorias = [...new Set(galeria.map(g => g.categoria).filter(Boolean))];
  
  if (galeria.length === 0) {
    return `
      <div class="galeria-empty">
        <div class="empty-icon">${ic.image}</div>
        <p>No hay imágenes en la galería aún.</p>
        <small>Las imágenes se pueden administrar desde el panel administrativo.</small>
      </div>
    `;
  }

  return `
    <div class="galeria-filters">
      <button class="galeria-filter active" data-filter="all">Todas</button>
      ${categorias.map(cat => `<button class="galeria-filter" data-filter="${cat}">${cat}</button>`).join("")}
    </div>
    <div class="galeria-masonry">
      ${galeria.map((img, idx) => `
        <div class="galeria-item" data-categoria="${escapeHtml(img.categoria || "")}">
          <img src="${escapeHtml(img.url)}" alt="${escapeHtml(img.descripcion || `Imagen ${idx + 1}`)}" loading="lazy">
          <div class="galeria-overlay">
            <h4>${escapeHtml(img.descripcion || "")}</h4>
            <span class="galeria-cat">${escapeHtml(img.categoria || "")}</span>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}