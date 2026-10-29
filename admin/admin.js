// Panel de administración de Áurea Bags.
// Login con Firebase Authentication, datos en Firestore y fotos en Cloud Storage.
import { FIREBASE_READY } from "../firebase-config.js";
import { LEGACY_SECTIONS, LEGACY_PRODUCTS, LEGACY_SETTINGS } from "../legacy-products.js";

const SDK = "https://www.gstatic.com/firebasejs/12.19.0/";
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

let A, F, S;           // módulos de Firebase: auth, firestore, storage
let auth, db, storage; // instancias

const state = { sections: [], products: [], settings: {} };
let editing = null;    // producto abierto en el editor

/* ═════════════════════════ Utilidades ═════════════════════════ */

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
const fmtPrice = (n) => "$" + Math.round(Number(n) || 0).toLocaleString("es-AR");
const fmtNumber = (n) => Math.round(Number(n) || 0).toLocaleString("es-AR");
const parsePrice = (s) => Number(String(s).replace(/[^0-9]/g, "")) || 0;
const fold = (s) => String(s || "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

// Las fotos migradas se guardan como "assets/x.jpg" (servidas por el hosting);
// las nuevas, como URL completa de Firebase Storage.
function imgSrc(u) {
  if (!u) return "";
  return /^(https?:|data:|blob:)/.test(u) ? u : "/" + u.replace(/^\/+/, "");
}

let toastTimer;
function toast(msg, kind = "ok") {
  const el = $("#toast");
  el.textContent = msg;
  el.className = "adm-toast is-" + kind;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.hidden = true), kind === "error" ? 6000 : 2800);
}

function errorMessage(err) {
  const code = (err && err.code) || "";
  if (code.includes("permission-denied") || code.includes("unauthorized"))
    return "Tu usuario no tiene permiso para guardar cambios. Revisá que su correo esté en las reglas de Firebase.";
  if (code.includes("unavailable") || code.includes("network"))
    return "Sin conexión. Revisá internet y probá de nuevo.";
  if (code.includes("quota") || code.includes("402"))
    return "Se superó la cuota de Firebase (o falta activar el plan Blaze para las fotos).";
  return (err && err.message) || "Ocurrió un error inesperado.";
}

function sectionName(id) {
  const s = state.sections.find((x) => x.id === id);
  return s ? s.name : "Sin sección";
}

function sortedSections() {
  return [...state.sections].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function productsOfSection(sectionId) {
  return state.products
    .filter((p) => (p.sectionId || null) === (sectionId || null))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function normalizeImages(list) {
  return (list || [])
    .map((im) => (typeof im === "string" ? { url: im, path: null } : { url: im.url, path: im.path || null }))
    .filter((im) => im.url);
}

/* ═════════════════════════ Arranque y login ═════════════════════════ */

if (!FIREBASE_READY) {
  $("#setupView").hidden = false;
} else {
  start().catch((err) => {
    console.error(err);
    $("#setupView").hidden = false;
    $("#setupView h1").textContent = "No se pudo conectar con Firebase";
    $("#setupView p").textContent = errorMessage(err);
  });
}

async function start() {
  const init = await import("../firebase-init.js");
  [A, F, S] = await Promise.all([
    import(SDK + "firebase-auth.js"),
    import(SDK + "firebase-firestore-lite.js"),
    import(SDK + "firebase-storage.js"),
  ]);
  db = init.db;
  auth = A.getAuth(init.app);
  storage = S.getStorage(init.app);

  setupLogin();
  setupTabs();
  setupProductsTab();
  setupSectionsTab();
  setupSettingsTab();
  setupProductDialog();

  A.onAuthStateChanged(auth, async (user) => {
    if (!user) {
      $("#appView").hidden = true;
      $("#loginView").hidden = false;
      $("#loginEmail").focus();
      return;
    }
    $("#loginView").hidden = true;
    $("#appView").hidden = false;
    $("#userEmail").textContent = user.email || "";
    await reload();
  });
}

function setupLogin() {
  const form = $("#loginForm");
  const errEl = $("#loginError");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errEl.hidden = true;
    const email = $("#loginEmail").value.trim();
    const pass = $("#loginPass").value;
    if (!email || !pass) {
      errEl.textContent = "Completá correo y contraseña.";
      errEl.hidden = false;
      return;
    }
    const btn = $("#loginBtn");
    btn.disabled = true;
    btn.textContent = "Ingresando…";
    try {
      await A.signInWithEmailAndPassword(auth, email, pass);
      $("#loginPass").value = "";
    } catch (err) {
      const c = err.code || "";
      errEl.textContent =
        c.includes("invalid-credential") || c.includes("wrong-password") || c.includes("user-not-found") || c.includes("invalid-email")
          ? "Correo o contraseña incorrectos."
          : c.includes("too-many-requests")
          ? "Demasiados intentos. Esperá unos minutos o restablecé la contraseña."
          : errorMessage(err);
      errEl.hidden = false;
    } finally {
      btn.disabled = false;
      btn.textContent = "Ingresar";
    }
  });

  $("#forgotBtn").addEventListener("click", async () => {
    const email = $("#loginEmail").value.trim();
    if (!email) {
      errEl.textContent = "Escribí tu correo arriba y tocá de nuevo “Olvidé mi contraseña”.";
      errEl.hidden = false;
      return;
    }
    try {
      await A.sendPasswordResetEmail(auth, email);
      toast("Si el correo está registrado, te llegó un link para crear una nueva contraseña.");
    } catch (err) {
      toast(errorMessage(err), "error");
    }
  });

  $("#logoutBtn").addEventListener("click", () => A.signOut(auth));
}

