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
    
    // Update theme icons across pages
    updateThemeToggleIcons(savedTheme);
}

// Update icons based on current theme (now handled cleanly via CSS classes on document.body)
function updateThemeToggleIcons(theme) {
    // Left empty since CSS animations swap Sun/Moon/Zap SVG vectors automatically based on body classes
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

// 3. INITIALIZE NAVBAR LOGIC & THEME ON DOM CONTENT LOADED
document.addEventListener("DOMContentLoaded", () => {
    applySavedTheme();
    initPremiumNavbar();
});

// 4. PREMIUM NAVBAR FUNCTIONALITY
function initPremiumNavbar() {
    // 4.1 Highlight Active Page
    const path = window.location.pathname;
    const pageName = path.substring(path.lastIndexOf('/') + 1) || "index.html";
    
    // Reset active states
    document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
    document.querySelectorAll(".drawer-link").forEach(l => l.classList.remove("active"));

    // Find and highlight links
    let activeId = "";
    if (pageName === "index.html" || pageName === "") {
        if (window.location.hash === "#learn") {
            activeId = "learn";
        } else {
            activeId = "home";
        }
    } else if (pageName.includes("arrays")) {
        activeId = "arrays";
    } else if (pageName.includes("stack")) {
        activeId = "stack";
    } else if (pageName.includes("queue")) {
        activeId = "queue";
    } else if (pageName.includes("linkedlist")) {
        activeId = "linkedlist";
    } else if (pageName.includes("trees")) {
        activeId = "trees";
    } else if (pageName.includes("graphs")) {
        activeId = "graphs";
    } else if (pageName.includes("feedback")) {
        activeId = "feedback";
    }

    if (activeId) {
        const desktopLink = document.getElementById(`link-${activeId}`);
        const drawerLink = document.getElementById(`drawer-link-${activeId}`);
        if (desktopLink) desktopLink.classList.add("active");
        if (drawerLink) drawerLink.classList.add("active");
    }

    // Handle hash change for learn smooth scrolling
    if (window.location.hash === "#learn") {
        scrollToLearnSection();
    }

    window.addEventListener("hashchange", () => {
        if (window.location.hash === "#learn") {
            scrollToLearnSection();
            document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
            const learnLink = document.getElementById("link-learn");
            if (learnLink) learnLink.classList.add("active");
        }
    });

    // Add click listeners to learn link for smooth scrolling
    const learnLinks = [document.getElementById("link-learn"), document.getElementById("drawer-link-learn")];
    learnLinks.forEach(link => {
        if (link) {
            link.addEventListener("click", (e) => {
                if (pageName === "index.html" || pageName === "") {
                    e.preventDefault();
                    window.location.hash = "learn";
                    scrollToLearnSection();
                }
            });
        }
    });

    // 4.2 Scroll Effect on Header
    const navbar = document.querySelector(".premium-navbar");
    if (navbar) {
        window.addEventListener("scroll", () => {
            if (window.scrollY > 20) {
                navbar.classList.add("scrolled");
            } else {
                navbar.classList.remove("scrolled");
            }
        });
        // Run once on load in case page is already scrolled
        if (window.scrollY > 20) {
            navbar.classList.add("scrolled");
        }
    }

    // 4.3 Initialize Profile State
    updateProfileUI();


}

// Scroll smoothly to learn section
function scrollToLearnSection() {
    const learnContainer = document.querySelector(".learn-container");
    if (learnContainer) {
        setTimeout(() => {
            learnContainer.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }
}

// Toggle Mobile Drawer
function toggleMobileDrawer() {
    const drawer = document.getElementById("mobileNavDrawer");
    if (drawer) {
        drawer.classList.toggle("active");
    }
}



// 4.5 Profile/Login Logic
function handleProfileClick() {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (isLoggedIn) {
        // Toggle logout
        if (confirm("Do you want to logout?")) {
            localStorage.setItem("isLoggedIn", "false");
            updateProfileUI();
        }
    } else {
        // Mock Login
        const username = prompt("Enter username to login:");
        if (username) {
            localStorage.setItem("isLoggedIn", "true");
            localStorage.setItem("username", username);
            updateProfileUI();
        }
    }
}

function updateProfileUI() {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    const avatarImg = document.getElementById("profileAvatarImg");
    const loginText = document.getElementById("loginTextBtn");

    if (avatarImg && loginText) {
        if (isLoggedIn) {
            avatarImg.style.display = "block";
            loginText.style.display = "none";
        } else {
            avatarImg.style.display = "none";
            loginText.style.display = "block";
        }
    }
}

// Old Mobile Menu Toggle (backward compatibility for old template files if any)
function toggleMenu() {
    toggleMobileDrawer();
}