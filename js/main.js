import { CONFIG } from './config.js';
import { gameState, setGameState } from './state.js';
import { resizeCanvas, ctx } from './utils.js';
import { initGame, spawnPassenger, spawnStation, checkGameOver } from './systems/game.js';
import { updateUI, showUpgradeChoices } from './systems/ui.js';
import { initInput, previewLine } from './systems/input.js';

// Game Loop
let lastTime = 0;
function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    
    if (!gameState.gameOver) {
         if (!gameState.paused) {
            const elapsed = Date.now() - gameState.weekStartTime;
            setGameState({ day: Math.floor(elapsed / (CONFIG.WEEK_DURATION / 7)) % 7 });
            if (elapsed > CONFIG.WEEK_DURATION) {
                setGameState({ week: gameState.week + 1, weekStartTime: Date.now() });
                showUpgradeChoices();
            }
            // Progressive difficulty scaling
            const difficultyMultiplier = Math.pow(CONFIG.DIFFICULTY_SCALE_FACTOR, gameState.week - 1);
            const currentSpawnRate = CONFIG.BASE_SPAWN_RATE * difficultyMultiplier;
            const currentStationSpawnRate = CONFIG.BASE_STATION_SPAWN_RATE * difficultyMultiplier;
            
            if (Date.now() - gameState.lastSpawnTime > currentSpawnRate / gameState.speed) {
                spawnPassenger();
                setGameState({ lastSpawnTime: Date.now() });
            }
            if (Date.now() - gameState.lastStationSpawnTime > currentStationSpawnRate / gameState.speed) {
                spawnStation();
                setGameState({ lastStationSpawnTime: Date.now() });
            }
            gameState.trains.forEach(train => train.update(deltaTime));
            checkGameOver();
            updateUI();
        }

        // Render
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        gameState.rivers.forEach(river => river.draw());
        gameState.lines.forEach(line => line.draw());
        
        // Draw preview line
        if (previewLine) {
            ctx.save();
            ctx.strokeStyle = previewLine.color;
            ctx.lineWidth = CONFIG.LINE_WIDTH;
            ctx.globalAlpha = 0.6;
            ctx.setLineDash([10, 8]);
            ctx.lineCap = 'round';
            
            if (previewLine.isSegment) {
                // Draw preview for segment insertion
                ctx.beginPath();
                ctx.moveTo(previewLine.s1.x, previewLine.s1.y);
                ctx.lineTo(previewLine.target.x, previewLine.target.y);
                ctx.lineTo(previewLine.s2.x, previewLine.s2.y);
                ctx.stroke();
            } else {
                // Draw preview for line extension
                ctx.beginPath();
                ctx.moveTo(previewLine.start.x, previewLine.start.y);
                ctx.lineTo(previewLine.end.x, previewLine.end.y);
                ctx.stroke();
            }
            ctx.restore();
        }
        
        gameState.stations.forEach(station => station.draw());
        gameState.trains.forEach(train => train.draw());
        
        requestAnimationFrame(gameLoop);
    }
}

// Initial Setup
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
initInput();

// UI Listeners
document.getElementById('pauseBtn').addEventListener('click', () => {
    setGameState({ paused: !gameState.paused });
    document.getElementById('pauseBtn').textContent = gameState.paused ? '▶' : '⏸';
});
document.getElementById('speedBtn').addEventListener('click', () => {
    setGameState({ speed: gameState.speed === 1 ? 2.5 : 1 });
    document.getElementById('speedBtn').classList.toggle('active', gameState.speed !== 1);
    updateUI();
});
document.querySelectorAll('.city-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.city-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        setGameState({ selectedCity: btn.dataset.city });
    });
});
document.querySelector('.start-btn').addEventListener('click', () => {
    document.getElementById('startScreen').classList.add('hide');
    initGame();
    requestAnimationFrame(gameLoop);
});
document.querySelector('.restart-btn').addEventListener('click', () => {
    document.getElementById('gameOverModal').classList.remove('show');
    document.getElementById('startScreen').classList.remove('hide');
});