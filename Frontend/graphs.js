// GRAPH VISUALIZATION LOGIC

let nodes = [];
let links = [];
let nextNodeId = 1;
let selectedNode = null;
let selectedLink = null;

let isDirected = false;
let isWeighted = false;

// D3 Force Simulation
let simulation;
const width = 680;
const height = 480;

// Animator for traversals
class GraphAnimator {
    constructor() {
        this.frames = [];
        this.currentIdx = -1;
        this.isPlaying = false;
        this.timer = null;
        this.speed = 1000;
    }

    clear() {
        this.frames = [];
        this.currentIdx = -1;
        this.pause();
    }

    addFrame(visitedNodes, currentNode, visitedEdges, pathEdges, queueStack, dsType, explanation) {
        this.frames.push({
            visitedNodes: [...visitedNodes],
            currentNode: currentNode,
            visitedEdges: [...visitedEdges],
            pathEdges: [...pathEdges],
            queueStack: [...queueStack],
            dsType: dsType,
            explanation: explanation
        });
    }

    play() {
        if (this.frames.length === 0) return;
        this.isPlaying = true;
        document.getElementById("playBtn").innerText = "Pause";
        document.getElementById("playBtn").classList.add("active-btn");
        this.run();
    }

    pause() {
        this.isPlaying = false;
        document.getElementById("playBtn").innerText = "Resume";
        document.getElementById("playBtn").classList.remove("active-btn");
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }

    run() {
        if (!this.isPlaying) return;
        if (this.currentIdx >= this.frames.length - 1) {
            this.pause();
            document.getElementById("playBtn").innerText = "Play";
            return;
        }
        this.currentIdx++;
        this.renderFrame(this.frames[this.currentIdx]);

        this.timer = setTimeout(() => {
            this.run();
        }, this.speed);
    }

    stepForward() {
        this.pause();
        if (this.currentIdx < this.frames.length - 1) {
            this.currentIdx++;
            this.renderFrame(this.frames[this.currentIdx]);
        }
    }

    stepBackward() {
        this.pause();
        if (this.currentIdx > 0) {
            this.currentIdx--;
            this.renderFrame(this.frames[this.currentIdx]);
        }
    }

    renderFrame(frame) {
        if (!frame) return;
        
        // Render helper ds stack/queue content
        renderDSContainer(frame.queueStack, frame.dsType);
        
        // Draw the current state by highlighting nodes and links
        const svg = d3.select("#graphSvg");
        
        svg.selectAll("circle").each(function(d) {
            const circle = d3.select(this);
            circle.attr("class", "graph-node");
            if (d.id === frame.currentNode) {
                circle.classed("current", true);
            } else if (frame.visitedNodes.includes(d.id)) {
                circle.classed("visited", true);
            } else if (frame.queueStack.includes(d.id)) {
                circle.classed("in-queue", true);
            } else {
                circle.classed("default", true);
            }
        });

        svg.selectAll(".graph-edge").each(function(d) {
            const edge = d3.select(this);
            edge.attr("class", "graph-edge");
            
            const edgeKey = `${d.source.id}-${d.target.id}`;
            const revEdgeKey = `${d.target.id}-${d.source.id}`;
            
            const isPath = frame.pathEdges.some(e => e === edgeKey || e === revEdgeKey);
            const isVisited = frame.visitedEdges.some(e => e === edgeKey || e === revEdgeKey);

            if (isPath) {
                edge.classed("path", true);
            } else if (isVisited) {
                edge.classed("visited", true);
            } else {
                edge.classed("default", true);
            }
        });

        document.getElementById("explanation").innerText = frame.explanation;
    }
}

const animator = new GraphAnimator();

// Initialize canvas on load
document.addEventListener("DOMContentLoaded", () => {
    setupSvg();
    generateSampleGraph();
    changeSpeed(1000);
});

