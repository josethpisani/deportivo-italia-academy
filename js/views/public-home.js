import { state } from "../state.js";
import { ic } from "../icons.js";
import { escapeHtml, sedeDisplayName } from "../utils.js";
import { CONTACT_EMAIL } from "../constants.js";
import { registrationFields } from "../registration-fields.js";

const whatsappNumber = "+507 6431-1299";
const whatsappUrl = "https://wa.me/50764311299";
const instagramUrl = "https://www.instagram.com/deportivoitaliapa/";
const whatsappLogo = `<svg aria-hidden="true" width="25" height="25" viewBox="0 0 24 24" fill="currentColor"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.08-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.09 3.19 5.06 4.47.71.3 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35M12 21.8a9.8 9.8 0 0 1-5-1.37l-.36-.21-3.71.97.99-3.61-.24-.37A9.8 9.8 0 1 1 12 21.8M12 0a12 12 0 0 0-10.4 17.98L0 24l6.16-1.62A12 12 0 1 0 12 0"/></svg>`;

export function renderFloatingSocialLinks() {
  return `<div class="public-social-float">
    <a class="public-social-button public-instagram-button" href="${instagramUrl}" target="_blank" rel="noopener noreferrer" aria-label="Deportivo Italia en Instagram">${ic.instagram}</a>
    <a class="public-social-button public-whatsapp-button" href="${whatsappUrl}" target="_blank" rel="noopener noreferrer" aria-label="Contactar por WhatsApp">${whatsappLogo}</a>
  </div>`;
}

