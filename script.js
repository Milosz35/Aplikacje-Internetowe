const PUZZLE_ROWS = 4;
const PUZZLE_COLS = 4;

let map;
let currentMarker = null;
let mapImageDataUrl = null;

let pieceWidth = 0;
let pieceHeight = 0;
let puzzleSolved = false;

document.addEventListener("DOMContentLoaded", () => {
    initMap();
    initPuzzleBoard();
    initButtons();
    requestNotificationPermission();
});

function initMap() {
    map = L.map("map").setView([52.2297, 21.0122], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        crossOrigin: "anonymous", 
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/">OSM</a> contributors'
    }).addTo(map);
}
function initPuzzleBoard() {
    const board = document.getElementById("puzzleBoard");
    board.innerHTML = "";

    for (let i = 0; i < PUZZLE_ROWS * PUZZLE_COLS; i++) {
        const slot = document.createElement("div");
        slot.classList.add("puzzle-slot");
        slot.dataset.index = i;

        slot.addEventListener("dragover", onSlotDragOver);
        slot.addEventListener("drop", onSlotDrop);
        slot.addEventListener("dragleave", onSlotDragLeave);

        board.appendChild(slot);
    }

    const pool = document.getElementById("puzzlePool");
    pool.addEventListener("dragover", onSlotDragOver);
    pool.addEventListener("drop", onPoolDrop);
    pool.addEventListener("dragleave", onSlotDragLeave);
}

function initButtons() {
    document
        .getElementById("btnMyLocation")
        .addEventListener("click", handleMyLocationClick);

    document
        .getElementById("btnCaptureMap")
        .addEventListener("click", handleCaptureMapClick);
}

