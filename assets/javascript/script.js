import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { signOut } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAZx-5UPvsaAz29f_8Qk67WGGmIx6KsInE",
  authDomain: "trainix-47c4f.firebaseapp.com",
  projectId: "trainix-47c4f",
  storageBucket: "trainix-47c4f.firebasestorage.app",
  messagingSenderId: "207195754323",
  appId: "1:207195754323:web:7a2c800bc0f500911adba6",
  measurementId: "G-CXBKSTHZ5M"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let workoutData = {};
let nutritionData = {};
let currentUser = null;
let currentProgram = null;

async function loadData() {
  try {
    const [workoutRes, nutritionRes] = await Promise.all([
      fetch('data/workout.json'),
      fetch('data/nutrition.json')
    ]);
    workoutData = await workoutRes.json();
    nutritionData = await nutritionRes.json();
  } catch (error) {
    console.error("Erreur lors du chargement des fichiers JSON :", error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initializeAppTrainix();
});

async function initializeAppTrainix() {
  await loadData();

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log("Connecté :", user.email);

      // 🔍 Récupérer les infos de l'utilisateur depuis Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data();

      const welcomeElement = document.getElementById("welcomeMsg");
      if (welcomeElement && userData?.prenom) {
        welcomeElement.textContent = `Bonjour ${userData.prenom}`;
      }

      await loadProgramme(user.uid); // ou tout autre fonction perso
    } else {
      console.log("Utilisateur non connecté.");
      window.location.href = "index.html";
    }
});


document.getElementById("btn-deconnexion").addEventListener("click", async () => {
  try {
    await signOut(auth);
    console.log("Déconnecté !");
    window.location.href = "index.html";
  } catch (error) {
    console.error("Erreur de déconnexion :", error);
  }
});


  document.getElementById('workoutForm').addEventListener('submit', handleFormSubmit);
  document.getElementById('darkModeBtn').addEventListener('click', toggleDarkMode);
  document.getElementById('historyBtn').addEventListener('click', showHistory);
  document.getElementById('statsBtn').addEventListener('click', showStats);
  document.getElementById('printBtn').addEventListener('click', printProgram);
  document.getElementById('saveBtn').addEventListener('click', () => {
    if (currentUser && currentProgram) {
      saveProgramme(currentUser.uid, currentProgram);
    } else {
      alert("Connecte-toi et génère un programme d'abord !");
    }
  });
  document.getElementById('newProgramBtn').addEventListener('click', newProgram);
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });
}

function toggleDarkMode() {
  const isDark = document.body.classList.toggle('dark-mode');
  localStorage.setItem('fitpro-darkmode', isDark);
}

async function handleFormSubmit(e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target));
  if (!validateForm(data)) return;
  showLoading(true);

  try {
    currentProgram = generateProgram(data);
    displayResults(currentProgram);
  } catch (err) {
    console.error(err);
    alert('Erreur lors de la génération du programme: ' + err.message);
  } finally {
    showLoading(false);
  }
}

function validateForm(data) {
  const requiredFields = ['goal', 'level', 'days', 'equipment', 'duration'];
  for (const field of requiredFields) {
    if (!data[field]) {
      alert(`Veuillez remplir le champ ${field}`);
      return false;
    }
  }
  return true;
}

const goalMap = {
  'muscle-gain': 'prise de masse',
  'fat-loss': 'perte de poids',
  'general-fitness': 'remise en forme',
  'strength': 'prise de masse',
  'endurance': 'perte de poids'
};

const equipMap = {
  'bodyweight': 'poids du corps',
  'home-gym': 'halteres',
  'full-gym': 'salle complete'
};

const levelMap = {
  'beginner': 'debutant',
  'intermediate': 'intermediaire',
  'advanced': 'avance'
};

