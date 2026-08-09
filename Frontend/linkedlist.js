// LINKED LIST VISUALIZATION LOGIC

// Node state representation: array of { id, val }
let list = [];
let currentListType = "singly";

// Helper to generate unique node IDs
function generateId() {
    return 'node_' + Math.random().toString(36).substr(2, 9);
}

class Animator {
    constructor() {
        this.frames = [];
        this.currentIdx = -1;
        this.isPlaying = false;
        this.timer = null;
        this.speed = 1000; // default 1s
    }

    clear() {
        this.frames = [];
        this.currentIdx = -1;
        this.pause();
    }

    addFrame(listState, highlights = {}, arrows = {}, explanation = {}) {
        this.frames.push({
            list: listState.map(node => ({ ...node })),
            highlights: { ...highlights },
            arrows: { ...arrows },
            explanation: { ...explanation }
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
        renderListState(frame.list, frame.highlights, frame.arrows);
        updateExplanation(frame.explanation);
    }
}

const animator = new Animator();

// Initialize on DOM load
document.addEventListener("DOMContentLoaded", () => {
    renderListState(list);
    changeSpeed(1000);
    showMessage("Linked List is Empty.");
    updateExplanation({
        operation: "Initialize List",
        description: "Linked List is Empty.",
        timeComplexity: "-",
        spaceComplexity: "-"
    });
});

// Render the linked list node-by-node
function renderListState(nodes, highlights = {}, arrows = {}) {
    const container = document.getElementById("ll-container");

    // Helper to get arrow color based on active theme
    function getArrowColor() {
        const body = document.body;
        let arrowColor = "#3b82f6";
        if (body.classList.contains("neon-mode")) arrowColor = "#d946ef";
        else if (body.classList.contains("light-mode")) arrowColor = "#2563eb";
        return arrowColor;
    }

    // Determine if structural DOM representation can be updated in-place (same structure & order)
    const currentDomWrappers = Array.from(container.querySelectorAll(".ll-node-wrapper"));
    const currentDomIds = currentDomWrappers.map(el => el.id.replace("wrapper_", ""));
    const targetIds = nodes.map(node => node.id);

    const isSameStructure = (currentDomIds.length === targetIds.length) && currentDomIds.every((id, idx) => id === targetIds[idx]);

    if (isSameStructure && nodes.length > 0) {
        // Just update existing elements to prevent flashing and enable smooth transitions
        nodes.forEach((node, idx) => {
            const wrapper = document.getElementById(`wrapper_${node.id}`);
            if (!wrapper) return;

            const nodeBox = wrapper.querySelector(".ll-node");
            if (nodeBox) {
                // Update highlights
                nodeBox.className = "ll-node";
                if (highlights[node.id]) {
                    nodeBox.classList.add(highlights[node.id]);
                }
            }

            // Update arrow highlights
            const arrowDiv = wrapper.querySelector(".ll-arrow");
            if (arrowDiv) {
                const isHighlighted = arrows[node.id];
                const activeColor = isHighlighted ? '#fbbf24' : getArrowColor();
                const lines = arrowDiv.querySelectorAll("line");
                lines.forEach(line => line.setAttribute("stroke", activeColor));
                const paths = arrowDiv.querySelectorAll("path");
                paths.forEach(path => path.setAttribute("fill", activeColor));
            }
        });

        // Re-draw circular loopbacks (they are SVGs drawn on top of container)
        if (currentListType === "circular" || currentListType === "circular_doubly") {
            setTimeout(() => {
                drawCircularLoopbacks(nodes);
            }, 50);
        }
        return;
    }

    container.innerHTML = "";

    // Clear old loopbacks
    const oldLoop = document.getElementById("ll-loopback-svg");
    if (oldLoop) oldLoop.remove();

    if (nodes.length === 0) {
        const wrapper = document.createElement("div");
        wrapper.className = "ll-node-wrapper";

        // HEAD box
        const headBox = document.createElement("div");
        headBox.className = "ll-node";
        headBox.style.borderColor = "#475569";

        const dataDiv = document.createElement("div");
        dataDiv.className = "ll-data";
        dataDiv.innerText = "HEAD";
        dataDiv.style.borderRight = "none";
        dataDiv.style.color = "#94a3b8";
        headBox.appendChild(dataDiv);
        wrapper.appendChild(headBox);

        // Arrow
        const arrowDiv = document.createElement("div");
        arrowDiv.className = "ll-arrow";
        arrowDiv.innerHTML = `
            <svg width="50" height="20">
                <line x1="5" y1="10" x2="42" y2="10" stroke-width="3" stroke="#475569" stroke-dasharray="4"/>
            </svg>
        `;
        wrapper.appendChild(arrowDiv);

        // NULL box
        const nullBox = document.createElement("div");
        nullBox.className = "ll-null-node";
        nullBox.innerText = "NULL";
        wrapper.appendChild(nullBox);

        container.appendChild(wrapper);
        return;
    }

    // Determine colors based on active theme
    const body = document.body;
    let arrowColor = "#3b82f6";
    if (body.classList.contains("neon-mode")) arrowColor = "#d946ef";
    else if (body.classList.contains("light-mode")) arrowColor = "#2563eb";

    // 1. For Doubly list: show a left NULL node at the very beginning
    if (currentListType === "doubly") {
        const nullWrapper = document.createElement("div");
        nullWrapper.className = "ll-node-wrapper";
        
        const nullBox = document.createElement("div");
        nullBox.className = "ll-null-node";
        nullBox.innerText = "NULL";
        nullWrapper.appendChild(nullBox);

        const leftArrow = document.createElement("div");
        leftArrow.className = "ll-arrow";
        leftArrow.style.width = "40px";
        leftArrow.innerHTML = `
            <svg width="40" height="20">
                <defs>
                    <marker id="arrow_left" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="${arrowColor}"/>
                    </marker>
                </defs>
                <line x1="35" y1="10" x2="8" y2="10" stroke="${arrowColor}" stroke-width="3" marker-end="url(#arrow_left)"/>
            </svg>
        `;
        nullWrapper.appendChild(leftArrow);
        container.appendChild(nullWrapper);
    }

    nodes.forEach((node, idx) => {
        const wrapper = document.createElement("div");
        wrapper.className = "ll-node-wrapper";
        wrapper.id = `wrapper_${node.id}`;

        // Node structure
        const nodeBox = document.createElement("div");
        nodeBox.className = "ll-node";
        if (highlights[node.id]) {
            nodeBox.classList.add(highlights[node.id]);
        }

        // If Doubly or Circular Doubly, show .ll-prev cell on the left
        if (currentListType === "doubly" || currentListType === "circular_doubly") {
            const prevDiv = document.createElement("div");
            prevDiv.className = "ll-prev";
            prevDiv.innerText = (idx === 0 && currentListType === "doubly") ? "NULL" : "•";
            nodeBox.appendChild(prevDiv);
        }

        // Data cell
        const dataDiv = document.createElement("div");
        dataDiv.className = "ll-data";
        dataDiv.innerText = node.val;
        nodeBox.appendChild(dataDiv);

        // Next pointer cell
        const nextDiv = document.createElement("div");
        nextDiv.className = "ll-next";
        
        let isLast = (idx === nodes.length - 1);
        if (isLast) {
            if (currentListType === "circular" || currentListType === "circular_doubly") {
                nextDiv.innerText = "•"; // points to HEAD
            } else {
                nextDiv.innerText = "NULL";
            }
        } else {
            nextDiv.innerText = "•";
        }
        nodeBox.appendChild(nextDiv);
        wrapper.appendChild(nodeBox);

        // Arrow drawing
        if (!isLast) {
            const arrowDiv = document.createElement("div");
            arrowDiv.className = "ll-arrow";
            const isHighlighted = arrows[node.id];
            const activeColor = isHighlighted ? '#fbbf24' : arrowColor;

            if (currentListType === "doubly" || currentListType === "circular_doubly") {
                // Bidirectional Double Arrows Y=6 and Y=14
                arrowDiv.innerHTML = `
                    <svg width="60" height="20">
                        <defs>
                            <marker id="arrow_fwd_${node.id}" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                                <path d="M 0 0 L 10 5 L 0 10 z" fill="${activeColor}"/>
                            </marker>
                            <marker id="arrow_bwd_${node.id}" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                                <path d="M 0 0 L 10 5 L 0 10 z" fill="${activeColor}"/>
                            </marker>
                        </defs>
                        <line x1="5" y1="6" x2="52" y2="6" stroke="${activeColor}" stroke-width="2.5" marker-end="url(#arrow_fwd_${node.id})"/>
                        <line x1="55" y1="14" x2="8" y2="14" stroke="${activeColor}" stroke-width="2.5" marker-end="url(#arrow_bwd_${node.id})"/>
                    </svg>
                `;
            } else {
                // Single Forward Arrow Y=10
                arrowDiv.innerHTML = `
                    <svg width="60" height="20">
                        <defs>
                            <marker id="arrow_${node.id}" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                                <path d="M 0 0 L 10 5 L 0 10 z" fill="${activeColor}"/>
                            </marker>
                        </defs>
                        <line x1="5" y1="10" x2="52" y2="10" stroke="${activeColor}" stroke-width="3" marker-end="url(#arrow_${node.id})"/>
                    </svg>
                `;
            }
            wrapper.appendChild(arrowDiv);
        } else {
            // Last node
            if (currentListType === "singly" || currentListType === "doubly") {
                // Points right to a NULL box
                const arrowDiv = document.createElement("div");
                arrowDiv.className = "ll-arrow";
                arrowDiv.innerHTML = `
                    <svg width="40" height="20">
                        <defs>
                            <marker id="arrow_null" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                                <path d="M 0 0 L 10 5 L 0 10 z" fill="${arrowColor}"/>
                            </marker>
                        </defs>
                        <line x1="5" y1="10" x2="32" y2="10" stroke="${arrowColor}" stroke-width="3" marker-end="url(#arrow_null)"/>
                    </svg>
                `;
                wrapper.appendChild(arrowDiv);

                const nullBox = document.createElement("div");
                nullBox.className = "ll-null-node";
                nullBox.innerText = "NULL";
                wrapper.appendChild(nullBox);
            }
        }

        container.appendChild(wrapper);
    });

    // Draw circular loops if list is circular and has elements
    if (currentListType === "circular" || currentListType === "circular_doubly") {
        setTimeout(() => {
            drawCircularLoopbacks(nodes);
        }, 50);
    }
}

// Explanation Panel dynamic updater
function updateExplanation(details) {
    if (!details) return;

    document.getElementById("exp-operation").innerText = details.operation || "-";

    const valContainer = document.getElementById("exp-val-container");
    if (details.value !== undefined && details.value !== null && details.value !== "") {
        valContainer.style.display = "block";
        document.getElementById("exp-val-value").innerText = details.value;
        if (details.valueLabel) {
            document.getElementById("exp-val-label").innerText = details.valueLabel + ":";
        } else {
            document.getElementById("exp-val-label").innerText = "Value:";
        }
    } else {
        valContainer.style.display = "none";
    }

    document.getElementById("explanation").innerHTML = details.description || "-";

    const extraContainer = document.getElementById("exp-extra-container");
    if (details.extra && Object.keys(details.extra).length > 0) {
        extraContainer.style.display = "block";
        extraContainer.innerHTML = Object.entries(details.extra)
            .map(([k, v]) => `
                <div class="explanation-item" style="margin-top: 8px;">
                    <span class="explanation-label">${k}</span>
                    <span class="explanation-value">${v}</span>
                </div>
            `).join("");
    } else {
        extraContainer.style.display = "none";
    }

    document.getElementById("exp-time").innerText = details.timeComplexity || "-";
    document.getElementById("exp-space").innerText = details.spaceComplexity || "-";
}

// Helper: update bottom status message box
function showMessage(msg, type = "success") {
    const el = document.getElementById("message");
    el.innerText = msg;
    if (type === "success") {
        el.style.color = "#22c55e";
    } else {
        el.style.color = "#ef4444";
    }
}

// Playback / Speed controls
function changeSpeed(ms) {
    animator.speed = parseInt(ms);
    const s = (ms / 1000).toFixed(1);
    document.getElementById("speedVal").innerText = s;
}

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

function resetAnimation() {
    animator.clear();
    renderListState(list);
    showMessage("Linked List Ready");
    updateExplanation({
        operation: "Reset",
        description: "Animation reset. Ready to visualize operations."
    });
}

// ----------------------------------------
// OPERATIONS IMPLEMENTATION
// ----------------------------------------

function setCustomList() {
    animator.clear();
    const input = document.getElementById("customInput").value;
    if (!input.trim()) return;

    const parts = input.split(",").map(p => parseInt(p.trim())).filter(p => !isNaN(p));
    if (parts.length === 0) {
        showMessage("Invalid initialization format.", "error");
        return;
    }

    list = parts.slice(0, 8).map(val => ({ id: generateId(), val: val }));
    renderListState(list);
    showMessage("Custom list initialized successfully.");
    document.getElementById("customInput").value = "";
    updateExplanation({
        operation: "Initialize List",
        value: parts.join(", "),
        valueLabel: "Elements",
        description: `Set up the list with ${parts.length} custom nodes.`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(n)"
    });
}

function createEmptyList() {
    animator.clear();
    list = [];
    renderListState(list);
    showMessage("Created Empty Linked List.");
    updateExplanation({
        operation: "Create Empty List",
        description: "List cleared. Head pointer points to NULL.",
        timeComplexity: "O(1)",
        spaceComplexity: "O(1)"
    });
}

function insertAtBeginning() {
    animator.clear();
    const val = parseInt(document.getElementById("insertValue").value);
    if (isNaN(val)) {
        showMessage("Please enter a value to insert.", "error");
        return;
    }

    const newNodeId = generateId();
    const newNodeObj = { id: newNodeId, val: val };

    // Intermediate frame showing the new node independently
    let temp = [newNodeObj, ...list];
    // Set highlights: newNode is active
    let h = { [newNodeId]: 'active' };

    animator.addFrame(list, {}, {}, {
        operation: "Insert at Beginning",
        value: val,
        description: `Create a new node with data: ${val}. Ready to connect to head.`,
        timeComplexity: "O(1)",
        spaceComplexity: "O(1)"
    });

    // Node is added at the start of the state
    animator.addFrame(temp, h, {}, {
        operation: "Insert at Beginning",
        value: val,
        description: `Update next pointer of the new node to point to the current head.`,
        timeComplexity: "O(1)",
        spaceComplexity: "O(1)"
    });

    // Make it green to indicate completion
    h[newNodeId] = 'sorted';
    animator.addFrame(temp, h, {}, {
        operation: "Insert at Beginning",
        value: val,
        description: `Successfully updated the head reference to point to the new node. Node inserted.`,
        timeComplexity: "O(1)",
        spaceComplexity: "O(1)"
    });

    list = temp;
    document.getElementById("insertValue").value = "";
    animator.play();
    showMessage("Node Inserted Successfully");
}

function insertAtEnd() {
    animator.clear();
    const val = parseInt(document.getElementById("insertValue").value);
    if (isNaN(val)) {
        showMessage("Please enter a value to insert.", "error");
        return;
    }

    const newNodeId = generateId();
    const newNodeObj = { id: newNodeId, val: val };

    if (list.length === 0) {
        list.push(newNodeObj);
        renderListState(list);
        showMessage("Node Inserted Successfully");
        updateExplanation({
            operation: "Insert at End",
            value: val,
            description: "List was empty. Inserted node as the head node.",
            timeComplexity: "O(1)",
            spaceComplexity: "O(1)"
        });
        return;
    }

    // Traverse the list to find the last node
    let temp = [...list];
    let h = {};
    let a = {};

    animator.addFrame(temp, {}, {}, {
        operation: "Insert at End",
        value: val,
        description: `Find tail to append node ${val}. Start traversing from head.`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)"
    });

    for (let i = 0; i < temp.length; i++) {
        h = {};
        a = {};
        // Highlight active traversing node
        h[temp[i].id] = 'compare';
        
        // Highlight arrow traversed so far
        for (let j = 0; j < i; j++) {
            a[temp[j].id] = true;
        }

        animator.addFrame(temp, h, a, {
            operation: "Insert at End",
            value: val,
            description: `Traversing node ${temp[i].val} at index ${i}.`,
            extra: { "Current Index": i },
            timeComplexity: "O(n)",
            spaceComplexity: "O(1)"
        });
    }

    // Now append
    let finalTemp = [...temp, newNodeObj];
    h = { [newNodeId]: 'active' };
    for (let j = 0; j < temp.length; j++) {
        a[temp[j].id] = true;
    }
    
    animator.addFrame(finalTemp, h, a, {
        operation: "Insert at End",
        value: val,
        description: `Connect the tail node's next pointer to the newly allocated node.`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)"
    });

