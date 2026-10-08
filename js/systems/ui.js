import { CONFIG } from '../config.js';
import { gameState, setGameState } from '../state.js';

export function showUpgradeChoices() {
    const upgrades = ['line', 'tunnel', 'carriage', 'interchange'];
    const available = upgrades.filter(u => (u === 'line') ? gameState.availableLines < gameState.maxLines : true);
    const choices = [];
    for (let i = 0; i < 2 && available.length > 0; i++) {
        const index = Math.floor(Math.random() * available.length);
        choices.push(available.splice(index, 1)[0]);
    }
    
    const modal = document.getElementById('upgradeModal');
    const container = modal.querySelector('.upgrade-choices');
    container.innerHTML = '';
    
    choices.forEach(upgrade => {
        const div = document.createElement('div');
        div.className = 'upgrade-choice';
        div.onclick = () => selectUpgrade(upgrade);
        const content = {
            line: { icon: '🚇', name: 'New Line' },
            tunnel: { icon: '🌉', name: 'Bridge/Tunnel' },
            carriage: { icon: '🚃', name: 'Carriage' },
            interchange: { icon: '🔄', name: 'Interchange' }
        };
        div.innerHTML = `<div class="upgrade-icon">${content[upgrade].icon}</div><div class="upgrade-name">${content[upgrade].name}</div>`;
        container.appendChild(div);
    });
    
    modal.classList.add('show');
    setGameState({ paused: true });
}

function selectUpgrade(upgrade) {
    switch(upgrade) {
        case 'line': 
            setGameState({ availableLines: gameState.availableLines + 1 });
            setGameState({ availableTrains: gameState.availableTrains + 1 });
            break;
        case 'tunnel': setGameState({ bridges: gameState.bridges + 1 }); break;
        case 'carriage': setGameState({ carriages: gameState.carriages + 1 }); break;
        case 'interchange': setGameState({ interchanges: gameState.interchanges + 1 }); break;
    }
    
    document.getElementById('upgradeModal').classList.remove('show');
    setGameState({ paused: false });
    createLineSelector();
    updateResourceDisplay();
}

export function updateUI() {
    const elapsed = gameState.weekElapsed;
    const progress = (elapsed % CONFIG.WEEK_DURATION) / CONFIG.WEEK_DURATION;
    const days = ['M', 'Tu', 'W', 'Th', 'F', 'Sa', 'Su'];
    document.querySelector('.clock-text').innerHTML = `W${gameState.week}<br>${days[gameState.day]}`;
    document.querySelector('.clock-progress').style.strokeDasharray = `${progress * 150.8}, 150.8`;
    
    const scoreElement = document.getElementById('score');
    if (scoreElement.textContent !== `${gameState.score}`) {
        scoreElement.textContent = `${gameState.score}`;
        scoreElement.classList.add('updated');
        setTimeout(() => scoreElement.classList.remove('updated'), 500);
    }

    const speedBtn = document.getElementById('speedBtn');
    speedBtn.textContent = gameState.speed === 1 ? '▶' : '⏩';
    speedBtn.classList.toggle('active', gameState.speed !== 1);
    document.getElementById('pauseBtn').textContent = gameState.paused ? '▶' : '⏸';
    updateCheatDisplay();
    updateResourceDisplay();
}

let cheatToastTimer = null;

export function initCheatMenu() {
    const overlay = document.getElementById('cheatOverlay');
    const menuButton = document.getElementById('cheatMenuBtn');

    const setOpen = (isOpen) => {
        overlay.classList.toggle('show', isOpen);
        overlay.setAttribute('aria-hidden', String(!isOpen));
        menuButton.setAttribute('aria-expanded', String(isOpen));
    };

    menuButton.addEventListener('click', () => setOpen(!overlay.classList.contains('show')));
    overlay.querySelectorAll('[data-close-cheats]').forEach(element => {
        element.addEventListener('click', () => setOpen(false));
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') setOpen(false);
    });

    overlay.querySelectorAll('[data-cheat]').forEach(input => {
        input.addEventListener('change', () => {
            const cheat = input.dataset.cheat;
            gameState.cheats[cheat] = input.checked;

            if (cheat === 'endlessMode' && !input.checked) {
                const now = Date.now();
                gameState.stations.forEach(station => {
                    if (station.passengers.length > station.capacity) station.overcrowdStartTime = now;
                });
            }

            const label = input.closest('.cheat-toggle-row').querySelector('strong').textContent;
            showCheatToast(`${label}: ${input.checked ? 'включено' : 'выключено'}`);
            updateCheatDisplay();
        });
    });

    overlay.querySelectorAll('[data-cheat-action]').forEach(button => {
        button.addEventListener('click', () => runCheatAction(button.dataset.cheatAction));
    });

    syncCheatMenu();
}

