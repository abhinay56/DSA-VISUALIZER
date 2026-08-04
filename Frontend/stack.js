let stack = [];

// SOUND OBJECTS
let pushSound = new Audio();
let popSound = new Audio();

// LOAD SOUNDS (reliable links)
pushSound.src = "https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg";
popSound.src = "https://actions.google.com/sounds/v1/cartoon/pop.ogg";

// PRELOAD
pushSound.load();
popSound.load();

// UNLOCK AUDIO (IMPORTANT FIX)
document.addEventListener("click", () => {
    pushSound.play().then(() => {
        pushSound.pause();
        pushSound.currentTime = 0;
    }).catch(() => {});
}, { once: true });


// ENTER KEY SUPPORT
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("value").addEventListener("keydown", function(e){
        if(e.key === "Enter"){
            push();
        }
    });
    showMessage("Stack is Empty.");
    updateExplanation({
        operation: "Initialize Stack",
        description: "Stack is Empty.",
        timeComplexity: "-",
        spaceComplexity: "-"
    });
});


// RENDER
function render() {

    let container = document.getElementById("stack");
    container.innerHTML = "";

    stack.forEach(val => {
        let box = document.createElement("div");
        box.className = "box";
        box.innerText = val;
        container.appendChild(box);
    });

    updateInfo();
}

// UPDATE INFO
function updateInfo() {
    document.getElementById("size").innerText = stack.length;

    if (stack.length === 0)
        document.getElementById("top").innerText = "-";
    else
        document.getElementById("top").innerText = stack[stack.length - 1];
}

// MESSAGE
function showMessage(msg){
    document.getElementById("message").innerText = msg;
}

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

// SAFE PLAY FUNCTION
function playSound(sound){
    sound.currentTime = 0;
    sound.play().catch(err => {
        console.log("Sound blocked:", err);
    });
}

// PUSH
function push() {

    let val = document.getElementById("value").value;

    if (val === "") return;

    stack.push(val);

    playSound(pushSound);

    showMessage("Pushed: " + val);
    updateExplanation({
        operation: "Push",
        value: val,
        description: `Pushed element ${val} onto the top of the stack.`,
        timeComplexity: "O(1)",
        spaceComplexity: "O(1)"
    });

    document.getElementById("value").value = "";

    render();
}

// POP
function pop() {

    if (stack.length === 0) {
        showMessage("Stack is Empty");
        updateExplanation({
            operation: "Pop",
            description: "Cannot pop from an empty stack (Stack Underflow).",
            timeComplexity: "O(1)",
            spaceComplexity: "O(1)"
        });
        return;
    }

    let container = document.getElementById("stack");
    let last = container.lastChild;

    if (last) {
        last.classList.add("pop");

        setTimeout(() => {
            let removed = stack.pop();

            playSound(popSound);

            showMessage("Popped: " + removed);
            updateExplanation({
                operation: "Pop",
                value: removed,
                description: `Successfully popped element ${removed} from the top of the stack.`,
                timeComplexity: "O(1)",
                spaceComplexity: "O(1)"
            });

            render();
        }, 300);
    }
}

// PEEK
function peek() {

    if (stack.length === 0) {
        showMessage("Stack is Empty");
        updateExplanation({
            operation: "Peek",
            description: "Cannot peek at an empty stack.",
            timeComplexity: "O(1)",
            spaceComplexity: "O(1)"
        });
    } else {
        let val = stack[stack.length - 1];
        showMessage("Top Element: " + val);
        updateExplanation({
            operation: "Peek",
            value: val,
            description: `Peeking top element: value is ${val}.`,
            timeComplexity: "O(1)",
            spaceComplexity: "O(1)"
        });
    }
}

// RESET
function resetStack() {
    stack = [];
    showMessage("Stack Reset");
    updateExplanation({
        operation: "Reset",
        description: "Stack reset to empty. All elements removed.",
        timeComplexity: "O(1)",
        spaceComplexity: "O(1)"
    });
    render();
}