    h[newNodeId] = 'sorted';
    animator.addFrame(finalTemp, h, a, {
        operation: "Insert at End",
        value: val,
        description: `Node appended successfully at the tail.`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)"
    });

    list = finalTemp;
    document.getElementById("insertValue").value = "";
    animator.play();
    showMessage("Node Inserted Successfully");
}

function insertAtIndex() {
    animator.clear();
    const val = parseInt(document.getElementById("insertValue").value);
    const idx = parseInt(document.getElementById("insertIndex").value);

    if (isNaN(val)) {
        showMessage("Please enter a value to insert.", "error");
        return;
    }
    if (isNaN(idx) || idx < 0 || idx > list.length) {
        showMessage(`Invalid index. Valid range: 0 to ${list.length}.`, "error");
        return;
    }

    if (idx === 0) {
        insertAtBeginning();
        return;
    }
    if (idx === list.length) {
        insertAtEnd();
        return;
    }

    const newNodeId = generateId();
    const newNodeObj = { id: newNodeId, val: val };
    let temp = [...list];
    let h = {};
    let a = {};

    animator.addFrame(temp, {}, {}, {
        operation: "Insert at Index",
        value: val,
        description: `Prepare to insert ${val} at index ${idx}. Traverse to index ${idx - 1}.`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)"
    });

    // Traverse to index - 1
    for (let i = 0; i < idx; i++) {
        h = {};
        a = {};
        h[temp[i].id] = 'compare';
        for (let j = 0; j < i; j++) {
            a[temp[j].id] = true;
        }

        animator.addFrame(temp, h, a, {
            operation: "Insert at Index",
            value: val,
            description: `Traverse step: reached index ${i} (value: ${temp[i].val}).`,
            extra: { "Traversing Index": i, "Target Node Index": idx - 1 },
            timeComplexity: "O(n)",
            spaceComplexity: "O(1)"
        });
    }

    // Position of insertion: between idx-1 and idx
    let finalTemp = [];
    for (let i = 0; i < temp.length; i++) {
        if (i === idx) {
            finalTemp.push(newNodeObj);
        }
        finalTemp.push(temp[i]);
    }

    h = { [newNodeId]: 'active', [temp[idx - 1].id]: 'compare' };
    // Highlight traversed arrows up to idx - 1
    a = {};
    for (let j = 0; j < idx - 1; j++) {
        a[temp[j].id] = true;
    }

    animator.addFrame(finalTemp, h, a, {
        operation: "Insert at Index",
        value: val,
        description: `Point the next arrow of the new node to point to index ${idx} node.`,
        extra: { "Target Index": idx },
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)"
    });

    // Set predecessor to point to new node
    a[newNodeId] = true;
    animator.addFrame(finalTemp, h, a, {
        operation: "Insert at Index",
        value: val,
        description: `Update the next arrow of node at index ${idx - 1} to point to the new node.`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)"
    });

    h[newNodeId] = 'sorted';
    animator.addFrame(finalTemp, h, a, {
        operation: "Insert at Index",
        value: val,
        description: `Node successfully inserted at index ${idx}.`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)"
    });

    list = finalTemp;
    document.getElementById("insertValue").value = "";
    document.getElementById("insertIndex").value = "";
    animator.play();
    showMessage("Node Inserted Successfully");
}