function setupTabs() {
  $$(".adm-tab").forEach((tab) =>
    tab.addEventListener("click", () => {
      $$(".adm-tab").forEach((t) => t.classList.toggle("is-active", t === tab));
      $$(".adm-panel").forEach((p) => (p.hidden = p.id !== "tab-" + tab.dataset.tab));
    })
  );
}

/* ═════════════════════════ Datos ═════════════════════════ */

async function reload() {
  try {
    const [secSnap, prodSnap, setSnap] = await Promise.all([
      F.getDocs(F.collection(db, "sections")),
      F.getDocs(F.collection(db, "products")),
      F.getDoc(F.doc(db, "settings", "site")),
    ]);
    state.sections = secSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    state.products = prodSnap.docs.map((d) => {
      const data = d.data();
      return { ...data, id: d.id, images: normalizeImages(data.images), stock: Math.max(0, Math.floor(Number(data.stock) || 0)) };
    });
    state.settings = setSnap.exists() ? setSnap.data() : {};
  } catch (err) {
    console.error(err);
    toast("No se pudieron cargar los datos: " + errorMessage(err), "error");
  }
  renderAll();
}

function renderAll() {
  renderSectionSelects();
  renderProducts();
  renderSections();
  fillSettingsForm();
  const empty = !state.products.length && !state.sections.length;
  $("#migrateBanner").hidden = !empty;
  $("#legacyCount").textContent = LEGACY_PRODUCTS.length;
}

function renderSectionSelects() {
  const filter = $("#prodSectionFilter");
  const current = filter.value;
  filter.innerHTML =
    `<option value="">Todas las secciones</option>` +
    sortedSections().map((s) => `<option value="${esc(s.id)}">${esc(s.name)}</option>`).join("") +
    `<option value="__none">Sin sección</option>`;
  filter.value = [...filter.options].some((o) => o.value === current) ? current : "";
}

/* ═════════════════════════ Productos: listado ═════════════════════════ */

function setupProductsTab() {
  $("#prodSearch").addEventListener("input", renderProducts);
  $("#prodSectionFilter").addEventListener("change", renderProducts);
  $("#prodStockFilter").addEventListener("change", renderProducts);
  $("#newProductBtn").addEventListener("click", () => openProduct(null));
  $("#migrateBtn").addEventListener("click", migrateLegacy);

  const list = $("#productList");
  list.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-act]");
    const item = e.target.closest("[data-id]");
    if (!item) return;
    const p = state.products.find((x) => x.id === item.dataset.id);
    if (!p) return;
    if (!btn) {
      if (!e.target.closest("input, button, label")) openProduct(p.id);
      return;
    }
    const act = btn.dataset.act;
    if (act === "edit") openProduct(p.id);
    if (act === "inc") quickUpdate(p, { stock: p.stock + 1 });
    if (act === "dec" && p.stock > 0) quickUpdate(p, { stock: p.stock - 1 });
    if (act === "visible") quickUpdate(p, { visible: p.visible === false });
    if (act === "up" || act === "down") moveProduct(p, act === "up" ? -1 : 1);
  });

  list.addEventListener("change", (e) => {
    const item = e.target.closest("[data-id]");
    if (!item) return;
    const p = state.products.find((x) => x.id === item.dataset.id);
    if (!p) return;
    if (e.target.matches(".js-price")) {
      const price = parsePrice(e.target.value);
      e.target.value = fmtNumber(price);
      if (price !== p.price) quickUpdate(p, { price });
    }
    if (e.target.matches(".js-stock")) {
      const stock = Math.max(0, Math.floor(Number(e.target.value) || 0));
      if (stock !== p.stock) quickUpdate(p, { stock });
      else e.target.value = stock;
    }
  });
  list.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.matches(".js-price, .js-stock")) e.target.blur();
  });
}