// Setup arrow markers and layout click events
function setupSvg() {
    const svg = d3.select("#graphSvg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .on("dblclick", (event) => {
            if (event.target === svg.node()) {
                const coords = d3.pointer(event);
                addNodeAt(coords[0], coords[1]);
            }
        })
        .on("click", () => {
            selectedNode = null;
            selectedLink = null;
            animator.clear();
            updateGraphVisuals();
        });

    svg.append("defs").append("marker")
        .attr("id", "arrow")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 22) // Node radius (20px) + offset
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
      .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", "#94a3b8");

    simulation = d3.forceSimulation(nodes)
        .force("charge", d3.forceManyBody().strength(-200))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("link", d3.forceLink(links).id(d => d.id).distance(120))
        .force("x", d3.forceX(width / 2).strength(0.08))
        .force("y", d3.forceY(height / 2).strength(0.08));

    simulation.on("tick", updateTick);
}

// ----------------------------------------
// GRAPH OPERATIONS
// ----------------------------------------

function addNodeAt(x, y) {
    const id = getNextNodeLabel();
    nodes.push({ id: id, x: x, y: y });
    animator.clear();
    restartSimulation();
    updateGraphVisuals();
    document.getElementById("explanation").innerText = `Added node "${id}".`;
}

function getNextNodeLabel() {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const existing = nodes.map(n => n.id);
    for (let i = 0; i < alphabet.length; i++) {
        if (!existing.includes(alphabet[i])) return alphabet[i];
    }
    let idx = 1;
    while (true) {
        for (let i = 0; i < alphabet.length; i++) {
            let id = alphabet[i] + idx;
            if (!existing.includes(id)) return id;
        }
        idx++;
    }
}

function addEdgeManually() {
    const src = document.getElementById("edgeSource").value;
    const dst = document.getElementById("edgeTarget").value;
    const weight = parseInt(document.getElementById("edgeWeightInput").value);

    if (!src || !dst) return;
    if (src === dst) {
        document.getElementById("explanation").innerText = "Self-loops are not supported.";
        return;
    }

    addEdge(src, dst, isNaN(weight) ? 1 : weight);
    updateGraphVisuals();
}

function addEdge(sourceId, targetId, weight) {
    animator.clear();
    // Check if duplicate link exists
    const existing = links.find(l => 
        (l.source.id === sourceId && l.target.id === targetId) ||
        (!isDirected && l.source.id === targetId && l.target.id === sourceId)
    );

    if (existing) {
        existing.weight = weight;
        document.getElementById("explanation").innerText = `Updated edge weight between "${sourceId}" and "${targetId}" to ${weight}.`;
    } else {
        links.push({ source: sourceId, target: targetId, weight: weight });
        document.getElementById("explanation").innerText = `Added edge: "${sourceId}" → "${targetId}" with weight ${weight}.`;
    }
    
    restartSimulation();
}

function removeSelectedElement() {
    animator.clear();
    if (selectedNode) {
        const id = selectedNode.id;
        nodes = nodes.filter(n => n.id !== id);
        links = links.filter(l => l.source.id !== id && l.target.id !== id);
        selectedNode = null;
        document.getElementById("explanation").innerText = `Removed node "${id}".`;
        restartSimulation();
        updateGraphVisuals();
    } else if (selectedLink) {
        links = links.filter(l => l !== selectedLink);
        selectedLink = null;
        document.getElementById("explanation").innerText = "Removed selected edge.";
        restartSimulation();
        updateGraphVisuals();
    } else {
        document.getElementById("explanation").innerText = "Nothing selected to remove.";
    }
}

function clearGraph() {
    nodes = [];
    links = [];
    selectedNode = null;
    selectedLink = null;
    animator.clear();
    restartSimulation();
    updateGraphVisuals();
    document.getElementById("explanation").innerText = "Graph cleared. Double click the canvas to add nodes.";
}

function generateSampleGraph() {
    animator.clear();
    nodes = [
        { id: "A", x: 150, y: 150 },
        { id: "B", x: 300, y: 100 },
        { id: "C", x: 250, y: 250 },
        { id: "D", x: 450, y: 150 },
        { id: "E", x: 350, y: 320 }
    ];

    links = [
        { source: "A", target: "B", weight: 4 },
        { source: "A", target: "C", weight: 2 },
        { source: "B", target: "C", weight: 1 },
        { source: "B", target: "D", weight: 5 },
        { source: "C", target: "D", weight: 8 },
        { source: "C", target: "E", weight: 10 },
        { source: "D", target: "E", weight: 2 }
    ];

    selectedNode = null;
    selectedLink = null;
    restartSimulation();
    updateGraphVisuals();
    document.getElementById("explanation").innerText = "Generated sample graph. Drag nodes to reposition.";
}

