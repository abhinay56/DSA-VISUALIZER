// ARRAY VISUALIZATION LOGIC

// Current array state
let array = [];

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

// Animation Frame Animator
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

    addFrame(arr, highlights = {}, explanation = "", extra = null) {
        this.frames.push({
            array: [...arr],
            highlights: { ...highlights }, // e.g. { 0: 'compare', 1: 'compare' }
            explanation: explanation,
            opName: currentOp.name,
            opVal: currentOp.value,
            opTime: currentOp.time,
            opSpace: currentOp.space,
            extra: extra
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
        renderArrayState(frame.array, frame.highlights);
        updateExplanation({
            operation: frame.opName,
            value: frame.opVal,
            description: frame.explanation,
            timeComplexity: frame.opTime,
            spaceComplexity: frame.opSpace,
            extra: frame.extra
        });
    }
}

const animator = new Animator();

// Initialize on load
document.addEventListener("DOMContentLoaded", () => {
    renderArrayState(array);
    changeSpeed(1000);
    updateExplanation({
        operation: "Initialize Array",
        description: "Array is Empty. Insert elements to begin visualization.",
        timeComplexity: "-",
        spaceComplexity: "-"
    });
});

// Render helper
function renderArrayState(arr, highlights = {}) {
    const container = document.getElementById("array-container");
    container.innerHTML = "";

    if (arr.length === 0) {
        // Show 6 empty slots
        for (let i = 0; i < 6; i++) {
            const wrapper = document.createElement("div");
            wrapper.className = "array-bar-wrapper";

            const bar = document.createElement("div");
            bar.className = "array-bar";
            bar.style.border = "2px dashed #475569";
            bar.style.background = "transparent";
            bar.style.height = "50px";
            bar.style.boxShadow = "none";

            const indexLabel = document.createElement("span");
            indexLabel.className = "array-index";
            indexLabel.innerText = i;

            wrapper.appendChild(bar);
            wrapper.appendChild(indexLabel);
            container.appendChild(wrapper);
        }
        return;
    }

    const maxVal = Math.max(...arr, 1);
    const scale = Math.min(180 / maxVal, 8); // scaling factor, max height 180px

    arr.forEach((val, idx) => {
        const wrapper = document.createElement("div");
        wrapper.className = "array-bar-wrapper";

        const bar = document.createElement("div");
        bar.className = "array-bar";
        bar.innerText = val;
        
        // Calculate height
        const height = 40 + (val * scale);
        bar.style.height = `${height}px`;

        // Apply highlights
        if (highlights[idx]) {
            bar.classList.add(highlights[idx]);
        }

        const indexLabel = document.createElement("span");
        indexLabel.className = "array-index";
        indexLabel.innerText = idx;

        wrapper.appendChild(bar);
        wrapper.appendChild(indexLabel);
        container.appendChild(wrapper);
    });
}

// ----------------------------------------
// PLAYBACK / SPEED CONTROLS
// ----------------------------------------
function togglePlay() {
    if (animator.isPlaying) {
        animator.pause();
    } else {
        if (animator.currentIdx >= animator.frames.length - 1) {
            animator.currentIdx = -1; // restart
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
    const s = (ms / 1000).toFixed(1);
    document.getElementById("speedVal").innerText = s;
}

function resetAnimation() {
    animator.clear();
    renderArrayState(array);
    document.getElementById("explanation").innerText = "Animation reset. Ready.";
}

// ----------------------------------------
// ARRAY GENERATION / SETUP
// ----------------------------------------
function generateRandomArray() {
    animator.clear();
    const size = 5 + Math.floor(Math.random() * 6); // size 5 to 10
    array = [];
    for (let i = 0; i < size; i++) {
        array.push(1 + Math.floor(Math.random() * 49)); // values 1 to 50
    }
    renderArrayState(array);
    document.getElementById("explanation").innerText = `Generated a random array of size ${size}.`;
}

function setCustomArray() {
    animator.clear();
    const input = document.getElementById("customInput").value;
    if (!input.trim()) return;

    const parts = input.split(",").map(p => parseInt(p.trim())).filter(p => !isNaN(p));
    if (parts.length === 0) {
        document.getElementById("explanation").innerText = "Invalid comma-separated input.";
        return;
    }

    array = parts.slice(0, 12); // limit to 12 elements for UI spacing
    renderArrayState(array);
    document.getElementById("explanation").innerText = `Initialized custom array: [${array.join(", ")}].`;
    document.getElementById("customInput").value = "";
}

// ----------------------------------------
// CRUD OPERATIONS
// ----------------------------------------
function insertElement() {
    animator.clear();
    const val = parseInt(document.getElementById("opValue").value);
    let idx = parseInt(document.getElementById("opIndex").value);
    if (isNaN(idx)) idx = array.length;
    currentOp = { name: "Insert", value: isNaN(val) ? "-" : `${val} at index ${idx}`, time: "O(n)", space: "O(1)" };

    if (isNaN(val)) {
        document.getElementById("explanation").innerText = "Please enter a value to insert.";
        return;
    }

    if (isNaN(idx)) {
        idx = array.length; // default insert at end
    }

    if (idx < 0 || idx > array.length) {
        document.getElementById("explanation").innerText = `Index out of bounds. Valid range: 0 to ${array.length}.`;
        return;
    }

    let temp = [...array];
    animator.addFrame(temp, { [idx]: 'active' }, `Prepare to insert ${val} at index ${idx}.`);

    // Shift items animation
    for (let i = temp.length; i > idx; i--) {
        let shifts = {};
        shifts[i - 1] = 'compare';
        temp[i] = temp[i - 1];
        animator.addFrame(temp, shifts, `Shift element ${temp[i]} from index ${i-1} to ${i}.`);
    }

    temp[idx] = val;
    animator.addFrame(temp, { [idx]: 'sorted' }, `Inserted ${val} at index ${idx}.`);
    array = [...temp];

    animator.play();
}

function deleteByIndex() {
    animator.clear();
    const idx = parseInt(document.getElementById("opIndex").value);
    currentOp = { name: "Delete by Index", value: isNaN(idx) ? "-" : `Index ${idx}`, time: "O(n)", space: "O(1)" };

    if (isNaN(idx)) {
        document.getElementById("explanation").innerText = "Please specify an index to delete.";
        return;
    }

    if (idx < 0 || idx >= array.length) {
        document.getElementById("explanation").innerText = `Index out of bounds. Valid range: 0 to ${array.length - 1}.`;
        return;
    }

    let temp = [...array];
    const val = temp[idx];
    animator.addFrame(temp, { [idx]: 'swap' }, `Prepare to delete element ${val} at index ${idx}.`);

    // Shift items
    for (let i = idx; i < temp.length - 1; i++) {
        temp[i] = temp[i + 1];
        animator.addFrame(temp, { [i]: 'compare', [i+1]: 'active' }, `Shift element ${temp[i]} from index ${i+1} to ${i}.`);
    }

    temp.pop();
    animator.addFrame(temp, {}, `Removed last duplicate slot. Element ${val} deleted successfully.`);
    array = [...temp];

    animator.play();
}

function deleteByValue() {
    animator.clear();
    const val = parseInt(document.getElementById("opValue").value);
    currentOp = { name: "Delete by Value", value: isNaN(val) ? "-" : `Value ${val}`, time: "O(n)", space: "O(1)" };

    if (isNaN(val)) {
        document.getElementById("explanation").innerText = "Please specify a value to delete.";
        return;
    }

    const idx = array.indexOf(val);
    if (idx === -1) {
        document.getElementById("explanation").innerText = `Value ${val} not found in array.`;
        return;
    }

    document.getElementById("opIndex").value = idx;
    deleteByIndex();
}

function updateElement() {
    animator.clear();
    const val = parseInt(document.getElementById("opValue").value);
    const idx = parseInt(document.getElementById("opIndex").value);
    currentOp = { name: "Update Element", value: `${val} at index ${idx}`, time: "O(1)", space: "O(1)" };

    if (isNaN(val) || isNaN(idx)) {
        document.getElementById("explanation").innerText = "Please enter both Value and Index.";
        return;
    }

    if (idx < 0 || idx >= array.length) {
        document.getElementById("explanation").innerText = `Index out of bounds. Valid range: 0 to ${array.length - 1}.`;
        return;
    }

    let temp = [...array];
    animator.addFrame(temp, { [idx]: 'compare' }, `Locate element at index ${idx} (current value: ${temp[idx]}).`);
    temp[idx] = val;
    animator.addFrame(temp, { [idx]: 'sorted' }, `Updated element at index ${idx} to ${val}.`);
    array = [...temp];

    animator.play();
}

// ----------------------------------------
// SEARCH & TRAVERSE OPERATIONS
// ----------------------------------------
function traverseArray() {
    animator.clear();
    currentOp = { name: "Traverse", value: "", time: "O(n)", space: "O(1)" };
    let temp = [...array];

    for (let i = 0; i < temp.length; i++) {
        animator.addFrame(temp, { [i]: 'active' }, `Traversing index ${i}: Element value is ${temp[i]}.`);
    }
    animator.addFrame(temp, {}, "Finished traversal of all array elements.");

    animator.play();
}

function reverseArray() {
    animator.clear();
    currentOp = { name: "Reverse Array", value: "", time: "O(n)", space: "O(1)" };
    let temp = [...array];
    let l = 0;
    let r = temp.length - 1;

    while (l < r) {
        animator.addFrame(temp, { [l]: 'compare', [r]: 'compare' }, `Comparing left index ${l} (${temp[l]}) and right index ${r} (${temp[r]}). Swap them.`);
        let t = temp[l];
        temp[l] = temp[r];
        temp[r] = t;
        animator.addFrame(temp, { [l]: 'swap', [r]: 'swap' }, `Swapped elements. New values: left is ${temp[l]}, right is ${temp[r]}.`);
        l++;
        r--;
    }

    animator.addFrame(temp, {}, "Array reversed successfully.");
    array = [...temp];

    animator.play();
}

function linearSearch() {
    animator.clear();
    const val = parseInt(document.getElementById("searchValue").value);
    currentOp = { name: "Linear Search", value: isNaN(val) ? "-" : val, time: "O(n)", space: "O(1)" };

    if (isNaN(val)) {
        document.getElementById("explanation").innerText = "Please enter a search term.";
        return;
    }

    let found = false;
    for (let i = 0; i < array.length; i++) {
        animator.addFrame(array, { [i]: 'compare' }, `Comparing array[${i}] (${array[i]}) with search target ${val}...`);
        if (array[i] === val) {
            animator.addFrame(array, { [i]: 'sorted' }, `Found match! target ${val} is at index ${i}.`);
            found = true;
            break;
        }
    }

    if (!found) {
        animator.addFrame(array, {}, `Linear Search finished. Value ${val} was NOT found in the array.`);
    }

    animator.play();
}

function binarySearch() {
    animator.clear();
    const val = parseInt(document.getElementById("searchValue").value);
    currentOp = { name: "Binary Search", value: isNaN(val) ? "-" : val, time: "O(log n)", space: "O(1)" };

    if (isNaN(val)) {
        document.getElementById("explanation").innerText = "Please enter a search term.";
        return;
    }

    // Binary search requires a sorted array
    // Check if sorted
    let isSorted = true;
    for (let i = 0; i < array.length - 1; i++) {
        if (array[i] > array[i + 1]) {
            isSorted = false;
            break;
        }
    }

    let temp = [...array];
    if (!isSorted) {
        animator.addFrame(temp, {}, "Binary search requires a sorted array. Let's sort the array first.");
        temp.sort((a, b) => a - b);
        animator.addFrame(temp, {}, "Array sorted successfully. Now starting binary search.");
    }

    let l = 0;
    let r = temp.length - 1;
    let found = false;

    while (l <= r) {
        let mid = Math.floor((l + r) / 2);
        
        // Highlight active search boundary in purple (active) and mid in yellow (compare)
        let highlights = {};
        for (let i = l; i <= r; i++) {
            highlights[i] = 'active';
        }
        highlights[mid] = 'compare';

        animator.addFrame(temp, highlights, `Search bounds: [${l} to ${r}]. Midpoint is index ${mid} (value ${temp[mid]}). Compare with target ${val}.`);

        if (temp[mid] === val) {
            animator.addFrame(temp, { [mid]: 'sorted' }, `Found match! target ${val} is at index ${mid}.`);
            found = true;
            break;
        } else if (temp[mid] < val) {
            l = mid + 1;
            animator.addFrame(temp, {}, `${temp[mid]} < ${val}. Target must be in right half. Shifting left pointer to ${l}.`);
        } else {
            r = mid - 1;
            animator.addFrame(temp, {}, `${temp[mid]} > ${val}. Target must be in left half. Shifting right pointer to ${r}.`);
        }
    }

    if (!found) {
        animator.addFrame(temp, {}, `Binary Search finished. Value ${val} was NOT found in the array.`);
    }

    array = [...temp]; // keep sorted array state
    animator.play();
}

// ----------------------------------------
// SORTING ALGORITHMS
// ----------------------------------------
function bubbleSort() {
    animator.clear();
    currentOp = { name: "Bubble Sort", value: "", time: "O(n²)", space: "O(1)" };
    let temp = [...array];
    let n = temp.length;

    for (let i = 0; i < n - 1; i++) {
        for (let j = 0; j < n - i - 1; j++) {
            animator.addFrame(temp, { [j]: 'compare', [j + 1]: 'compare' }, `Comparing element at ${j} (${temp[j]}) and ${j+1} (${temp[j+1]}).`);
            if (temp[j] > temp[j + 1]) {
                let t = temp[j];
                temp[j] = temp[j + 1];
                temp[j + 1] = t;
                animator.addFrame(temp, { [j]: 'swap', [j + 1]: 'swap' }, `Swap: ${temp[j+1]} > ${temp[j]}, swap them.`);
            }
        }
        // Mark sorted
        let sortedHighlights = {};
        for (let s = n - i - 1; s < n; s++) {
            sortedHighlights[s] = 'sorted';
        }
        animator.addFrame(temp, sortedHighlights, `Element at index ${n-i-1} is placed in its final sorted position.`);
    }

    animator.addFrame(temp, temp.reduce((acc, _, idx) => ({ ...acc, [idx]: 'sorted' }), {}), "Bubble Sort completed! Entire array is sorted.");
    array = [...temp];

    animator.play();
}

function selectionSort() {
    animator.clear();
    currentOp = { name: "Selection Sort", value: "", time: "O(n²)", space: "O(1)" };
    let temp = [...array];
    let n = temp.length;

    for (let i = 0; i < n - 1; i++) {
        let minIdx = i;
        animator.addFrame(temp, { [i]: 'active' }, `Pass ${i+1}: Assume current element at index ${i} (${temp[i]}) is the minimum.`);

        for (let j = i + 1; j < n; j++) {
            animator.addFrame(temp, { [j]: 'compare', [minIdx]: 'active' }, `Compare current minimum (${temp[minIdx]}) with element at ${j} (${temp[j]}).`);
            if (temp[j] < temp[minIdx]) {
                minIdx = j;
                animator.addFrame(temp, { [minIdx]: 'swap' }, `New minimum found at index ${minIdx} (value ${temp[minIdx]}).`);
            }
        }

        if (minIdx !== i) {
            let t = temp[i];
            temp[i] = temp[minIdx];
            temp[minIdx] = t;
            animator.addFrame(temp, { [i]: 'swap', [minIdx]: 'swap' }, `Swap minimum element ${temp[i]} with element at index ${i}.`);
        }

        // Highlight sorted prefix
        let sortedHighlights = {};
        for (let s = 0; s <= i; s++) {
            sortedHighlights[s] = 'sorted';
        }
        animator.addFrame(temp, sortedHighlights, `Sorted prefix from index 0 to ${i}.`);
    }

    animator.addFrame(temp, temp.reduce((acc, _, idx) => ({ ...acc, [idx]: 'sorted' }), {}), "Selection Sort completed!");
    array = [...temp];

    animator.play();
}

function insertionSort() {
    animator.clear();
    currentOp = { name: "Insertion Sort", value: "", time: "O(n²)", space: "O(1)" };
    let temp = [...array];
    let n = temp.length;

    for (let i = 1; i < n; i++) {
        let key = temp[i];
        let j = i - 1;
        
        animator.addFrame(temp, { [i]: 'active' }, `Inspecting element ${key} at index ${i} for insertion into sorted prefix.`);

        while (j >= 0 && temp[j] > key) {
            animator.addFrame(temp, { [j]: 'compare', [j + 1]: 'compare' }, `Is ${temp[j]} > key (${key})? Yes, shift ${temp[j]} right.`);
            temp[j + 1] = temp[j];
            j = j - 1;
            animator.addFrame(temp, { [j + 1]: 'swap' }, `Element shifted right.`);
        }
        
        temp[j + 1] = key;
        
        // Highlight current sorted portion
        let sortedHighlights = {};
        for (let s = 0; s <= i; s++) {
            sortedHighlights[s] = 'sorted';
        }
        animator.addFrame(temp, sortedHighlights, `Inserted key ${key} at index ${j + 1}.`);
    }

    animator.addFrame(temp, temp.reduce((acc, _, idx) => ({ ...acc, [idx]: 'sorted' }), {}), "Insertion Sort completed!");
    array = [...temp];

    animator.play();
}

function mergeSort() {
    animator.clear();
    currentOp = { name: "Merge Sort", value: "", time: "O(n log n)", space: "O(n)" };
    let temp = [...array];
    
    function mergeSortHelper(arr, l, r) {
        if (l >= r) return;
        let m = Math.floor((l + r) / 2);
        
        animator.addFrame(temp, getRangeHighlights(l, r, 'active'), `Divide sub-array [${l} to ${r}] into halves: [${l} to ${m}] and [${m + 1} to ${r}].`);
        
        mergeSortHelper(arr, l, m);
        mergeSortHelper(arr, m + 1, r);
        merge(arr, l, m, r);
    }

    function merge(arr, l, m, r) {
        let n1 = m - l + 1;
        let n2 = r - m;
        let L = [];
        let R = [];

        for (let i = 0; i < n1; i++) L.push(arr[l + i]);
        for (let j = 0; j < n2; j++) R.push(arr[m + 1 + j]);

        let i = 0, j = 0, k = l;
        while (i < n1 && j < n2) {
            // Highlight comparing items
            let compareHighlights = getRangeHighlights(l, r, 'active');
            compareHighlights[l + i] = 'compare';
            compareHighlights[m + 1 + j] = 'compare';
            animator.addFrame(temp, compareHighlights, `Merging: Comparing L[${i}] (${L[i]}) and R[${j}] (${R[j]})`);

            if (L[i] <= R[j]) {
                arr[k] = L[i];
                i++;
            } else {
                arr[k] = R[j];
                j++;
            }
            // Update the animation display array copy
            temp[k] = arr[k];
            compareHighlights = getRangeHighlights(l, r, 'active');
            compareHighlights[k] = 'swap';
            animator.addFrame(temp, compareHighlights, `Merged smaller element back into array at index ${k} (value ${temp[k]}).`);
            k++;
        }

        while (i < n1) {
            arr[k] = L[i];
            temp[k] = arr[k];
            let compareHighlights = getRangeHighlights(l, r, 'active');
            compareHighlights[k] = 'swap';
            animator.addFrame(temp, compareHighlights, `Copy remaining element L[${i}] (${L[i]}) back at index ${k}.`);
            i++;
            k++;
        }

        while (j < n2) {
            arr[k] = R[j];
            temp[k] = arr[k];
            let compareHighlights = getRangeHighlights(l, r, 'active');
            compareHighlights[k] = 'swap';
            animator.addFrame(temp, compareHighlights, `Copy remaining element R[${j}] (${R[j]}) back at index ${k}.`);
            j++;
            k++;
        }

        animator.addFrame(temp, getRangeHighlights(l, r, 'sorted'), `Sub-array [${l} to ${r}] merged successfully.`);
    }

    function getRangeHighlights(start, end, type) {
        let highlights = {};
        for (let i = start; i <= end; i++) {
            highlights[i] = type;
        }
        return highlights;
    }

    mergeSortHelper(temp, 0, temp.length - 1);
    animator.addFrame(temp, temp.reduce((acc, _, idx) => ({ ...acc, [idx]: 'sorted' }), {}), "Merge Sort completed!");
    array = [...temp];

    animator.play();
}

function quickSort() {
    animator.clear();
    currentOp = { name: "Quick Sort", value: "", time: "Best: O(n log n), Worst: O(n²)", space: "O(log n)" };
    let temp = [...array];

    function quickSortHelper(arr, low, high) {
        if (low < high) {
            let pi = partition(arr, low, high);
            quickSortHelper(arr, low, pi - 1);
            quickSortHelper(arr, pi + 1, high);
        } else if (low >= 0 && low < arr.length) {
            // mark single element range as sorted
            animator.addFrame(temp, { [low]: 'sorted' }, `Range [${low}] is trivially sorted.`);
        }
    }

    function partition(arr, low, high) {
        let pivot = arr[high];
        
        let initialHighlights = getPartitionHighlights(low, high, -1);
        initialHighlights[high] = 'compare'; // Pivot in gold/compare color
        animator.addFrame(temp, initialHighlights, `Partitioning: pivot selected at high index ${high} (value ${pivot}).`);

        let i = low - 1;

        for (let j = low; j < high; j++) {
            let stepHighlights = getPartitionHighlights(low, high, i);
            stepHighlights[high] = 'compare';
            stepHighlights[j] = 'active'; // checking index j
            animator.addFrame(temp, stepHighlights, `Inspect index ${j} (${arr[j]}). Compare with pivot (${pivot}).`);

            if (arr[j] < pivot) {
                i++;
                let t = arr[i];
                arr[i] = arr[j];
                arr[j] = t;
                temp[i] = arr[i];
                temp[j] = arr[j];

                let swapHighlights = getPartitionHighlights(low, high, i);
                swapHighlights[high] = 'compare';
                swapHighlights[i] = 'swap';
                swapHighlights[j] = 'swap';
                animator.addFrame(temp, swapHighlights, `${arr[i]} < pivot (${pivot}). Increment lower boundary index to ${i} and swap arr[${i}] and arr[${j}].`);
            }
        }

        let t = arr[i + 1];
        arr[i + 1] = arr[high];
        arr[high] = t;
        temp[i + 1] = arr[i + 1];
        temp[high] = arr[high];

        let finalHighlights = getPartitionHighlights(low, high, i + 1);
        finalHighlights[i + 1] = 'sorted';
        animator.addFrame(temp, finalHighlights, `Partition completed. Swapping pivot to its final position at index ${i + 1}.`);
        return i + 1;
    }

    function getPartitionHighlights(low, high, pIdx) {
        let highlights = {};
        for (let i = low; i <= high; i++) {
            highlights[i] = 'active'; // purple for active sub-segment
        }
        if (pIdx >= 0) {
            highlights[pIdx] = 'swap';
        }
        return highlights;
    }

    quickSortHelper(temp, 0, temp.length - 1);
    animator.addFrame(temp, temp.reduce((acc, _, idx) => ({ ...acc, [idx]: 'sorted' }), {}), "Quick Sort completed!");
    array = [...temp];

    animator.play();
}