function filteredProducts() {
  const q = fold($("#prodSearch").value.trim());
  const sec = $("#prodSectionFilter").value;
  const st = $("#prodStockFilter").value;
  return state.products.filter((p) => {
    if (q && !fold(p.name + " " + (p.code || "")).includes(q)) return false;
    if (sec === "__none" && state.sections.some((s) => s.id === p.sectionId)) return false;
    if (sec && sec !== "__none" && p.sectionId !== sec) return false;
    if (st === "in" && !(p.stock > 0)) return false;
    if (st === "out" && p.stock > 0) return false;
    if (st === "hidden" && p.visible !== false) return false;
    return true;
  });
}

function renderProducts() {
  const list = $("#productList");
  const items = filteredProducts();
  const total = state.products.length;
  const inStock = state.products.filter((p) => p.stock > 0).length;
  $("#prodSummary").textContent = total
    ? `${total} productos · ${inStock} disponibles · ${total - inStock} agotados` + (items.length !== total ? ` · mostrando ${items.length}` : "")
    : "";

  if (!total) {
    list.innerHTML = `<div class="adm-empty">Todavía no hay productos. Creá el primero con “+ Nuevo producto”.</div>`;
    return;
  }
  if (!items.length) {
    list.innerHTML = `<div class="adm-empty">Ningún producto coincide con el filtro.</div>`;
    return;
  }

  const groups = [];
  const known = new Set(state.sections.map((s) => s.id));
  for (const s of sortedSections()) groups.push({ id: s.id, name: s.name, hidden: s.visible === false });
  groups.push({ id: null, name: "Sin sección" });

  list.innerHTML = groups
    .map((g) => {
      const rows = items
        .filter((p) => (g.id ? p.sectionId === g.id : !known.has(p.sectionId)))
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      if (!rows.length) return "";
      return `<h3 class="adm-group">${esc(g.name)}${g.hidden ? ' <span class="adm-badge">sección oculta</span>' : ""} <span class="adm-muted">(${rows.length})</span></h3>` +
        rows.map(productRow).join("");
    })
    .join("");
}

function productRow(p) {
  const cover = p.images[0] ? imgSrc(p.images[0].url) : "";
  const out = !(p.stock > 0);
  const hidden = p.visible === false;
  return `
  <div class="adm-item${hidden ? " is-hidden" : ""}" data-id="${esc(p.id)}">
    <div class="adm-thumb">${cover ? `<img src="${esc(cover)}" alt="" loading="lazy">` : `<span>Sin foto</span>`}</div>
    <div class="adm-item-main">
      <strong>${esc(p.name)}</strong>
      <span class="adm-muted adm-small">${esc(p.code || "")}${p.code ? " · " : ""}${p.images.length} foto${p.images.length === 1 ? "" : "s"}</span>
      <span class="adm-badges">
        ${out ? '<span class="adm-badge is-out">Agotado</span>' : '<span class="adm-badge is-in">Disponible</span>'}
        ${hidden ? '<span class="adm-badge">Oculto</span>' : ""}
        ${p.isNew ? '<span class="adm-badge is-new">Nuevo</span>' : ""}
      </span>
    </div>
    <label class="adm-item-price">
      <span class="adm-small adm-muted">Precio</span>
      <span class="adm-price-input">$<input type="text" inputmode="numeric" class="js-price" value="${fmtNumber(p.price)}" aria-label="Precio de ${esc(p.name)}"></span>
    </label>
    <div class="adm-item-stock">
      <span class="adm-small adm-muted">Stock</span>
      <div class="adm-stepper adm-stepper-sm">
        <button type="button" data-act="dec" aria-label="Restar uno" ${out ? "disabled" : ""}>−</button>
        <input type="number" min="0" step="1" class="js-stock" value="${p.stock}" aria-label="Stock de ${esc(p.name)}">
        <button type="button" data-act="inc" aria-label="Sumar uno">+</button>
      </div>
    </div>
    <div class="adm-item-actions">
      <button type="button" class="adm-icon" data-act="up" title="Subir">↑</button>
      <button type="button" class="adm-icon" data-act="down" title="Bajar">↓</button>
      <button type="button" class="adm-icon" data-act="visible" title="${hidden ? "Mostrar en la tienda" : "Ocultar de la tienda"}">${hidden ? eyeOff : eye}</button>
      <button type="button" class="adm-btn adm-btn-ghost" data-act="edit">Editar</button>
    </div>
  </div>`;
}

