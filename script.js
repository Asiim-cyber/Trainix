
let workoutData = {};
let nutritionData = {};

// Charger les fichiers JSON externes
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


// Application state
let currentProgram = null;
let savedPrograms = JSON.parse(localStorage.getItem('fitpro-programs') || '[]');
let isDarkMode = localStorage.getItem('fitpro-darkmode') === 'true';

// Data stores - données intégrées directement
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
});

async function initializeApp() {
  await loadData();
  if (isDarkMode) document.body.classList.add('dark-mode');

  document.getElementById('workoutForm').addEventListener('submit', handleFormSubmit);
  document.getElementById('darkModeBtn').addEventListener('click', toggleDarkMode);
  document.getElementById('historyBtn').addEventListener('click', showHistory);
  document.getElementById('statsBtn').addEventListener('click', showStats);
  document.getElementById('printBtn').addEventListener('click', printProgram);
  document.getElementById('saveBtn').addEventListener('click', saveProgram);
  document.getElementById('newProgramBtn').addEventListener('click', newProgram);
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });
}

// Toggle dark/light mode
function toggleDarkMode() {
  isDarkMode = !isDarkMode;
  document.body.classList.toggle('dark-mode', isDarkMode);
  localStorage.setItem('fitpro-darkmode', isDarkMode);
}

// Form submission
async function handleFormSubmit(e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target));
  if (!validateForm(data)) return;
  showLoading(true);

  try {
    console.log('Form data:', data);
    currentProgram = generateProgram(data);
    displayResults(currentProgram);
  } catch (err) {
    console.error(err);
    alert('Erreur lors de la génération du programme: ' + err.message);
  } finally {
    showLoading(false);
  }
}

// Validation
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

// Mapping selects to JSON keys
const goalMap = {
  'muscle-gain': 'prise de masse',
  'fat-loss': 'perte de poids',
  'general-fitness': 'remise en forme',
  'strength': 'prise de masse', // Fallback
  'endurance': 'perte de poids' // Fallback
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

function generateProgram({ goal, equipment, level, days, duration, focus }) {
  const gKey = goalMap[goal];
  const eKey = equipMap[equipment];
  const lKey = levelMap[level];
  const dKey = days;

  console.log('Clés utilisées :', { gKey, eKey, lKey, dKey });

  if (!workoutData[gKey] || !workoutData[gKey][eKey] || !workoutData[gKey][eKey][dKey]) {
    throw new Error('Paramètres d\'entraînement invalides');
  }

  const workouts = workoutData[gKey][eKey][dKey];
  const nutrition = nutritionData[gKey]?.[lKey] || [];

  return { workouts, nutrition, days: +dKey, duration };
}

// Display workout and nutrition - CORRIGÉ
function displayResults({ workouts, nutrition }) {
  const formulaire = document.getElementById('form-card');
  const results = document.getElementById('results');
  const grid = document.getElementById('workoutGrid');
  const nGrid = document.getElementById('nutritionGrid');
  
  grid.innerHTML = '';
  nGrid.innerHTML = '';

  // Générer les cartes d'entraînement selon la structure HTML
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

          return url
            ? `<a href="${url}" target="_blank" class="exercise-link">${itemHTML}</a>`
            : itemHTML;
        }).join('')}
      </div>
    `;
    grid.appendChild(card);
  });

  

  // Générer les conseils nutritionnels
  nutrition.forEach(tip => {
    const item = document.createElement('div');
    item.className = 'nutrition-item';
    item.innerHTML = `
      <div class="nutrition-item-title">Conseil</div>
      <div class="nutrition-item-desc">${tip}</div>
    `;
    nGrid.appendChild(item);
  });

  // Afficher les résultats avec animation
  results.style.display = 'block';
  formulaire.style.display = 'none';
  results.classList.add('show');
  
  // Scroll vers les résultats
  results.scrollIntoView({ behavior: 'smooth' });
}

// Loading spinner
function showLoading(isLoading) {
  document.getElementById('btnText').style.display = isLoading ? 'none' : 'inline';
  document.getElementById('loadingSpinner').style.display = isLoading ? 'inline-flex' : 'none';
  document.getElementById('generateBtn').disabled = isLoading;
}

// Save program
function saveProgram() {
  if (!currentProgram) return;
  savedPrograms.push({ ...currentProgram, date: new Date().toISOString() });
  localStorage.setItem('fitpro-programs', JSON.stringify(savedPrograms));
  alert('Programme sauvegardé');
}

// Print
function printProgram() {
  window.print();
}

// Reset
function newProgram() {
  document.getElementById('form-card').style.display = 'grid';
  document.getElementById('results').style.display = 'none';
  document.getElementById('results').classList.remove('show');
  document.getElementById('workoutForm').reset();
}

// History modal
function showHistory() {
  const modal = document.getElementById('modal');
  const body = document.getElementById('modalBody');
  body.innerHTML = savedPrograms.length
    ? `<ul>${savedPrograms.map(p =>
      `<li>${new Date(p.date).toLocaleString()} - ${p.workouts.length} jours</li>`).join('')}</ul>`
    : '<p>Aucun programme sauvegardé.</p>';
  document.getElementById('modalTitle').textContent = 'Historique des programmes';
  modal.style.display = 'flex';
}

// Stats modal
function showStats() {
  const modal = document.getElementById('modal');
  const body = document.getElementById('modalBody');
  const count = savedPrograms.length;
  const avgDays = count
    ? Math.round(savedPrograms.reduce((a, p) => a + p.days, 0) / count)
    : 0;
  body.innerHTML = `
    <p>Total: ${count} programmes</p>
    <p>Durée moyenne: ${avgDays} jours</p>
  `;
  document.getElementById('modalTitle').textContent = 'Statistiques';
  modal.style.display = 'flex';
}

// Close modal
function closeModal() {
  document.getElementById('modal').style.display = 'none';
}