// ----------------------------------------
// CONFIG TOGGLES
// ----------------------------------------
function toggleDirected(val) {
    isDirected = (val === "directed");
    animator.clear();
    restartSimulation();
    updateGraphVisuals();
    document.getElementById("explanation").innerText = `Switched topology to ${val}.`;
}

function toggleWeighted(val) {
    isWeighted = (val === "weighted");
    animator.clear();
    updateGraphVisuals();
    document.getElementById("explanation").innerText = `Switched edge labels to ${val}.`;
}

// ----------------------------------------
// SIMULATION UPDATE / RENDERING
// ----------------------------------------

function restartSimulation() {
    simulation.nodes(nodes);
    simulation.force("link").links(links);
    simulation.alpha(1).restart();
}

function updateTick() {
    const svg = d3.select("#graphSvg");

    // Keep nodes inside bounds
    nodes.forEach(d => {
        d.x = Math.max(25, Math.min(width - 25, d.x));
        d.y = Math.max(25, Math.min(height - 25, d.y));
    });

    svg.selectAll(".graph-edge")
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

    svg.selectAll(".graph-edge-text")
        .attr("x", d => (d.source.x + d.target.x) / 2)
        .attr("y", d => (d.source.y + d.target.y) / 2 - 5);

    svg.selectAll(".node-g")
        .attr("transform", d => `translate(${d.x},${d.y})`);
}

function updateGraphVisuals() {
    const svg = d3.select("#graphSvg");
    
    // 1. Render links (edges)
    const edgeSelection = svg.selectAll(".graph-edge")
        .data(links, d => `${d.source.id}-${d.target.id}`);

    edgeSelection.exit().remove();

    const edgeEnter = edgeSelection.enter()
        .append("line")
        .attr("class", "graph-edge default")
        .on("click", (event, d) => {
            event.stopPropagation();
            selectedLink = d;
            selectedNode = null;
            animator.clear();
            updateGraphVisuals();
            document.getElementById("explanation").innerText = `Selected edge: "${d.source.id}" to "${d.target.id}".`;
        });

    const combinedEdges = edgeEnter.merge(edgeSelection);
    
    // Apply directed markers
    if (isDirected) {
        combinedEdges.attr("marker-end", "url(#arrow)");
    } else {
        combinedEdges.attr("marker-end", null);
    }

    // Apply selection highlighting
    combinedEdges.classed("selected", d => d === selectedLink);

    // 2. Edge weight labels
    const weightSelection = svg.selectAll(".graph-edge-text")
        .data(links, d => `${d.source.id}-${d.target.id}`);

    weightSelection.exit().remove();

    if (isWeighted) {
        weightSelection.enter()
            .append("text")
            .attr("class", "graph-edge-text")
            .merge(weightSelection)
            .text(d => d.weight);
    } else {
        svg.selectAll(".graph-edge-text").remove();
    }

    // 3. Render nodes
    const nodeSelection = svg.selectAll(".node-g")
        .data(nodes, d => d.id);

    nodeSelection.exit().remove();

    const nodeEnter = nodeSelection.enter()
        .append("g")
        .attr("class", "node-g")
        .call(drag(simulation));

    nodeEnter.append("circle")
        .attr("r", 20)
        .attr("class", "graph-node default")
        .on("click", (event, d) => {
            event.stopPropagation();
            
            // Check if we are selecting a second node to connect edge
            if (selectedNode && selectedNode !== d) {
                addEdge(selectedNode.id, d.id, 1);
                selectedNode = null;
            } else {
                selectedNode = d;
                selectedLink = null;
                document.getElementById("explanation").innerText = `Selected node "${d.id}". Click another node to connect them.`;
            }
            animator.clear();
            updateGraphVisuals();
        });

    nodeEnter.append("text")
        .attr("class", "graph-node-text")
        .text(d => d.id);

    // Highlight selected node
    svg.selectAll("circle")
        .classed("selected", d => d === selectedNode);

    // Update form selects on left panel
    updateSelectDropdowns();

    // Redraw matrix/list panels
    updateAdjacencyList();
    updateAdjacencyMatrix();
}