function deleteFromBeginning() {
    animator.clear();
    if (list.length === 0) {
        showMessage("List is empty. Nothing to delete.", "error");
        return;
    }

    let temp = [...list];
    let deletedId = temp[0].id;
    let val = temp[0].val;

    animator.addFrame(temp, { [deletedId]: 'swap' }, {}, {
        operation: "Delete from Beginning",
        description: `Prepare to remove the head node (value: ${val}).`,
        timeComplexity: "O(1)",
        spaceComplexity: "O(1)"
    });

    temp.shift();
    animator.addFrame(temp, {}, {}, {
        operation: "Delete from Beginning",
        description: `Updated head pointer to point to the next node. Node ${val} deleted successfully.`,
        timeComplexity: "O(1)",
        spaceComplexity: "O(1)"
    });

    list = temp;
    animator.play();
    showMessage("Node Deleted Successfully");
}

function deleteFromEnd() {
    animator.clear();
    if (list.length === 0) {
        showMessage("List is empty. Nothing to delete.", "error");
        return;
    }

    if (list.length === 1) {
        deleteFromBeginning();
        return;
    }

    let temp = [...list];
    let tailId = temp[temp.length - 1].id;
    let val = temp[temp.length - 1].val;
    let h = {};
    let a = {};

    animator.addFrame(temp, {}, {}, {
        operation: "Delete from End",
        description: "Find the tail node by traversing from the head node.",
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)"
    });

    // Traverse to second-to-last node
    for (let i = 0; i < temp.length - 1; i++) {
        h = { [temp[i].id]: 'compare' };
        a = {};
        for (let j = 0; j < i; j++) {
            a[temp[j].id] = true;
        }

        animator.addFrame(temp, h, a, {
            operation: "Delete from End",
            description: `Traversing node ${temp[i].val} at index ${i}.`,
            extra: { "Current Index": i, "Target Index": temp.length - 2 },
            timeComplexity: "O(n)",
            spaceComplexity: "O(1)"
        });
    }

    h = { [temp[temp.length - 2].id]: 'compare', [tailId]: 'swap' };
    for (let j = 0; j < temp.length - 2; j++) {
        a[temp[j].id] = true;
    }

    animator.addFrame(temp, h, a, {
        operation: "Delete from End",
        description: `Update the next pointer of second-to-last node to NULL. Freeing tail node.`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)"
    });

    temp.pop();
    animator.addFrame(temp, {}, a, {
        operation: "Delete from End",
        description: `Node ${val} deleted successfully.`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)"
    });

    list = temp;
    animator.play();
    showMessage("Node Deleted Successfully");
}

