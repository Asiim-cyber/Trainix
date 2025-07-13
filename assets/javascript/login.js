import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// 🔧 Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAZx-5UPvsaAz29f_8Qk67WGGmIx6KsInE",
  authDomain: "trainix-47c4f.firebaseapp.com",
  projectId: "trainix-47c4f",
  storageBucket: "trainix-47c4f.appspot.com",
  messagingSenderId: "207195754323",
  appId: "1:207195754323:web:7a2c800bc0f500911adba6"
};

// 🔥 Initialisation Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 🔐 Connexion
document.getElementById("loginBtn").addEventListener("click", async () => {
  const email = document.getElementById("loginEmail").value;
  const pass = document.getElementById("loginPassword").value;

  try {
    await signInWithEmailAndPassword(auth, email, pass);
    alert("Connexion réussie !");
    window.location.href = "app.html";
  } catch (err) {
    alert("Erreur : " + err.message);
  }
});

// 👤 Inscription avec prénom + nom
document.getElementById("signupBtn").addEventListener("click", async () => {
  const email = document.getElementById("signupEmail").value;
  const pass = document.getElementById("signupPassword").value;
  const prenom = document.getElementById("signupFirstname").value;
  const nom = document.getElementById("signupLastname").value;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const uid = userCredential.user.uid;

    // Enregistrer prénom et nom dans Firestore
    await setDoc(doc(db, "users", uid), {
      email: email,
      prenom: prenom,
      nom: nom,
      createdAt: new Date()
    });

    alert("Inscription réussie !");
    switchModal("loginModal");
  } catch (err) {
    alert("Erreur : " + err.message);
  }
});

// 🔄 Navigation entre modales
document.getElementById("toSignup").addEventListener("click", () => switchModal("signupModal"));
document.getElementById("toLogin").addEventListener("click", () => switchModal("loginModal"));
document.getElementById("openLogin").addEventListener("click", () => switchModal("loginModal"));
document.getElementById("openSignup").addEventListener("click", () => switchModal("signupModal"));

// 🎯 Fonction pour basculer entre modales
function switchModal(toModalId) {
  document.getElementById("loginModal").style.display = "none";
  document.getElementById("signupModal").style.display = "none";
  document.getElementById(toModalId).style.display = "flex";
}
