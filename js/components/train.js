import { CONFIG } from '../config.js';
import { ctx } from '../utils.js';
import { gameState } from '../state.js';

// Train Class
export class Train {
    constructor(line) {
        this.id = gameState.trainIdCounter++;
        this.line = line;
        this.passengers = [];
        this.capacity = CONFIG.TRAIN_CAPACITY;
        this.currentStationIndex = 0;
        this.nextStationIndex = 1;
        this.direction = 1;
        this.x = 0;
        this.y = 0;
        this.progress = 0;
        
        this.state = 'WAITING'; // WAITING, MOVING
        this.waitTimer = 0;
        
        this.speed = 0; 
        this.maxSpeed = CONFIG.TRAIN_MAX_SPEED;
        
        this.hasCarriage = false;
        this.isLoop = false;
        
        if (line.stations.length > 0) {
            this.x = line.stations[0].x;
            this.y = line.stations[0].y;
            this.processPassengers(line.stations[0]); 
        }
        
        this.checkLoopStatus();
    }
    
    checkLoopStatus() {
        if (this.line.stations.length >= 3) {
            this.isLoop = this.line.stations[0] === this.line.stations[this.line.stations.length - 1];
        } else {
            this.isLoop = false;
        }
    }

    get totalCapacity() {
        return this.capacity + (this.hasCarriage ? CONFIG.TRAIN_CAPACITY : 0);
    }

    update(deltaTime) {
        if (!this.line.active || this.line.stations.length < 2) return;

        if (this.state === 'WAITING') {
            this.waitTimer -= deltaTime;
            if (this.waitTimer <= 0) {
                this.state = 'MOVING';
                this.determineNextStation();
            }
            return;
        }
        
        this.checkLoopStatus();
        
        const currentStation = this.line.stations[this.currentStationIndex];
        const nextStation = this.line.stations[this.nextStationIndex];
        
        if (!currentStation || !nextStation) {
            this.state = 'WAITING';
            this.waitTimer = 100;
            return;
        }
        
        const dx = nextStation.x - currentStation.x;
        const dy = nextStation.y - currentStation.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance === 0) return;

        const accelDist = Math.min(distance * 0.4, 60);
        const decelStart = Math.max(distance - accelDist, distance * 0.6);
        const currentPos = this.progress * distance;

        if (currentPos < accelDist) {
            this.speed += CONFIG.TRAIN_ACCELERATION * deltaTime;
            if (this.speed > this.maxSpeed) this.speed = this.maxSpeed;
        } else if (currentPos > decelStart) {
            this.speed -= CONFIG.TRAIN_ACCELERATION * deltaTime;
            if (this.speed < 0.2 * this.maxSpeed) this.speed = 0.2 * this.maxSpeed;
        } else {
            this.speed = this.maxSpeed;
        }

        this.progress += (this.speed * gameState.speed * (deltaTime/16.67)) / distance;
        