function deleteAtIndex() {
    animator.clear();
    const idx = parseInt(document.getElementById("deleteIndex").value);
    if (isNaN(idx) || idx < 0 || idx >= list.length) {
        showMessage(`Invalid index. Valid range: 0 to ${list.length - 1}.`, "error");
        return;
    }

    if (idx === 0) {
        deleteFromBeginning();
        return;
    }
    if (idx === list.length - 1) {
        deleteFromEnd();
        return;
    }

    let temp = [...list];
    let targetId = temp[idx].id;
    let val = temp[idx].val;
    let h = {};
    let a = {};

    animator.addFrame(temp, {}, {}, {
        operation: "Delete at Index",
        description: `Prepare to delete node at index ${idx}. Traverse to index ${idx - 1}.`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)"
    });

    // Traverse to index - 1
    for (let i = 0; i < idx; i++) {
        h = { [temp[i].id]: 'compare' };
        a = {};
        for (let j = 0; j < i; j++) {
            a[temp[j].id] = true;
        }

        animator.addFrame(temp, h, a, {
            operation: "Delete at Index",
            description: `Traverse step: reached index ${i} (value: ${temp[i].val}).`,
            extra: { "Traversing Index": i, "Target Predecessor Index": idx - 1 },
            timeComplexity: "O(n)",
            spaceComplexity: "O(1)"
        });
    }

    h = { [temp[idx - 1].id]: 'compare', [targetId]: 'swap' };
    for (let j = 0; j < idx - 1; j++) {
        a[temp[j].id] = true;
    }

    animator.addFrame(temp, h, a, {
        operation: "Delete at Index",
        description: `Point the next arrow of index ${idx - 1} node directly to node at index ${idx + 1}.`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)"
    });

    temp.splice(idx, 1);
    animator.addFrame(temp, {}, a, {
        operation: "Delete at Index",
        description: `Unlinked target node successfully. Node ${val} deleted.`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)"
    });

    list = temp;
    document.getElementById("deleteIndex").value = "";
    animator.play();
    showMessage("Node Deleted Successfully");
}

