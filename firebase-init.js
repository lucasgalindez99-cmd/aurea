// Inicializa Firebase una sola vez y lo comparte entre la tienda y el panel.
import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore-lite.js";

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
