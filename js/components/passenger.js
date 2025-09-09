import { CONFIG, STATION_TYPES } from '../config.js';
import { ctx } from '../utils.js';
import { findPath } from '../systems/pathfinding.js';

// Passenger Class
export class Passenger {
    constructor(station, destination) {
        this.currentStation = station;
        this.destination = destination;
        this.onTrain = null;
        this.path = null;
        this.pathIndex = 0;
        this.recalculatePath(); // Calculate initial path
    }

    /**
     * Calculates and stores the path to the destination.
     */
    recalculatePath() {
        this.path = findPath(this.currentStation, this.destination);
        this.pathIndex = this.path ? 1 : 0; // Start by targeting the second station in the path (index 1)
    }

    drawAt(x, y) {
        ctx.fillStyle = '#333';
        const size = CONFIG.PASSENGER_SIZE;
        
        switch(this.destination) {
            case STATION_TYPES.CIRCLE:
                ctx.beginPath();
                ctx.arc(x, y, size/2, 0, Math.PI * 2);
                ctx.fill();
                break;
            case STATION_TYPES.TRIANGLE:
                ctx.beginPath();
                ctx.moveTo(x, y - size/2);
                ctx.lineTo(x - size/2, y + size/2);
                ctx.lineTo(x + size/2, y + size/2);
                ctx.closePath();
                ctx.fill();
                break;
            case STATION_TYPES.SQUARE:
                ctx.fillRect(x - size/2, y - size/2, size, size);
                break;
            case STATION_TYPES.PENTAGON:
                this.drawPassengerPolygon(ctx, x, y, 5, size/2);
                break;
            case STATION_TYPES.DIAMOND:
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(Math.PI / 4);
                ctx.fillRect(-size/2, -size/2, size, size);
                ctx.restore();
                break;
            case STATION_TYPES.STAR:
                this.drawPassengerStar(ctx, x, y, size/2);
                break;
            case STATION_TYPES.CROSS:
                const thickness = size * 0.3;
                ctx.fillRect(x - size/2, y - thickness/2, size, thickness);
                ctx.fillRect(x - thickness/2, y - size/2, thickness, size);
                break;
        }
    }
    
    drawPassengerPolygon(ctx, x, y, sides, radius) {
        ctx.beginPath();
        for (let i = 0; i < sides; i++) {
            const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
            const px = x + radius * Math.cos(angle);
            const py = y + radius * Math.sin(angle);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
    }
    
    drawPassengerStar(ctx, x, y, radius) {
        const outerRadius = radius;
        const innerRadius = radius * 0.4;
        const spikes = 5;
        
        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const angle = (i * Math.PI) / spikes - Math.PI / 2;
            const r = i % 2 === 0 ? outerRadius : innerRadius;
            const px = x + r * Math.cos(angle);
            const py = y + r * Math.sin(angle);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
    }
}