function deleteByValue() {
    animator.clear();
    const val = parseInt(document.getElementById("deleteValue").value);
    if (isNaN(val)) {
        showMessage("Please enter a value to delete.", "error");
        return;
    }

    if (list.length === 0) {
        showMessage("List is empty. Nothing to delete.", "error");
        return;
    }

    let temp = [...list];
    let foundIdx = -1;
    for (let i = 0; i < temp.length; i++) {
        if (temp[i].val === val) {
            foundIdx = i;
            break;
        }
    }

    if (foundIdx === -1) {
        // Not found traversal animation
        let h = {};
        let a = {};
        animator.addFrame(temp, {}, {}, {
            operation: "Delete by Value",
            value: val,
            description: `Start searching for node with value ${val} to delete.`,
            timeComplexity: "O(n)",
            spaceComplexity: "O(1)"
        });

        for (let i = 0; i < temp.length; i++) {
            h = { [temp[i].id]: 'compare' };
            a = {};
            for (let j = 0; j < i; j++) {
                a[temp[j].id] = true;
            }

            animator.addFrame(temp, h, a, {
                operation: "Delete by Value",
                value: val,
                description: `Compare target value ${val} with node value ${temp[i].val}. Not a match.`,
                extra: { "Current Index": i, "Match Status": "No Match" },
                timeComplexity: "O(n)",
                spaceComplexity: "O(1)"
            });
        }

        animator.addFrame(temp, {}, {}, {
            operation: "Delete by Value",
            value: val,
            description: `Reached end of the list. Node with value ${val} not found.`,
            extra: { "Result": "Not Found" },
            timeComplexity: "O(n)",
            spaceComplexity: "O(1)"
        });

        animator.play();
        showMessage(`Node with value ${val} not found in the list.`, "error");
        return;
    }

    // Node is found, animate traversal to foundIdx and then delete it
    let targetId = temp[foundIdx].id;
    let h = {};
    let a = {};

    animator.addFrame(temp, {}, {}, {
        operation: "Delete by Value",
        value: val,
        description: `Start searching for node with value ${val} to delete.`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)"
    });

    for (let i = 0; i <= foundIdx; i++) {
        h = {};
        a = {};
        for (let j = 0; j < i; j++) {
            a[temp[j].id] = true;
        }

        if (i === foundIdx) {
            h[temp[i].id] = 'active';
            animator.addFrame(temp, h, a, {
                operation: "Delete by Value",
                value: val,
                description: `Found node: value ${temp[i].val} matches target value ${val} at index ${i}.`,
                extra: { "Index": i, "Match Status": "Match Found" },
                timeComplexity: "O(n)",
                spaceComplexity: "O(1)"
            });
        } else {
            h[temp[i].id] = 'compare';
            animator.addFrame(temp, h, a, {
                operation: "Delete by Value",
                value: val,
                description: `Compare target value ${val} with node value ${temp[i].val}. Not a match.`,
                extra: { "Current Index": i, "Match Status": "No Match" },
                timeComplexity: "O(n)",
                spaceComplexity: "O(1)"
            });
        }
    }

    if (foundIdx === 0) {
        // Delete from beginning
        h = { [targetId]: 'swap' };
        animator.addFrame(temp, h, {}, {
            operation: "Delete by Value",
            value: val,
            description: `Node with value ${val} is the head node. Prepare to remove it.`,
            timeComplexity: "O(1)",
            spaceComplexity: "O(1)"
        });

        temp.shift();
        animator.addFrame(temp, {}, {}, {
            operation: "Delete by Value",
            value: val,
            description: `Updated head pointer to point to next node. Node with value ${val} deleted.`,
            timeComplexity: "O(1)",
            spaceComplexity: "O(1)"
        });
    } else if (foundIdx === list.length - 1) {
        // Delete from end
        let predecessorId = temp[foundIdx - 1].id;
        h = { [predecessorId]: 'compare', [targetId]: 'swap' };
        a = {};
        for (let j = 0; j < foundIdx - 1; j++) {
            a[temp[j].id] = true;
        }

        animator.addFrame(temp, h, a, {
            operation: "Delete by Value",
            value: val,
            description: `Node with value ${val} is the tail node. Set next pointer of second-to-last node (index ${foundIdx - 1}) to NULL.`,
            timeComplexity: "O(n)",
            spaceComplexity: "O(1)"
        });

        temp.pop();
        animator.addFrame(temp, {}, a, {
            operation: "Delete by Value",
            value: val,
            description: `Removed tail node. Node with value ${val} deleted successfully.`,
            timeComplexity: "O(n)",
            spaceComplexity: "O(1)"
        });
    } else {
        // Delete from middle
        let predecessorId = temp[foundIdx - 1].id;
        h = { [predecessorId]: 'compare', [targetId]: 'swap' };
        a = {};
        for (let j = 0; j < foundIdx - 1; j++) {
            a[temp[j].id] = true;
        }

        animator.addFrame(temp, h, a, {
            operation: "Delete by Value",
            value: val,
            description: `Point the next arrow of predecessor node (index ${foundIdx - 1}) directly to successor node (index ${foundIdx + 1}).`,
            timeComplexity: "O(n)",
            spaceComplexity: "O(1)"
        });

        temp.splice(foundIdx, 1);
        animator.addFrame(temp, {}, a, {
            operation: "Delete by Value",
            value: val,
            description: `Unlinked target node successfully. Node with value ${val} deleted.`,
            timeComplexity: "O(n)",
            spaceComplexity: "O(1)"
        });
    }

    list = temp;
    document.getElementById("deleteValue").value = "";
    animator.play();
    showMessage("Node Deleted Successfully");
}

