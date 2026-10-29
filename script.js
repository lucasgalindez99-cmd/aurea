// Tienda pública de Áurea Bags.
// Los productos, secciones y ajustes se leen de Firebase (Firestore) y se
// administran desde /admin. Si Firebase todavía no está configurado, se
// muestran los productos de legacy-products.js para que la página nunca quede vacía.
import { FIREBASE_READY } from "./firebase-config.js";

let settings = {
  whatsapp: "5493517012317",
  saludo: "Hola! Me interesa esta cartera:",
  instagram: "",
};
let products = [];   // productos visibles, ya normalizados
let groups = [];     // [{ id, name, items: [indices de products] }]

/* ———————————————— Carga de datos ———————————————— */

function normalizeProduct(raw, id) {
  const images = (raw.images || [])
    .map((im) => (typeof im === "string" ? im : im && im.url))
    .filter(Boolean);
  return {
    id,
    name: raw.name || "",
    code: raw.code || "",
    price: Number(raw.price) || 0,
    desc: raw.desc || "",
    medidas: raw.medidas || "",
    stockQty: Math.max(0, Math.floor(Number(raw.stock) || 0)),
    inStock: Number(raw.stock) > 0,
    isNew: !!raw.isNew,
    visible: raw.visible !== false,
    sectionId: raw.sectionId || raw.section || null,
    order: Number.isFinite(raw.order) ? raw.order : 0,
    images,
  };
}

async function loadFromFirebase() {
  const { db } = await import("./firebase-init.js");
  const { collection, getDocs, doc, getDoc } = await import(
    "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore-lite.js"
  );
  const [secSnap, prodSnap, setSnap] = await Promise.all([
    getDocs(collection(db, "sections")),
    getDocs(collection(db, "products")),
    getDoc(doc(db, "settings", "site")),
  ]);
  const sections = secSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const prods = prodSnap.docs.map((d) => normalizeProduct(d.data(), d.id));
  const site = setSnap.exists() ? setSnap.data() : {};
  return { sections, prods, site };
}

async function loadFromLegacy() {
  const { LEGACY_SECTIONS, LEGACY_PRODUCTS, LEGACY_SETTINGS } = await import("./legacy-products.js");
  const sections = LEGACY_SECTIONS.map((s, i) => ({ id: s.key, name: s.name, order: i, visible: true }));
  const prods = LEGACY_PRODUCTS.map((p, i) => normalizeProduct({ ...p, order: i }, "legacy-" + i));
  return { sections, prods, site: LEGACY_SETTINGS };
}

