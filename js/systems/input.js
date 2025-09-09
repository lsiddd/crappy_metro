import { CONFIG } from '../config.js';
import { gameState, setGameState } from '../state.js';
import { getPointerPos, canvas } from '../utils.js';
import { updateResourceDisplay } from './ui.js';
import { Train } from '../components/train.js';

let isDrawingLine = false;
let isRemovingSegment = false;
let draggedSegment = null;
let currentPath = [];
let draggedTrainResource = false;
let draggedCarriage = false;
let hoveredStation = null;
let hoveredTrain = null;
let previewLine = null;

// Input Handling
export function initInput() {
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);

    document.getElementById('trainsResource').addEventListener('dragstart', (e) => {
        if (gameState.availableTrains > 0) {
            draggedTrainResource = true;
            e.dataTransfer.effectAllowed = 'move';
        } else {
            e.preventDefault();
        }
    });

    document.getElementById('carriagesResource').addEventListener('dragstart', (e) => {
        if (gameState.carriages > 0) {
            draggedCarriage = true;
            e.dataTransfer.effectAllowed = 'move';
        } else {
            e.preventDefault();
        }
    });

    canvas.addEventListener('dragover', (e) => e.preventDefault());
    canvas.addEventListener('drop', onDrop);
}

function onPointerDown(e) {
    if (gameState.gameOver) return;
    const pos = getPointerPos(e);
    const line = gameState.lines[gameState.selectedLine];

    const station = gameState.stations.find(s => Math.hypot(s.x - pos.x, s.y - pos.y) < CONFIG.STATION_RADIUS + 15);
    if (station) {
        if (line.stations.includes(station) && e.shiftKey) {
            line.removeStation(station);
            return;
        }

        const isAlreadyLoop = line.stations.length > 2 && line.stations[0] === line.stations[line.stations.length - 1];
        if (isAlreadyLoop && line.stations.includes(station)) {
            return;
        }

        isDrawingLine = true;
        if (line.stations.includes(station)) {
            const stationIndex = line.stations.indexOf(station);
            if (stationIndex === 0 || stationIndex === line.stations.length - 1) {
                currentPath = [station];
                isRemovingSegment = true;
            } else {
                isDrawingLine = false;
            }
        } else {
            currentPath = [station];
            isRemovingSegment = false;
        }
        return;
    }

    for (const line of gameState.lines) {
        if (!line.active) continue;
        for (let i = 0; i < line.stations.length - 1; i++) {
            const s1 = line.stations[i];
            const s2 = line.stations[i + 1];
            if (line.distanceToLineSegment(pos, s1, s2) < 20) {
                draggedSegment = { line, index: i };
                isDrawingLine = false;
                return;
            }
        }
    }
}


function onPointerMove(e) {
    const pos = getPointerPos(e);
    
    if (isDrawingLine && currentPath.length > 0) {
        const startStation = currentPath[0];
        if (isRemovingSegment) {
            const dist = Math.hypot(pos.x - startStation.x, pos.y - startStation.y);
            if (dist > CONFIG.STATION_RADIUS * 2.5) {
                isRemovingSegment = false;
            }
        }
        
        previewLine = isRemovingSegment ? null : {
            start: { x: startStation.x, y: startStation.y },
            end: pos,
            color: CONFIG.LINE_COLORS[gameState.selectedLine]
        };
    } 
    else if (draggedSegment) {
        const s1 = draggedSegment.line.stations[draggedSegment.index];
        const s2 = draggedSegment.line.stations[draggedSegment.index + 1];
        const station = gameState.stations.find(s => Math.hypot(s.x - pos.x, s.y - pos.y) < CONFIG.STATION_RADIUS + 15);
        
        previewLine = {
            isSegment: true, s1, s2,
            target: station || pos,
            color: draggedSegment.line.color
        };
    } else {
        previewLine = null;
    }
}