function drag(simulation) {
    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
}

// ----------------------------------------
// PANEL DATA WRITERS
// ----------------------------------------

function updateSelectDropdowns() {
    const list = nodes.map(n => n.id).sort();
    
    populateSelect("edgeSource", list);
    populateSelect("edgeTarget", list);
    populateSelect("algoStartNode", list);
    populateSelect("algoEndNode", list);
}

function populateSelect(elemId, items) {
    const el = document.getElementById(elemId);
    const currVal = el.value;
    el.innerHTML = "";
    
    items.forEach(item => {
        const option = document.createElement("option");
        option.value = item;
        option.innerText = item;
        el.appendChild(option);
    });

    if (items.includes(currVal)) {
        el.value = currVal;
    }
}

function updateAdjacencyList() {
    const adjContainer = document.getElementById("adjList");
    if (nodes.length === 0) {
        adjContainer.innerText = "Empty graph.";
        return;
    }

    const adj = getAdjacencyStructures();
    let text = "";
    
    nodes.map(n => n.id).sort().forEach(id => {
        const neighbors = adj[id] || [];
        const edgesStr = neighbors.map(n => `${n.node}${isWeighted ? `(${n.weight})` : ""}`).join(", ");
        text += `${id} → [ ${edgesStr || "none"} ]\n`;
    });

    adjContainer.innerText = text;
}

function updateAdjacencyMatrix() {
    const matrixContainer = document.getElementById("matrixTable");
    matrixContainer.innerHTML = "";

    if (nodes.length === 0) {
        matrixContainer.innerHTML = "<tbody><tr><td>-</td></tr></tbody>";
        return;
    }

    const adj = getAdjacencyStructures();
    const sortedNodeIds = nodes.map(n => n.id).sort();

    // 1. Header row
    const tbody = document.createElement("tbody");
    const headRow = document.createElement("tr");
    headRow.appendChild(document.createElement("th")); // blank top-left corner
    
    sortedNodeIds.forEach(id => {
        const th = document.createElement("th");
        th.innerText = id;
        headRow.appendChild(th);
    });
    tbody.appendChild(headRow);

    // 2. Data rows
    sortedNodeIds.forEach(rowId => {
        const row = document.createElement("tr");
        const headerCell = document.createElement("td");
        headerCell.style.fontWeight = "bold";
        headerCell.style.background = "#0f172a";
        headerCell.innerText = rowId;
        row.appendChild(headerCell);

        sortedNodeIds.forEach(colId => {
            const cell = document.createElement("td");
            
            // Check edge
            const neighbors = adj[rowId] || [];
            const edge = neighbors.find(n => n.node === colId);
            
            if (edge) {
                cell.innerText = isWeighted ? edge.weight : 1;
                cell.style.color = "#10b981";
                cell.style.fontWeight = "bold";
            } else {
                cell.innerText = "0";
            }

            row.appendChild(cell);
        });
        tbody.appendChild(row);
    });

    matrixContainer.appendChild(tbody);
}

// Convert D3 structures to standard adjacency map
function getAdjacencyStructures() {
    const adj = {};
    nodes.forEach(n => { adj[n.id] = []; });
    
    links.forEach(l => {
        // links hold references to D3 node objects, so fetch their ids
        const s = typeof l.source === 'object' ? l.source.id : l.source;
        const t = typeof l.target === 'object' ? l.target.id : l.target;
        const w = l.weight;

        if (adj[s]) adj[s].push({ node: t, weight: w });
        if (!isDirected && adj[t]) {
            adj[t].push({ node: s, weight: w });
        }
    });

    return adj;
}

// Render dynamic elements for queue/stack display
function renderDSContainer(items, type) {
    document.getElementById("dsTitle").innerText = `${type}:`;
    const container = document.getElementById("graph-ds-content");
    container.innerHTML = "";

    items.forEach(val => {
        const div = document.createElement("div");
        div.className = "graph-ds-item";
        div.innerText = val;
        container.appendChild(div);
    });

    if (items.length === 0) {
        container.innerHTML = `<span style="color:#64748b; font-size:12px; font-style:italic;">Empty ${type.toLowerCase()}</span>`;
    }
}

