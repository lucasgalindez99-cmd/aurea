// ─────────────────────────────────────────────────────────────
//  CONFIGURACIÓN DE FIREBASE
//  Pegá acá los datos de tu proyecto:
//  Consola Firebase → ⚙ Configuración del proyecto → "Tus apps" → app web → "Configuración del SDK" (opción "Config").
//  Estos datos NO son secretos: la seguridad la dan las reglas (firestore.rules / storage.rules).
// ─────────────────────────────────────────────────────────────
export const firebaseConfig = {
  apiKey: "AIzaSyD0FiXMhUCINfDGxndv5LcHpniacu2tmN4",
  authDomain: "aurea-bag.firebaseapp.com",
  projectId: "aurea-bag",
  storageBucket: "aurea-bag.firebasestorage.app",
  messagingSenderId: "936354133526",
  appId: "1:936354133526:web:b6a0813811f109c6536737",
};

// Mientras no pegues la configuración, la tienda muestra los productos de legacy-products.js
export const FIREBASE_READY = !!firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith("PEGAR");
