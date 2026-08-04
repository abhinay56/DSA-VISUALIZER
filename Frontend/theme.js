// 1. THIS RUNS IMMEDIATELY ON EVERY PAGE LOAD
function applySavedTheme() {
    const savedTheme = localStorage.getItem("theme") || "dark";
    const body = document.body;

    // Clear existing theme classes
    body.classList.remove("light-mode", "neon-mode");

    if (savedTheme === "light") {
        body.classList.add("light-mode");
    } else if (savedTheme === "neon") {
        body.classList.add("neon-mode");
    }
}

// 2. THIS RUNS ONLY WHEN YOU CLICK THE BUTTON
function toggleTheme() {
    const savedTheme = localStorage.getItem("theme") || "dark";
    let nextTheme = "dark";

    if (savedTheme === "dark") {
        nextTheme = "light";
    } else if (savedTheme === "light") {
        nextTheme = "neon";
    } else {
        nextTheme = "dark";
    }

    localStorage.setItem("theme", nextTheme);
    applySavedTheme();
}

// 3. INITIALIZE: Run the check as soon as the DOM is ready
document.addEventListener("DOMContentLoaded", applySavedTheme);

// 4. MOBILE MENU TOGGLE
function toggleMenu() {
    const nav = document.getElementById("navLinks");
    if (nav) {
        nav.classList.toggle("active");
    }
}