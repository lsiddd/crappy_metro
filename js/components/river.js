import { ctx } from '../utils.js';

// River Class
export class River {
    constructor(points) {
        this.points = points;
    }

    draw() {
        ctx.fillStyle = '#cae3e3'; // Softer, map-like water color
        
        ctx.beginPath();
        this.points.forEach((point, i) => {
            if (i === 0) ctx.moveTo(point.x, point.y);
            else ctx.lineTo(point.x, point.y);
        });
        ctx.closePath();
        ctx.fill();
    }

    contains(x, y) {
        // Ray-casting algorithm to check if a point is inside a polygon
        let inside = false;
        for (let i = 0, j = this.points.length - 1; i < this.points.length; j = i++) {
            const xi = this.points[i].x, yi = this.points[i].y;
            const xj = this.points[j].x, yj = this.points[j].y;

            const intersect = ((yi > y) !== (yj > y))
                && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) {
                inside = !inside;
            }
        }
        return inside;
    }
}