import { gameState } from '../state.js';

/**
 * Builds a graph representation of the metro network for pathfinding.
 * The graph is an adjacency list where keys are station IDs.
 * @returns {Map<number, Array<{station: Station, line: Line}>>} The constructed graph.
 */
function buildGraph() {
    const graph = new Map();
    // Initialize the graph with all stations as nodes
    gameState.stations.forEach(s => graph.set(s.id, []));

    // Add edges for each segment of each active line
    gameState.lines.forEach(line => {
        if (!line.active) return;
        for (let i = 0; i < line.stations.length - 1; i++) {
            const s1 = line.stations[i];
            const s2 = line.stations[i + 1];
            
            // For looped lines, the last station is the same as the first. Avoid adding a self-loop.
            if (s1 === s2) continue;

            // Add edges in both directions as trains travel both ways
            graph.get(s1.id).push({ station: s2, line });
            graph.get(s2.id).push({ station: s1, line });
        }
    });
    return graph;
}

/**
 * Finds the shortest path from a start station to any station of a given destination type using BFS.
 * "Shortest" is determined by the number of stations, which implicitly handles transfers.
 * @param {Station} startStation - The passenger's starting station.
 * @param {string} destinationType - The shape of the destination station.
 * @returns {Array<Station>|null} An array of station objects representing the path, or null if no path is found.
 */
export function findPath(startStation, destinationType) {
    const graph = buildGraph();
    const queue = [{ station: startStation, path: [startStation] }];
    const visited = new Set([startStation.id]);

    // If the starting station itself is a valid destination
    if (startStation.type === destinationType) {
        return [startStation];
    }

    while (queue.length > 0) {
        const { station: currentStation, path } = queue.shift();

        const neighbors = graph.get(currentStation.id) || [];
        for (const { station: neighborStation } of neighbors) {
            if (!visited.has(neighborStation.id)) {
                visited.add(neighborStation.id);
                const newPath = [...path, neighborStation];
                
                // Check if the neighbor is a destination
                if (neighborStation.type === destinationType) {
                    return newPath; // Path found
                }
                
                queue.push({ station: neighborStation, path: newPath });
            }
        }
    }

    return null; // No path found
}
