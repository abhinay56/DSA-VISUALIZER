// QUEUE VISUALIZATION LOGIC

const CAPACITY = 8;
let queueData = new Array(CAPACITY).fill(null);
let front = -1;
let rear = -1;
let size = 0;
let queueType = "linear"; // "linear" or "circular"

// Sound effects (Google reliable sound links)
const enqueueSound = new Audio("https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg");
const dequeueSound = new Audio("https://actions.google.com/sounds/v1/cartoon/pop.ogg");
const errorSound = new Audio("https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg");

// Preload audio
enqueueSound.load();
dequeueSound.load();
errorSound.load();

// Global operation context for explanation panel
let currentOp = { name: "-", value: "-", time: "-", space: "-" };

function updateExplanation(details) {
    if (!details) return;
    document.getElementById("exp-operation").innerText = details.operation || "-";

    const valContainer = document.getElementById("exp-val-container");
    if (details.value !== undefined && details.value !== null && details.value !== "") {
        valContainer.style.display = "block";
        document.getElementById("exp-val-value").innerText = details.value;
    } else {
        valContainer.style.display = "none";
    }

    document.getElementById("explanation").innerText = details.description || "-";

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

// Animator for step-by-step playback
class QueueAnimator {
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

    addFrame(qArr, f, r, sz, highlights = {}, explanation = "", playError = false) {
        this.frames.push({
            queue: [...qArr],
            front: f,
            rear: r,
            size: sz,
            highlights: { ...highlights }, // e.g. { index: 'peeked' or 'reared' }
            explanation: explanation,
            playError: playError,
            opName: currentOp.name,
            opVal: currentOp.value,
            opTime: currentOp.time,
            opSpace: currentOp.space
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
        renderQueueState(frame.queue, frame.front, frame.rear, frame.size, frame.highlights);
        updateExplanation({
            operation: frame.opName,
            value: frame.opVal,
            description: frame.explanation,
            timeComplexity: frame.opTime,
            spaceComplexity: frame.opSpace
        });
        
        // Shake container on error
        if (frame.playError) {
            triggerShakeEffect();
            playSound(errorSound);
        }
    }
}

const animator = new QueueAnimator();

document.addEventListener("DOMContentLoaded", () => {
    initQueue();
    changeSpeed(1000);
    updateExplanation({
        operation: "Initialize Queue",
        description: "Queue is Empty.",
        timeComplexity: "-",
        spaceComplexity: "-"
    });
});

// Initialize / Render setup
function initQueue() {
    queueData.fill(null);
    front = -1;
    rear = -1;
    size = 0;
    animator.clear();
    renderQueueState(queueData, front, rear, size);
    updateInfoPanel(front, rear, size);
}

function switchQueueType(type) {
    queueType = type;
    initQueue();
    document.getElementById("explanation").innerText = `${type === "linear" ? "Linear" : "Circular"} queue initialized.`;
}

// Draw state of queue
function renderQueueState(qArr, f, r, sz, highlights = {}) {
    const container = document.getElementById("queue-container");

    const expectedClass = queueType === "circular" ? "queue-container circular" : "queue-container";
    const currentSlots = container.querySelectorAll(".queue-slot");

    if (container.className === expectedClass && currentSlots.length === CAPACITY) {
        for (let i = 0; i < CAPACITY; i++) {
            const slot = currentSlots[i];
            let item = slot.querySelector(".queue-item");
            if (qArr[i] !== null) {
                if (!item) {
                    item = document.createElement("div");
                    item.className = "queue-item";
                    slot.appendChild(item);
                }
                item.innerText = qArr[i];
                item.className = "queue-item";
                if (highlights[i]) {
                    item.classList.add(highlights[i]);
                }
            } else {
                if (item) {
                    item.remove();
                }
            }

            const badges = slot.querySelectorAll(".pointer-label");
            badges.forEach(b => b.remove());
            drawPointersForSlot(slot, i, f, r);
        }
        updateInfoPanel(f, r, sz);
        return;
    }

    container.innerHTML = "";

    if (queueType === "circular") {
        container.className = "queue-container circular";
        const width = 320;
        const height = 320;
        const radius = 110;
        const centerX = width / 2;
        const centerY = height / 2;

        for (let i = 0; i < CAPACITY; i++) {
            const slot = document.createElement("div");
            slot.className = "queue-slot";
            
            // Circular position calculation
            const angle = (i * (360 / CAPACITY) - 90) * (Math.PI / 180);
            const x = centerX + radius * Math.cos(angle) - 30; // offset half slot size (60px/2 = 30)
            const y = centerY + radius * Math.sin(angle) - 30;

            slot.style.left = `${x}px`;
            slot.style.top = `${y}px`;
            
            // Add slot index indicator inside/above
            const indexLabel = document.createElement("span");
            indexLabel.style.position = "absolute";
            indexLabel.style.fontSize = "11px";
            indexLabel.style.color = "#64748b";
            indexLabel.style.top = "-16px";
            indexLabel.innerText = `[${i}]`;
            slot.appendChild(indexLabel);

            // Populate value if exists
            if (qArr[i] !== null) {
                const item = document.createElement("div");
                item.className = "queue-item";
                item.innerText = qArr[i];
                if (highlights[i]) {
                    item.classList.add(highlights[i]);
                }
                slot.appendChild(item);
            }

            // Draw Front / Rear pointer badges
            drawPointersForSlot(slot, i, f, r);
            container.appendChild(slot);
        }
    } else {
        container.className = "queue-container";
        for (let i = 0; i < CAPACITY; i++) {
            const slot = document.createElement("div");
            slot.className = "queue-slot";

            const indexLabel = document.createElement("span");
            indexLabel.style.position = "absolute";
            indexLabel.style.fontSize = "11px";
            indexLabel.style.color = "#64748b";
            indexLabel.style.top = "-16px";
            indexLabel.innerText = `[${i}]`;
            slot.appendChild(indexLabel);

            if (qArr[i] !== null) {
                const item = document.createElement("div");
                item.className = "queue-item";
                item.innerText = qArr[i];
                if (highlights[i]) {
                    item.classList.add(highlights[i]);
                }
                slot.appendChild(item);
            }

            drawPointersForSlot(slot, i, f, r);
            container.appendChild(slot);
        }
    }

    updateInfoPanel(f, r, sz);
}

// Pointers drawing
function drawPointersForSlot(slotElement, index, f, r) {
    if (f === index && r === index) {
        const badge = document.createElement("span");
        badge.className = "pointer-label pointer-both";
        badge.innerText = "F & R";
        slotElement.appendChild(badge);
    } else if (f === index) {
        const badge = document.createElement("span");
        badge.className = "pointer-label pointer-front";
        badge.innerText = "Front (F)";
        slotElement.appendChild(badge);
    } else if (r === index) {
        const badge = document.createElement("span");
        badge.className = "pointer-label pointer-rear";
        badge.innerText = "Rear (R)";
        slotElement.appendChild(badge);
    }
}

function updateInfoPanel(f, r, sz) {
    document.getElementById("frontPtr").innerText = f === -1 ? "-" : f;
    document.getElementById("rearPtr").innerText = r === -1 ? "-" : r;
    document.getElementById("queueSize").innerText = sz;
}

// Play sound safely
function playSound(audio) {
    audio.currentTime = 0;
    audio.play().catch(e => console.log("Sound blocked by browser policy"));
}

function triggerShakeEffect() {
    const container = document.getElementById("queue-container");
    container.classList.add("queue-error-alert");
    setTimeout(() => {
        container.classList.remove("queue-error-alert");
    }, 500);
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

function resetAnimation() {
    animator.clear();
    renderQueueState(queueData, front, rear, size);
    document.getElementById("explanation").innerText = "Animation reset. Ready.";
}

// ----------------------------------------
// QUEUE OPERATIONS
// ----------------------------------------
function enqueueElement() {
    animator.clear();
    const val = document.getElementById("enqueueValue").value.trim();
    currentOp = { name: "Enqueue", value: val || "-", time: "O(1)", space: "O(1)" };

    if (!val) {
        document.getElementById("explanation").innerText = "Please enter an element value.";
        return;
    }

    if (queueType === "linear") {
        // Linear Queue Overflow checks
        if (rear === CAPACITY - 1) {
            animator.addFrame(queueData, front, rear, size, {}, `OVERFLOW! Simple Linear Queue is full. Rear reaches index ${CAPACITY - 1}. No elements can be added.`, true);
            animator.play();
            return;
        }

        let nextFront = front;
        let nextRear = rear;
        let nextSize = size + 1;

        if (front === -1) {
            nextFront = 0;
            nextRear = 0;
        } else {
            nextRear++;
        }

        let temp = [...queueData];
        animator.addFrame(temp, front, rear, size, {}, `Preparing to Enqueue element "${val}"...`);
        
        temp[nextRear] = val;
        // Highlight enqueued index in Rear colors (blue)
        animator.addFrame(temp, nextFront, nextRear, nextSize, { [nextRear]: 'reared' }, `Enqueued element "${val}" at rear index ${nextRear}. Front moves to ${nextFront}, Rear moves to ${nextRear}.`);

        queueData = temp;
        front = nextFront;
        rear = nextRear;
        size = nextSize;

        playSound(enqueueSound);
        animator.play();

    } else {
        // Circular Queue Overflow check
        if ((rear + 1) % CAPACITY === front) {
            animator.addFrame(queueData, front, rear, size, {}, `OVERFLOW! Circular Queue is full. Formula: (Rear + 1) % Capacity = Front.`, true);
            animator.play();
            return;
        }

        let nextFront = front;
        let nextRear = rear;
        let nextSize = size + 1;

        if (front === -1) {
            nextFront = 0;
            nextRear = 0;
        } else {
            nextRear = (rear + 1) % CAPACITY;
        }

        let temp = [...queueData];
        animator.addFrame(temp, front, rear, size, {}, `Preparing to Enqueue element "${val}"...`);
        
        temp[nextRear] = val;
        animator.addFrame(temp, nextFront, nextRear, nextSize, { [nextRear]: 'reared' }, `Enqueued element "${val}" at circular index ${nextRear}. Front moves to ${nextFront}, Rear wraps to ${nextRear}.`);

        queueData = temp;
        front = nextFront;
        rear = nextRear;
        size = nextSize;

        playSound(enqueueSound);
        animator.play();
    }

    document.getElementById("enqueueValue").value = "";
}

function dequeueElement() {
    animator.clear();
    currentOp = { name: "Dequeue", value: "", time: "O(1)", space: "O(1)" };

    if (front === -1) {
        animator.addFrame(queueData, front, rear, size, {}, "UNDERFLOW! Queue is empty. Cannot dequeue any elements.", true);
        animator.play();
        return;
    }

    let val = queueData[front];
    let nextFront = front;
    let nextRear = rear;
    let nextSize = size - 1;

    let temp = [...queueData];
    animator.addFrame(temp, front, rear, size, { [front]: 'peeked' }, `Preparing to Dequeue element at front index ${front} (value "${val}")...`);
    
    temp[front] = null;

    if (front === rear) {
        // Last item dequeued, reset pointers
        nextFront = -1;
        nextRear = -1;
        animator.addFrame(temp, nextFront, nextRear, nextSize, {}, `Dequeued "${val}". Queue is now empty. Resetting Front and Rear to -1.`);
    } else {
        if (queueType === "linear") {
            nextFront++;
            animator.addFrame(temp, nextFront, nextRear, nextSize, {}, `Dequeued "${val}". Front pointer increments from ${front} to ${nextFront}.`);
        } else {
            nextFront = (front + 1) % CAPACITY;
            animator.addFrame(temp, nextFront, nextRear, nextSize, {}, `Dequeued "${val}". Front pointer wraps from ${front} to ${nextFront}.`);
        }
    }

    queueData = temp;
    front = nextFront;
    rear = nextRear;
    size = nextSize;

    playSound(dequeueSound);
    animator.play();
}

function peekElement() {
    animator.clear();
    currentOp = { name: "Peek / Front", value: "", time: "O(1)", space: "O(1)" };
    if (front === -1) {
        document.getElementById("explanation").innerText = "Peek error: Queue is empty.";
        triggerShakeEffect();
        playSound(errorSound);
        return;
    }

    let val = queueData[front];
    animator.addFrame(queueData, front, rear, size, { [front]: 'peeked' }, `Peek operation: Front element value is "${val}" at index ${front}.`);
    animator.play();
}

function checkIsEmpty() {
    animator.clear();
    currentOp = { name: "Is Empty?", value: "", time: "O(1)", space: "O(1)" };
    const isEmpty = (front === -1);
    
    let highlights = {};
    if (isEmpty) {
        animator.addFrame(queueData, front, rear, size, {}, "Queue is EMPTY (Front is -1, size is 0).");
    } else {
        // highlight all occupied elements
        for (let i = 0; i < CAPACITY; i++) {
            if (queueData[i] !== null) highlights[i] = 'peeked';
        }
        animator.addFrame(queueData, front, rear, size, highlights, `Queue is NOT EMPTY. It contains ${size} elements.`);
    }
    animator.play();
}

function checkIsFull() {
    animator.clear();
    currentOp = { name: "Is Full?", value: "", time: "O(1)", space: "O(1)" };
    let isFull = false;
    
    if (queueType === "linear") {
        isFull = (rear === CAPACITY - 1);
    } else {
        isFull = ((rear + 1) % CAPACITY === front);
    }

    let highlights = {};
    if (isFull) {
        for (let i = 0; i < CAPACITY; i++) highlights[i] = 'reared';
        animator.addFrame(queueData, front, rear, size, highlights, `Queue is FULL (Capacity limit of ${CAPACITY} reached).`);
    } else {
        animator.addFrame(queueData, front, rear, size, {}, `Queue is NOT FULL. Current occupancy: ${size}/${CAPACITY} slots.`);
    }
    animator.play();
}

function clearQueue() {
    initQueue();
    updateExplanation({
        operation: "Clear Queue",
        description: "Queue cleared successfully. Reset front and rear pointers to -1.",
        timeComplexity: "O(1)",
        spaceComplexity: "O(1)"
    });
}