const eye = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
const eyeOff = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;

async function quickUpdate(p, changes) {
  const before = { ...p };
  Object.assign(p, changes);
  renderProducts();
  try {
    await F.updateDoc(F.doc(db, "products", p.id), { ...changes, updatedAt: F.serverTimestamp() });
    const what = "stock" in changes ? `Stock de ${p.name}: ${p.stock}` : "price" in changes ? `Precio de ${p.name}: ${fmtPrice(p.price)}` : "visible" in changes ? (p.visible ? `${p.name} ahora se ve en la tienda` : `${p.name} quedó oculto`) : "Guardado";
    toast(what);
  } catch (err) {
    Object.assign(p, before);
    renderProducts();
    toast(errorMessage(err), "error");
  }
}

async function moveProduct(p, dir) {
  const known = new Set(state.sections.map((s) => s.id));
  const sid = known.has(p.sectionId) ? p.sectionId : null;
  const siblings = state.products
    .filter((x) => (sid ? x.sectionId === sid : !known.has(x.sectionId)))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const i = siblings.indexOf(p);
  const j = i + dir;
  if (j < 0 || j >= siblings.length) return;
  [siblings[i], siblings[j]] = [siblings[j], siblings[i]];
  const before = siblings.map((x) => [x, x.order]);
  const batch = F.writeBatch(db);
  siblings.forEach((x, idx) => {
    if (x.order !== idx) {
      x.order = idx;
      batch.update(F.doc(db, "products", x.id), { order: idx });
    }
  });
  renderProducts();
  try {
    await batch.commit();
  } catch (err) {
    before.forEach(([x, o]) => (x.order = o));
    renderProducts();
    toast(errorMessage(err), "error");
  }
}

/* ═════════════════════════ Productos: editor ═════════════════════════ */

function setupProductDialog() {
  const dlg = $("#productDialog");
  const form = $("#productForm");

  $$("[data-close]", dlg).forEach((b) => b.addEventListener("click", () => closeProduct()));
  dlg.addEventListener("cancel", (e) => {
    e.preventDefault();
    closeProduct();
  });
  form.addEventListener("input", () => editing && (editing.dirty = true));
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    saveProduct();
  });

  form.price.addEventListener("blur", () => {
    if (form.price.value.trim()) form.price.value = fmtNumber(parsePrice(form.price.value));
  });
  $$(".adm-stepper [data-step]", form).forEach((b) =>
    b.addEventListener("click", () => {
      form.stock.value = Math.max(0, (Number(form.stock.value) || 0) + Number(b.dataset.step));
      editing.dirty = true;
    })
  );

  $("#photoInput").addEventListener("change", (e) => {
    addFiles(e.target.files);
    e.target.value = "";
  });
  const drop = $("#photoDrop");
  const photos = $(".adm-photos");
  ["dragenter", "dragover"].forEach((ev) =>
    photos.addEventListener(ev, (e) => {
      e.preventDefault();
      drop.classList.add("is-over");
    })
  );
  ["dragleave", "drop"].forEach((ev) =>
    photos.addEventListener(ev, (e) => {
      e.preventDefault();
      if (ev === "dragleave" && photos.contains(e.relatedTarget)) return;
      drop.classList.remove("is-over");
    })
  );
  photos.addEventListener("drop", (e) => addFiles(e.dataTransfer.files));

  $("#photoGrid").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-photo]");
    if (!btn) return;
    const i = Number(btn.closest("[data-i]").dataset.i);
    const imgs = editing.images;
    const act = btn.dataset.photo;
    if (act === "left" && i > 0) [imgs[i - 1], imgs[i]] = [imgs[i], imgs[i - 1]];
    if (act === "right" && i < imgs.length - 1) [imgs[i + 1], imgs[i]] = [imgs[i], imgs[i + 1]];
    if (act === "cover" && i > 0) imgs.unshift(imgs.splice(i, 1)[0]);
    if (act === "remove") {
      const [gone] = imgs.splice(i, 1);
      if (gone.path) editing.removedPaths.push(gone.path);
      if (gone.preview) URL.revokeObjectURL(gone.preview);
    }
    editing.dirty = true;
    renderPhotoGrid();
  });

  $("#deleteProductBtn").addEventListener("click", deleteProduct);
}