// ----------------------------------------
// ALGORITHM RUNNERS / TRAVERSALS
// ----------------------------------------

function runBFS() {
    animator.clear();
    const start = document.getElementById("algoStartNode").value;
    if (!start) return;

    const adj = getAdjacencyStructures();
    const visited = new Set();
    const queue = [start];
    
    visited.add(start);
    animator.addFrame([], start, [], [], [...queue], "Queue", `Start BFS traversal from node "${start}". Enqueue start node.`);

    const visitedList = [];
    const traversedEdges = [];

    while (queue.length > 0) {
        const curr = queue.shift();
        visitedList.push(curr);
        
        animator.addFrame(visitedList, curr, traversedEdges, [], [...queue], "Queue", `Visit node "${curr}". Dequeue from front.`);

        // Sort neighbors alphabetically for predictable traversal animation
        const neighbors = (adj[curr] || []).map(n => n.node).sort();
        for (const n of neighbors) {
            if (!visited.has(n)) {
                visited.add(n);
                queue.push(n);
                traversedEdges.push(`${curr}-${n}`);
                
                animator.addFrame(visitedList, curr, traversedEdges, [], [...queue], "Queue", `Explore neighbor "${n}". Not visited. Mark visited and enqueue.`);
            }
        }
    }

    animator.addFrame(visitedList, null, traversedEdges, [], [], "Queue", "BFS traversal completed successfully.");
    animator.play();
}

function runDFS() {
    animator.clear();
    const start = document.getElementById("algoStartNode").value;
    if (!start) return;

    const adj = getAdjacencyStructures();
    const visited = new Set();
    const stack = [start];
    const visitedList = [];
    const traversedEdges = [];

    animator.addFrame([], null, [], [], [...stack], "Stack", `Start DFS traversal from node "${start}". Push start node.`);

    while (stack.length > 0) {
        const curr = stack.pop();
        
        if (visited.has(curr)) {
            animator.addFrame(visitedList, curr, traversedEdges, [], [...stack], "Stack", `Node "${curr}" is already visited. Pop and discard.`);
            continue;
        }

        visited.add(curr);
        visitedList.push(curr);

        animator.addFrame(visitedList, curr, traversedEdges, [], [...stack], "Stack", `Visit node "${curr}". Pop from top of stack.`);

        // Neighbors sorted recursively (push reverse order so they process alphabetical)
        const neighbors = (adj[curr] || []).map(n => n.node).sort().reverse();
        for (const n of neighbors) {
            if (!visited.has(n)) {
                stack.push(n);
                traversedEdges.push(`${curr}-${n}`);
                animator.addFrame(visitedList, curr, traversedEdges, [], [...stack], "Stack", `Explore neighbor "${n}". Push to stack.`);
            }
        }
    }

    animator.addFrame(visitedList, null, traversedEdges, [], [], "Stack", "DFS traversal completed successfully.");
    animator.play();
}

