// Tienda pública de Áurea Bags.
// Los productos, secciones y ajustes se leen de Firebase (Firestore) y se
// administran desde /admin. Si Firebase todavía no está configurado (o la base
// está vacía), se muestran los productos de legacy-products.js.
import { FIREBASE_READY } from "./firebase-config.js";

let settings = {
  whatsapp: "5493517012317",
  saludo: "Hola! Me interesa esta cartera:",
  instagram: "",
};
let products = [];     // productos visibles, ya normalizados
let groups = [];       // [{ id, name, slug, items: [índices de products] }]
let activeSlug = null; // sección que se está mostrando (cada sección es una pestaña)

/* ════════════════ Datos ════════════════ */

function normalizeProduct(raw, id) {
  const images = (raw.images || [])
    .map((im) => (typeof im === "string" ? im : im && im.url))
    .filter(Boolean);
  return {
    id,
    name: raw.name || "",
    price: Number(raw.price) || 0,
    desc: raw.desc || "",
    medidas: raw.medidas || "",
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
  return {
    sections: secSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    prods: prodSnap.docs.map((d) => normalizeProduct(d.data(), d.id)),
    site: setSnap.exists() ? setSnap.data() : {},
  };
}

async function loadFromLegacy() {
  const { LEGACY_SECTIONS, LEGACY_PRODUCTS, LEGACY_SETTINGS } = await import("./legacy-products.js");
  return {
    sections: LEGACY_SECTIONS.map((s, i) => ({ id: s.key, name: s.name, order: i, visible: true })),
    prods: LEGACY_PRODUCTS.map((p, i) => normalizeProduct({ ...p, order: i }, "legacy-" + i)),
    site: LEGACY_SETTINGS,
  };
}

function buildGroups(sections, prods) {
  const visibleSections = sections
    .filter((s) => s.visible !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const known = new Set(sections.map((s) => s.id));
  const hidden = new Set(sections.filter((s) => s.visible === false).map((s) => s.id));

  products = prods.filter((p) => p.visible && !hidden.has(p.sectionId));

  // Dentro de cada sección: primero las disponibles, después las agotadas; luego el orden del panel.
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
      slug: slugify(s.name) || s.id,
      items: sortIdx(products.map((p, i) => i).filter((i) => products[i].sectionId === s.id)),
    }))
    .filter((g) => g.items.length);

  const orphans = sortIdx(products.map((p, i) => i).filter((i) => !known.has(products[i].sectionId)));
  if (orphans.length) groups.push({ id: "otros", name: "Más modelos", slug: "mas-modelos", items: orphans });
}

