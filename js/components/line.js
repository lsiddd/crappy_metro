import { CONFIG } from '../config.js';
import { ctx } from '../utils.js';
import { gameState } from '../state.js';
import { updateResourceDisplay } from '../systems/ui.js';

// Line Class
export class Line {
    constructor(color, index) {
        this.color = color;
        this.index = index;
        this.stations = [];
        this.trains = [];
        this.active = false;
        this.originalStart = null;
        this.originalEnd = null;
    }

    addStation(station, insertIndex = -1) {
        if (this.stations.length === 0) {
            this.originalStart = station;
        }

        const isClosingLoop = (
            this.stations.length >= 2 &&
            station === this.stations[0] &&
            (insertIndex === -1 || insertIndex === this.stations.length)
        );

        if (this.stations.includes(station) && !isClosingLoop) {
            return false;
        }
        
        if (insertIndex === 0) {
             this.stations.unshift(station);
             this.originalStart = station;
        } else if (insertIndex > 0 && insertIndex < this.stations.length) {
            this.stations.splice(insertIndex, 0, station);
        } else {
            this.stations.push(station);
            if (!isClosingLoop) {
                this.originalEnd = station;
            }
        }
        
        this.active = this.stations.length >= 2;
        this.animateStationConnection(station);
        return true;
    }

    removeEndStation(station) {
        if (this.stations.length < 2) return;

        const isLoop = this.stations.length > 2 && this.stations[0] === this.stations[this.stations.length - 1];
        const index = this.stations.indexOf(station);
        const lastIndex = this.stations.length - 1;

        if (isLoop) {
            if (station === this.originalStart && (index === 0 || index === lastIndex)) {
                this.stations.pop(); 
                this.originalEnd = this.stations[this.stations.length - 1];
            } else if (station === this.originalEnd) {
                 this.stations.pop();
                 this.stations.reverse();
                 this.originalStart = this.stations[0];
                 this.originalEnd = this.stations[this.stations.length - 1];
            }
        } else {
            if (index === 0) {
                this.stations.shift();
                this.originalStart = this.stations.length > 0 ? this.stations[0] : null;
            } else if (index === lastIndex) {
                this.stations.pop();
                this.originalEnd = this.stations.length > 0 ? this.stations[this.stations.length - 1] : null;
            }
        }

        if (this.stations.length < 2) {
            this.clearLine();
        } else {
            this.active = true;
        }
    }
    
    removeStation(station) {
        const indices = [];
        this.stations.forEach((s, i) => {
            if (s === station) indices.push(i);
        });

        if (indices.length === 0) return;

        const isLoop = this.stations.length > 2 && this.stations[0] === this.stations[this.stations.length - 1];
        const isEndpoint = !isLoop && (indices[0] === 0 || indices[0] === this.stations.length - 1);
        
        if (isEndpoint) {
            this.removeEndStation(station);
            return;
        }
        
        if (indices.length > 1) { 
            this.stations.pop();
            this.stations.splice(indices[0], 1);
            this.stations.push(this.stations[0]);
        } else {
            this.stations.splice(indices[0], 1);
        }

        this.active = this.stations.length >= 2;
        if (!this.active) {
            this.clearLine();
        }
    }
    
    clearLine() {
        let refundedBridges = 0;
        for (let i = 0; i < this.stations.length - 1; i++) {
            if (this.checkRiverCrossing(this.stations[i], this.stations[i+1])) {
                refundedBridges++;
            }
        }
        gameState.bridges += refundedBridges;

        this.trains.forEach(train => {
            const trainIndex = gameState.trains.indexOf(train);
            if (trainIndex > -1) gameState.trains.splice(trainIndex, 1);
            gameState.availableTrains++;
        });

        this.stations = [];
        this.trains = [];
        this.active = false;
        this.originalStart = null;
        this.originalEnd = null;
        updateResourceDisplay();
    }
    
    checkRiverCrossing(station1, station2) {
        if (!station1 || !station2) return false;
        for (const river of gameState.rivers) {
            if (this.lineIntersectsPolygon(
                station1.x, station1.y, 
                station2.x, station2.y, 
                river.points
            )) {
                return true;
            }
        }
        return false;
    }
    