function openProduct(id) {
  const p = id ? state.products.find((x) => x.id === id) : null;
  const form = $("#productForm");
  form.reset();

  const filterSec = $("#prodSectionFilter").value;
  const defaultSection = filterSec && filterSec !== "__none" ? filterSec : (sortedSections()[0] || {}).id || "";
  form.sectionId.innerHTML =
    sortedSections().map((s) => `<option value="${esc(s.id)}">${esc(s.name)}</option>`).join("") +
    `<option value="">Sin sección</option>`;

  editing = {
    id: p ? p.id : null,
    images: p ? p.images.map((im) => ({ ...im })) : [],
    removedPaths: [],
    dirty: false,
  };

  $("#productDialogTitle").textContent = p ? "Editar producto" : "Nuevo producto";
  $("#deleteProductBtn").hidden = !p;
  $("#saveStatus").textContent = "";
  form.name.value = p ? p.name || "" : "";
  form.price.value = p ? fmtNumber(p.price) : "";
  form.stock.value = p ? p.stock : 1;
  form.code.value = p ? p.code || "" : "";
  form.medidas.value = p ? p.medidas || "" : "";
  form.desc.value = p ? p.desc || "" : "";
  form.visible.checked = p ? p.visible !== false : true;
  form.isNew.checked = p ? !!p.isNew : true;
  const sid = p ? (state.sections.some((s) => s.id === p.sectionId) ? p.sectionId : "") : defaultSection;
  form.sectionId.value = sid;

  renderPhotoGrid();
  $("#productDialog").showModal();
  if (!p) form.name.focus();
}

function closeProduct(force = false) {
  if (!editing) return $("#productDialog").close();
  if (!force && editing.dirty && !confirm("Tenés cambios sin guardar. ¿Querés descartarlos?")) return;
  editing.images.forEach((im) => im.preview && URL.revokeObjectURL(im.preview));
  editing = null;
  $("#productDialog").close();
}

function renderPhotoGrid() {
  const grid = $("#photoGrid");
  const imgs = editing.images;
  $("#photoDrop").hidden = imgs.length > 0;
  grid.innerHTML = imgs
    .map(
      (im, i) => `
    <div class="adm-photo${i === 0 ? " is-cover" : ""}" data-i="${i}">
      <img src="${esc(im.preview || imgSrc(im.url))}" alt="Foto ${i + 1}">
      ${i === 0 ? '<span class="adm-photo-badge">Portada</span>' : ""}
      ${im.blob ? '<span class="adm-photo-badge is-pending">Nueva</span>' : ""}
      <div class="adm-photo-tools">
        <button type="button" data-photo="left" title="Mover a la izquierda" ${i === 0 ? "disabled" : ""}>‹</button>
        ${i > 0 ? '<button type="button" data-photo="cover" title="Usar como portada">★</button>' : ""}
        <button type="button" data-photo="right" title="Mover a la derecha" ${i === imgs.length - 1 ? "disabled" : ""}>›</button>
        <button type="button" data-photo="remove" title="Quitar foto" class="is-danger">✕</button>
      </div>
    </div>`
    )
    .join("");
}

async function addFiles(fileList) {
  const files = [...(fileList || [])].filter((f) => f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name));
  if (!files.length || !editing) return;
  const status = $("#saveStatus");
  let failed = 0;
  for (let k = 0; k < files.length; k++) {
    status.textContent = `Preparando foto ${k + 1} de ${files.length}…`;
    try {
      const blob = await compressImage(files[k]);
      editing.images.push({ url: null, path: null, blob, preview: URL.createObjectURL(blob) });
      editing.dirty = true;
      renderPhotoGrid();
    } catch (err) {
      console.error(err);
      failed++;
    }
  }
  status.textContent = "";
  if (failed) toast(`${failed} foto(s) no se pudieron leer. Probá con JPG o PNG.`, "error");
}

