import { CONFIG, STATION_TYPES } from '../config.js';
import { gameState, resetState, setGameState } from '../state.js';
import { canvas } from '../utils.js';
import { Station } from '../components/station.js';
import { Passenger } from '../components/passenger.js';
import { Line } from '../components/line.js';
import { Train } from '../components/train.js';
import { River } from '../components/river.js';
import { updateUI, createLineSelector, showUpgradeChoices } from './ui.js';

// Game Functions
export function initGame() {
    resetState();

    for (let i = 0; i < gameState.maxLines; i++) {
        gameState.lines.push(new Line(CONFIG.LINE_COLORS[i], i));
    }

    createRivers();
    createInitialStations();
    
    updateUI();
    createLineSelector();
}

function createRivers() {
    gameState.rivers = [];
    const w = canvas.width, h = canvas.height;
    if (gameState.selectedCity === 'london') {
        gameState.rivers.push(new River([
            {x: 0, y: h*0.65}, {x: w*0.3, y: h*0.55}, {x: w*0.7, y: h*0.6}, {x: w, y: h*0.5},
            {x: w, y: h*0.6}, {x: w*0.7, y: h*0.7}, {x: w*0.3, y: h*0.65}, {x: 0, y: h*0.75}
        ]));
    }
}

function createInitialStations() {
    const types = [STATION_TYPES.CIRCLE, STATION_TYPES.TRIANGLE, STATION_TYPES.SQUARE];
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const spread = Math.min(canvas.width, canvas.height) * 0.2;
    const minDistance = 120;

    for (const type of types) {
        let x, y, tooClose, inRiver;
        let attempts = 0;
        const maxAttempts = 200;
        
        do {
            const angle = Math.random() * Math.PI * 2;
            const radius = spread * (0.5 + Math.random() * 0.5);
            x = centerX + Math.cos(angle) * radius;
            y = centerY + Math.sin(angle) * radius;

            tooClose = gameState.stations.some(s => Math.hypot(s.x - x, s.y - y) < minDistance);
            inRiver = gameState.rivers.some(river => river.contains(x, y));
            attempts++;
        } while ((tooClose || inRiver) && attempts < maxAttempts);

        if (attempts < maxAttempts) {
            gameState.stations.push(new Station(x, y, type));
        } else {
            console.warn(`Could not find a good initial spot for ${type}, placing near center.`);
            gameState.stations.push(new Station(centerX + (Math.random()-0.5)*50, centerY + (Math.random()-0.5)*50, type));
        }
    }
}

export function spawnPassenger() {
    if (gameState.stations.length < 2) return;
    const station = gameState.stations[Math.floor(Math.random() * gameState.stations.length)];
    
    const availableTypes = Object.values(STATION_TYPES).filter(type => {
        if (type === station.type) return false;
        return gameState.stations.some(s => s.type === type);
    });
    
    if (availableTypes.length > 0) {
        const destination = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        const passenger = new Passenger(station, destination);
        station.addPassenger(passenger);
        gameState.passengers.push(passenger);
    }
}

export function spawnStation() {
    const margin = 80;
    const minDistance = 120;
    let x, y, tooClose, inRiver;
    let attempts = 0;
    const maxAttempts = 500; // Increased attempts to prevent failure on crowded maps

    do {
        x = margin + Math.random() * (canvas.width - margin * 2);
        y = margin + Math.random() * (canvas.height - margin * 2);
        
        tooClose = gameState.stations.some(s => Math.hypot(s.x - x, s.y - y) < minDistance);
        inRiver = gameState.rivers.some(river => river.contains(x, y));
        
        attempts++;
    } while ((tooClose || inRiver) && attempts < maxAttempts);

    if (attempts >= maxAttempts) {
        console.warn("Could not find a valid position for a new station after many attempts.");
        return;
    }

    let type;
    const gameTime = Date.now() - gameState.gameStartTime;
    const minutesPlayed = gameTime / 60000;
    
    const basicTypes = [STATION_TYPES.CIRCLE, STATION_TYPES.TRIANGLE, STATION_TYPES.SQUARE];
    const specialTypes = [STATION_TYPES.PENTAGON, STATION_TYPES.DIAMOND, STATION_TYPES.STAR, STATION_TYPES.CROSS];
    
    if (minutesPlayed > 2 && Math.random() < 0.1) {
        const availableSpecialTypes = specialTypes.filter(sType => 
            !gameState.stations.some(station => station.type === sType)
        );
        
        if (availableSpecialTypes.length > 0) {
            type = availableSpecialTypes[Math.floor(Math.random() * availableSpecialTypes.length)];
        } else {
            type = basicTypes[Math.floor(Math.random() * basicTypes.length)];
        }
    } else {
        type = basicTypes[Math.floor(Math.random() * basicTypes.length)];
    }
    
    gameState.stations.push(new Station(x, y, type));
}

export function checkGameOver() {
    for (const station of gameState.stations) {
        if (station.overcrowdStartTime) {
            if (Date.now() - station.overcrowdStartTime > CONFIG.OVERCROWD_TIME) {
                endGame();
                return;
            }
        }
    }
}

function endGame() {
    setGameState({ gameOver: true, paused: true });
    const gameTime = Date.now() - gameState.gameStartTime;
    const days = Math.floor(gameTime / CONFIG.WEEK_DURATION * 7);
    const modal = document.getElementById('gameOverModal');
    const stats = modal.querySelector('.gameover-stats');
    stats.innerHTML = `
        <div>Passengers Transported: <strong>${gameState.passengersDelivered}</strong></div>
        <div>Days Survived: <strong>${days}</strong></div>
        <div>Final Score: <strong>${gameState.score}</strong></div>
    `;
    modal.classList.add('show');
}