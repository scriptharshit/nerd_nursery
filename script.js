
"use strict";

/* ========================================
   1. Helpers and shared state
======================================== */

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

let audioContext = null;
let soundEnabled = true;
let notesPlayed = 0;
let melodyToken = 0;
let currentPdfUrl = null;
let pdfPage = 1;

const speechBubble = $("#speech-bubble");
const pianoStatus = $("#piano-status");

const originalSpeech = [
    "🤓 My IQ is higher than your Wi-Fi speed.",
    "Actually, that's scientifically incorrect.",
    "I was born intelligent. You had to download it.",
    "Bro really thought that was a good argument.",
    "Respectfully, your take needs a software update."
];

const books = [
    {
        title: "The Moon's Homework",
        chapter: "CHAPTER ONE",
        paragraphs: [
            "The moon had forgotten to finish its homework.",
            "“I was busy orbiting,” it explained. “Honestly, school should understand celestial responsibilities.”",
            "Earth sighed. Another late assignment. Classic moon behaviour."
        ]
    },
    {
        title: "Tiny Science",
        chapter: "CHAPTER ONE",
        paragraphs: [
            "Nero mixed two harmless-looking liquids and put on his safety goggles.",
            "Nothing exploded. He looked disappointed.",
            "“Science is mostly patience,” his teacher said. Nero immediately requested a refund."
        ]
    },
    {
        title: "Dragon Algebra",
        chapter: "CHAPTER ONE",
        paragraphs: [
            "A dragon guarded a treasure chest containing one mysterious number.",
            "If x plus seven equalled twelve, what was x?",
            "The dragon roared. Nero answered five and asked whether the dragon had considered revising its curriculum."
        ]
    },
    {
        title: "The Piano Planet",
        chapter: "CHAPTER ONE",
        paragraphs: [
            "On a tiny planet, every mountain had seven piano keys.",
            "When the wind blew, the mountains played a song that made the stars wiggle.",
            "Nero called it a masterpiece. The stars called it noise pollution."
        ]
    },
    {
        title: "Space for Babies",
        chapter: "CHAPTER ONE",
        paragraphs: [
            "Space is enormous, dark, and full of things we are still learning about.",
            "Nero packed a sandwich, three pencils, and an unreasonable amount of confidence.",
            "His first discovery was that sandwiches float when you forget gravity exists."
        ]
    },
    {
        title: "How to Touch Grass",
        chapter: "CHAPTER ONE",
        paragraphs: [
            "Step one: close the laptop.",
            "Step two: walk outside and locate a patch of grass.",
            "Nero touched one blade. “Interesting texture,” he said, then went back inside to write a 40-page report."
        ]
    }
];


/* ========================================
   2. Dialogue
======================================== */

function say(message) {
    speechBubble.textContent = message;
}

function randomRagebait() {
    const message = originalSpeech[
        Math.floor(Math.random() * originalSpeech.length)
    ];

    say(message);

    const character = $(".character");

    if (character) {
        character.animate(
            [
                { transform: "rotate(0deg) scale(1)" },
                { transform: "rotate(-5deg) scale(1.04)" },
                { transform: "rotate(5deg) scale(1.04)" },
                { transform: "rotate(0deg) scale(1)" }
            ],
            {
                duration: 350,
                easing: "ease-out"
            }
        );
    }
}


/* ========================================
   3. Activity panel navigation
======================================== */

const panels = {
    piano: {
        element: $("#piano-panel"),
        title: "The Piano of Doom",
        subtitle: "Play a song. Nero will absolutely judge it."
    },
    library: {
        element: $("#library-panel"),
        title: "The Cozy Library",
        subtitle: "Six books, one night light, zero overdue fees."
    },
    study: {
        element: $("#study-panel"),
        title: "Young Sheldon Mode",
        subtitle: "A study plan from a baby with suspicious confidence."
    }
};

function openPanel(name) {
    const selected = panels[name];

    if (!selected) {
        return;
    }

    Object.values(panels).forEach((panel) => {
        panel.element.classList.add("hidden");
    });

    selected.element.classList.remove("hidden");

    $("#workspace-title").textContent = selected.title;
    $("#workspace-subtitle").textContent = selected.subtitle;

    $("#workspace").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    if (name === "piano") {
        say("🎹 Observe a true musical genius. Try not to cry.");
    }

    if (name === "library") {
        say("📚 Reading is cool. I knew that before it was cool.");
    }

    if (name === "study") {
        say("🧠 Finally, someone who understands the value of a timetable.");
    }
}