function buildGroups(sections, prods) {
  const visibleSections = sections
    .filter((s) => s.visible !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const known = new Set(sections.map((s) => s.id));
  const hiddenSections = new Set(sections.filter((s) => s.visible === false).map((s) => s.id));

  products = prods.filter((p) => p.visible && !hiddenSections.has(p.sectionId));

  // Dentro de cada sección: primero las disponibles, después las agotadas; luego por orden manual.
  const sortIdx = (arr) =>
    arr.sort((a, b) => {
      const A = products[a], B = products[b];
      if (A.inStock !== B.inStock) return A.inStock ? -1 : 1;
      return A.order - B.order;
    });

  groups = visibleSections
    .map((s) => ({
      id: s.id,
      name: s.name,
      items: sortIdx(products.map((p, i) => i).filter((i) => products[i].sectionId === s.id)),
    }))
    .filter((g) => g.items.length);

  const orphans = sortIdx(products.map((p, i) => i).filter((i) => !known.has(products[i].sectionId)));
  if (orphans.length) groups.push({ id: "otros", name: groups.length ? "Más modelos" : "", items: orphans });
}

/* ———————————————— Utilidades ———————————————— */

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function formatPrice(n) { return "$" + Math.round(n).toLocaleString("es-AR"); }

function bagPlaceholderSrc() {
  const svg = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 400'>" +
    "<rect width='320' height='400' fill='#f4ead8'/>" +
    "<g fill='none' stroke='#a9822f' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'>" +
    "<path d='M124 158 v-18 a36 36 0 0 1 72 0 v18'/>" +
    "<rect x='86' y='158' width='148' height='128' rx='8'/>" +
    "<line x1='86' y1='196' x2='234' y2='196'/>" +
    "<rect x='150' y='182' width='20' height='16' rx='2'/></g></svg>";
  return "data:image/svg+xml," + encodeURIComponent(svg);
}

// Devuelve las fotos de un producto (la primera es la portada). Si no tiene, usa el dibujo placeholder.
function productImages(p) {
  return p.images.length ? p.images : [bagPlaceholderSrc()];
}

function waNumber() { return String(settings.whatsapp || "").replace(/[^0-9]/g, ""); }

function waLink(msg) { return "https://wa.me/" + waNumber() + "?text=" + encodeURIComponent(msg); }

function whatsappUrl(p) {
  return waLink((settings.saludo || "Hola! Me interesa esta cartera:") + "\n\n" + p.name + " - " + formatPrice(p.price));
}

/* ———————————————— Render del catálogo ———————————————— */

function rowHtml(i, pos) {
  const p = products[i];
  const url = whatsappUrl(p);
  const rowClass = pos % 2 === 1 ? "rev" : "";
  const tagClass = p.inStock ? "tag-accent-2" : "tag-neutral";
  const stockLabel = p.inStock ? "Disponible" : "Agotado";
  const thumb = productImages(p)[0];
  return `
      <div class="ab-wrap">
        <div class="ab-row ${rowClass}" data-index="${i}" tabindex="0" role="button" aria-haspopup="dialog" aria-label="Ver detalle de ${esc(p.name)}">
          <figure class="ab-photo${p.inStock ? "" : " is-soldout"}" style="margin:0;">
            <img src="${esc(thumb)}" alt="Foto de ${esc(p.name)}" loading="${pos < 2 ? "eager" : "lazy"}">
            <span class="ab-photo-cue" aria-hidden="true">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              Ver más
            </span>
          </figure>
          <div class="ab-info">
            <div class="ab-tag-row" style="display:flex;align-items:center;gap:var(--space-3);margin-bottom:var(--space-3);">
              <span class="tag ${tagClass}">${stockLabel}</span>
              ${p.isNew ? `<span class="tag ab-tag-new">Nuevo</span>` : ""}
            </div>
            <h2 class="ab-title" style="font-family:var(--font-heading);font-weight:var(--font-heading-weight);font-size:clamp(26px,3vw,36px);letter-spacing:0;margin:0;">${esc(p.name)}</h2>
            <p class="ab-desc" style="font-size:15.5px;line-height:1.65;max-width:42ch;margin:var(--space-4) 0 0;color:color-mix(in srgb,var(--color-text) 78%,transparent);">${esc(p.desc)}</p>
            ${p.medidas ? `<p class="ab-medidas" style="font-size:13px;margin:var(--space-3) 0 0;color:color-mix(in srgb,var(--color-text) 58%,transparent);">Medidas: ${esc(p.medidas)}</p>` : ""}
            <div class="ab-meta-row">
              <p class="ab-price" style="font-family:var(--font-heading);font-weight:var(--font-heading-weight);font-size:26px;color:var(--color-accent-700);margin:var(--space-5) 0 0;">${formatPrice(p.price)}</p>
              <div class="ab-mobile-more" aria-hidden="true">
                Ver detalle
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </div>
            </div>
            <a href="${esc(url)}" target="_blank" rel="noopener" class="btn btn-secondary js-wa-link ab-wa-btn" style="margin-top:var(--space-5);display:inline-flex;">Consultar por WhatsApp</a>
          </div>
        </div>
        <hr class="hr">
      </div>`;
}

function render() {
  const root = document.getElementById("catalogo-list");
  if (!groups.length) {
    root.innerHTML = `<div class="ab-wrap"><p class="ab-catalog-msg">Pronto vas a ver nuestras carteras acá. Mientras tanto, <a href="${esc(waLink("Hola! Quiero consultar por el catálogo de Áurea Bags"))}" target="_blank" rel="noopener">escribinos por WhatsApp</a>.</p></div>`;
    return;
  }
  const named = groups.filter((g) => g.name);
  const chips = named.length > 1
    ? `<div class="ab-wrap"><nav class="ab-section-chips" aria-label="Secciones del catálogo">${named
        .map((g) => `<a href="#sec-${esc(g.id)}" class="ab-chip">${esc(g.name)}</a>`).join("")}</nav></div>`
    : "";
  root.innerHTML = chips + groups.map((g) => {
    const head = g.name
      ? `<div class="ab-wrap ab-section-head" id="sec-${esc(g.id)}"><h2 class="ab-section-title">${esc(g.name)}</h2><span class="ab-section-count">${g.items.length} ${g.items.length === 1 ? "modelo" : "modelos"}</span></div>`
      : "";
    return head + g.items.map((i, pos) => rowHtml(i, pos)).join("");
  }).join("");
}

function applySettings() {
  const set = (id, val, prop = "textContent") => {
    const el = document.getElementById(id);
    if (el && val) el[prop] = val;
  };
  set("heroTitle", settings.heroTitle);
  set("heroDesc", settings.heroDesc);
  set("entregasTitle", settings.entregasTitle);
  set("entregasDesc", settings.entregasDesc);
  set("footerIgLink", settings.instagram, "href");
  const ent = document.getElementById("entregasWaLink");
  if (ent) ent.href = waLink("Hola! Quiero coordinar la entrega de mi pedido en Código Capital");
  const foot = document.getElementById("footerWaLink");
  if (foot) foot.href = waLink("Hola! Quiero consultar por el catálogo de Áurea Bags");
}

/* ———————————————— Navegación (menú mobile) ———————————————— */

function setupNav() {
  const toggle = document.getElementById("navToggle");
  const links = document.getElementById("navLinks");
  if (!toggle || !links) return;

  function close() {
    links.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Abrir menú");
  }
  function open() {
    links.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Cerrar menú");
  }

  toggle.addEventListener("click", () => {
    links.classList.contains("is-open") ? close() : open();
  });
  links.querySelectorAll("a").forEach((a) => a.addEventListener("click", close));
  window.addEventListener("resize", () => { if (window.innerWidth > 700) close(); });
}

/* ————————————————————————————————————————————
   Modal de producto: galería, specs, precio y WhatsApp
   ———————————————————————————————————————————— */
let modalEls = null;
let currentIndex = 0;
let currentImgIdx = 0;
let lastFocusedEl = null;

function buildModal() {
  const wrap = document.createElement("div");
  wrap.className = "ab-modal-backdrop";
  wrap.id = "abModalBackdrop";
  wrap.hidden = true;
  wrap.innerHTML = `
    <div class="ab-modal" role="dialog" aria-modal="true" aria-labelledby="abModalTitle">
      <button type="button" class="ab-modal-close" aria-label="Cerrar">&times;</button>
      <div class="ab-modal-gallery">
        <div class="ab-modal-main">
          <button type="button" class="ab-modal-arrow prev" aria-label="Foto anterior">&#8249;</button>
          <img id="abModalMainImg" src="" alt="">
          <button type="button" class="ab-modal-arrow next" aria-label="Foto siguiente">&#8250;</button>
        </div>
        <div class="ab-modal-thumbs" id="abModalThumbs"></div>
      </div>
      <div class="ab-modal-info">
        <span class="tag" id="abModalTag"></span>
        <h2 id="abModalTitle"></h2>
        <p id="abModalDesc"></p>
        <p id="abModalMedidas" class="text-muted"></p>
        <p id="abModalPrice"></p>
        <a id="abModalWA" href="#" target="_blank" rel="noopener" class="btn btn-secondary ab-modal-wa-btn">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.28-1.38a9.9 9.9 0 0 0 4.76 1.21h.01c5.46 0 9.9-4.45 9.9-9.91C21.96 6.45 17.51 2 12.04 2zm5.8 14.03c-.24.68-1.4 1.3-1.93 1.36-.5.06-1.06.09-1.72-.11-.4-.12-.9-.29-1.56-.57-2.74-1.18-4.53-3.94-4.67-4.13-.14-.19-1.11-1.48-1.11-2.82s.7-2.01.95-2.28c.24-.27.53-.34.71-.34l.51.01c.16 0 .38-.06.6.46.22.53.75 1.83.82 1.96.07.14.11.3.02.48-.09.19-.13.3-.26.46-.13.16-.28.36-.4.48-.13.13-.27.28-.12.55.16.27.7 1.16 1.51 1.88 1.04.93 1.91 1.22 2.19 1.36.28.14.44.12.6-.07.16-.19.68-.79.86-1.06.18-.27.36-.22.6-.13.24.09 1.53.72 1.79.85.27.13.44.2.51.31.06.11.06.65-.18 1.33z"/></svg>
          Consultar por WhatsApp
        </a>
      </div>
    </div>`;
  document.body.appendChild(wrap);

  modalEls = {
    backdrop: wrap,
    closeBtn: wrap.querySelector(".ab-modal-close"),
    prevBtn: wrap.querySelector(".ab-modal-arrow.prev"),
    nextBtn: wrap.querySelector(".ab-modal-arrow.next"),
    mainImg: wrap.querySelector("#abModalMainImg"),
    thumbs: wrap.querySelector("#abModalThumbs"),
    tag: wrap.querySelector("#abModalTag"),
    title: wrap.querySelector("#abModalTitle"),
    desc: wrap.querySelector("#abModalDesc"),
    medidas: wrap.querySelector("#abModalMedidas"),
    price: wrap.querySelector("#abModalPrice"),
    wa: wrap.querySelector("#abModalWA"),
  };

  modalEls.closeBtn.addEventListener("click", closeModal);
  modalEls.backdrop.addEventListener("click", (e) => { if (e.target === modalEls.backdrop) closeModal(); });
  modalEls.prevBtn.addEventListener("click", () => stepImage(-1));
  modalEls.nextBtn.addEventListener("click", () => stepImage(1));

  document.addEventListener("keydown", (e) => {
    if (modalEls.backdrop.hidden) return;
    if (e.key === "Escape") closeModal();
    if (e.key === "ArrowRight") stepImage(1);
    if (e.key === "ArrowLeft") stepImage(-1);
  });
}

function renderImage() {
  const p = products[currentIndex];
  const imgs = productImages(p);
  modalEls.mainImg.src = imgs[currentImgIdx];
  modalEls.mainImg.alt = "Foto de " + p.name;
  modalEls.mainImg.closest(".ab-modal-main").classList.toggle("is-soldout", !p.inStock);

  const showNav = imgs.length > 1;
  modalEls.prevBtn.style.display = showNav ? "flex" : "none";
  modalEls.nextBtn.style.display = showNav ? "flex" : "none";
  modalEls.thumbs.style.display = showNav ? "flex" : "none";

  modalEls.thumbs.innerHTML = imgs.map((src, i) =>
    `<button type="button" class="ab-modal-thumb ${i === currentImgIdx ? "is-active" : ""}" data-i="${i}" aria-label="Foto ${i + 1}"><img src="${esc(src)}" alt=""></button>`
  ).join("");

  modalEls.thumbs.querySelectorAll(".ab-modal-thumb").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentImgIdx = Number(btn.dataset.i);
      renderImage();
    });
  });
}

