# Panel de administración — Áurea Bags

La tienda ahora lee todo (productos, secciones, precios, stock, fotos y textos) de **Firebase**.
Tu cliente lo administra desde **`tusitio.com/admin`** con su correo y contraseña.

Mientras no conectes Firebase, la tienda sigue funcionando igual que antes con los productos de `legacy-products.js`.

---

## Qué archivo hace qué

| Archivo | Para qué sirve |
|---|---|
| `firebase-config.js` | **Lo único que tenés que editar en el código.** Acá van los datos de tu proyecto Firebase. |
| `firebase-init.js` | Conecta con Firebase (no tocar). |
| `script.js` | Tienda pública: lee el catálogo de Firebase y lo muestra por secciones. |
| `legacy-products.js` | Los 34 productos que estaban en el código. Se usan para la migración y como respaldo. |
| `admin/` | El panel (login, productos, secciones, ajustes). |
| `firestore.rules` / `storage.rules` | Seguridad: todos pueden ver el catálogo, solo el admin puede modificarlo. |
| `firebase.json` | Configuración del hosting de Firebase. |
| `_respaldo-antes-firebase/` | Copia de `index.html`, `script.js` y `styles.css` como estaban antes. |

---

## Puesta en marcha (una sola vez, ~20 minutos)

### 1. Crear el proyecto
1. Entrá a <https://console.firebase.google.com> → **Crear proyecto** (ej: `aurea-bags`). Google Analytics no hace falta.
2. En la pantalla del proyecto tocá el ícono **`</>` (Web)** → poné un nombre → **Registrar app**.
3. Te muestra un bloque `const firebaseConfig = { ... }`. Copiá esos valores en **`firebase-config.js`** (reemplazando `PEGAR_AQUI` y los campos vacíos).

### 2. Usuario administrador
1. Menú **Authentication → Comenzar → Correo electrónico/contraseña → Habilitar → Guardar**.
2. Pestaña **Users → Agregar usuario**: el correo y contraseña de tu cliente.
3. (Recomendado) **Settings → User actions** → desmarcá **Enable create (sign-up)**, así nadie más puede crearse una cuenta.

### 3. Base de datos
1. Menú **Firestore Database → Crear base de datos** → modo **producción** → ubicación `southamerica-east1 (São Paulo)`.

### 4. Fotos (Storage)
Firebase exige el **plan Blaze** (pago por uso, pide tarjeta) para guardar fotos. Con el tamaño de este catálogo el uso entra en la capa gratuita, así que en la práctica cuesta $0.
1. Abajo a la izquierda: **Upgrade → Blaze**. Configurá una **alerta de presupuesto** de USD 1 para quedarte tranquilo.
2. Menú **Storage → Comenzar** → ubicación **`us-east1`** (o `us-central1` / `us-west1`): son las que tienen capa gratuita.

### 5. Reglas de seguridad
1. En **`firestore.rules`** y **`storage.rules`** reemplazá `CORREO_DEL_ADMIN@gmail.com` por el correo del paso 2 (en minúsculas). Para varios admins: `['uno@gmail.com', 'otro@gmail.com']`.
2. Publicalas: copiá el contenido de cada archivo en **Firestore → Reglas** y **Storage → Reglas** y tocá **Publicar**.
   (O por terminal en el paso 6: `firebase deploy --only firestore:rules,storage`.)

### 6. Publicar el sitio (Firebase Hosting, gratis)
En la terminal, dentro de la carpeta del proyecto:
```bash
npm install -g firebase-tools
firebase login
firebase use --add        # elegí el proyecto creado
firebase deploy           # sube el sitio + las reglas
```
Queda en `https://TU-PROYECTO.web.app` y el panel en `https://TU-PROYECTO.web.app/admin`.

- **Dominio propio:** Hosting → Agregar dominio personalizado.
- **Si el sitio está en otro hosting** (Netlify, Vercel, etc.): también funciona, siempre que el sitio esté en la raíz del dominio. Agregá ese dominio en **Authentication → Settings → Dominios autorizados**.
- **No borres la carpeta `assets/`:** las fotos de los productos migrados siguen ahí. Las fotos nuevas se guardan en Firebase Storage. Las carpetas `Cod...` y el `.docx` no se publican.

### 7. Migrar los productos actuales
1. Entrá a `/admin` e iniciá sesión.
2. Como la base está vacía, aparece el botón **“Importar productos actuales”** → crea las 3 secciones y los 34 productos con sus precios, fotos y descripciones.
3. **Revisá el stock:** las que hoy figuran como disponibles se importan con **1 unidad** y las agotadas con **0**. Ajustá las cantidades reales con los botones − / +.
4. Solo la *Tercera Colección* quedó marcada como “Nuevo”. Se cambia desde cada producto.

> **Para probar en tu compu:** abrí el sitio con Live Server en `http://localhost:5501` (no `127.0.0.1`) y el panel en `http://localhost:5501/admin/`.

---

## Uso diario (para tu cliente)

- **Cambiar precio o stock:** pestaña *Productos*. Se edita directo en la lista y se guarda solo. Con stock 0 aparece “Agotado”.
- **Nuevo producto:** *+ Nuevo producto* → fotos, nombre, precio, stock, sección → *Guardar*. Aparece primero en su sección.
- **Fotos:** la primera es la **portada**. Con ★ se elige otra portada y con ‹ › se cambia el orden. Las fotos se achican solas antes de subirse (no hace falta editarlas).
- **Ocultar sin borrar:** el ícono del ojo (sirve para productos y secciones).
- **Orden:** flechas ↑ ↓. En la tienda las agotadas siempre aparecen al final de su sección.
- **Secciones:** pestaña *Secciones* → crear, renombrar (escribir sobre el nombre), ordenar, ocultar o eliminar. Si se elimina una sección, sus productos **no** se borran: pasan a “Sin sección”.
- **Ajustes del sitio:** número de WhatsApp, mensaje automático, Instagram y textos principales de la página.
- **Olvidé la contraseña:** en el login, escribir el correo y tocar “Olvidé mi contraseña”.