function searchList() {
    animator.clear();
    const val = parseInt(document.getElementById("opValue").value);
    if (isNaN(val)) {
        showMessage("Please enter a value to search.", "error");
        return;
    }

    let temp = [...list];
    let found = false;
    let foundIdx = -1;
    let h = {};
    let a = {};

    animator.addFrame(temp, {}, {}, {
        operation: "Search",
        value: val,
        description: `Start linear search for value ${val} from the head node.`,
        timeComplexity: "Best: O(1), Worst: O(n)",
        spaceComplexity: "O(1)"
    });

    for (let i = 0; i < temp.length; i++) {
        h = {};
        a = {};
        h[temp[i].id] = 'compare';
        for (let j = 0; j < i; j++) {
            a[temp[j].id] = true;
        }

        if (temp[i].val === val) {
            found = true;
            foundIdx = i;
            h[temp[i].id] = 'sorted';
            animator.addFrame(temp, h, a, {
                operation: "Search",
                value: val,
                description: `Value ${val} found at index ${i}!`,
                extra: { "Search Result": "Found", "Index": i },
                timeComplexity: "Best: O(1), Worst: O(n)",
                spaceComplexity: "O(1)"
            });
            break;
        } else {
            animator.addFrame(temp, h, a, {
                operation: "Search",
                value: val,
                description: `Compare ${val} with node value ${temp[i].val}. Not a match. Keep moving.`,
                extra: { "Current Index": i, "Match Status": "No Match" },
                timeComplexity: "Best: O(1), Worst: O(n)",
                spaceComplexity: "O(1)"
            });
        }
    }

    if (!found) {
        animator.addFrame(temp, {}, {}, {
            operation: "Search",
            value: val,
            description: `Searched entire list. Target value ${val} is not present in the list.`,
            extra: { "Search Result": "Not Found" },
            timeComplexity: "Best: O(1), Worst: O(n)",
            spaceComplexity: "O(1)"
        });
    }

    animator.play();
    if (found) {
        showMessage(`Node Found`);
    } else {
        showMessage(`Node Not Found`, "error");
    }
}

function updateNode() {
    animator.clear();
    const val = parseInt(document.getElementById("opValue").value);
    const idx = parseInt(document.getElementById("opIndex").value);

    if (isNaN(val) || isNaN(idx)) {
        showMessage("Please specify both Value and Index to update.", "error");
        return;
    }

    if (idx < 0 || idx >= list.length) {
        showMessage(`Invalid index. Valid range: 0 to ${list.length - 1}.`, "error");
        return;
    }

    let temp = [...list];
    let h = {};
    let a = {};

    animator.addFrame(temp, {}, {}, {
        operation: "Update Node",
        value: val,
        description: `Traverse to index ${idx} to update value (currently: ${temp[idx].val}).`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)"
    });

    for (let i = 0; i <= idx; i++) {
        h = {};
        a = {};
        h[temp[i].id] = 'compare';
        for (let j = 0; j < i; j++) {
            a[temp[j].id] = true;
        }

        if (i === idx) {
            h[temp[i].id] = 'active';
            animator.addFrame(temp, h, a, {
                operation: "Update Node",
                value: val,
                description: `Target index reached. Modifying value from ${temp[i].val} to ${val}.`,
                extra: { "Index": i, "Old Value": temp[i].val },
                timeComplexity: "O(n)",
                spaceComplexity: "O(1)"
            });
        } else {
            animator.addFrame(temp, h, a, {
                operation: "Update Node",
                value: val,
                description: `Traversing node ${temp[i].val} at index ${i}.`,
                extra: { "Current Index": i, "Target Index": idx },
                timeComplexity: "O(n)",
                spaceComplexity: "O(1)"
            });
        }
    }

    // Apply the change
    temp[idx].val = val;
    h[temp[idx].id] = 'sorted';
    animator.addFrame(temp, h, a, {
        operation: "Update Node",
        value: val,
        description: `Successfully updated value at index ${idx} to ${val}.`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)"
    });

    list = temp;
    document.getElementById("opValue").value = "";
    document.getElementById("opIndex").value = "";
    animator.play();
    showMessage("Node Updated Successfully");
}