function stepImage(dir) {
  const imgs = productImages(products[currentIndex]);
  currentImgIdx = (currentImgIdx + dir + imgs.length) % imgs.length;
  renderImage();
}

function openModal(index, triggerEl) {
  if (!modalEls) buildModal();
  currentIndex = index;
  currentImgIdx = 0;
  lastFocusedEl = triggerEl || document.activeElement;

  const p = products[index];
  modalEls.tag.className = "tag " + (p.inStock ? "tag-accent-2" : "tag-neutral");
  modalEls.tag.textContent = p.inStock ? "Disponible" : "Agotado";
  modalEls.title.textContent = p.name;
  modalEls.desc.textContent = p.desc;
  modalEls.medidas.textContent = p.medidas ? "Medidas: " + p.medidas : "";
  modalEls.price.innerHTML = `<span class="ab-currency">$</span>` + Math.round(p.price).toLocaleString("es-AR");
  modalEls.wa.href = whatsappUrl(p);

  renderImage();

  modalEls.backdrop.hidden = false;
  requestAnimationFrame(() => modalEls.backdrop.classList.add("is-open"));
  document.body.style.overflow = "hidden";
  modalEls.closeBtn.focus();
}

function closeModal() {
  if (!modalEls || modalEls.backdrop.hidden) return;
  modalEls.backdrop.classList.remove("is-open");
  document.body.style.overflow = "";
  setTimeout(() => { modalEls.backdrop.hidden = true; }, 200);
  if (lastFocusedEl && lastFocusedEl.focus) lastFocusedEl.focus();
}

