const WHATSAPP_NUMBER = "549XXXXXXXXXX"; // reemplazá por tu número con código de país
const SALUDO = "Hola! Me interesa esta cartera:";

const products = [
  // Tip: para cargar fotos reales de cada cartera, agregá un array "images"
  // con las rutas de tus fotos, por ejemplo:
  //   images: ["assets/megan-1.jpg", "assets/megan-2.jpg", "assets/megan-3.jpg"]
  // Si un producto no tiene "images", se usa el dibujo placeholder.
  { name: "Bag Megan", code: "Cod1", price: 40000, desc: "Diseño moderno y detalles protagonistas, esta cartera está pensada para quienes buscan un accesorio característico. Amplia, cómoda y fácil de combinar.", medidas: "39 x 18 x 11 cm", stock: true, images: ["assets/megan-1.jpg", "assets/megan-2.jpg", "assets/megan-3.jpg"] },
  { name: "Bag Tini", code: "Cod2", price: 40000, desc: "La mini bag ideal para destacar con sutileza. Sus detalles crean el equilibrio perfecto entre estilo y funcionalidad.", medidas: "23 x 14 x 9 cm", stock: true, images: ["assets/tini-1.jpg", "assets/tini-2.jpg", "assets/tini-3.jpg", "assets/tini-4.jpg", "assets/tini-5.jpg"] },
  { name: "Bag Lola", code: "Cod3", price: 36000, desc: "Una pieza versátil que destaca por su diseño sofisticado y moderno, clave para combinar fácilmente con cualquier outfit.", medidas: "26 x 15 x 7 cm", stock: true, images: ["assets/lola-1.jpg", "assets/lola-2.jpg", "assets/lola-3.jpg"] },
  { name: "Bag Mery (rosa)", code: "Cod4", price: 38000, desc: "La combinación ideal entre comodidad y tendencia. Un accesorio pensado para acompañarte todos los días.", medidas: "20 x 12 x 8 cm", stock: true, images: ["assets/mery-rosa-1.png", "assets/mery-rosa-2.jpg", "assets/mery-rosa-3.jpg", "assets/mery-rosa-4.jpg", "assets/mery-rosa-5.jpg", "assets/mery-rosa-6.jpg"] },
  { name: "Bag Val (beige)", code: "Cod5", price: 58000, desc: "Un clásico renovado con un diseño moderno y sofisticado. Es la cartera ideal para acompañarte desde la mañana hasta la noche con total comodidad, aportando elegancia y practicidad. Incluye traba (ideal para salir de noche).", medidas: "19 x 18 x 9 cm", stock: true, images: ["assets/val-beige-1.jpg", "assets/val-beige-2.jpg", "assets/val-beige-3.jpg", "assets/val-beige-4.jpg", "assets/val-beige-5.jpg"] },
  { name: "Bag Val (negra)", code: "Cod6", price: 58000, desc: "Un clásico renovado con un diseño moderno y sofisticado. Es la cartera ideal para acompañarte desde la mañana hasta la noche con total comodidad, aportando elegancia y practicidad. Incluye traba (ideal para salir de noche).", medidas: "19 x 18 x 9 cm", stock: true, images: ["assets/val-negra-1.jpg", "assets/val-negra-2.jpg", "assets/val-negra-3.jpg", "assets/val-negra-4.jpg", "assets/val-negra-5.jpg"] },
  { name: "Bag Juli", code: "Cod7", price: 36000, desc: "Pensada para quienes valoran los detalles, esta bag definitivamente te hará destacar.", medidas: "24 x 14 x 7 cm", stock: false, images: ["assets/juli-1.jpg", "assets/juli-2.jpg", "assets/juli-3.jpg", "assets/juli-4.jpg"] },
  { name: "Bag Cherry", code: "Cod8", price: 32000, desc: "Diseño delicado y minimalista, ofrece el espacio perfecto para llevar tus esenciales con total comodidad sin perder estilo.", medidas: "27 x 16 x 9 cm", stock: true, images: ["assets/cherry-1.jpg", "assets/cherry-2.jpg", "assets/cherry-3.jpg", "assets/cherry-4.jpg"] },
  { name: "Bag Diamond (borgoña)", code: "Cod9", price: 44000, desc: "Un diseño que transmite elegancia desde cada ángulo. Ideal para complementar cualquier outfit con un toque distinguido.", medidas: "31 x 22 x 10 cm", stock: true, images: ["assets/diamond-borgona-1.png", "assets/diamond-borgona-2.jpg", "assets/diamond-borgona-3.jpg"] },
  { name: "Bag Diamond (negra)", code: "Cod10", price: 44000, desc: "Un diseño que transmite elegancia desde cada ángulo. Ideal para complementar cualquier outfit con un toque distinguido.", medidas: "31 x 22 x 10 cm", stock: true, images: ["assets/diamond-negra-1.jpg", "assets/diamond-negra-2.jpg", "assets/diamond-negra-3.jpg"] },
  { name: "Bag Classic", code: "Cod11", price: 38000, desc: "Clásica, amplia y fácil de combinar. Una cartera pensada para convertirse en tu compañera favorita en cualquier ocasión.", medidas: "34 x 18 x 12 cm", stock: false, images: ["assets/classic-1.png", "assets/classic-2.jpg", "assets/classic-3.jpg", "assets/classic-4.jpg"] },
  { name: "Bolso Wine", code: "Cod12", price: 42000, desc: "Es la tote bag perfecta si buscas amplitud, comodidad y estilo. Perfecta para destacar con sutileza.", medidas: "32 x 26 x 11 cm", stock: true, images: ["assets/wine-1.jpg", "assets/wine-2.jpg", "assets/wine-3.jpg"] },
  { name: "Bag Mery (beige)", code: "Cod13", price: 38000, desc: "La combinación ideal entre comodidad y tendencia. Un accesorio pensado para acompañarte todos los días.", medidas: "20 x 12 x 8 cm", stock: true, images: ["assets/mery-beige-1.png", "assets/mery-beige-2.jpg", "assets/mery-beige-3.jpg", "assets/mery-beige-4.jpg", "assets/mery-beige-5.jpg"] },
  { name: "Bag Emilia", code: "Cod14", price: 32000, desc: "Pequeña en tamaño, pero protagonista en estilo. Una mini bag versátil que complementa cualquier outfit con un toque sofisticado.", medidas: "20 x 13 x 11 cm", stock: true, images: ["assets/emilia-1.jpg", "assets/emilia-2.jpg", "assets/emilia-3.jpg", "assets/emilia-4.jpg", "assets/emilia-5.jpg"] },
  { name: "Bag Fancy", code: "Cod15", price: 38000, desc: "Un diseño atemporal que combina amplitud, comodidad y sofisticación. Opción ideal para acompañarte todos los días con un estilo elegante.", medidas: "30 x 25 x 14 cm", stock: true, images: ["assets/fancy-1.png", "assets/fancy-2.png"] },
  { name: "Bag Miley", code: "Cod16", price: 32000, desc: "Pensada para quienes aman los accesorios con actitud. Su diseño con hebillas hace de esta cartera el complemento perfecto para elevar cualquier look.", medidas: "39 x 22 x 8 cm", stock: true, images: ["assets/miley-1.jpg", "assets/miley-2.jpg", "assets/miley-3.jpg"] },
  { name: "Bag Mora (beige)", code: "Cod17", price: 30000, desc: "Una bag más informal, pero sin dejar de brindar estilo. Planeada para acompañarte en cualquier ocasión, sus compartimentos la hacen práctica y cómoda.", medidas: "24 x 20 x 8 cm", stock: true, images: ["assets/mora-beige-1.jpg", "assets/mora-beige-2.jpg", "assets/mora-beige-3.jpg"] },
  { name: "Bag Mora (negra)", code: "Cod18", price: 30000, desc: "Una bag más informal, pero sin dejar de brindar estilo. Planeada para acompañarte en cualquier ocasión, sus compartimentos la hacen práctica y cómoda.", medidas: "24 x 20 x 8 cm", stock: true, images: ["assets/mora-negra-1.jpg", "assets/mora-negra-2.jpg", "assets/mora-negra-3.jpg"] }
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
  root.innerHTML = products.map((p, i) => {
    const url = whatsappUrl(p);
    const rowClass = i % 2 === 1 ? "rev" : "";
    const tagClass = p.stock ? "tag-accent-2" : "tag-neutral";
    const stockLabel = p.stock ? "Disponible" : "Agotado";
    const thumb = productImages(p)[0];
    return `
      <div class="ab-wrap">
        <div class="ab-row ${rowClass}" data-index="${i}" tabindex="0" role="button" aria-haspopup="dialog" aria-label="Ver detalle de ${p.name}">
          <figure class="ab-photo" style="margin:0;">
            <img src="${thumb}" alt="Foto de ${p.name}">
            <span class="ab-photo-cue" aria-hidden="true">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              Ver más
            </span>
          </figure>
          <div class="ab-info">
            <div class="ab-tag-row" style="display:flex;align-items:center;gap:var(--space-3);margin-bottom:var(--space-3);">
              <span class="tag ${tagClass}">${stockLabel}</span>
            </div>
            <h2 class="ab-title" style="font-family:var(--font-heading);font-weight:var(--font-heading-weight);font-size:clamp(26px,3vw,36px);letter-spacing:0;margin:0;">${p.name}</h2>
            <p class="ab-desc" style="font-size:15.5px;line-height:1.65;max-width:42ch;margin:var(--space-4) 0 0;color:color-mix(in srgb,var(--color-text) 78%,transparent);">${p.desc}</p>
            <p class="ab-medidas" style="font-size:13px;margin:var(--space-3) 0 0;color:color-mix(in srgb,var(--color-text) 58%,transparent);">Medidas: ${p.medidas}</p>
            <p class="ab-price" style="font-family:var(--font-heading);font-weight:var(--font-heading-weight);font-size:26px;color:var(--color-accent-700);margin:var(--space-5) 0 0;">${formatPrice(p.price)}</p>
            <a href="${url}" target="_blank" rel="noopener" class="btn btn-secondary js-wa-link ab-wa-btn" style="margin-top:var(--space-5);display:inline-flex;">Consultar por WhatsApp</a>
            <div class="ab-mobile-more" aria-hidden="true">
              Ver detalle
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </div>
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