function traverseList() {
    animator.clear();
    if (list.length === 0) {
        showMessage("List is empty. Nothing to traverse.", "error");
        return;
    }

    let temp = [...list];
    let h = {};
    let a = {};

    animator.addFrame(temp, {}, {}, {
        operation: "Traverse",
        description: "Start traversing the linked list from the head node.",
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)"
    });

    for (let i = 0; i < temp.length; i++) {
        h = { [temp[i].id]: 'active' };
        a = {};
        for (let j = 0; j < i; j++) {
            a[temp[j].id] = true;
        }

        animator.addFrame(temp, h, a, {
            operation: "Traverse",
            description: `Visit node: index ${i} (value: ${temp[i].val}).`,
            extra: { "Current Index": i, "Current Value": temp[i].val },
            timeComplexity: "O(n)",
            spaceComplexity: "O(1)"
        });
    }

    animator.addFrame(temp, {}, a, {
        operation: "Traverse",
        description: "Reached tail node (points to NULL). Traversal completed successfully.",
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)"
    });

    animator.play();
    showMessage("Traversed List Successfully");
}

function reverseList() {
    animator.clear();
    if (list.length < 2) {
        showMessage("Reverse completed. List is too short.", "success");
        return;
    }

    let temp = [...list];
    let original = temp.map(node => ({ ...node }));
    
    // We will build final reversed list step-by-step
    // To do this, we show prev, curr, next pointers
    let prev = null;
    let curr = 0; // index in temp

    animator.addFrame(original, {}, {}, {
        operation: "Reverse Linked List",
        description: "Initialize pointers: prev = NULL, curr = Head, next = NULL.",
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)"
    });

    let cumulativeReversed = [];

    while (curr < original.length) {
        let currNode = original[curr];
        let nextNode = curr + 1 < original.length ? original[curr + 1] : null;

        // Highlight curr and prev
        let h = {};
        h[currNode.id] = 'active';
        if (prev !== null) {
            h[prev.id] = 'compare';
        }

        // Highlight arrows: reversed pointers go from currNode to prev in our conceptual frame
        // Let's create a frame of the current state of reversal
        let currentFrameNodes = [];
        // The first part is the reversed prefix: prev -> ... -> head
        for (let k = curr - 1; k >= 0; k--) {
            currentFrameNodes.push(original[k]);
        }
        // The second part is the unreversed suffix: curr -> ... -> tail
        for (let k = curr; k < original.length; k++) {
            currentFrameNodes.push(original[k]);
        }

        animator.addFrame(original, h, {}, {
            operation: "Reverse Linked List",
            description: `Store next pointer: next = ${nextNode ? nextNode.val : "NULL"}. Ready to reverse link.`,
            extra: {
                "Previous Node (prev)": prev ? prev.val : "NULL",
                "Current Node (curr)": currNode.val,
                "Next Node (next)": nextNode ? nextNode.val : "NULL"
            },
            timeComplexity: "O(n)",
            spaceComplexity: "O(1)"
        });

        // Conceptually reverse link: points to prev
        animator.addFrame(original, { [currNode.id]: 'sorted' }, {}, {
            operation: "Reverse Linked List",
            description: `Reverse link: point next pointer of curr (${currNode.val}) to prev (${prev ? prev.val : "NULL"}).`,
            extra: {
                "Reversing Link": `${currNode.val} → ${prev ? prev.val : "NULL"}`
            },
            timeComplexity: "O(n)",
            spaceComplexity: "O(1)"
        });

        prev = currNode;
        curr++;
    }

    // Reverse actual list array
    let reversedList = [];
    for (let i = list.length - 1; i >= 0; i--) {
        reversedList.push(list[i]);
    }

    animator.addFrame(reversedList, {}, {}, {
        operation: "Reverse Linked List",
        description: "All next pointers reversed. Set head of list to point to prev (node " + prev.val + ").",
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)"
    });

    list = reversedList;
    animator.play();
    showMessage("List Reversed Successfully");
}

function clearList() {
    animator.clear();
    list = [];
    renderListState(list);
    showMessage("List Cleared");
    updateExplanation({
        operation: "Clear List",
        description: "Deleted all nodes. List is empty.",
        timeComplexity: "O(1)",
        spaceComplexity: "O(1)"
    });
}

function switchListType(type) {
    currentListType = type;
    animator.clear();
    list = [];
    
    // Toggle Traverse Back button visibility
    const backBtn = document.getElementById("traverseBackBtn");
    const container = document.getElementById("traversal-container");
    if (type === "doubly" || type === "circular_doubly") {
        if (backBtn) backBtn.style.display = "block";
        if (container) container.style.gridTemplateColumns = "1fr 1fr 1fr";
    } else {
        if (backBtn) backBtn.style.display = "none";
        if (container) container.style.gridTemplateColumns = "1fr 1fr";
    }
    
    // Adjust Reverse button visibility
    const revBtn = document.getElementById("reverseBtn");
    if (type === "circular") {
        if (revBtn) revBtn.style.display = "none";
    } else {
        if (revBtn) revBtn.style.display = "block";
    }
    
    renderListState(list);
    
    const typeLabel = {
        "singly": "Singly Linked List",
        "doubly": "Doubly Linked List",
        "circular": "Circular Linked List",
        "circular_doubly": "Circular Doubly Linked List"
    }[type];
    
    showMessage(`${typeLabel} Initialized.`);
    updateExplanation({
        operation: `Initialize ${typeLabel}`,
        description: `${typeLabel} is Empty.`,
        timeComplexity: "-",
        spaceComplexity: "-"
    });
}

