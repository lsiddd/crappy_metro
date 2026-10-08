
import { CONFIG, STATION_TYPES } from '../config.js';
import { ctx } from '../utils.js';
import { gameState } from '../state.js';

// Station Class
export class Station {
    constructor(x, y, type) {
        this.id = gameState.stationIdCounter++;
        this.x = x;
        this.y = y;
        this.type = type;
        this.passengers = [];
        this.isInterchange = false;
        this.overcrowdStartTime = null;
    }

    get capacity() {
        return this.isInterchange ? CONFIG.MAX_PASSENGERS_WITH_INTERCHANGE : CONFIG.MAX_PASSENGERS_PER_STATION;
    }

    addPassenger(passenger) {
        const absoluteMax = gameState.cheats.endlessMode ? 1000 : 100;
        if (this.passengers.length < absoluteMax) {
            this.passengers.push(passenger);
            this.checkOvercrowd();
        }
    }

    removePassenger(passenger) {
        const index = this.passengers.indexOf(passenger);
        if (index > -1) {
            this.passengers.splice(index, 1);
        }
        this.checkOvercrowd();
    }

    checkOvercrowd() {
        if (this.passengers.length > this.capacity) {
            if (!this.overcrowdStartTime) {
                this.overcrowdStartTime = Date.now();
            }
        } else {
            this.overcrowdStartTime = null;
        }
    }

    draw() {
        ctx.save();
        // Draw station based on type
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 4;
        ctx.fillStyle = '#f4f1e9';
        
        const radius = CONFIG.STATION_RADIUS;
        
         // --- Overcrowd Animation ---
        if (this.overcrowdStartTime) {
            const elapsed = Date.now() - this.overcrowdStartTime;
            const progress = Math.min(elapsed / CONFIG.OVERCROWD_TIME, 1);

            // Pulsing glow
            ctx.shadowColor = 'rgba(211, 47, 47, 0.7)';
            ctx.shadowBlur = 10 + Math.sin(Date.now() / 150) * 5;

            // Background circle
            ctx.fillStyle = 'rgba(211, 47, 47, 0.2)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, radius + 8, 0, Math.PI * 2);
            ctx.fill();

            // Timer arc
            ctx.strokeStyle = gameState.cheats.endlessMode && progress >= 1 ? '#7b4ce2' : '#d32f2f';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(this.x, this.y, radius + 8, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = '#f4f1e9'; // Reset fill style for station shape
        }

        switch(this.type) {
            case STATION_TYPES.CIRCLE:
                ctx.beginPath();
                ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                break;
            case STATION_TYPES.TRIANGLE:
                ctx.beginPath();
                const h = radius * 1.7;
                ctx.moveTo(this.x, this.y - h * 0.6);
                ctx.lineTo(this.x - h * 0.5, this.y + h * 0.4);
                ctx.lineTo(this.x + h * 0.5, this.y + h * 0.4);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                break;
            case STATION_TYPES.SQUARE:
                const size = radius * 1.6;
                ctx.fillRect(this.x - size/2, this.y - size/2, size, size);
                ctx.strokeRect(this.x - size/2, this.y - size/2, size, size);
                break;
            case STATION_TYPES.PENTAGON:
                this.drawPolygon(ctx, 5, radius * 1.4);
                break;
            case STATION_TYPES.DIAMOND:
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(Math.PI / 4);
                const dSize = radius * 1.4;
                ctx.fillRect(-dSize/2, -dSize/2, dSize, dSize);
                ctx.strokeRect(-dSize/2, -dSize/2, dSize, dSize);
                ctx.restore();
                break;
            case STATION_TYPES.STAR:
                this.drawStar(ctx, radius * 1.5);
                break;
            case STATION_TYPES.CROSS:
                this.drawCross(ctx, radius * 1.4);
                break;
        }
        
        ctx.restore(); // Restore context to remove shadow for other drawings

        // Draw passengers INSIDE the station
        
        ctx.restore(); // Restore context to remove shadow for other drawings

        // Draw interchange indicator
        if (this.isInterchange) {
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.arc(this.x, this.y, radius + 8, 0, Math.PI * 2);
            ctx.stroke();
            
            // Upgrade animation
            if (this.animateUpgrade) {
                const elapsed = Date.now() - this.animateUpgrade.startTime;
                const progress = elapsed / this.animateUpgrade.duration;
                
                if (progress < 1) {
                    const pulse = 1 + 0.3 * Math.sin(progress * Math.PI * 4);
                    ctx.strokeStyle = '#4CAF50';
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, (radius + 15) * pulse, 0, Math.PI * 2);
                    ctx.stroke();
                } else {
                    delete this.animateUpgrade;
                }
            }
        }
        
        // Draw delivery animation
        if (this.deliveryAnimation) {
            const elapsed = Date.now() - this.deliveryAnimation.startTime;
            const progress = elapsed / this.deliveryAnimation.duration;
            
            if (progress < 1) {
                const scale = 1 + 0.5 * (1 - progress);
                const alpha = 1 - progress;
                ctx.globalAlpha = alpha;
                ctx.strokeStyle = '#4CAF50';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(this.x, this.y, radius * scale, 0, Math.PI * 2);
                ctx.stroke();
                ctx.globalAlpha = 1;
            } else {
                delete this.deliveryAnimation;
            }
        }
        
        // --- Draw passengers INSIDE the station ---
        const passengerArea = radius * 0.9;
        const cols = 3;
        const slotSize = CONFIG.PASSENGER_SIZE + 2;
        const startX = this.x - (cols / 2 - 0.5) * slotSize;
        const startY = this.y - passengerArea / 2 + CONFIG.PASSENGER_SIZE / 2;

        this.passengers.forEach((passenger, i) => {
            const row = Math.floor(i / cols);
            const col = i % cols;
            const px = startX + col * slotSize;
            const py = startY + row * slotSize;
            
            if (i < this.capacity) {
                passenger.drawAt(px, py);
            } else if (i === this.capacity) { // Show one extra passenger to indicate overflow
                passenger.drawAt(this.x, this.y + radius + 15);
            }
        });
    }
    
    drawPolygon(ctx, sides, radius) {
        ctx.beginPath();
        for (let i = 0; i < sides; i++) {
            const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
            const x = this.x + radius * Math.cos(angle);
            const y = this.y + radius * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
    
    drawStar(ctx, radius) {
        const outerRadius = radius;
        const innerRadius = radius * 0.4;
        const spikes = 5;
        
        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const angle = (i * Math.PI) / spikes - Math.PI / 2;
            const r = i % 2 === 0 ? outerRadius : innerRadius;
            const x = this.x + r * Math.cos(angle);
            const y = this.y + r * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
    
    drawCross(ctx, size) {
        const thickness = size * 0.3;
        ctx.fillRect(this.x - size/2, this.y - thickness/2, size, thickness);
        ctx.strokeRect(this.x - size/2, this.y - thickness/2, size, thickness);
        ctx.fillRect(this.x - thickness/2, this.y - size/2, thickness, size);
        ctx.strokeRect(this.x - thickness/2, this.y - size/2, thickness, size);
    }
}
