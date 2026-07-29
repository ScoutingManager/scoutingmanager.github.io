/* ScoutingManager - inicializacion de Firebase (App/Auth/Firestore) via CDN, sin build.
   Este script es un modulo ES (se carga con <script type="module">) y expone en window.FB
   las funciones que el resto del codigo (scripts clasicos) necesita, para no tener que
   convertir toda la aplicacion a modulos. */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged, updatePassword
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  getFirestore, collection, doc, setDoc, getDoc, getDocs, deleteDoc, onSnapshot, writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// Configuracion del proyecto Firebase (Project settings > General > Tus apps > Web).
// Estos valores identifican el proyecto pero no son secretos: la seguridad real la dan
// las reglas de Firestore (firestore.rules) y Firebase Authentication.
const firebaseConfig = {
  apiKey: "AIzaSyDjkQ2riLj3GltueeNO4i7PHZMJJpSR28E",
  authDomain: "jrvscoutingmanager.firebaseapp.com",
  projectId: "jrvscoutingmanager",
  storageBucket: "jrvscoutingmanager.firebasestorage.app",
  messagingSenderId: "194233027096",
  appId: "1:194233027096:web:159d23a637d3cea53e516d"
};

const isConfigured = firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith('__');

if (!isConfigured) {
  window.FB_CONFIG_MISSING = true;
} else {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  window.FB = {
    app, auth, db,
    createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updatePassword,
    collection, doc, setDoc, getDoc, getDocs, deleteDoc, onSnapshot, writeBatch
  };
}

window.dispatchEvent(new Event('firebase-checked'));
