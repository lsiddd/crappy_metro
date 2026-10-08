import { CONFIG } from './config.js';

// Game State
export let gameState = {
    paused: false,
    speed: 1,
    score: 0,
    week: 1,
    day: 0,
    stations: [],
    lines: [],
    trains: [],
    passengers: [],
    selectedLine: 0,
    availableLines: 3,
    maxLines: 5,
    bridges: 2,
    carriages: 0,
    interchanges: 0,
    availableTrains: 0,
    gameOver: false,
    selectedCity: 'london',
    rivers: [],
    lastSpawnTime: 0,
    lastStationSpawnTime: 0,
    weekStartTime: Date.now(),
    stationIdCounter: 0,
    trainIdCounter: 0,
    passengersDelivered: 0,
    gameStartTime: Date.now(),
    weekElapsed: 0,
    playTime: 0,
    cheats: {
        endlessMode: false,
        freezeCalendar: false,
        turboTrains: false
    }
};

export function resetState() {
    const cityConfig = CONFIG.CITIES[gameState.selectedCity];
    gameState = {
        ...gameState,
        paused: false, speed: 1, score: 0, week: 1, day: 0, stations: [],
        lines: [], trains: [], passengers: [], selectedLine: 0, gameOver: false,
        lastSpawnTime: Date.now(), lastStationSpawnTime: Date.now(), weekStartTime: Date.now(),
        stationIdCounter: 0, trainIdCounter: 0, passengersDelivered: 0, gameStartTime: Date.now(),
        weekElapsed: 0, playTime: 0,
        cheats: { endlessMode: false, freezeCalendar: false, turboTrains: false },
        bridges: cityConfig.bridges,
        maxLines: cityConfig.maxLines,
        availableLines: 3,
        availableTrains: 3,
        carriages: 0,
        interchanges: 0,
    };
}

export function setGameState(newState) {
    Object.assign(gameState, newState);
}
