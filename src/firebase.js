// src/firebase.js

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

/* =========================
   CONFIGURAÇÃO FIREBASE
========================= */
const firebaseConfig = {
  apiKey: "AIzaSyCPDBSwj3EbtOiPBfDuXxLXPFBMq3VzvyE",
  authDomain: "swapbook-d41d9.firebaseapp.com",
  projectId: "swapbook-d41d9",
  storageBucket: "swapbook-d41d9.appspot.com",
  messagingSenderId: "829267308830",
  appId: "1:829267308830:web:39d6daefa473092ca9590f"
};

/* =========================
   INIT APP
========================= */
const app = initializeApp(firebaseConfig);

/* =========================
   SERVIÇOS
========================= */

// 🔥 Banco de dados
export const db = getFirestore(app);

// 🔐 Autenticação
export const auth = getAuth(app);

// 🔑 Provider Google
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: "select_account",
});