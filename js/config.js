// Game Configuration
export const CONFIG = {
    STATION_RADIUS: 15,
    PASSENGER_SIZE: 6,
    TRAIN_WIDTH: 25,
    TRAIN_HEIGHT: 15,
    LINE_WIDTH: 6,
    MAX_PASSENGERS_PER_STATION: 6,
    MAX_PASSENGERS_WITH_INTERCHANGE: 12,
    TRAIN_CAPACITY: 6,
    MAX_TRAINS_PER_LINE: 4,
    TRAIN_MAX_SPEED: 1.2,
    TRAIN_ACCELERATION: 0.002,
    PASSENGER_BOARD_TIME: 200,
    BASE_SPAWN_RATE: 2000,
    BASE_STATION_SPAWN_RATE: 15000,
    DIFFICULTY_SCALE_FACTOR: 0.8,
    OVERCROWD_TIME: 30000,
    WEEK_DURATION: 60000,
    LINE_COLORS: ['#e74c3c', '#3498db', '#f39c12', '#2ecc71', '#9b59b6', '#1abc9c', '#e67e22'],
    CITIES: {
        london: { bridges: 2, maxLines: 5 },
        paris: { bridges: 3, maxLines: 6 },
        newyork: { bridges: 2, maxLines: 7 },
        tokyo: { bridges: 4, maxLines: 6 }
    }
};

// Station Types
export const STATION_TYPES = {
    CIRCLE: 'circle',
    TRIANGLE: 'triangle',
    SQUARE: 'square',
    PENTAGON: 'pentagon',
    DIAMOND: 'diamond',
    STAR: 'star',
    CROSS: 'cross'
};