// Achica la foto a máx. 1600 px de lado y la pasa a JPG (≈200–400 KB).
async function compressImage(file, max = 1600, quality = 0.82) {
  let source, w, h, tmpUrl;
  try {
    source = await createImageBitmap(file, { imageOrientation: "from-image" });
    w = source.width;
    h = source.height;
  } catch {
    tmpUrl = URL.createObjectURL(file);
    source = await new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = () => rej(new Error("No se pudo leer la imagen"));
      img.src = tmpUrl;
    });
    w = source.naturalWidth;
    h = source.naturalHeight;
  }
  const scale = Math.min(1, max / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  if (tmpUrl) URL.revokeObjectURL(tmpUrl);
  if (source.close) source.close();
  const blob = await new Promise((r) => canvas.toBlob(r, "image/jpeg", quality));
  if (!blob) throw new Error("No se pudo procesar la imagen");
  return blob;
}

async function saveProduct() {
  const form = $("#productForm");
  const name = form.name.value.trim();
  const priceRaw = form.price.value.trim();
  if (!name) {
    form.name.focus();
    return toast("Poné un nombre al producto.", "error");
  }
  if (!priceRaw) {
    form.price.focus();
    return toast("Poné el precio.", "error");
  }
  const btn = $("#saveProductBtn");
  const status = $("#saveStatus");
  btn.disabled = true;

  const isNew = !editing.id;
  const ref = isNew ? F.doc(F.collection(db, "products")) : F.doc(db, "products", editing.id);
  const sectionId = form.sectionId.value || null;

  try {
    // 1) Subir fotos nuevas
    const pending = editing.images.filter((im) => im.blob);
    let n = 0;
    for (const im of pending) {
      n++;
      status.textContent = `Subiendo foto ${n} de ${pending.length}…`;
      const path = `products/${ref.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
      const sref = S.ref(storage, path);
      await S.uploadBytes(sref, im.blob, { contentType: "image/jpeg", cacheControl: "public, max-age=31536000" });
      im.url = await S.getDownloadURL(sref);
      im.path = path;
      URL.revokeObjectURL(im.preview);
      delete im.blob;
      delete im.preview;
    }

    // 2) Guardar datos
    status.textContent = "Guardando…";
    const data = {
      name,
      code: form.code.value.trim(),
      price: parsePrice(priceRaw),
      stock: Math.max(0, Math.floor(Number(form.stock.value) || 0)),
      sectionId,
      medidas: form.medidas.value.trim(),
      desc: form.desc.value.trim(),
      visible: form.visible.checked,
      isNew: form.isNew.checked,
      images: editing.images.map((im) => ({ url: im.url, path: im.path || null })),
      updatedAt: F.serverTimestamp(),
    };
    const old = state.products.find((x) => x.id === editing.id);
    if (isNew || (old && (old.sectionId || null) !== sectionId)) {
      // Los productos nuevos (o que cambian de sección) quedan primeros en su sección.
      const orders = productsOfSection(sectionId).map((x) => x.order ?? 0);
      data.order = orders.length ? Math.min(...orders) - 1 : 0;
    }
    if (isNew) data.createdAt = F.serverTimestamp();
    await F.setDoc(ref, data, { merge: true });

    // 3) Borrar del Storage las fotos que se quitaron
    for (const path of editing.removedPaths) {
      S.deleteObject(S.ref(storage, path)).catch((e) => console.warn("No se pudo borrar", path, e));
    }

    const local = { ...(old || {}), ...data, id: ref.id, images: data.images };
    if (isNew) state.products.push(local);
    else Object.assign(old, local);

    editing.dirty = false;
    closeProduct(true);
    renderProducts();
    renderSections();
    toast(isNew ? `“${name}” se creó y ya está en la tienda${data.visible ? "" : " (oculto)"}.` : "Cambios guardados.");
  } catch (err) {
    console.error(err);
    toast(errorMessage(err), "error");
    renderPhotoGrid();
  } finally {
    btn.disabled = false;
    status.textContent = "";
  }
}

async function deleteProduct() {
  const p = state.products.find((x) => x.id === editing?.id);
  if (!p) return;
  if (!confirm(`¿Eliminar “${p.name}” definitivamente? Esta acción no se puede deshacer.\n\nSi solo querés sacarlo un tiempo, usá “Visible en la tienda”.`)) return;
  try {
    await F.deleteDoc(F.doc(db, "products", p.id));
    p.images.forEach((im) => im.path && S.deleteObject(S.ref(storage, im.path)).catch(() => {}));
    editing.removedPaths.forEach((path) => S.deleteObject(S.ref(storage, path)).catch(() => {}));
    state.products = state.products.filter((x) => x !== p);
    closeProduct(true);
    renderProducts();
    renderSections();
    toast(`“${p.name}” se eliminó.`);
  } catch (err) {
    toast(errorMessage(err), "error");
  }
}

/* ═════════════════════════ Secciones ═════════════════════════ */

function setupSectionsTab() {
  $("#newSectionForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = $("#newSectionName");
    const name = input.value.trim();
    if (!name) return;
    const orders = state.sections.map((s) => s.order ?? 0);
    const data = { name, order: orders.length ? Math.max(...orders) + 1 : 0, visible: true, createdAt: F.serverTimestamp() };
    try {
      const ref = await F.addDoc(F.collection(db, "sections"), data);
      state.sections.push({ ...data, id: ref.id });
      input.value = "";
      renderSections();
      renderSectionSelects();
      renderProducts();
      toast(`Sección “${name}” creada.`);
    } catch (err) {
      toast(errorMessage(err), "error");
    }
  });

  const list = $("#sectionList");
  list.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-act]");
    const item = e.target.closest("[data-id]");
    if (!btn || !item) return;
    const s = state.sections.find((x) => x.id === item.dataset.id);
    if (!s) return;
    const act = btn.dataset.act;
    if (act === "up" || act === "down") return moveSection(s, act === "up" ? -1 : 1);
    if (act === "visible") return updateSection(s, { visible: s.visible === false });
    if (act === "view") {
      $('.adm-tab[data-tab="products"]').click();
      $("#prodSectionFilter").value = s.id;
      renderProducts();
      return;
    }
    if (act === "delete") return deleteSection(s);
  });
  list.addEventListener("change", (e) => {
    if (!e.target.matches(".js-section-name")) return;
    const s = state.sections.find((x) => x.id === e.target.closest("[data-id]").dataset.id);
    const name = e.target.value.trim();
    if (!name) {
      e.target.value = s.name;
      return;
    }
    if (name !== s.name) updateSection(s, { name });
  });
  list.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.matches(".js-section-name")) e.target.blur();
  });
}

function renderSections() {
  const list = $("#sectionList");
  const secs = sortedSections();
  if (!secs.length) {
    list.innerHTML = `<div class="adm-empty">Todavía no hay secciones. Creá la primera arriba (por ejemplo “Nueva colección”).</div>`;
    return;
  }
  list.innerHTML = secs
    .map((s, i) => {
      const count = state.products.filter((p) => p.sectionId === s.id).length;
      const hidden = s.visible === false;
      return `
      <div class="adm-item adm-section-item${hidden ? " is-hidden" : ""}" data-id="${esc(s.id)}">
        <span class="adm-order">${i + 1}</span>
        <input type="text" class="adm-input js-section-name" value="${esc(s.name)}" maxlength="80" aria-label="Nombre de la sección">
        <span class="adm-muted adm-small adm-nowrap">${count} producto${count === 1 ? "" : "s"}${hidden ? " · oculta" : ""}</span>
        <div class="adm-item-actions">
          <button type="button" class="adm-icon" data-act="up" title="Subir" ${i === 0 ? "disabled" : ""}>↑</button>
          <button type="button" class="adm-icon" data-act="down" title="Bajar" ${i === secs.length - 1 ? "disabled" : ""}>↓</button>
          <button type="button" class="adm-icon" data-act="visible" title="${hidden ? "Mostrar en la tienda" : "Ocultar de la tienda"}">${hidden ? eyeOff : eye}</button>
          <button type="button" class="adm-btn adm-btn-ghost" data-act="view">Ver productos</button>
          <button type="button" class="adm-icon is-danger" data-act="delete" title="Eliminar sección">🗑</button>
        </div>
      </div>`;
    })
    .join("");
}

async function updateSection(s, changes) {
  const before = { ...s };
  Object.assign(s, changes);
  renderSections();
  renderSectionSelects();
  renderProducts();
  try {
    await F.updateDoc(F.doc(db, "sections", s.id), changes);
    toast("name" in changes ? "Nombre actualizado." : s.visible === false ? `“${s.name}” quedó oculta en la tienda.` : `“${s.name}” se ve en la tienda.`);
  } catch (err) {
    Object.assign(s, before);
    renderSections();
    renderSectionSelects();
    renderProducts();
    toast(errorMessage(err), "error");
  }
}

async function moveSection(s, dir) {
  const secs = sortedSections();
  const i = secs.indexOf(s);
  const j = i + dir;
  if (j < 0 || j >= secs.length) return;
  [secs[i], secs[j]] = [secs[j], secs[i]];
  const before = secs.map((x) => [x, x.order]);
  const batch = F.writeBatch(db);
  secs.forEach((x, idx) => {
    if (x.order !== idx) {
      x.order = idx;
      batch.update(F.doc(db, "sections", x.id), { order: idx });
    }
  });
  renderSections();
  renderSectionSelects();
  renderProducts();
  try {
    await batch.commit();
  } catch (err) {
    before.forEach(([x, o]) => (x.order = o));
    renderSections();
    toast(errorMessage(err), "error");
  }
}

async function deleteSection(s) {
  const prods = state.products.filter((p) => p.sectionId === s.id);
  const msg = prods.length
    ? `La sección “${s.name}” tiene ${prods.length} producto(s). Si la eliminás, esos productos NO se borran: quedan en “Sin sección” y se muestran al final de la tienda.\n\n¿Eliminar la sección?`
    : `¿Eliminar la sección “${s.name}”?`;
  if (!confirm(msg)) return;
  try {
    const batch = F.writeBatch(db);
    prods.forEach((p) => batch.update(F.doc(db, "products", p.id), { sectionId: null }));
    batch.delete(F.doc(db, "sections", s.id));
    await batch.commit();
    prods.forEach((p) => (p.sectionId = null));
    state.sections = state.sections.filter((x) => x !== s);
    renderAll();
    toast(`Sección “${s.name}” eliminada.`);
  } catch (err) {
    toast(errorMessage(err), "error");
  }
}

/* ═════════════════════════ Ajustes ═════════════════════════ */

const SETTING_KEYS = ["whatsapp", "saludo", "instagram", "heroTitle", "heroDesc", "entregasTitle", "entregasDesc"];

function setupSettingsTab() {
  $("#settingsForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = {};
    SETTING_KEYS.forEach((k) => (data[k] = form[k].value.trim()));
    data.whatsapp = data.whatsapp.replace(/[^0-9]/g, "");
    if (!data.whatsapp) return toast("El número de WhatsApp no puede quedar vacío.", "error");
    try {
      await F.setDoc(F.doc(db, "settings", "site"), data, { merge: true });
      state.settings = { ...state.settings, ...data };
      fillSettingsForm();
      toast("Ajustes guardados. Ya se ven en la tienda.");
    } catch (err) {
      toast(errorMessage(err), "error");
    }
  });
}

function fillSettingsForm() {
  const form = $("#settingsForm");
  const s = { ...LEGACY_SETTINGS, ...state.settings };
  SETTING_KEYS.forEach((k) => (form[k].value = s[k] || ""));
}

/* ═════════════════════════ Migración inicial ═════════════════════════ */

async function migrateLegacy() {
  if (!confirm(`Se van a crear ${LEGACY_SECTIONS.length} secciones y ${LEGACY_PRODUCTS.length} productos con los datos que hoy tiene la página. ¿Continuar?`)) return;
  const btn = $("#migrateBtn");
  btn.disabled = true;
  btn.textContent = "Importando…";
  try {
    const existing = await F.getDocs(F.collection(db, "products"));
    if (!existing.empty) {
      toast("La base ya tiene productos: no se importó nada para no duplicar.", "error");
      return reload();
    }
    const batch = F.writeBatch(db);
    const ids = {};
    LEGACY_SECTIONS.forEach((s, i) => {
      const ref = F.doc(F.collection(db, "sections"));
      ids[s.key] = ref.id;
      batch.set(ref, { name: s.name, order: i, visible: true, createdAt: F.serverTimestamp() });
    });
    const counters = {};
    LEGACY_PRODUCTS.forEach((p) => {
      const ref = F.doc(F.collection(db, "products"));
      counters[p.section] = (counters[p.section] || 0) + 1;
      batch.set(ref, {
        name: p.name,
        code: p.code || "",
        price: p.price,
        stock: p.stock,
        sectionId: ids[p.section] || null,
        medidas: p.medidas || "",
        desc: p.desc || "",
        visible: true,
        isNew: !!p.isNew,
        images: (p.images || []).map((url) => ({ url, path: null })),
        order: counters[p.section] - 1,
        createdAt: F.serverTimestamp(),
        updatedAt: F.serverTimestamp(),
      });
    });
    batch.set(F.doc(db, "settings", "site"), { ...LEGACY_SETTINGS }, { merge: true });
    await batch.commit();
    await reload();
    toast(`¡Listo! Se importaron ${LEGACY_PRODUCTS.length} productos en ${LEGACY_SECTIONS.length} secciones.`);
  } catch (err) {
    console.error(err);
    toast(errorMessage(err), "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Importar productos actuales";
  }
}