function runCheatAction(action) {
    if (action === 'resources') {
        setGameState({
            availableTrains: gameState.availableTrains + 5,
            carriages: gameState.carriages + 5,
            bridges: gameState.bridges + 5,
            interchanges: gameState.interchanges + 2
        });
        showCheatToast('Запасы пополнены');
    }

    if (action === 'unlockLines') {
        const newlyUnlocked = Math.max(0, gameState.maxLines - gameState.availableLines);
        setGameState({
            availableLines: gameState.maxLines,
            availableTrains: gameState.availableTrains + newlyUnlocked
        });
        createLineSelector();
        showCheatToast(newlyUnlocked ? 'Все линии открыты' : 'Все линии уже открыты');
    }

    if (action === 'clearStations') {
        const evacuated = gameState.stations.reduce((total, station) => total + station.passengers.length, 0);
        if (evacuated > 0) {
            const waitingPassengers = new Set(gameState.stations.flatMap(station => station.passengers));
            gameState.stations.forEach(station => {
                station.passengers = [];
                station.overcrowdStartTime = null;
            });
            gameState.passengers = gameState.passengers.filter(passenger => !waitingPassengers.has(passenger));
            setGameState({
                score: gameState.score + evacuated,
                passengersDelivered: gameState.passengersDelivered + evacuated
            });
        }
        showCheatToast(evacuated ? `Доставлено пассажиров: ${evacuated}` : 'Станции уже свободны');
    }

    updateResourceDisplay();
    updateUI();
}

function syncCheatMenu() {
    document.querySelectorAll('[data-cheat]').forEach(input => {
        input.checked = Boolean(gameState.cheats[input.dataset.cheat]);
    });
    updateCheatDisplay();
}

function updateCheatDisplay() {
    const indicator = document.getElementById('cheatIndicator');
    const menuButton = document.getElementById('cheatMenuBtn');
    const activeCheats = Object.values(gameState.cheats).filter(Boolean).length;

    document.querySelectorAll('[data-cheat]').forEach(input => {
        input.checked = Boolean(gameState.cheats[input.dataset.cheat]);
    });

    indicator.textContent = activeCheats ? `⚡ Читы активны: ${activeCheats}` : '';
    indicator.classList.toggle('show', activeCheats > 0);
    menuButton.classList.toggle('active', activeCheats > 0);
}

function showCheatToast(message) {
    const toast = document.getElementById('cheatToast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(cheatToastTimer);
    cheatToastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
}

export function createLineSelector() {
    const selector = document.getElementById('lineSelector');
    selector.innerHTML = '';
    for (let i = 0; i < gameState.availableLines; i++) {
        const line = gameState.lines[i];

        const container = document.createElement('div');
        container.className = 'line-btn-container';

        const btn = document.createElement('div');
        btn.className = 'line-btn';
        if (i === gameState.selectedLine) btn.classList.add('selected');
        btn.style.backgroundColor = CONFIG.LINE_COLORS[i];
        btn.onclick = () => { 
            setGameState({ selectedLine: i }); 
            createLineSelector(); 
        };
        container.appendChild(btn);

        if (line && line.active) {
            const deleteBtn = document.createElement('div');
            deleteBtn.className = 'line-delete-btn';
            deleteBtn.innerHTML = '&times;';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                if (confirm(`Delete this line? Trains will be returned to your inventory.`)) {
                    line.clearLine();
                    createLineSelector();
                }
            };
            container.appendChild(deleteBtn);
        }
        
        selector.appendChild(container);
    }
}

export function updateResourceDisplay() {
    document.getElementById('trainsCount').textContent = gameState.availableTrains;
    document.getElementById('carriagesCount').textContent = gameState.carriages;
    document.getElementById('interchangesCount').textContent = gameState.interchanges;
    document.getElementById('bridgesCount').textContent = gameState.bridges;

    document.getElementById('carriagesResource').style.display = gameState.carriages > 0 ? 'flex' : 'none';
    document.getElementById('interchangesResource').style.display = gameState.interchanges > 0 ? 'flex' : 'none';
    document.getElementById('bridgesResource').style.display = gameState.bridges > 0 ? 'flex' : 'none';
}