function onPointerUp(e) {
    const pos = getPointerPos(e);
    const line = gameState.lines[gameState.selectedLine];
    const targetStation = gameState.stations.find(s => 
        Math.hypot(s.x - pos.x, s.y - pos.y) < CONFIG.STATION_RADIUS + 15
    );

    // Finalize removing a line segment from an endpoint
    if (isRemovingSegment && currentPath.length > 0) {
        const startStation = currentPath[0];
        // If we didn't drag to a new station, it's a removal action
        if (!targetStation || targetStation === startStation) {
            const s1 = line.stations[0];
            const neighbor = startStation === s1 ? line.stations[1] : line.stations[line.stations.length - 2];
            
            line.removeEndStation(startStation);
            
            if (line.checkRiverCrossing(startStation, neighbor)) {
                gameState.bridges++;
                updateResourceDisplay();
            }
        }
    }
    // Finalize inserting a station into a line segment
    else if (draggedSegment && targetStation) {
        const { line, index } = draggedSegment;
        if (!line.stations.includes(targetStation)) {
            const s1 = line.stations[index];
            const s2 = line.stations[index + 1];

            const needsBridge1 = line.checkRiverCrossing(s1, targetStation);
            const needsBridge2 = line.checkRiverCrossing(targetStation, s2);
            const hadBridge = line.checkRiverCrossing(s1, s2);
            const bridgeCost = (needsBridge1 ? 1 : 0) + (needsBridge2 ? 1 : 0) - (hadBridge ? 1 : 0);

            if (gameState.bridges >= bridgeCost) {
                gameState.bridges -= bridgeCost;
                line.addStation(targetStation, index + 1);
                updateResourceDisplay();
            }
        }
    }
    // Finalize extending or creating a line
    else if (isDrawingLine && currentPath.length > 0 && targetStation) {
        const startStation = currentPath[0];

        if (targetStation !== startStation) {
            const stationsBefore = line.stations.length;
            const needsBridge = line.checkRiverCrossing(startStation, targetStation);

            if (needsBridge && gameState.bridges <= 0) {
                // Not enough bridges, abort.
            } else {
                let success = false;
                
                // Case 1: Line is empty. Create a new line.
                if (line.stations.length === 0) {
                    line.addStation(startStation);
                    success = line.addStation(targetStation);
                } 
                // Case 2: Start station is an endpoint. Extend from there.
                else if (line.stations[0] === startStation) {
                    success = line.addStation(targetStation, 0); // Add to beginning
                } 
                else if (line.stations[line.stations.length - 1] === startStation) {
                    success = line.addStation(targetStation); // Add to end
                }
                // Case 3: Target station is an endpoint. Connect the start station to it.
                else if (line.stations[0] === targetStation) {
                    success = line.addStation(startStation, 0); // Add to beginning
                }
                else if (line.stations[line.stations.length - 1] === targetStation) {
                    success = line.addStation(startStation); // Add to end
                }

                if (success) {
                    if (needsBridge) {
                        gameState.bridges--;
                    }

                    // If line was just created, add a train
                    if (stationsBefore < 2 && line.stations.length >= 2) {
                        if (gameState.availableTrains > 0 && line.trains.length === 0) {
                            setGameState({ availableTrains: gameState.availableTrains - 1 });
                            const newTrain = new Train(line);
                            gameState.trains.push(newTrain);
                            line.trains.push(newTrain);
                        }
                    }
                    updateResourceDisplay();
                }
            }
        }
    }
    
    // Reset state after any action
    isDrawingLine = false;
    isRemovingSegment = false;
    draggedSegment = null;
    currentPath = [];
    previewLine = null;
}

function onDrop(e) {
    e.preventDefault();
    const pos = getPointerPos(e);

    if (draggedTrainResource) {
        let targetLine = null;
        for (const line of gameState.lines) {
            if (!line.active) continue;
            for (let i = 0; i < line.stations.length - 1; i++) {
                if (line.distanceToLineSegment(pos, line.stations[i], line.stations[i+1]) < 20) {
                    targetLine = line;
                    break;
                }
            }
            if (targetLine) break;
        }

        if (targetLine && targetLine.trains.length < CONFIG.MAX_TRAINS_PER_LINE && gameState.availableTrains > 0) {
            setGameState({ availableTrains: gameState.availableTrains - 1 });
            const newTrain = new Train(targetLine);
            targetLine.trains.push(newTrain);
            gameState.trains.push(newTrain);
            updateResourceDisplay();
        }
        draggedTrainResource = false;
    }

    if (draggedCarriage) {
        const targetTrain = gameState.trains.find(t => 
            Math.hypot(t.x - pos.x, t.y - pos.y) < CONFIG.TRAIN_WIDTH
        );
        
        if (targetTrain && !targetTrain.hasCarriage && gameState.carriages > 0) {
            targetTrain.hasCarriage = true;
            setGameState({ carriages: gameState.carriages - 1 });
            updateResourceDisplay();
        }
        
        draggedCarriage = false;
    }
}

export { previewLine };