function handleMyLocationClick() {
    if (!navigator.geolocation) {
        updateStatus("Twoja przeglądarka nie wspiera Geolocation API.");
        return;
    }

    updateStatus("Pobieranie lokalizacji...");
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;

            document.getElementById("coords").textContent =
                `Twoje współrzędne: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;

            if (currentMarker) {
                map.removeLayer(currentMarker);
            }

            currentMarker = L.marker([lat, lng]).addTo(map);
            map.setView([lat, lng], 15);

            updateStatus("Lokalizacja pobrana i ustawiona na mapie.");
        },
        (err) => {
            console.error(err);
            updateStatus("Nie udało się pobrać lokalizacji.");
        }
    );
}

function handleCaptureMapClick() {
    const mapEl = document.getElementById("map");
    const canvas = document.getElementById("mapCanvas");

    updateStatus("Przechwytywanie mapy do rastra (canvas)...");

    html2canvas(mapEl, {
        useCORS: true,
        logging: false,
        backgroundColor: null
    })
        .then((mapCanvas) => {
            const ctx = canvas.getContext("2d");

            canvas.width = 400;
            canvas.height = 400;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(mapCanvas, 0, 0, canvas.width, canvas.height);

            mapImageDataUrl = canvas.toDataURL("image/png");

            pieceWidth = canvas.width / PUZZLE_COLS;
            pieceHeight = canvas.height / PUZZLE_ROWS;

            resizePuzzleSlots(pieceWidth, pieceHeight);

            createPuzzlePieces();

            updateStatus("Mapa została zapisana do rastra i podzielona na puzzle.");
        })
        .catch((err) => {
            console.error(err);
            updateStatus("Błąd podczas przechwytywania mapy do rastra.");
        });
}

function resizePuzzleSlots(w, h) {
    const slots = document.querySelectorAll(".puzzle-slot");
    slots.forEach((slot) => {
        slot.style.width = `${w}px`;
        slot.style.height = `${h}px`;
    });

    const board = document.getElementById("puzzleBoard");
    board.style.width = `${w * PUZZLE_COLS}px`;
    board.style.height = `${h * PUZZLE_ROWS}px`;
}


function createPuzzlePieces() {
    if (!mapImageDataUrl) return;

    const pool = document.getElementById("puzzlePool");
    pool.innerHTML = "";
    puzzleSolved = false;

    const indices = Array.from({ length: PUZZLE_ROWS * PUZZLE_COLS }, (_, i) => i);
    shuffleArray(indices);

    indices.forEach((index) => {
        const piece = document.createElement("div");
        piece.classList.add("puzzle-piece");
        piece.draggable = true;

        piece.style.width = `${pieceWidth}px`;
        piece.style.height = `${pieceHeight}px`;

        const correctRow = Math.floor(index / PUZZLE_COLS);
        const correctCol = index % PUZZLE_COLS;

        piece.dataset.correctIndex = index;
        piece.dataset.currentIndex = ""; 

        piece.style.backgroundImage = `url(${mapImageDataUrl})`;
        piece.style.backgroundSize = `${pieceWidth * PUZZLE_COLS}px ${pieceHeight * PUZZLE_ROWS}px`;
        piece.style.backgroundPosition = `-${correctCol * pieceWidth}px -${correctRow * pieceHeight}px`;

        piece.addEventListener("dragstart", onPieceDragStart);
        piece.addEventListener("dragend", onPieceDragEnd);

        pool.appendChild(piece);
    });
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}


let draggedPiece = null;

function onPieceDragStart(e) {
    draggedPiece = e.target;
    draggedPiece.classList.add("dragging");
    e.dataTransfer.setData("text/plain", "puzzle-piece");
}

function onPieceDragEnd() {
    if (draggedPiece) {
        draggedPiece.classList.remove("dragging");
    }
    draggedPiece = null;
}
function onSlotDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add("drop-highlight");
}

function onSlotDragLeave(e) {
    e.currentTarget.classList.remove("drop-highlight");
}


function onSlotDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove("drop-highlight");

    if (!draggedPiece) return;

    const slot = e.currentTarget;
    const index = slot.dataset.index;

    if (slot.firstChild && slot.firstChild !== draggedPiece) {
        document.getElementById("puzzlePool").appendChild(slot.firstChild);
        slot.firstChild.dataset.currentIndex = "";
    }

    slot.appendChild(draggedPiece);
    draggedPiece.dataset.currentIndex = index;

    checkIfPuzzleSolved();
}
function onPoolDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove("drop-highlight");

    if (!draggedPiece) return;

    const pool = e.currentTarget;
    pool.appendChild(draggedPiece);
    draggedPiece.dataset.currentIndex = "";

    checkIfPuzzleSolved();
}

function checkIfPuzzleSolved() {
    const pieces = document.querySelectorAll(".puzzle-piece");

    let allPlaced = true;
    let allCorrect = true;

    pieces.forEach((piece) => {
        const current = piece.dataset.currentIndex;
        const correct = piece.dataset.correctIndex;

        if (current === "") {
            allPlaced = false;
        } else if (current !== correct) {
            allCorrect = false;
        }
    });

    if (allPlaced && allCorrect) {
        console.log("Wszystkie puzzle są ułożone prawidłowo!");
        updateStatus("Wszystkie puzzle są ułożone prawidłowo!");
        if (!puzzleSolved) {
            puzzleSolved = true;
            showSystemNotification();
        }
    } else {
        console.log("Puzzle jeszcze nie są poprawnie ułożone.");
    }
}

function requestNotificationPermission() {
    if (!("Notification" in window)) {
        console.log("Notification API nie jest wspierane w tej przeglądarce.");
        return;
    }

    if (Notification.permission === "default") {
        Notification.requestPermission().then((perm) => {
            console.log("Status uprawnień do powiadomień:", perm);
        });
    }
}


function showSystemNotification() {
    if (!("Notification" in window)) {
        alert("Gratulacje! Puzzle ułożone poprawnie.");
        return;
    }

    if (Notification.permission === "granted") {
        const title = "Brawo!";
        const options = {
            body: "Wszystkie puzzle zostały poprawnie ułożone 🎉"
        };
        new Notification(title, options);
    } else {
        alert("Brawo! Wszystkie puzzle zostały poprawnie ułożone.");
    }
}

function updateStatus(msg) {
    const statusEl = document.getElementById("status");
    statusEl.textContent = msg;
}
