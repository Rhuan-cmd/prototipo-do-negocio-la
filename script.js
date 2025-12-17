const firebaseConfig = {
    apiKey: "AIzaSyAhuBtqvqzb1Htf07cT2D0y7T8dUFotZAQ",
    authDomain: "bergamota-65698.firebaseapp.com",
    databaseURL: "https://bergamota-65698-default-rtdb.firebaseio.com",
    projectId: "bergamota-65698",
    storageBucket: "bergamota-65698.firebasestorage.app",
    messagingSenderId: "978149827652",
    appId: "1:978149827652:web:598d05b990dccee75ac811",
    measurementId: "G-K6EPHWMP0Z"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

const DATA_FILES = [
    'EL-BUANCO-DE-DUEDOS/frutas.json',
    'EL-BUANCO-DE-DUEDOS/hortalicas.json',
    'EL-BUANCO-DE-DUEDOS/raizes.json',
    'EL-BUANCO-DE-DUEDOS/medicinais.json'
];

let allPlants = [];

const mainApp = document.getElementById('mainApp');
const loginScreen = document.getElementById('loginScreen');
const adminScreen = document.getElementById('adminScreen');
const plantsGrid = document.getElementById('plantsGrid');
const searchInput = document.getElementById('searchInput');
const filterBtns = document.querySelectorAll('.filter-btn');
const modal = document.getElementById('plantModal');
const closeModalBtn = document.querySelector('.close-modal');

async function loadData() {
    try {
        const promises = DATA_FILES.map(url => fetch(url).then(res => res.json()));
        const results = await Promise.all(promises);
        allPlants = results.flat();
        renderPlants(allPlants);
        
        document.getElementById('totalPlants').textContent = allPlants.length;
    } catch (error) {
        console.error("Erro ao carregar dados:", error);
        plantsGrid.innerHTML = `<p style="text-align:center; color: #dc2626;">Erro ao carregar o catálogo. Verifique sua conexão.</p>`;
    }
}

function renderPlants(plants) {
    plantsGrid.innerHTML = '';
    if (plants.length === 0) {
        plantsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Nenhuma planta encontrada.</p>';
        return;
    }
    plants.forEach(plant => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <img src="${plant.image}" alt="${plant.name}" class="card-img" onerror="this.src='https://placehold.co/600x400?text=Sem+Imagem'">
            <div class="card-body">
                <span class="card-cat">${plant.category}</span>
                <h3>${plant.name}</h3>
                <p class="card-sci">${plant.scientificName}</p>
            </div>
        `;
        card.addEventListener('click', () => openModal(plant));
        plantsGrid.appendChild(card);
    });
}

function filterPlants(category) {
    filterBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.category === category));
    const term = searchInput.value.toLowerCase();
    const filtered = allPlants.filter(plant => {
        const matchesCategory = category === 'all' || plant.category === category;
        const matchesSearch = plant.name.toLowerCase().includes(term) || plant.scientificName.toLowerCase().includes(term);
        return matchesCategory && matchesSearch;
    });
    renderPlants(filtered);
}

filterBtns.forEach(btn => btn.addEventListener('click', () => filterPlants(btn.dataset.category)));
searchInput.addEventListener('input', () => {
    const activeCategory = document.querySelector('.filter-btn.active').dataset.category;
    filterPlants(activeCategory);
});

document.getElementById('feedbackForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('feedbackName').value;
    const msg = document.getElementById('feedbackMessage').value;
    
    const feedbackBtn = e.target.querySelector('button');
    const originalText = feedbackBtn.textContent;
    feedbackBtn.textContent = "Enviando...";
    feedbackBtn.disabled = true;

    const newFeedbackRef = db.ref('feedbacks').push();
    newFeedbackRef.set({
        user: name,
        message: msg,
        timestamp: new Date().toISOString()
    }).then(() => {
        alert("Obrigado! Sua sugestão foi salva com sucesso.");
        e.target.reset();
    }).catch((error) => {
        alert("Erro ao enviar: " + error.message);
    }).finally(() => {
        feedbackBtn.textContent = originalText;
        feedbackBtn.disabled = false;
    });
});

function openModal(plant) {
    document.getElementById('modalImg').style.backgroundImage = `url('${plant.image}')`;
    document.getElementById('modalCategory').textContent = plant.category;
    document.getElementById('modalName').textContent = plant.name;
    document.getElementById('modalScientific').textContent = plant.scientificName;
    document.getElementById('modalDesc').textContent = plant.description;
    document.getElementById('modalSeason').textContent = plant.season;
    document.getElementById('modalUsage').textContent = plant.usage;
    modal.classList.remove('hidden');
}

closeModalBtn.addEventListener('click', () => modal.classList.add('hidden'));
window.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });

window.toggleLogin = function() {
    loginScreen.classList.remove('hidden');
}

document.getElementById('closeLoginBtn').addEventListener('click', () => {
    loginScreen.classList.add('hidden');
});

document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPassword').value;

    if(email === 'admin@florama.com' && pass === 'admin123') {
        loginScreen.classList.add('hidden');
        mainApp.classList.add('hidden');
        adminScreen.classList.remove('hidden');
        loadAdminData();
    } else {
        alert("Credenciais inválidas! Tente admin@florama.com / admin123");
    }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
    adminScreen.classList.add('hidden');
    mainApp.classList.remove('hidden');
});

function loadAdminData() {
    const listContainer = document.getElementById('feedbackList');
    const totalFeedbacksEl = document.getElementById('totalFeedbacks');
    
    listContainer.innerHTML = '<p class="loading-text">Buscando dados no Firebase...</p>';

    db.ref('feedbacks').on('value', (snapshot) => {
        const data = snapshot.val();
        listContainer.innerHTML = '';

        if (!data) {
            listContainer.innerHTML = '<p style="color: #666;">Nenhum feedback recebido ainda.</p>';
            totalFeedbacksEl.textContent = '0';
            return;
        }

        const feedbacks = Object.values(data).reverse();
        totalFeedbacksEl.textContent = feedbacks.length;

        feedbacks.forEach(item => {
            const date = new Date(item.timestamp).toLocaleDateString('pt-BR');
            const div = document.createElement('div');
            div.className = 'feedback-item';
            div.innerHTML = `
                <div class="feedback-header">
                    <span class="feedback-user"><i class="ri-user-line"></i> ${item.user}</span>
                    <span class="feedback-date">${date}</span>
                </div>
                <p class="feedback-msg">"${item.message}"</p>
            `;
            listContainer.appendChild(div);
        });
    });
}

loadData();