function setupProductModal() {
  const root = document.getElementById("catalogo-list");
  root.addEventListener("click", (e) => {
    if (e.target.closest(".js-wa-link")) return; // el link de WhatsApp funciona normal, no abre el modal
    const row = e.target.closest(".ab-row");
    if (!row) return;
    openModal(Number(row.dataset.index), row);
  });
  root.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    if (e.target.closest(".js-wa-link")) return;
    const row = e.target.closest(".ab-row");
    if (!row) return;
    e.preventDefault();
    openModal(Number(row.dataset.index), row);
  });
}

/* ———————————————— Arranque ———————————————— */

async function init() {
  setupNav();
  setupProductModal();
  applySettings();
  const root = document.getElementById("catalogo-list");
  root.innerHTML = `<div class="ab-wrap"><p class="ab-catalog-msg">Cargando catálogo…</p></div>`;
  try {
    let data = FIREBASE_READY ? await loadFromFirebase() : await loadFromLegacy();
    // Si la base todavía está vacía (antes de importar desde /admin), mostramos los productos de siempre.
    if (FIREBASE_READY && !data.prods.length && !data.sections.length) data = await loadFromLegacy();
    settings = { ...settings, ...data.site };
    buildGroups(data.sections, data.prods);
    applySettings();
    render();
  } catch (err) {
    console.error("[Áurea] No se pudo cargar el catálogo:", err);
    root.innerHTML = `<div class="ab-wrap"><p class="ab-catalog-msg">No pudimos cargar el catálogo en este momento. Probá recargar la página o <a href="${esc(waLink("Hola! Quiero consultar por el catálogo de Áurea Bags"))}" target="_blank" rel="noopener">escribinos por WhatsApp</a>.</p></div>`;
  }
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();