$$("[data-open]").forEach((button) => {
    button.addEventListener("click", () => {
        openPanel(button.dataset.open);
    });
});

$$("[data-close]").forEach((button) => {
    button.addEventListener("click", () => {
        stopMelody();

        Object.values(panels).forEach((panel) => {
            panel.element.classList.add("hidden");
        });

        $("#workspace-title").textContent = "Your next adventure awaits";
        $("#workspace-subtitle").textContent =
            "Choose an activity above to begin.";
    });
});


/* ========================================
   4. Web Audio piano
======================================== */

function playClickSound() {
    // If the user has muted the sound, do absolutely nothing
    if (!soundEnabled) {
        return;
    }

    const context = getAudioContext();
    if (!context) {
        return;
    }

     // Modern browsers require a safety check to wake up the engine
    if (context.state === "suspended") {
        context.resume();
    }

    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    const now = context.currentTime;

    // Use a high triangle wave for a gentle "pop/click" instead of a harsh beep
    oscillator.type = "triangle"; 
    // Quickly sweep the frequency downwards to mimic a natural button snap
    oscillator.frequency.setValueAtTime(400, now);
    oscillator.frequency.exponentialRampToValueAtTime(150, now + 0.05);

    // Fast volume envelope to keep it tight and snappy
    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.linearRampToValueAtTime(0,12, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.start(now);
    oscillator.stop(now + 0.09);
}


function getAudioContext() {
    if (!audioContext) {
        const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClass) {
            say("Your browser does not support Web Audio. Try a newer browser.");
            return null;
        }

        audioContext = new AudioContextClass();
    }

    if (audioContext.state === "suspended") {
        audioContext.resume();
    }

    return audioContext;
}

function playNote(noteIndex, countNote = true) {
    if (!soundEnabled) {
        return;
    }

    const context = getAudioContext();

    if (!context) {
        return;
    }

    const frequencies = [
        261.63,
        293.66,
        329.63,
        349.23,
        392.00,
        440.00,
        493.88
    ];

    const frequency = frequencies[noteIndex];

    if (!frequency) {
        return;
    }

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.22, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.48);

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start(now);
    oscillator.stop(now + 0.5);

    const key = $(`.key[data-note="${noteIndex}"]`);

    if (key) {
        key.classList.add("active");

        window.setTimeout(() => {
            key.classList.remove("active");
        }, 150);
    }

    if (countNote) {
        notesPlayed += 1;
        pianoStatus.textContent = `Notes played: ${notesPlayed}`;
    }
}

$$(".key").forEach((key) => {
    key.addEventListener("click", () => {
        stopMelody();
        playNote(Number(key.dataset.note));
    });
});

const keyboardNotes = {
    a: 0,
    s: 1,
    d: 2,
    f: 3,
    g: 4,
    h: 5,
    j: 6
};

document.addEventListener("keydown", (event) => {
    if (
        event.repeat ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey
    ) {
        return;
    }

    const tag = document.activeElement?.tagName;

    if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) {
        return;
    }

    const noteIndex = keyboardNotes[event.key.toLowerCase()];

    if (noteIndex !== undefined && !$("#piano-panel").classList.contains("hidden")) {
        stopMelody();
        playNote(noteIndex);
    }
});

function stopMelody() {
    // Invalidates any melody currently waiting between notes.
    melodyToken += 1;
}

async function playMelody() {
    stopMelody();

    const myToken = melodyToken;
    const melody = [
        0, 2, 4, 2,
        0, 0, 0,
        2, 2, 2,
        0, 4, 4
    ];

    say("🎼 Behold: Nero's Grammy-winning performance.");

    for (const noteIndex of melody) {
        if (myToken !== melodyToken) {
            return;
        }

        playNote(noteIndex);
        await new Promise((resolve) => window.setTimeout(resolve, 330));
    }

    if (myToken === melodyToken) {
        say("🎹 Thank you. Autographs are available after the concert.");
    }
}

$("#demo-song").addEventListener("click", playMelody);

$("#interrupt").addEventListener("click", () => {
    stopMelody();
    randomRagebait();
});

$("#clear-song").addEventListener("click", () => {
    stopMelody();
    notesPlayed = 0;
    pianoStatus.textContent = "Notes played: 0";
    say("Piano stats reset. Your musical crimes have been erased.");
});


/* ========================================
   5. Library and night light
======================================== */