function traverseBackward() {
    animator.clear();
    if (list.length === 0) {
        showMessage("List is empty. Nothing to traverse.", "error");
        return;
    }

    let temp = [...list];
    let h = {};
    let a = {};

    const typeLabel = {
        "doubly": "Doubly Linked List",
        "circular_doubly": "Circular Doubly Linked List"
    }[currentListType] || "Linked List";

    animator.addFrame(temp, {}, {}, {
        operation: `Traverse Backward (${typeLabel})`,
        description: `Start backward traversal from tail node (value: ${temp[temp.length - 1].val}).`,
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)"
    });

    for (let i = temp.length - 1; i >= 0; i--) {
        h = { [temp[i].id]: 'active' };
        a = {};
        for (let j = temp.length - 1; j > i; j--) {
            a[temp[j-1].id] = true;
        }

        animator.addFrame(temp, h, a, {
            operation: `Traverse Backward (${typeLabel})`,
            description: `Visit node: index ${i} (value: ${temp[i].val}).`,
            extra: { "Current Index": i, "Current Value": temp[i].val },
            timeComplexity: "O(n)",
            spaceComplexity: "O(1)"
        });
    }

    animator.play();
    showMessage("Traversed List Backward Successfully");
}

function drawCircularLoopbacks(nodes) {
    const oldLoop = document.getElementById("ll-loopback-svg");
    if (oldLoop) oldLoop.remove();

    if (nodes.length === 0) return;
    if (currentListType !== "circular" && currentListType !== "circular_doubly") return;

    const container = document.getElementById("ll-container");
    const firstNode = container.querySelector(".ll-node");
    const lastNode = container.querySelectorAll(".ll-node:last-of-type");
    const allWrappers = container.querySelectorAll(".ll-node-wrapper");
    const firstWrap = allWrappers[0];
    const lastWrap = allWrappers[allWrappers.length - 1];
    
    if (!firstWrap || !lastWrap || !firstNode || !lastNode) return;

    const firstRect = firstNode.getBoundingClientRect();
    const lastRect = lastNode.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    const startX = (lastRect.left + lastRect.width / 2) - containerRect.left;
    const endX = (firstRect.left + firstRect.width / 2) - containerRect.left;
    const startY = lastRect.bottom - containerRect.top;
    const endY = firstRect.bottom - containerRect.top;

    const loopSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    loopSvg.id = "ll-loopback-svg";
    loopSvg.style.position = "absolute";
    loopSvg.style.top = "0";
    loopSvg.style.left = "0";
    loopSvg.style.width = `${container.scrollWidth}px`;
    loopSvg.style.height = `${container.scrollHeight}px`;
    loopSvg.style.pointerEvents = "none";

    const body = document.body;
    let color = "#3b82f6";
    if (body.classList.contains("neon-mode")) color = "#d946ef";
    else if (body.classList.contains("light-mode")) color = "#2563eb";

    const markerId = "loop_arrow";
    const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
    marker.setAttribute("id", markerId);
    marker.setAttribute("viewBox", "0 0 10 10");
    marker.setAttribute("refX", "5");
    marker.setAttribute("refY", "5");
    marker.setAttribute("markerWidth", "5");
    marker.setAttribute("markerHeight", "5");
    marker.setAttribute("orient", "auto-start-reverse");

    const pathArrow = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathArrow.setAttribute("d", "M 0 0 L 10 5 L 0 10 z");
    pathArrow.setAttribute("fill", color);
    marker.appendChild(pathArrow);
    loopSvg.appendChild(marker);

    // Draw curved loopback path (from last node bottom, curving down and left, then curving up to first node bottom)
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const controlY = Math.max(startY, endY) + 35;
    path.setAttribute("d", `M ${startX} ${startY} C ${startX} ${controlY}, ${endX} ${controlY}, ${endX} ${endY + 12}`);
    path.setAttribute("stroke", color);
    path.setAttribute("stroke-width", "3");
    path.setAttribute("fill", "none");
    path.setAttribute("marker-end", `url(#${markerId})`);

    loopSvg.appendChild(path);
    
    // If circular doubly, draw a second return arrow!
    if (currentListType === "circular_doubly") {
        const returnMarkerId = "loop_return_arrow";
        const returnMarker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
        returnMarker.setAttribute("id", returnMarkerId);
        returnMarker.setAttribute("viewBox", "0 0 10 10");
        returnMarker.setAttribute("refX", "5");
        returnMarker.setAttribute("refY", "5");
        returnMarker.setAttribute("markerWidth", "5");
        returnMarker.setAttribute("markerHeight", "5");
        returnMarker.setAttribute("orient", "auto-start-reverse");

        const returnPathArrow = document.createElementNS("http://www.w3.org/2000/svg", "path");
        returnPathArrow.setAttribute("d", "M 0 0 L 10 5 L 0 10 z");
        returnPathArrow.setAttribute("fill", color);
        returnMarker.appendChild(returnPathArrow);
        loopSvg.appendChild(returnMarker);

        const pathReturn = document.createElementNS("http://www.w3.org/2000/svg", "path");
        const controlY2 = Math.max(startY, endY) + 50;
        // Reverse path: from first node to last node
        pathReturn.setAttribute("d", `M ${endX} ${endY} C ${endX} ${controlY2}, ${startX} ${controlY2}, ${startX} ${startY + 12}`);
        pathReturn.setAttribute("stroke", color);
        pathReturn.setAttribute("stroke-width", "2.5");
        pathReturn.setAttribute("fill", "none");
        pathReturn.setAttribute("marker-end", `url(#${returnMarkerId})`);
        loopSvg.appendChild(pathReturn);
    }

    container.appendChild(loopSvg);
}