export function renderPublicHome() {
  /* Legacy duplicated template kept out of the render path. */
  const c = state.siteContent.hero;
  const sedes = state.sedes.filter(s => s.estado === 'activa');
  
  /*
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
            <a href="/acceso" class="btn-hero btn-hero-secondary">${ic.shield} ${escapeHtml(c.ctaSecondary === "Acceder al sistema" ? "Sistema Staff" : (c.ctaSecondary || "Sistema Staff"))}</a>
            <a href="/portal-padres" class="btn-hero btn-hero-secondary">${ic.users} Portal de padres</a>
            <button type="button" class="btn-hero btn-hero-trial" id="btnTrialRequest">${ic.calendar} Práctica de prueba</button>
            <button type="button" class="btn-hero btn-hero-trial" id="btnTrialRequest">${ic.calendar} Solicita tu entrenamiento de prueba</button>
            <button type="button" class="btn-hero btn-hero-trial" id="btnTrialRequest">${ic.calendar} Solicita tu entrenamiento de prueba</button>
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
  */
  
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
            <a href="/acceso" class="btn-hero btn-hero-secondary">${ic.shield} ${escapeHtml(c.ctaSecondary === "Acceder al sistema" ? "Sistema Staff" : (c.ctaSecondary || "Sistema Staff"))}</a>
            <a href="/portal-padres" class="btn-hero btn-hero-secondary">${ic.users} Portal de padres</a>
            <button type="button" class="btn-hero btn-hero-trial" id="btnTrialRequest">${ic.calendar} Práctica de prueba</button>
            <button type="button" class="btn-hero btn-hero-trial" id="btnEnrollmentRequest">${ic.users} Inscribir jugador</button>
          </div>
        </div>
        <div class="hero-scroll">${ic.chevronDown}</div>
      </section>

      <div class="modal-overlay" id="trialModal" style="display:none" role="dialog" aria-modal="true" aria-labelledby="trialModalTitle">
        <div class="modal modal-trial">
          <button class="modal-close" id="closeTrialModal" aria-label="Cerrar">${ic.x}</button>
          <div class="modal-header"><h2 id="trialModalTitle">${ic.calendar} Solicitar Entrenamiento de Prueba</h2><p class="modal-subtitle">Selecciona día, horario y completa tus datos</p></div>
          <form id="trialForm" class="modal-body">
            <div class="form-step" id="stepCalendar">
              <h3>${ic.calendar} Paso 1: Sede, categoría y fecha</h3>
              <div class="form-row"><div class="form-group"><label for="trialSede">${ic.mapPin} Sede *</label><select id="trialSede" name="sede_id" required><option value="">Selecciona una sede</option>${sedes.map(s => `<option value="${escapeHtml(s.id)}">${escapeHtml(s.nombre)}</option>`).join('')}</select></div><div class="form-group"><label for="trialCategory">${ic.users} Categoría *</label><select id="trialCategory" name="category" required><option value="">Selecciona categoría</option><option value="U4">U4 — 4:30 PM</option><option value="U6">U6 — 4:30 PM</option><option value="U8">U8 — 5:00 PM</option><option value="U10">U10 — 5:00 PM</option><option value="U12">U12 — 5:00 PM</option></select></div></div>
              <div class="calendar-info"><div class="info-badge">${ic.alert} Disponible solo lunes y miércoles</div><div class="info-badge" id="selectedSchedule">Selecciona una categoría y un día</div></div>
              <div class="calendar-container" id="calendarContainer"></div>
              <button type="button" class="btn-next" id="btnNextToForm" disabled>${ic.arrowRight} Continuar</button>
            </div>
            <div class="form-step" id="stepForm" style="display:none">
              <h3>${ic.users} Paso 2: Datos del representante y atleta</h3>
              <div class="form-row"><div class="form-group"><label for="athleteName">${ic.users} Nombre completo del atleta *</label><input type="text" id="athleteName" name="athleteName" required></div><div class="form-group"><label for="athleteAge">${ic.users} Edad *</label><input type="number" id="athleteAge" name="athlete_age" min="3" max="12" required></div></div>
              <div class="form-group"><label for="repName">${ic.users} Nombre completo del representante *</label><input type="text" id="repName" name="repName" required></div>
              <div class="form-row"><div class="form-group"><label for="trialEmail">${ic.mail} Correo *</label><input type="email" id="trialEmail" name="email" required></div><div class="form-group"><label for="trialPhone">${ic.phone} Teléfono *</label><input type="tel" id="trialPhone" name="phone" pattern="(?:\\+?507[\\s-]?)?[2-9][0-9]{3}[\\s-]?[0-9]{4}" title="Ejemplo: +507 6000-0000" required></div></div>
              <div class="form-group"><label for="trialNotes">Observaciones / comentarios</label><textarea id="trialNotes" name="notes" rows="3"></textarea></div>
              <p class="trial-summary" id="trialSummary"></p>
              <button type="submit" class="btn-submit-trial">${ic.send} Enviar Solicitud</button>
            </div>
          </form>
          <div class="modal-success" id="modalSuccess" style="display:none"><div class="success-icon">${ic.checkCircle}</div><h3>¡Práctica de prueba registrada correctamente!</h3><p id="trialConfirmation"></p><button type="button" class="btn-close-success" id="btnCloseSuccess">${ic.check} Cerrar</button></div>
        </div>
      </div>

      <div class="modal-overlay" id="enrollmentModal" style="display:none" role="dialog" aria-modal="true" aria-labelledby="enrollmentModalTitle">
        <div class="modal modal-trial">
          <button class="modal-close" id="closeEnrollmentModal" aria-label="Cerrar">${ic.x}</button>
          <div class="modal-header"><h2 id="enrollmentModalTitle">${ic.users} Inscribir jugador</h2><p class="modal-subtitle">Déjanos tus datos y te contactaremos para completar la inscripción.</p></div>
          <form id="enrollmentForm" class="modal-body">
            <div class="form-row"><div class="form-group"><label for="enrollAthleteName">Nombre completo del jugador *</label><input id="enrollAthleteName" name="athlete_name" required></div><div class="form-group"><label for="enrollAthleteAge">Edad *</label><input id="enrollAthleteAge" name="athlete_age" type="number" min="3" max="18" required></div></div>
            <div class="form-row"><div class="form-group"><label for="enrollCategory">Categoría *</label><select id="enrollCategory" name="category" required><option value="">Selecciona categoría</option><option>U4</option><option>U6</option><option>U8</option><option>U10</option><option>U12</option></select></div><div class="form-group"><label for="enrollSede">Sede *</label><select id="enrollSede" name="sede_id" required><option value="">Selecciona sede</option>${sedes.map(s => `<option value="${escapeHtml(s.id)}">${escapeHtml(s.nombre)}</option>`).join('')}</select></div></div>
            <div class="form-row">${registrationFields.map(([name, label, type = "text", required = true]) => {
              const control = Array.isArray(type)
                ? `<select id="enroll-${name}" name="${name}" ${required ? "required" : ""}><option value="">Selecciona una opción</option>${type.map(option => `<option>${option}</option>`).join("")}</select>`
                : `<input id="enroll-${name}" name="${name}" type="${type}" maxlength="250" ${required ? "required" : ""}>`;
              return `<div class="form-group"><label for="enroll-${name}">${label}${required ? " *" : ""}</label>${control}</div>`;
            }).join("")}</div>
            <div class="form-group"><label for="enrollRepresentative">Nombre completo del acudiente *</label><input id="enrollRepresentative" name="representative_name" required></div>
            <div class="form-row"><div class="form-group"><label for="enrollPhone">Teléfono *</label><input id="enrollPhone" name="phone" type="tel" pattern="(?:\\+?507[\\s-]?)?[2-9][0-9]{3}[\\s-]?[0-9]{4}" title="Ejemplo: +507 6000-0000" required></div><div class="form-group"><label for="enrollEmail">Correo electrónico *</label><input id="enrollEmail" name="email" type="email" required></div></div>
            <div class="form-group"><label for="enrollNotes">Comentarios</label><textarea id="enrollNotes" name="notes" rows="3" placeholder="Horario preferido, experiencia u otra información"></textarea></div>
            <button type="submit" class="btn-submit-trial">${ic.send} Enviar solicitud de inscripción</button>
          </form>
          <div class="modal-success" id="enrollmentSuccess" style="display:none"><div class="success-icon">${ic.checkCircle}</div><h3>¡Solicitud recibida!</h3><p id="enrollmentConfirmation">Te contactaremos para confirmar los siguientes pasos.</p><button type="button" class="btn-close-success" id="btnCloseEnrollment">${ic.check} Cerrar</button></div>
        </div>
      </div>

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
                  ${sede.codigo === 'BR' || sede.id === 'sed_brisas' ? `<img src="/img/sede-brisas.jpg" alt="Cancha de la sede Brisas" class="sede-img" style="object-position: center 67%" loading="lazy">` :
                    sede.codigo === 'PV' || sede.id === 'sed_panama_viejo' ? `<img src="/img/panama-viejo.jpg" alt="Sede Panamá Viejo" class="sede-img">` : sede.imagen_principal 
                    ? `<img src="${escapeHtml(sede.imagen_principal)}" alt="${escapeHtml(sede.nombre)}" class="sede-img">`
                    : `<div class="sede-img-placeholder">${ic.mapPin}</div>`
                  }
                </div>
                <div class="sede-info">
                  <h3>${escapeHtml(sedeDisplayName(sede))}</h3>
                  <p class="sede-desc">${escapeHtml(sede.descripcion || "")}</p>
                  <div class="sede-meta">
                    <span>${ic.mapPin} ${escapeHtml(sede.direccion || "")}</span>
                    <span>${ic.mail} ${escapeHtml(sede.email || "")}</span>
                  </div>
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
                  <span class="contacto-icon">${ic.messageSquare}</span>
                  <div>
                    <strong>WhatsApp</strong>
                    <p><a href="${whatsappUrl}" target="_blank" rel="noopener noreferrer">${whatsappNumber}</a></p>
                  </div>
                </div>
                <div class="contacto-item">
                  <span class="contacto-icon">${ic.mail}</span>
                  <div>
                    <strong>Email</strong>
                    <p><a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a></p>
                  </div>
                </div>
              </div>
              <div class="redes-sociales">
                <h4>Síguenos</h4>
                <div class="social-links">
                  <a href="#" class="social-link" aria-label="Facebook">${ic.facebook}</a>
                  <a href="${instagramUrl}" class="social-link" target="_blank" rel="noopener noreferrer" aria-label="Instagram">${ic.instagram}</a>
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
              <button type="submit" class="btn-submit">${ic.send} Abrir en mi correo</button>
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
                <li><a href="/acceso">Sistema Staff</a></li>
                <li><a href="/portal-padres">Portal de padres</a></li>
              </ul>
            </div>
            <div class="footer-links">
              <h4>Sedes</h4>
              <ul>
                <li><a href="/acceso?sede=PV">${sedeDisplayName({ codigo: "PV" })}</a></li>
                <li><a href="/acceso?sede=BR">${sedeDisplayName({ codigo: "BR" })}</a></li>
              </ul>
            </div>
            <div class="footer-contact">
              <h4>Contacto</h4>
              <p>${ic.mapPin} Ciudad de Panamá</p>
              <p>${ic.messageSquare} <a href="${whatsappUrl}" target="_blank" rel="noopener noreferrer">WhatsApp ${whatsappNumber}</a></p>
              <p>${ic.mail} <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a></p>
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