function generateProgram({ goal, equipment, level, days, duration }) {
  const gKey = goalMap[goal];
  const eKey = equipMap[equipment];
  const lKey = levelMap[level];
  const dKey = days;

  if (!workoutData[gKey] || !workoutData[gKey][eKey] || !workoutData[gKey][eKey][dKey]) {
    throw new Error("Paramètres d'entraînement invalides");
  }

  const workouts = workoutData[gKey][eKey][dKey];
  const nutrition = nutritionData[gKey]?.[lKey] || [];

  return { workouts, nutrition, days: +dKey, duration };
}

function displayResults({ workouts, nutrition }) {
  const formulaire = document.getElementById('form-card');
  const results = document.getElementById('results');
  const grid = document.getElementById('workoutGrid');
  const nGrid = document.getElementById('nutritionGrid');

  grid.innerHTML = '';
  nGrid.innerHTML = '';

  workouts.forEach((dayExercises, i) => {
    const card = document.createElement('div');
    card.className = 'workout-card';
    card.innerHTML = `
      <div class="workout-header">
        <div class="workout-day">Jour ${i + 1}</div>
        <div class="workout-focus">Entraînement complet</div>
      </div>
      <div class="workout-exercises">
        ${dayExercises.map(exercise => {
          const name = typeof exercise === 'object' ? exercise.name : exercise;
          const url = typeof exercise === 'object' ? exercise.url : null;
          const itemHTML = `
            <div class="exercise-item">
              <div class="exercise-icon"></div>
              <div>
                <div class="exercise-name">${name}</div>
                <div class="exercise-details">3 séries × 8-12 répétitions</div>
              </div>
            </div>
          `;
          return url ? `<a href="${url}" target="_blank" class="exercise-link">${itemHTML}</a>` : itemHTML;
        }).join('')}
      </div>
    `;
    grid.appendChild(card);
  });

  nutrition.forEach(tip => {
    const item = document.createElement('div');
    item.className = 'nutrition-item';
    item.innerHTML = `
      <div class="nutrition-item-title">Conseil</div>
      <div class="nutrition-item-desc">${tip}</div>
    `;
    nGrid.appendChild(item);
  });

  results.style.display = 'block';
  formulaire.style.display = 'none';
  results.classList.add('show');
  results.scrollIntoView({ behavior: 'smooth' });
}

function showLoading(isLoading) {
  document.getElementById('btnText').style.display = isLoading ? 'none' : 'inline';
  document.getElementById('loadingSpinner').style.display = isLoading ? 'inline-flex' : 'none';
  document.getElementById('generateBtn').disabled = isLoading;
}

async function saveProgramme(userId, programmeData) {
  try {
    const ref = doc(db, "users", userId);
    await setDoc(ref, { programme: programmeData });
    alert("Programme sauvegardé dans le cloud !");
  } catch (e) {
    console.error("Erreur enregistrement :", e);
    alert("Erreur lors de l'enregistrement.");
  }
}

async function loadProgramme(userId) {
  try {
    const ref = doc(db, "users", userId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data().programme;
      console.log("Programme chargé :", data);
      displayResults(data);
    }
  } catch (e) {
    console.error("Erreur de chargement :", e);
  }
}

function printProgram() {
  window.print();
}

function newProgram() {
  document.getElementById('form-card').style.display = 'grid';
  document.getElementById('results').style.display = 'none';
  document.getElementById('results').classList.remove('show');
  document.getElementById('workoutForm').reset();
}

function showHistory() {
  const modal = document.getElementById('modal');
  const body = document.getElementById('modalBody');
  body.innerHTML = "<p>L'historique est maintenant stocké dans le cloud avec ton compte.</p>";
  document.getElementById('modalTitle').textContent = 'Historique des programmes';
  modal.style.display = 'flex';
}

function showStats() {
  const modal = document.getElementById('modal');
  const body = document.getElementById('modalBody');
  body.innerHTML = "<p>Les statistiques seront bientôt disponibles via Firestore.</p>";
  document.getElementById('modalTitle').textContent = 'Statistiques';
  modal.style.display = 'flex';
}

function closeModal() {
  document.getElementById('modal').style.display = 'none';
}