    lineIntersectsPolygon(x1, y1, x2, y2, polygonPoints) {
        for (let i = 0; i < polygonPoints.length; i++) {
            const p1 = polygonPoints[i];
            const p2 = polygonPoints[(i + 1) % polygonPoints.length];
            
            if (this.lineIntersectsLine(x1, y1, x2, y2, p1.x, p1.y, p2.x, p2.y)) {
                return true;
            }
        }
        return false;
    }
    
    lineIntersectsLine(x1, y1, x2, y2, x3, y3, x4, y4) {
        const denom = (x1-x2)*(y3-y4) - (y1-y2)*(x3-x4);
        if (denom === 0) return false;
        
        const t = ((x1-x3)*(y3-y4) - (y1-y3)*(x3-x4)) / denom;
        const u = -((x1-x2)*(y1-y3) - (y1-y2)*(x1-x3)) / denom;
        
        return t > 0 && t < 1 && u > 0 && u < 1;
    }
    
    animateStationConnection(station) {
        if (station) {
            station.connectionAnimation = {
                startTime: Date.now(),
                duration: 300
            };
        }
    }
    
    findInsertionPoint(station) {
        if (this.stations.length < 2) return -1;
        
        let minDistance = Infinity;
        let insertIndex = -1;
        
        for (let i = 0; i < this.stations.length - 1; i++) {
            const s1 = this.stations[i];
            const s2 = this.stations[i + 1];
            const distance = this.distanceToLineSegment(station, s1, s2);
            
            if (distance < minDistance && distance < 50) {
                minDistance = distance;
                insertIndex = i + 1;
            }
        }
        
        return insertIndex;
    }

    distanceToLineSegment(point, lineStart, lineEnd) {
        const A = point.x - lineStart.x;
        const B = point.y - lineStart.y;
        const C = lineEnd.x - lineStart.x;
        const D = lineEnd.y - lineStart.y;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        if (lenSq !== 0) param = dot / lenSq;

        let xx, yy;
        if (param < 0) {
            xx = lineStart.x;
            yy = lineStart.y;
        } else if (param > 1) {
            xx = lineEnd.x;
            yy = lineEnd.y;
        } else {
            xx = lineStart.x + param * C;
            yy = lineStart.y + param * D;
        }

        const dx = point.x - xx;
        const dy = point.y - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }

    draw() {
        if (this.stations.length < 2) return;
        
        ctx.strokeStyle = this.color;
        ctx.lineWidth = CONFIG.LINE_WIDTH;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        for (let i = 0; i < this.stations.length - 1; i++) {
            const s1 = this.stations[i];
            const s2 = this.stations[i+1];
            
            const sharedLines = gameState.lines.filter(line => 
                line.active &&
                line.stations.includes(s1) && 
                line.stations.includes(s2) &&
                Math.abs(line.stations.indexOf(s1) - line.stations.indexOf(s2)) === 1
            );
            
            const lineIndex = sharedLines.findIndex(line => line.index === this.index);
            const offset = (lineIndex - (sharedLines.length - 1) / 2) * (CONFIG.LINE_WIDTH + 2);

            const dx = s2.x - s1.x;
            const dy = s2.y - s1.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            const nx = -dy / len;
            const ny = dx / len;

            const startX = s1.x + offset * nx;
            const startY = s1.y + offset * ny;
            const endX = s2.x + offset * nx;
            const endY = s2.y + offset * ny;

            const crossesRiver = this.checkRiverCrossing(s1, s2);
            
            if (crossesRiver) {
                ctx.setLineDash([8, 4]);
                ctx.lineWidth = CONFIG.LINE_WIDTH * 0.8;
            } else {
                ctx.setLineDash([]);
                ctx.lineWidth = CONFIG.LINE_WIDTH;
            }

            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
            
            ctx.setLineDash([]);
            ctx.lineWidth = CONFIG.LINE_WIDTH;
        }
    }
}