/* ════════════════ Utilidades ════════════════ */

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function slugify(s) {
  return String(s || "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function formatPrice(n) { return "$" + Math.round(n).toLocaleString("es-AR"); }

function placeholderSrc() {
  const svg = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 400'>" +
    "<rect width='320' height='400' fill='#EFEAE4'/>" +
    "<g fill='none' stroke='#A9822F' stroke-width='3' stroke-linecap='round' stroke-linejoin='round' opacity='.6'>" +
    "<path d='M134 166 v-16 a26 26 0 0 1 52 0 v16'/>" +
    "<rect x='104' y='166' width='112' height='96' rx='6'/></g></svg>";
  return "data:image/svg+xml," + encodeURIComponent(svg);
}

const productImages = (p) => (p.images.length ? p.images : [placeholderSrc()]);
const waNumber = () => String(settings.whatsapp || "").replace(/[^0-9]/g, "");
const waLink = (msg) => "https://wa.me/" + waNumber() + "?text=" + encodeURIComponent(msg);
const whatsappUrl = (p) =>
  waLink((settings.saludo || "Hola! Me interesa esta cartera:") + "\n\n" + p.name + " - " + formatPrice(p.price));

const ICON_WA = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.28-1.38a9.9 9.9 0 0 0 4.76 1.21h.01c5.46 0 9.9-4.45 9.9-9.91C21.96 6.45 17.51 2 12.04 2zm5.8 14.03c-.24.68-1.4 1.3-1.93 1.36-.5.06-1.06.09-1.72-.11-.4-.12-.9-.29-1.56-.57-2.74-1.18-4.53-3.94-4.67-4.13-.14-.19-1.11-1.48-1.11-2.82s.7-2.01.95-2.28c.24-.27.53-.34.71-.34l.51.01c.16 0 .38-.06.6.46.22.53.75 1.83.82 1.96.07.14.11.3.02.48-.09.19-.13.3-.26.46-.13.16-.28.36-.4.48-.13.13-.27.28-.12.55.16.27.7 1.16 1.51 1.88 1.04.93 1.91 1.22 2.19 1.36.28.14.44.12.6-.07.16-.19.68-.79.86-1.06.18-.27.36-.22.6-.13.24.09 1.53.72 1.79.85.27.13.44.2.51.31.06.11.06.65-.18 1.33z"/></svg>`;
const ICON_CLOSE = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg>`;
const ICON_PREV = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>`;
const ICON_NEXT = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>`;

/* ════════════════ Portada ════════════════ */

function renderHero() {
  const box = document.getElementById("heroPhotos");
  if (!box) return;
  // Las 3 primeras disponibles con foto (de la primera sección hacia abajo) son las destacadas.
  const ordered = groups.flatMap((g) => g.items);
  const picks = ordered.filter((i) => products[i].inStock && products[i].images.length).slice(0, 3);
  if (picks.length < 3) picks.push(...ordered.filter((i) => products[i].images.length && !picks.includes(i)).slice(0, 3 - picks.length));
  if (!picks.length) return;
  box.innerHTML = picks.map((i) => {
    const p = products[i];
    return `<button type="button" class="hero-pick" data-index="${i}" aria-label="Ver ${esc(p.name)}">
      <img src="${esc(p.images[0])}" alt="" fetchpriority="high">
      <span class="hero-cap">${esc(p.name)}</span>
    </button>`;
  }).join("");
}

/* ════════════════ Colección ════════════════ */

function cardHtml(i, pos) {
  const p = products[i];
  const imgs = productImages(p);
  const lazy = pos < 4 ? "eager" : "lazy";
  return `
    <button type="button" class="card${p.inStock ? "" : " is-out"}" data-index="${i}" aria-haspopup="dialog">
      <span class="card-media">
        <img class="main" src="${esc(imgs[0])}" alt="${esc(p.name)}" loading="${lazy}">
        ${imgs[1] ? `<img class="alt" src="${esc(imgs[1])}" alt="" loading="lazy">` : ""}
        ${p.isNew && p.inStock ? `<span class="card-flag">Nuevo</span>` : ""}
        ${p.inStock ? "" : `<span class="card-flag is-out">Agotada</span>`}
      </span>
      <span class="card-body">
        <span class="card-name">${esc(p.name)}</span>
        <span class="card-price">${formatPrice(p.price)}</span>
      </span>
    </button>`;
}

function render(animate = false) {
  const root = document.getElementById("catalogo-list");
  if (!groups.length) {
    root.innerHTML = `<p class="catalog-msg">Estamos preparando la próxima colección. Mientras tanto, <a href="${esc(waLink("Hola! Quiero consultar por el catálogo de Áurea Bags"))}" target="_blank" rel="noopener">escribinos por WhatsApp</a> y te contamos qué hay disponible.</p>`;
    return;
  }
  if (!groups.some((g) => g.slug === activeSlug)) activeSlug = groups[0].slug;
  const tabs = groups.length > 1;
  const g = tabs ? groups.find((x) => x.slug === activeSlug) : null;
  const items = tabs ? g.items : groups.flatMap((x) => x.items);

  const bar = tabs
    ? `<div class="tabs-bar"><nav class="tabs" aria-label="Secciones">${groups.map((x) =>
        `<a href="?seccion=${esc(x.slug)}" data-slug="${esc(x.slug)}" class="tab${x.slug === activeSlug ? " is-active" : ""}"${x.slug === activeSlug ? ' aria-current="page"' : ""}>${esc(x.name)}<small>${x.items.length}</small></a>`
      ).join("")}</nav></div>`
    : "";

  root.innerHTML = bar + `<div class="wrap"><div class="grid${animate ? " is-swapping" : ""}">${items.map(cardHtml).join("")}</div></div>`;

  // En celular la barra de secciones se desliza: centramos la pestaña activa sin mover la página.
  const active = root.querySelector(".tab.is-active");
  if (active) {
    const bar = active.parentElement;
    bar.scrollLeft = active.offsetLeft - (bar.clientWidth - active.offsetWidth) / 2;
  }
}

function renderSkeleton() {
  document.getElementById("catalogo-list").innerHTML =
    `<div class="wrap"><div class="grid" aria-busy="true" aria-label="Cargando la colección">${'<span class="skeleton"></span>'.repeat(8)}</div></div>`;
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
  set("navIgLink", settings.instagram || document.getElementById("footerIgLink")?.href, "href");
  const generic = waLink("Hola! Quiero consultar por el catálogo de Áurea Bags");
  set("navWaLink", generic, "href");
  set("footerWaLink", generic, "href");
  set("entregasWaLink", waLink("Hola! Quiero coordinar la entrega de mi pedido en Código Capital"), "href");
}

/* ════════════════ Secciones como pestañas ════════════════ */

const slugFromUrl = () => new URLSearchParams(location.search).get("seccion");

function setupSectionTabs() {
  const root = document.getElementById("catalogo-list");
  root.addEventListener("click", (e) => {
    const tab = e.target.closest(".tab[data-slug]");
    if (!tab) return;
    e.preventDefault();
    if (tab.dataset.slug === activeSlug) return;
    activeSlug = tab.dataset.slug;
    history.pushState({ seccion: activeSlug }, "", "?seccion=" + encodeURIComponent(activeSlug) + "#catalogo");
    render(true);
    const shop = document.getElementById("catalogo-list");
    const top = shop.getBoundingClientRect().top + window.scrollY - parseInt(getComputedStyle(document.documentElement).getPropertyValue("--hdr-h"));
    if (window.scrollY > top) window.scrollTo({ top, behavior: "smooth" });
  });
  window.addEventListener("popstate", () => {
    if (!groups.length) return;
    activeSlug = slugFromUrl();
    render(true);
  });
}

/* ════════════════ Header ════════════════ */

function setupHeader() {
  const hdr = document.querySelector(".hdr");
  const toggle = document.getElementById("navToggle");
  const links = document.getElementById("navLinks");
  const onScroll = () => hdr.classList.toggle("is-scrolled", window.scrollY > 8);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const close = () => {
    links.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Abrir menú");
  };
  toggle.addEventListener("click", () => {
    const open = !links.classList.contains("is-open");
    links.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
  });
  links.querySelectorAll("a").forEach((a) => a.addEventListener("click", close));
  window.addEventListener("resize", () => { if (window.innerWidth > 860) close(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
}

/* ════════════════ Portada → barra: el "Áurea" gigante se pasa al header ════════════════ */

function setupBrandHandoff() {
  const word = document.querySelector(".hero-word");
  const hdr = document.querySelector(".hdr");
  if (!word || !hdr) return;
  document.body.classList.add("has-hero");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let ticking = false;

  const update = () => {
    ticking = false;
    const r = word.getBoundingClientRect();
    const h = hdr.offsetHeight;
    // 0 = la palabra está entera debajo de la barra · 1 = ya pasó por debajo de la barra
    const p = Math.min(1, Math.max(0, (h - r.top) / Math.max(1, r.height * 1.3)));
    if (!reduce) word.style.setProperty("--p", p.toFixed(3));
    hdr.classList.toggle("show-brand", p > 0.7);
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();
}

/* ════════════════ Ficha del producto ════════════════ */

let pd = null;
let current = 0;
let lastFocused = null;

function buildModal() {
  const wrap = document.createElement("div");
  wrap.className = "pd-backdrop";
  wrap.hidden = true;
  wrap.innerHTML = `
    <div class="pd" role="dialog" aria-modal="true" aria-labelledby="pdName">
      <button type="button" class="pd-close" aria-label="Cerrar">${ICON_CLOSE}</button>
      <div class="pd-gallery">
        <div class="pd-track" tabindex="-1"></div>
        <button type="button" class="pd-arrow prev" aria-label="Foto anterior">${ICON_PREV}</button>
        <button type="button" class="pd-arrow next" aria-label="Foto siguiente">${ICON_NEXT}</button>
        <div class="pd-dots" aria-hidden="true"></div>
        <div class="pd-thumbs"></div>
      </div>
      <div class="pd-info">
        <div class="pd-flags"></div>
        <h2 class="pd-name" id="pdName"></h2>
        <p class="pd-price"></p>
        <p class="pd-desc"></p>
        <dl class="pd-specs"></dl>
        <div class="pd-cta">
          <a href="#" target="_blank" rel="noopener" class="btn btn-ink pd-wa">${ICON_WA}<span></span></a>
          <p>Te respondemos por WhatsApp para coordinar el pago y la entrega.</p>
        </div>
      </div>
    </div>`;
  document.body.appendChild(wrap);

  const q = (s) => wrap.querySelector(s);
  pd = {
    backdrop: wrap, box: q(".pd"), close: q(".pd-close"), gallery: q(".pd-gallery"), track: q(".pd-track"),
    prev: q(".pd-arrow.prev"), next: q(".pd-arrow.next"), dots: q(".pd-dots"), thumbs: q(".pd-thumbs"),
    flags: q(".pd-flags"), name: q(".pd-name"), price: q(".pd-price"), desc: q(".pd-desc"),
    specs: q(".pd-specs"), wa: q(".pd-wa"), waLabel: q(".pd-wa span"),
  };

  pd.close.addEventListener("click", closeModal);
  wrap.addEventListener("click", (e) => { if (e.target === wrap) closeModal(); });
  pd.prev.addEventListener("click", () => goTo(currentSlide() - 1));
  pd.next.addEventListener("click", () => goTo(currentSlide() + 1));
  pd.thumbs.addEventListener("click", (e) => {
    const t = e.target.closest("[data-i]");
    if (t) goTo(Number(t.dataset.i));
  });
  let raf;
  pd.track.addEventListener("scroll", () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(markSlide);
  }, { passive: true });

  document.addEventListener("keydown", (e) => {
    if (pd.backdrop.hidden) return;
    if (e.key === "Escape") closeModal();
    if (e.key === "ArrowRight") goTo(currentSlide() + 1);
    if (e.key === "ArrowLeft") goTo(currentSlide() - 1);
    if (e.key === "Tab") {
      const f = [...pd.box.querySelectorAll("button, a[href]")].filter((el) => el.offsetParent !== null);
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });
}

const slideCount = () => pd.track.children.length;
const currentSlide = () => Math.round(pd.track.scrollLeft / Math.max(1, pd.track.clientWidth));

function goTo(i) {
  const n = slideCount();
  const idx = (i + n) % n;
  pd.track.scrollTo({ left: idx * pd.track.clientWidth, behavior: "smooth" });
}

function markSlide() {
  const i = currentSlide();
  [...pd.thumbs.children].forEach((t, k) => t.classList.toggle("is-active", k === i));
  [...pd.dots.children].forEach((d, k) => d.classList.toggle("is-active", k === i));
}

function openModal(index, trigger) {
  if (!pd) buildModal();
  current = index;
  lastFocused = trigger || document.activeElement;
  const p = products[index];
  const imgs = productImages(p);
  const many = imgs.length > 1;

  pd.track.innerHTML = imgs.map((src, i) => `<img src="${esc(src)}" alt="${esc(p.name)}, foto ${i + 1} de ${imgs.length}"${i ? ' loading="lazy"' : ""}>`).join("");
  pd.thumbs.innerHTML = many ? imgs.map((src, i) => `<button type="button" class="pd-thumb${i ? "" : " is-active"}" data-i="${i}" aria-label="Ver foto ${i + 1}"><img src="${esc(src)}" alt=""></button>`).join("") : "";
  pd.dots.innerHTML = many ? imgs.map((_, i) => `<span class="${i ? "" : "is-active"}"></span>`).join("") : "";
  pd.prev.hidden = pd.next.hidden = !many;
  pd.thumbs.hidden = !many;
  pd.gallery.classList.toggle("is-out", !p.inStock);

  pd.flags.innerHTML = (p.inStock ? `<span class="pd-flag is-in">Disponible</span>` : `<span class="pd-flag is-out">Agotada</span>`) +
    (p.isNew && p.inStock ? `<span class="pd-flag">Nuevo</span>` : "");
  pd.name.textContent = p.name;
  pd.price.textContent = formatPrice(p.price);
  pd.desc.textContent = p.desc;
  pd.desc.hidden = !p.desc;
  pd.specs.innerHTML = p.medidas ? `<dt>Medidas</dt><dd>${esc(p.medidas)}</dd>` : "";
  pd.specs.hidden = !p.medidas;
  pd.wa.href = p.inStock ? whatsappUrl(p) : waLink(`Hola! Quería saber si va a volver a entrar la ${p.name}.`);
  pd.waLabel.textContent = p.inStock ? "Consultar por WhatsApp" : "Avisame si vuelve a entrar";

  pd.backdrop.hidden = false;
  pd.track.scrollLeft = 0;
  pd.box.scrollTop = 0;
  requestAnimationFrame(() => pd.backdrop.classList.add("is-open"));
  document.body.style.overflow = "hidden";
  pd.close.focus({ preventScroll: true });
}

function closeModal() {
  if (!pd || pd.backdrop.hidden) return;
  pd.backdrop.classList.remove("is-open");
  document.body.style.overflow = "";
  setTimeout(() => { pd.backdrop.hidden = true; }, 250);
  if (lastFocused && lastFocused.focus) lastFocused.focus({ preventScroll: true });
}

function setupCardClicks() {
  document.addEventListener("click", (e) => {
    const card = e.target.closest(".card[data-index], .hero-pick[data-index]");
    if (card) openModal(Number(card.dataset.index), card);
  });
}

/* ════════════════ Arranque ════════════════ */

async function init() {
  setupHeader();
  setupBrandHandoff();
  setupCardClicks();
  setupSectionTabs();
  applySettings();
  renderSkeleton();
  try {
    let data = FIREBASE_READY ? await loadFromFirebase() : await loadFromLegacy();
    if (FIREBASE_READY && !data.prods.length && !data.sections.length) data = await loadFromLegacy();
    settings = { ...settings, ...data.site };
    buildGroups(data.sections, data.prods);
    activeSlug = slugFromUrl();
    applySettings();
    renderHero();
    render();
  } catch (err) {
    console.error("[Áurea] No se pudo cargar el catálogo:", err);
    document.getElementById("catalogo-list").innerHTML = `<p class="catalog-msg">La colección no cargó. Revisá tu conexión y recargá la página, o <a href="${esc(waLink("Hola! Quiero consultar por el catálogo de Áurea Bags"))}" target="_blank" rel="noopener">escribinos por WhatsApp</a>.</p>`;
  }
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();