function runDijkstra() {
    animator.clear();
    const start = document.getElementById("algoStartNode").value;
    const end = document.getElementById("algoEndNode").value;

    if (!start || !end) return;

    const adj = getAdjacencyStructures();
    
    // Initialize distances
    const dist = {};
    const prev = {};
    const queue = []; // custom list of nodes

    nodes.forEach(n => {
        dist[n.id] = Infinity;
        prev[n.id] = null;
        queue.push(n.id);
    });

    dist[start] = 0;
    animator.addFrame([], start, [], [], queue.map(q => `${q}:${dist[q] === Infinity ? '∞' : dist[q]}`), "Min-Dist", `Initialize Dijkstra distances. Dist[${start}] = 0, all others = ∞.`);

    const visitedList = [];
    const traversedEdges = [];

    while (queue.length > 0) {
        // Find node with min distance in queue
        queue.sort((a, b) => dist[a] - dist[b]);
        const curr = queue.shift();

        if (dist[curr] === Infinity) {
            animator.addFrame(visitedList, null, traversedEdges, [], [], "Min-Dist", `Remaining nodes are unreachable. Terminating.`);
            break;
        }

        visitedList.push(curr);
        animator.addFrame(visitedList, curr, traversedEdges, [], queue.map(q => `${q}:${dist[q]}`), "Min-Dist", `Select node "${curr}" with minimum distance ${dist[curr]}.`);

        if (curr === end) {
            animator.addFrame(visitedList, curr, traversedEdges, [], [], "Min-Dist", `Reached target node "${end}"! Trace back path.`);
            break;
        }

        const neighbors = adj[curr] || [];
        for (const edge of neighbors) {
            const n = edge.node;
            if (queue.includes(n)) {
                const alt = dist[curr] + edge.weight;
                animator.addFrame(visitedList, curr, traversedEdges, [], queue.map(q => `${q}:${dist[q]}`), "Min-Dist", `Relax edge to "${n}". Calculate: current dist (${dist[curr]}) + edge weight (${edge.weight}) = ${alt}.`);
                
                if (alt < dist[n]) {
                    dist[n] = alt;
                    prev[n] = curr;
                    traversedEdges.push(`${curr}-${n}`);
                    animator.addFrame(visitedList, curr, traversedEdges, [], queue.map(q => `${q}:${dist[q]}`), "Min-Dist", `Found shorter path to "${n}". Update Dist[${n}] = ${alt}, Prev[${n}] = ${curr}.`);
                }
            }
        }
    }

    // Reconstruct path
    const pathNodes = [];
    const pathEdges = [];
    let curr = end;
    
    if (prev[curr] !== null || curr === start) {
        while (curr !== null) {
            pathNodes.unshift(curr);
            const parent = prev[curr];
            if (parent) {
                pathEdges.push(`${parent}-${curr}`);
            }
            curr = parent;
        }
    }

    if (pathNodes[0] === start) {
        animator.addFrame(pathNodes, null, [], pathEdges, [], "Path", `Shortest path found: ${pathNodes.join(" → ")}. Total distance: ${dist[end]}.`);
    } else {
        animator.addFrame([], null, [], [], [], "Path", `No path exists between "${start}" and "${end}".`);
    }

    animator.play();
}

function runPrim() {
    animator.clear();
    const start = document.getElementById("algoStartNode").value;
    if (!start) return;

    if (isDirected) {
        document.getElementById("explanation").innerText = "Prim's MST requires an Undirected graph.";
        return;
    }

    const adj = getAdjacencyStructures();
    const mstNodes = [start];
    const mstEdges = [];
    const unvisited = nodes.map(n => n.id).filter(id => id !== start);

    animator.addFrame(mstNodes, start, [], [], [], "MST", `Starting Prim's MST from node "${start}".`);

    while (unvisited.length > 0) {
        let minWeight = Infinity;
        let bestEdge = null;

        // Inspect all edges spanning from MST nodes to unvisited nodes
        for (const u of mstNodes) {
            const neighbors = adj[u] || [];
            for (const edge of neighbors) {
                const v = edge.node;
                if (unvisited.includes(v)) {
                    // Visual step: examine candidates
                    if (edge.weight < minWeight) {
                        minWeight = edge.weight;
                        bestEdge = { source: u, target: v, weight: edge.weight };
                    }
                }
            }
        }

        if (bestEdge) {
            mstNodes.push(bestEdge.target);
            unvisited.splice(unvisited.indexOf(bestEdge.target), 1);
            mstEdges.push(`${bestEdge.source}-${bestEdge.target}`);
            animator.addFrame(mstNodes, bestEdge.target, [], mstEdges, [], "MST", `Added minimum spanning edge: "${bestEdge.source}"-${bestEdge.target} (weight ${bestEdge.weight}) to MST.`);
        } else {
            animator.addFrame(mstNodes, null, [], mstEdges, [], "MST", "Remaining nodes are disconnected. Prim's MST completed.");
            break;
        }
    }

    animator.addFrame(mstNodes, null, [], mstEdges, [], "MST", "Prim's Minimum Spanning Tree visual completes.");
    animator.play();
}

