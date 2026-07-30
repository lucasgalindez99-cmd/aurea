const WHATSAPP_NUMBER = "549XXXXXXXXXX"; // reemplazá por tu número con código de país
const SALUDO = "Hola! Me interesa esta cartera:";

const products = [
  // Tip: para cargar fotos reales de cada cartera, agregá un array "images"
  // con las rutas de tus fotos, por ejemplo:
  //   images: ["assets/mora-1.jpg", "assets/mora-2.jpg", "assets/mora-3.jpg"]
  // Si un producto no tiene "images", se usa el dibujo placeholder.
  { name: "Cartera Mora", price: 34000, desc: "Cuero sintético texturado con solapa y cierre imán.", medidas: "26 x 18 x 9 cm", stock: true },
  { name: "Cartera Ámbar", price: 38500, desc: "Bandolera estructurada con correa regulable.", medidas: "24 x 16 x 8 cm", stock: true },
  { name: "Bandolera Luna", price: 29900, desc: "Diseño acolchado, correa cadena metálica.", medidas: "22 x 14 x 7 cm", stock: true },
  { name: "Cartera Sol", price: 42000, desc: "Tote amplio con doble manija, ideal día a día.", medidas: "32 x 24 x 12 cm", stock: false },
  { name: "Clutch Noche", price: 26500, desc: "Sobre de mano con cierre broche, uso de fiesta.", medidas: "20 x 12 x 4 cm", stock: true },
  { name: "Tote Lino", price: 33900, desc: "Cuerpo texturizado tipo lino, base reforzada.", medidas: "30 x 22 x 10 cm", stock: true },
  { name: "Cartera Terra", price: 36700, desc: "Cuero tostado con costuras a la vista.", medidas: "27 x 19 x 9 cm", stock: true },
  { name: "Bandolera Arena", price: 28900, desc: "Compacta, ideal para lo esencial.", medidas: "20 x 15 x 6 cm", stock: true },
  { name: "Mini Bag Rosa", price: 24900, desc: "Formato mini con cadena dorada desmontable.", medidas: "16 x 12 x 6 cm", stock: false },
  { name: "Cartera Cobre", price: 39900, desc: "Estructura rígida, cierre cremallera superior.", medidas: "28 x 20 x 10 cm", stock: true },
  { name: "Tote Urbano", price: 31500, desc: "Bolso tote de lona reforzada con bolsillo interno.", medidas: "34 x 26 x 12 cm", stock: true },
  { name: "Cartera Bruma", price: 35200, desc: "Tono neutro, apta para looks formales.", medidas: "25 x 17 x 8 cm", stock: true },
  { name: "Clutch Dorado", price: 27800, desc: "Detalle metálico, correa cadena fina extraíble.", medidas: "21 x 13 x 5 cm", stock: true },
  { name: "Bandolera Nude", price: 30400, desc: "Línea minimalista, correa ajustable en 3 alturas.", medidas: "23 x 16 x 7 cm", stock: true }
];

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

// Devuelve las fotos de un producto. Usa "images" si existe, si no cae al placeholder.
function productImages(p) {
  if (p.images && p.images.length) return p.images;
  return [bagPlaceholderSrc()];
}

function whatsappUrl(p) {
  const msg = SALUDO + "\n\n" + p.name + " - " + formatPrice(p.price);
  return "https://wa.me/" + WHATSAPP_NUMBER.replace(/[^0-9]/g, "") + "?text=" + encodeURIComponent(msg);
}

function render() {
  const root = document.getElementById("catalogo-list");
  const placeholder = bagPlaceholderSrc();
  root.innerHTML = products.map((p, i) => {
    const url = whatsappUrl(p);
    const rowClass = i % 2 === 1 ? "rev" : "";
    const tagClass = p.stock ? "tag-neutral" : "tag-outline";
    const stockLabel = p.stock ? "Disponible" : "Agotado";
    return `
      <div class="ab-wrap">
        <div class="ab-row ${rowClass}" data-index="${i}" role="button" tabindex="0" aria-label="Ver detalle de ${p.name}">
          <figure class="ab-photo" style="margin:0;">
            <img src="${productImages(p)[0]}" alt="Foto de ${p.name}">
          </figure>
          <div>
            <div style="display:flex;align-items:center;gap:var(--space-3);margin-bottom:var(--space-3);">
              <span class="tag ${tagClass}">${stockLabel}</span>
            </div>
            <h2 style="font-family:var(--font-heading);font-weight:var(--font-heading-weight);font-size:clamp(26px,3vw,36px);letter-spacing:0;margin:0;">${p.name}</h2>
            <p style="font-size:15.5px;line-height:1.65;max-width:42ch;margin:var(--space-4) 0 0;color:color-mix(in srgb,var(--color-text) 78%,transparent);">${p.desc}</p>
            <p style="font-size:13px;margin:var(--space-3) 0 0;color:color-mix(in srgb,var(--color-text) 58%,transparent);">Medidas: ${p.medidas}</p>
            <p style="font-family:var(--font-heading);font-weight:var(--font-heading-weight);font-size:26px;color:var(--color-accent-700);margin:var(--space-5) 0 0;">${formatPrice(p.price)}</p>
            <a href="${url}" target="_blank" rel="noopener" class="btn btn-secondary js-wa-link" style="margin-top:var(--space-5);display:inline-flex;">Consultar por WhatsApp</a>
          </div>
        </div>
        <hr class="hr">
      </div>`;
  }).join("");
}

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
    const isOpen = links.classList.contains("is-open");
    isOpen ? close() : open();
  });

  links.querySelectorAll("a").forEach((a) => a.addEventListener("click", close));

  window.addEventListener("resize", () => {
    if (window.innerWidth > 700) close();
  });
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
        <a id="abModalWA" href="#" target="_blank" rel="noopener" class="btn btn-primary">Consultar por WhatsApp</a>
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
  modalEls.backdrop.addEventListener("click", (e) => {
    if (e.target === modalEls.backdrop) closeModal();
  });
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

  const showNav = imgs.length > 1;
  modalEls.prevBtn.style.display = showNav ? "flex" : "none";
  modalEls.nextBtn.style.display = showNav ? "flex" : "none";
  modalEls.thumbs.style.display = showNav ? "flex" : "none";

  modalEls.thumbs.innerHTML = imgs.map((src, i) =>
    `<button type="button" class="ab-modal-thumb ${i === currentImgIdx ? "is-active" : ""}" data-i="${i}" aria-label="Foto ${i + 1}"><img src="${src}" alt=""></button>`
  ).join("");

  modalEls.thumbs.querySelectorAll(".ab-modal-thumb").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentImgIdx = Number(btn.dataset.i);
      renderImage();
    });
  });
}

function stepImage(dir) {
  const p = products[currentIndex];
  const imgs = productImages(p);
  currentImgIdx = (currentImgIdx + dir + imgs.length) % imgs.length;
  renderImage();
}

function openModal(index, triggerEl) {
  if (!modalEls) buildModal();
  currentIndex = index;
  currentImgIdx = 0;
  lastFocusedEl = triggerEl || document.activeElement;

  const p = products[index];
  modalEls.tag.className = "tag " + (p.stock ? "tag-neutral" : "tag-outline");
  modalEls.tag.textContent = p.stock ? "Disponible" : "Agotado";
  modalEls.title.textContent = p.name;
  modalEls.desc.textContent = p.desc;
  modalEls.medidas.textContent = "Medidas: " + p.medidas;
  modalEls.price.textContent = formatPrice(p.price);
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

document.addEventListener("DOMContentLoaded", () => {
  render();
  setupNav();
  setupProductModal();
});