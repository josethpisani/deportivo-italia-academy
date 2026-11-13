import { state } from "./state.js";
import { escapeHtml } from "./utils.js";

const endpoint = "/api/data?key=academy_news";
const esc = escapeHtml;
const savedCovers = {
  "https://www.instagram.com/p/C-DkHjOOkg5/": "/img/noticia-donde-nos-encuentras.jpg",
  "https://www.instagram.com/p/DfsFKBWhPET/": "/img/noticia-calendario-noviembre.jpg",
  "https://www.instagram.com/reel/DWha0lQEUTZ/": "/img/noticia-reel-dwha0lqeutz.jpg"
};

async function requestNews(body) {
  const response = await fetch(endpoint, body ? {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
  } : {});
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "No se pudo completar la operación.");
  return result;
}

export async function loadNews() {
  state.news = await requestNews();
}

const formatDate = value => new Intl.DateTimeFormat("es-PA", {
  dateStyle: "medium", timeZone: "America/Panama"
}).format(new Date(value));

export function renderNews() {
  return `<section class="section-news" id="noticias" aria-labelledby="news-heading">
    <div class="container">
      <header class="section-header"><h2 id="news-heading" class="dia-title">Noticias de la Academia</h2></header>
      <div class="news-grid">${state.news.map((item, index) => {
        const instagram = /^https:\/\/(?:www\.)?instagram\.com\/(?:p|reel)\/[A-Za-z0-9_-]+\/$/.test(item.instagram) ? item.instagram : "";
        const cover = item.image || (instagram && (savedCovers[instagram] || `${instagram.replace("/reel/", "/p/")}media/?size=l`));
        const tag = instagram ? "a" : "article";
        const link = instagram ? `href="${esc(instagram)}" target="_blank" rel="noopener noreferrer"` : "";
        return `
        <${tag} class="news-card ${index === 0 && item.featured ? "news-featured" : ""}" ${link}>
          ${cover ? `<img src="${esc(cover)}" alt="" loading="lazy">` : ""}
          <div class="news-copy">
            <time datetime="${esc(item.created_at)}">${formatDate(item.created_at)}</time>
            ${item.title ? `<h3>${esc(item.title)}</h3>` : ""}
          </div>
        </${tag}>`;
      }).join("") || "<p>Aún no hay noticias publicadas.</p>"}</div>
    </div>
  </section>`;
}

export function renderNewsAdmin() {
  const item = state.news.find(news => news.id === state.newsEditingId);
  return `<section class="config-section">
    <h3 class="dia-title">${item ? "Editar noticia" : "Nueva noticia"}</h3>
    <form id="newsForm" class="news-form">
      <label>Título (opcional)<input name="title" maxlength="120" value="${esc(item?.title || "")}"></label>
      <label>Resumen (opcional)<textarea name="summary" maxlength="2000" rows="5">${esc(item?.summary || "")}</textarea></label>
      <p>Agrega una foto o un enlace de Instagram. También puedes incluir ambos.</p>
      <label>${item?.image ? "Reemplazar portada" : "Foto"} · JPG, PNG o WebP, hasta 500 KB
        <input name="image" type="file" accept="image/jpeg,image/png,image/webp">
      </label>
      <label>Enlace opcional a un post o reel de Instagram<input name="instagram" type="url" value="${esc(item?.instagram || "")}"></label>
      <label class="news-check"><input type="checkbox" name="featured" ${item?.featured ? "checked" : ""}> Destacar noticia</label>
      <div class="news-actions"><button class="btn-primary" type="submit">${item ? "Guardar cambios" : "Publicar noticia"}</button>
      ${item ? '<button class="btn-outline" type="button" id="newsCancel">Cancelar</button>' : ""}</div>
      <p id="newsMessage" role="status"></p>
    </form>
  </section>
  <div class="news-admin-list">${state.news.map(news => `<article class="config-section">
    <h4>${esc(news.title || "Publicación sin título")}</h4><p>${formatDate(news.created_at)}${news.featured ? " · Destacada" : ""}</p>
    <div class="news-actions">
      <button type="button" class="btn-outline" data-news-edit="${esc(news.id)}">Editar</button>
      <button type="button" class="btn-outline" data-news-delete="${esc(news.id)}">Eliminar</button>
    </div></article>`).join("")}</div>`;
}

async function imageData(file) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 500000) {
    throw new Error("Selecciona una imagen JPG, PNG o WebP de hasta 500 KB.");
  }
  try {
    const bitmap = await createImageBitmap(file);
    bitmap.close();
  } catch {
    throw new Error("La portada no se puede abrir. Selecciona otra imagen.");
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("No se pudo leer la foto."));
    reader.readAsDataURL(file);
  });
}

export function attachNewsEvents() {
  const form = document.getElementById("newsForm");
  if (!form) return;
  const render = () => window.__render?.();
  const message = document.getElementById("newsMessage");
  const run = async (button, task) => {
    button.disabled = true;
    message.textContent = "";
    try { await task(); }
    catch (error) { message.textContent = error.message; }
    finally { button.disabled = false; }
  };
  const refresh = async () => {
    await loadNews();
    state.newsEditingId = null;
    render();
  };
  form.onsubmit = event => {
    event.preventDefault();
    return run(form.querySelector('[type="submit"]'), async () => {
      const fields = new FormData(form);
      const item = state.news.find(news => news.id === state.newsEditingId);
      const file = fields.get("image");
      const input = fields.get("instagram").trim();
      const match = /^https:\/\/(?:www\.)?instagram\.com\/(p|reel)\/([A-Za-z0-9_-]+)\/?(?:[?#].*)?$/.exec(input);
      if (input && !match) throw new Error("Pega el enlace de un post o reel de Instagram.");
      if (!match && !file?.size && !item?.image) {
        throw new Error("Agrega una foto o un enlace de Instagram para publicar.");
      }
      await requestNews({
        action: "save", id: item?.id, title: fields.get("title"), summary: fields.get("summary"),
        featured: fields.has("featured"),
        instagram: match ? `https://www.instagram.com/${match[1]}/${match[2]}/` : "",
        image: file?.size ? await imageData(file) : item?.image || ""
      });
      await refresh();
    });
  };
  document.getElementById("newsCancel")?.addEventListener("click", () => {
    state.newsEditingId = null;
    render();
  });
  document.querySelectorAll("[data-news-edit]").forEach(button => {
    button.onclick = () => { state.newsEditingId = button.dataset.newsEdit; render(); };
  });
  document.querySelectorAll("[data-news-delete]").forEach(button => {
    button.onclick = () => {
      if (confirm("¿Eliminar esta noticia de la página principal?")) {
        void run(button, async () => {
          await requestNews({ action: "delete", id: button.dataset.newsDelete });
          await refresh();
        });
      }
    };
  });
}