function runKruskal() {
    animator.clear();
    if (isDirected) {
        document.getElementById("explanation").innerText = "Kruskal's MST requires an Undirected graph.";
        return;
    }

    // Sort edges by weight
    const sortedEdges = links.map(l => ({
        source: typeof l.source === 'object' ? l.source.id : l.source,
        target: typeof l.target === 'object' ? l.target.id : l.target,
        weight: l.weight
    })).sort((a, b) => a.weight - b.weight);

    // Union Find structure
    const parent = {};
    nodes.forEach(n => { parent[n.id] = n.id; });

    function find(i) {
        if (parent[i] === i) return i;
        return find(parent[i]);
    }

    function union(i, j) {
        const rootI = find(i);
        const rootJ = find(j);
        parent[rootI] = rootJ;
    }

    const mstEdges = [];
    const mstNodes = new Set();

    animator.addFrame([], null, [], [], sortedEdges.map(e => `${e.source}-${e.target}:${e.weight}`), "Sorted Edges", "Initialize Kruskal. Sort edges by weight.");

    for (const edge of sortedEdges) {
        const u = edge.source;
        const v = edge.target;
        
        const rootU = find(u);
        const rootV = find(v);

        const edgeKey = `${u}-${v}`;
        animator.addFrame([...mstNodes], null, [edgeKey], mstEdges, sortedEdges.map(e => `${e.source}-${e.target}:${e.weight}`), "Sorted Edges", `Inspect edge "${u}"-"${v}" (weight ${edge.weight}). Roots: ${u} is ${rootU}, ${v} is ${rootV}.`);

        if (rootU !== rootV) {
            union(u, v);
            mstNodes.add(u);
            mstNodes.add(v);
            mstEdges.push(edgeKey);
            animator.addFrame([...mstNodes], null, [], mstEdges, sortedEdges.map(e => `${e.source}-${e.target}:${e.weight}`), "Sorted Edges", `Roots differ (no cycle). Add edge "${u}"-"${v}" to Kruskal MST.`);
        } else {
            animator.addFrame([...mstNodes], null, [edgeKey], mstEdges, sortedEdges.map(e => `${e.source}-${e.target}:${e.weight}`), "Sorted Edges", `Roots match! Edge "${u}"-"${v}" forms a cycle, so we discard it.`);
        }
    }

    animator.addFrame([...mstNodes], null, [], mstEdges, [], "Sorted Edges", "Kruskal's MST algorithm completed successfully.");
    animator.play();
}

function runTopSort() {
    animator.clear();
    if (!isDirected) {
        document.getElementById("explanation").innerText = "Topological Sort requires a Directed graph.";
        return;
    }

    const adj = getAdjacencyStructures();
    
    // Kahn's algorithm
    const inDegree = {};
    nodes.forEach(n => { inDegree[n.id] = 0; });

    links.forEach(l => {
        const t = typeof l.target === 'object' ? l.target.id : l.target;
        inDegree[t] = (inDegree[t] || 0) + 1;
    });

    const queue = [];
    nodes.forEach(n => {
        if (inDegree[n.id] === 0) {
            queue.push(n.id);
        }
    });

    animator.addFrame([], null, [], [], [...queue], "Queue (in-deg 0)", `Initialize Topological Sort. Compute in-degrees: [ ${Object.entries(inDegree).map(e => `${e[0]}:${e[1]}`).join(", ")} ]. Enqueue nodes with in-degree 0.`);

    const order = [];
    const traversedEdges = [];

    while (queue.length > 0) {
        const curr = queue.shift();
        order.push(curr);

        animator.addFrame(order, curr, traversedEdges, [], [...queue], "Queue (in-deg 0)", `Process node "${curr}". Add to topological ordering.`);

        const neighbors = (adj[curr] || []).map(n => n.node).sort();
        for (const n of neighbors) {
            inDegree[n] = inDegree[n] - 1;
            traversedEdges.push(`${curr}-${n}`);
            
            animator.addFrame(order, curr, traversedEdges, [], [...queue], "Queue (in-deg 0)", `Decrement in-degree of neighbor "${n}". In-degree is now ${inDegree[n]}.`);
            
            if (inDegree[n] === 0) {
                queue.push(n);
                animator.addFrame(order, curr, traversedEdges, [], [...queue], "Queue (in-deg 0)", `In-degree of "${n}" is 0. Enqueue "${n}".`);
            }
        }
    }

    if (order.length !== nodes.length) {
        animator.addFrame(order, null, [], [], [], "Sorted", "Graph contains a cycle! Topological sort is not possible on graphs with cycles.");
    } else {
        animator.addFrame(order, null, [], [], [], "Sorted", `Topological Ordering completed: [ ${order.join(" → ")} ]`);
    }

    animator.play();
}