function renderBook(index) {
    const book = books[index];

    if (!book) {
        return;
    }

    const page = $("#book-page");

    page.replaceChildren();

    const chapter = document.createElement("p");
    chapter.className = "eyebrow";
    chapter.textContent = book.chapter;

    const heading = document.createElement("h3");
    heading.textContent = book.title;

    page.append(chapter, heading);

    book.paragraphs.forEach((paragraphText) => {
        const paragraph = document.createElement("p");
        paragraph.textContent = paragraphText;
        page.appendChild(paragraph);
    });

    $$(".book-choice").forEach((button) => {
        button.classList.toggle(
            "selected",
            Number(button.dataset.book) === index
        );
    });

    say(`📖 Blu is reading "${book.title}"`);
}

$$(".book-choice").forEach((button) => {
    button.addEventListener("click", () => {
        renderBook(Number(button.dataset.book));
    });
});

let lampOn = false;

$("#lamp-toggle").addEventListener("click", () => {
    lampOn = !lampOn;

    $("#lamp-box").classList.toggle("lamp-on", lampOn);

    $("#lamp-toggle").textContent = lampOn
        ? "☾ Turn off night light"
        : "☼ Turn on night light";

    $("#lamp-message").textContent = lampOn
        ? 'Blu: "Perfect. The vibes are immaculate. Opening my book now."'
        : 'Blu: "HELLO? I cannot read in darkness. Activate the cozy photons."';

    say(
        lampOn
            ? "🌙 Night light activated. Cozy reading mode enabled."
            : "💡 Night light off. Nero has filed a complaint."
    );
});


/* ========================================
   6. PDF loading and drag-and-drop
======================================== */

function loadPdf(file) {
    if (!file) {
        return;
    }

    const isPdf =
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
        $("#pdf-status").textContent = "Please select a PDF file.";
        return;
    }

    if (currentPdfUrl) {
        URL.revokeObjectURL(currentPdfUrl);
    }

    currentPdfUrl = URL.createObjectURL(file);
    pdfPage = 1;

    $("#pdf-name").textContent = file.name;
    $("#pdf-status").textContent = "PDF loaded locally in your browser.";
    $("#pdf-viewer").classList.remove("hidden");

    updatePdfPage();

    say("📚 Your book is ready. Nero has temporarily stopped judging you.");
}

function updatePdfPage() {
    if (!currentPdfUrl) {
        return;
    }

    $("#pdf-frame").src = `${currentPdfUrl}#page=${pdfPage}&toolbar=1`;
    $("#pdf-page-count").textContent = `Page ${pdfPage}`;
}

$("#pdf-file").addEventListener("change", (event) => {
    loadPdf(event.target.files[0]);
});

const dropZone = $("#drop-zone");

["dragenter", "dragover"].forEach((eventName) => {
    dropZone.addEventListener(eventName, (event) => {
        event.preventDefault();
        dropZone.classList.add("drag-over");
    });
});

["dragleave", "drop"].forEach((eventName) => {
    dropZone.addEventListener(eventName, (event) => {
        event.preventDefault();
        dropZone.classList.remove("drag-over");
    });
});

dropZone.addEventListener("drop", (event) => {
    const file = event.dataTransfer.files[0];
    loadPdf(file);
});

$("#pdf-prev").addEventListener("click", () => {
    if (pdfPage > 1) {
        pdfPage -= 1;
        updatePdfPage();
    }
});

$("#pdf-next").addEventListener("click", () => {
    pdfPage += 1;
    updatePdfPage();
});


/* ========================================
   7. Study-plan generator
======================================== */

const examDateInput = $("#exam-date");

// Set the earliest selectable exam date to today.
const today = new Date();
const localToday = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0")
].join("-");

examDateInput.min = localToday;
examDateInput.value = localToday;