        if (this.progress >= 1) {
            this.progress = 1;
            this.x = nextStation.x;
            this.y = nextStation.y;
            this.currentStationIndex = this.nextStationIndex;
            this.processPassengers(nextStation);
            this.speed = 0;
        } else {
            this.x = currentStation.x + dx * this.progress;
            this.y = currentStation.y + dy * this.progress;
        }
    }

    determineNextStation() {
        if (!this.line.stations[this.currentStationIndex]) {
             this.currentStationIndex = 0;
        }
        if (this.isLoop) {
            this.nextStationIndex = (this.currentStationIndex + 1) % (this.line.stations.length - 1);
        } else {
            if (this.currentStationIndex >= this.line.stations.length - 1) {
                this.direction = -1;
            } else if (this.currentStationIndex === 0) {
                this.direction = 1;
            }
            this.nextStationIndex = this.currentStationIndex + this.direction;
        }
        this.progress = 0;
    }

    processPassengers(station) {
        let passengersChanged = 0;
        
        this.passengers = this.passengers.filter(p => {
            if (p.destination === station.type) {
                passengersChanged++;
                gameState.score++;
                gameState.passengersDelivered++;
                station.deliveryAnimation = { startTime: Date.now(), duration: 500 };
                return false;
            }

            if (p.path && p.path.length > p.pathIndex && p.path[p.pathIndex] === station) {
                p.pathIndex++;

                if (p.pathIndex >= p.path.length) {
                     passengersChanged++;
                     gameState.score++;
                     gameState.passengersDelivered++;
                     station.deliveryAnimation = { startTime: Date.now(), duration: 500 };
                     return false;
                }

                const nextStopInPath = p.path[p.pathIndex];
                const upcomingStopsOnThisLine = this.getUpcomingStops(station, true);

                if (!upcomingStopsOnThisLine.includes(nextStopInPath)) {
                    passengersChanged++;
                    p.onTrain = null;
                    p.currentStation = station;
                    station.addPassenger(p);
                    return false;
                }
            }
            return true;
        });

        const availableSpace = this.totalCapacity - this.passengers.length;
        if (availableSpace > 0) {
            const upcomingStops = this.getUpcomingStops(station, true);
            const waitingPassengers = station.passengers.filter(p => {
                if (!p.path || p.pathIndex >= p.path.length) {
                    p.recalculatePath();
                    if (!p.path) return false;
                }
                const passengerTargetStation = p.path[p.pathIndex];
                return upcomingStops.includes(passengerTargetStation);
            });
            
            const toBoard = waitingPassengers.slice(0, availableSpace);
            toBoard.forEach(p => {
                passengersChanged++;
                station.removePassenger(p);
                this.passengers.push(p);
                p.onTrain = this;
                p.currentStation = null;
            });
        }
        
        this.state = 'WAITING';
        this.waitTimer = passengersChanged * CONFIG.PASSENGER_BOARD_TIME;
        if (this.waitTimer <= 0) {
            this.waitTimer = 300;
        }
    }

    getUpcomingStops(currentStation, singleDirectionOnly = false) {
        const upcoming = new Set();
        const lineStations = this.line.stations;
        const numStations = this.isLoop ? lineStations.length - 1 : lineStations.length;
        if (numStations <= 1) return [];

        let currentIndex = lineStations.indexOf(currentStation);
        if(currentIndex === -1) currentIndex = 0;

        let currentDirection = this.direction;
        if (!this.isLoop) {
            if (currentIndex === 0) currentDirection = 1;
            if (currentIndex >= lineStations.length - 1) currentDirection = -1;
        }

        if (this.isLoop) {
            for (let i = 1; i < numStations; i++) {
                const index = (currentIndex + i) % numStations;
                upcoming.add(lineStations[index]);
            }
        } else {
            if (currentDirection === 1) {
                for (let i = currentIndex + 1; i < lineStations.length; i++) upcoming.add(lineStations[i]);
            } else {
                for (let i = currentIndex - 1; i >= 0; i--) upcoming.add(lineStations[i]);
            }
            
            if (!singleDirectionOnly) {
                 if (currentDirection === 1) {
                    for (let i = lineStations.length - 2; i >= 0; i--) upcoming.add(lineStations[i]);
                 } else {
                    for (let i = 1; i < lineStations.length; i++) upcoming.add(lineStations[i]);
                 }
            }
        }
        
        return Array.from(upcoming);
    }
    
    reassignToLine(newLine) {
        if (this.line) {
            const index = this.line.trains.indexOf(this);
            if (index > -1) this.line.trains.splice(index, 1);
        }
        this.line = newLine;
        this.line.trains.push(this);
        this.currentStationIndex = 0;
        this.nextStationIndex = this.line.stations.length > 1 ? 1 : 0;
        this.direction = 1;
        this.progress = 0;
        this.state = 'WAITING';
        this.waitTimer = 500;
        if(this.line.stations.length > 0) {
            this.x = this.line.stations[0].x;
            this.y = this.line.stations[0].y;
        }
        this.checkLoopStatus();
    }

    draw() {
        ctx.fillStyle = this.line.color;
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        
        const width = CONFIG.TRAIN_WIDTH;
        const height = CONFIG.TRAIN_HEIGHT;
        
        const currentStation = this.line.stations[this.currentStationIndex];
        let nextStation = this.line.stations[this.nextStationIndex];
        if (!nextStation) nextStation = currentStation;
        
        let angle = 0;
        if (nextStation && currentStation && (nextStation !== currentStation)) {
            angle = Math.atan2(nextStation.y - currentStation.y, nextStation.x - currentStation.x);
        }

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(angle);

        ctx.fillRect(-width/2, -height/2, width, height);
        ctx.strokeRect(-width/2, -height/2, width, height);
        
        if (this.hasCarriage) {
            ctx.fillRect(-width/2 - width - 5, -height/2, width, height);
            ctx.strokeRect(-width/2 - width - 5, -height/2, width, height);
            
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-width/2, 0);
            ctx.lineTo(-width/2 - 5, 0);
            ctx.stroke();
        }
        
        if (this.passengers.length > 0) {
            const maxDots = Math.min(this.passengers.length, 4);
            for (let i = 0; i < maxDots; i++) {
                ctx.fillStyle = '#fff';
                const dotX = -width/4 + (i % 2) * width/4;
                const dotY = -height/4 + Math.floor(i/2) * height/4;
                ctx.beginPath();
                ctx.arc(dotX, dotY, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        ctx.restore();
    }
}