function runCycleDetection() {
    animator.clear();
    const adj = getAdjacencyStructures();
    const visited = new Set();
    const recStack = new Set(); // for directed
    const cycleEdges = [];
    let cycleDetected = false;

    if (isDirected) {
        function dfsDirected(curr, parentNode) {
            if (cycleDetected) return true;
            visited.add(curr);
            recStack.add(curr);

            animator.addFrame([...visited], curr, cycleEdges, [], [...recStack], "Recursion Stack", `DFS visit "${curr}". Add to recursion stack.`);

            const neighbors = (adj[curr] || []).map(n => n.node).sort();
            for (const n of neighbors) {
                const edgeKey = `${curr}-${n}`;
                if (!visited.has(n)) {
                    cycleEdges.push(edgeKey);
                    if (dfsDirected(n, curr)) return true;
                    cycleEdges.pop();
                } else if (recStack.has(n)) {
                    cycleDetected = true;
                    cycleEdges.push(edgeKey);
                    animator.addFrame([...visited], n, cycleEdges, cycleEdges, [...recStack], "Recursion Stack", `Cycle Detected! Node "${n}" is already in recursion stack. Edge is "${curr}" → "${n}".`, true);
                    return true;
                }
            }

            recStack.delete(curr);
            animator.addFrame([...visited], null, cycleEdges, [], [...recStack], "Recursion Stack", `Finished exploring neighbors of "${curr}". Pop from stack.`);
            return false;
        }

        for (const n of nodes) {
            if (!visited.has(n.id)) {
                if (dfsDirected(n.id, null)) break;
            }
        }

        if (!cycleDetected) {
            animator.addFrame([...visited], null, [], [], [], "Recursion Stack", "No cycles detected in this Directed graph.");
        }

    } else {
        // Undirected cycle detection
        function dfsUndirected(curr, parentNode) {
            if (cycleDetected) return true;
            visited.add(curr);

            animator.addFrame([...visited], curr, cycleEdges, [], [curr], "Active DFS Path", `DFS visit "${curr}" (parent: ${parentNode || "none"}).`);

            const neighbors = (adj[curr] || []).map(n => n.node).sort();
            for (const n of neighbors) {
                const edgeKey = `${curr}-${n}`;
                if (!visited.has(n)) {
                    cycleEdges.push(edgeKey);
                    if (dfsUndirected(n, curr)) return true;
                    cycleEdges.pop();
                } else if (n !== parentNode) {
                    cycleDetected = true;
                    cycleEdges.push(edgeKey);
                    animator.addFrame([...visited], n, cycleEdges, cycleEdges, [curr], "Active DFS Path", `Cycle Detected! Node "${n}" is already visited and is not parent "${parentNode}". Edge is "${curr}"-"${n}".`, true);
                    return true;
                }
            }

            return false;
        }

        for (const n of nodes) {
            if (!visited.has(n.id)) {
                if (dfsUndirected(n.id, null)) break;
            }
        }

        if (!cycleDetected) {
            animator.addFrame([...visited], null, [], [], [], "Active DFS Path", "No cycles detected in this Undirected graph.");
        }
    }

    animator.play();
}

// ----------------------------------------
// PLAYBACK / SPEED CONTROLS
// ----------------------------------------
function togglePlay() {
    if (animator.isPlaying) {
        animator.pause();
    } else {
        if (animator.currentIdx >= animator.frames.length - 1) {
            animator.currentIdx = -1;
        }
        animator.play();
    }
}

function stepNext() {
    animator.stepForward();
}

function stepPrev() {
    animator.stepBackward();
}

function changeSpeed(ms) {
    animator.speed = parseInt(ms);
    document.getElementById("speedVal").innerText = (ms / 1000).toFixed(1);
}