$("#study-form").addEventListener("submit", (event) => {
    event.preventDefault();

    const subject = $("#subject").value.trim();
    const examDate = new Date(`${examDateInput.value}T12:00:00`);
    const hours = Number($("#hours").value);
    const difficulty = Number($("#difficulty").value);

    if (!subject || Number.isNaN(examDate.getTime()) || hours < 1) {
        return;
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const daysRemaining = Math.max(
        1,
        Math.ceil((examDate.getTime() - now.getTime()) / 86400000)
    );

    const dailyStudyHours = Math.min(hours, 12);
    const totalHours = dailyStudyHours * daysRemaining;

    const breakMinutes = difficulty === 3 ? 10 : 5;
    const focusMinutes = difficulty === 3 ? 25 : 40;

    const tasks = [
        `Review the core concepts of ${subject}.`,
        `Practise questions and write down mistakes.`,
        "Use active recall: close the notes and explain the topic from memory.",
        "Finish with a short review of the hardest material."
    ];

    const result = $("#study-result");
    result.replaceChildren();

    const heading = document.createElement("h4");
    heading.textContent = `Nero's plan for ${subject}`;

    const summary = document.createElement("p");
    summary.textContent =
        `${daysRemaining} day(s) until your exam. ` +
        `At ${dailyStudyHours} hour(s) daily, you have about ` +
        `${totalHours} scheduled study hour(s).`;

    const routine = document.createElement("p");
    routine.textContent =
        `Try ${focusMinutes} minutes of focused work, followed by ` +
        `${breakMinutes} minutes of rest. Adjust the intervals to suit you.`;

    const list = document.createElement("ol");

    tasks.forEach((task) => {
        const item = document.createElement("li");
        item.textContent = task;
        list.appendChild(item);
    });

    const warning = document.createElement("p");
    warning.className = "microcopy";
    warning.textContent =
        "This is a general template, not a personalised assessment of your syllabus. " +
        "Adjust it to your topics, deadlines, and progress.";

    result.append(heading, summary, routine, list, warning);
    result.classList.remove("hidden");

    say("🧠 Study plan generated. Now the difficult part: actually studying.");
});


/* ========================================
   8. Sound toggle
======================================== */

$("#sound-toggle").addEventListener("click", () => {
    soundEnabled = !soundEnabled;

    $("#sound-toggle").textContent = soundEnabled ? "♫" : "🔇";
    $("#sound-toggle").setAttribute(
        "aria-label",
        soundEnabled ? "Mute piano sound" : "Enable piano sound"
    );

    if (!soundEnabled) {
        stopMelody();
        say("🔇 Silence. Blu is composing internally.");
    } else {
        say("♫ Sound enabled. The concert may resume.");
    }
});


/* ========================================
   9. Hidden Easter egg
======================================== */

let secretClicks = 0;
let secretResetTimer = null;

$("#secret-button").addEventListener("click", () => {
    secretClicks += 1;

    window.clearTimeout(secretResetTimer);

    if (secretClicks >= 5) {
        secretClicks = 0;
        say("⭐ SECRET UNLOCKED: Blu's IQ is 404. Intelligence not found.");
        window.alert(
            "SECRET UNLOCKED!\n\n" +
            "Blu's forbidden academic achievement:\n" +
            "He got 100% on a test he wrote himself."
        );
        return;
    }

    secretResetTimer = window.setTimeout(() => {
        secretClicks = 0;
    }, 1800);
});


/* ========================================
   10. Initial page setup
======================================== */

renderBook(0);

console.log("Tiny Genius is ready. Please do not feed Blu bad takes.");

// Attach a click sound listener globally to all clickable elements
document.addEventListener("click", (event) => {
    const target = event.target;
    
    // Check if the clicked element (or its parent) is a button or link
    const isClickable = target.closest("button, a, [role='button'], .key, .book-choice");
    
    // Exclude the sound toggle button itself so clicking "Mute" stays silent when turning off
    const isSoundToggle = target.closest("#sound-toggle");

    if (isClickable && !isSoundToggle) {
        playClickSound();
    }
});

/* ========================================
   GLOBAL CLICK SOUND SYSTEM (DYNAMIC PITCH)
======================================== */
(function() {
    let clickAudioContext = null;

    document.addEventListener("mousedown", function(event) {
        // 1. Check if the app's sound toggle is set to muted
        if (typeof soundEnabled !== "undefined" && !soundEnabled) {
            return; 
        }

        // 2. Skip playing the click sound if the user clicked the mute button itself
        const target = event.target;
        if (target.closest("#sound-toggle")) {
            return;
        }

        // 3. Determine if the element clicked is an interactive element
        const closeBtn = target.closest("[data-close]");
        const openBtn = target.closest("[data-open], .book-choice, #lamp-toggle, #demo-song");
        const regularClickable = target.closest("button, a, [role='button']");

        if (!closeBtn && !openBtn && !regularClickable) {
            return; // Ignore clicking empty void spaces
        }

        try {
            // 4. Lazy load context
            if (!clickAudioContext) {
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                if (!AudioContextClass) return;
                clickAudioContext = new AudioContextClass();
            }
            if (clickAudioContext.state === "suspended") {
                clickAudioContext.resume();
            }

            const osc = clickAudioContext.createOscillator();
            const gain = clickAudioContext.createGain();
            const now = clickAudioContext.currentTime;

            osc.type = "sine";

            // 5. AUDIO VARIANCE LOGIC BASED ON USER INTENT
            if (closeBtn) {
                // Descending tone for closing panels (Sad error/exit sound)
                osc.frequency.setValueAtTime(450, now);
                osc.frequency.exponentialRampToValueAtTime(200, now + 0.08);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
                osc.connect(gain);
                gain.connect(clickAudioContext.destination);
                osc.start(now);
                osc.stop(now + 0.1);
            } 
            else if (openBtn) {
                // Ascending bright chime for opening a book, light, or panel
                osc.frequency.setValueAtTime(520, now);
                osc.frequency.exponentialRampToValueAtTime(880, now + 0.06);
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
                osc.connect(gain);
                gain.connect(clickAudioContext.destination);
                osc.start(now);
                osc.stop(now + 0.08);
            } 
            else {
                // Regular classic UI snappy button click
                osc.frequency.setValueAtTime(580, now);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
                osc.connect(gain);
                gain.connect(clickAudioContext.destination);
                osc.start(now);
                osc.stop(now + 0.04);
            }
        } catch (error) {
            console.error("Audio engine failed: ", error);
        }
    });
})();

/* ========================================
   11. NERO'S RETRO ARCADE MINI-GAME
======================================== */
(function() {
    const canvas = document.getElementById("gameCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const startBtn = document.getElementById("start-game-btn");
    const gameOverScreen = document.getElementById("game-over-screen");
    const scoreDisplay = document.getElementById("game-score");
    const highScoreDisplay = document.getElementById("game-high-score");

    let score = 0;
    let highScore = 0;
    let gameActive = true;
    let playerX = 180;
    const playerY = 260;
    const playerSize = 30;
    let fallingObjects = [];
    let spawnTimer = 0;

    // Game loop
    function updateGame() {
        if (!gameActive) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw Player (Nero's Pixel Brain)
        ctx.fillStyle = "#f5cbdc"; // Pink
        ctx.fillRect(playerX, playerY, playerSize, playerSize);
        ctx.fillStyle = "#443b48";
        ctx.font = "14px Arial";
        ctx.fillText("🧠", playerX + 4, playerY + 20);

        // Spawn logic
        spawnTimer++;
        if (spawnTimer % 45 === 0) {
            const isGood = Math.random() > 0.4;
            fallingObjects.push({
                x: Math.random() * (canvas.width - 20),
                y: -20,
                size: 20,
                speed: 3 + Math.random() * 3,
                type: isGood ? "A+" : "F"
            });
        }

        // Move and draw items
        for (let i = fallingObjects.length - 1; i >= 0; i--) {
            let obj = fallingObjects[i];
            obj.y += obj.speed;

            // Render grade texts
            ctx.font = "bold 16px monospace";
            ctx.fillStyle = obj.type === "A+" ? "#cbdcf5" : "#f5cbdc";
            ctx.fillText(obj.type, obj.x, obj.y);

            // Collision check
            if (obj.y > playerY && obj.y < playerY + playerSize &&
                obj.x > playerX - 10 && obj.x < playerX + playerSize) {
                
                if (obj.type === "A+") {
                    score += 10;
                    scoreDisplay.textContent = `Score: ${score}`;
                    if (typeof playClickSound === "function") playClickSound();
                } else {
                    endGame();
                }
                fallingObjects.splice(i, 1);
                continue;
            }

            // Remove off-screen elements
            if (obj.y > canvas.height) {
                fallingObjects.splice(i, 1);
            }
        }

        requestAnimationFrame(updateGame);
    }

    function endGame() {
        gameActive = false;
        if (score > highScore) {
            highScore = score;
            highScoreDisplay.textContent = `High Score: ${highScore}`;
        }
        document.getElementById("final-score").textContent = `Score: ${score}`;
        gameOverScreen.classList.remove("hidden");
        if (typeof say === "function") say("🎮 Game Over! Your score represents significant baseline error.");
    }

    function resetGame() {
        score = 0;
        scoreDisplay.textContent = "Score: 0";
        fallingObjects = [];
        playerX = 180;
        gameActive = true;
        gameOverScreen.classList.add("hidden");
        updateGame();
    }

    // Direct Control Listeners
    document.getElementById("move-left").addEventListener("mousedown", () => { if(playerX > 0) playerX -= 25; });
    document.getElementById("move-right").addEventListener("mousedown", () => { if(playerX < canvas.width - playerSize) playerX += 25; });

    document.addEventListener("keydown", (e) => {
        if (e.key === "a" || e.key === "ArrowLeft") { if(playerX > 0) playerX -= 20; }
        if (e.key === "d" || e.key === "ArrowRight") { if(playerX < canvas.width - playerSize) playerX += 20; }
    });

    startBtn.addEventListener("click", resetGame);
    updateGame();
})();
