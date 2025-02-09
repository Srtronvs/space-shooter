const GAME_WIDTH = 300;
const GAME_HEIGHT = 500;
const ROCKET_WIDTH = 40;
const ROCKET_HEIGHT = 60;
const ROCK_SIZE = 30;
const STAR_SIZE = 20;
const BULLET_SIZE = 5;
const LANE_WIDTH = GAME_WIDTH / 5;

let rocketPosition = GAME_WIDTH / 2 - ROCKET_WIDTH / 2;
let objects = [];
let score = 0;
let gameOver = false;
let gameSpeed = 1;
let multiShot = false;

const backgroundCanvas = document.getElementById('background');
const ctx = backgroundCanvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const gameOverModal = document.getElementById('game-over-modal');
const finalScoreDisplay = document.getElementById('final-score');
const restartButton = document.getElementById('restart-button');

// Elementos de audio
const backgroundMusic = document.getElementById('background-music');
const rockDestroyedSound = document.getElementById('rock-destroyed-sound');
const shootSound = document.getElementById('shoot-sound');

backgroundCanvas.width = GAME_WIDTH;
backgroundCanvas.height = GAME_HEIGHT;

// Obtener la dirección de wallet del usuario desde la URL
const userWalletAddress = new URLSearchParams(window.location.search).get("user");

// Reproducir música de fondo
document.addEventListener('click', () => {
    backgroundMusic.play();
});

// Fondo estrellado
function drawStars() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    for (let i = 0; i < 100; i++) {
        const x = Math.random() * GAME_WIDTH;
        const y = Math.random() * GAME_HEIGHT;
        const size = Math.random() * 2;
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Dibujar objetos
function drawObjects() {
    objects.forEach(obj => {
        if (obj.type === "rock") {
            ctx.font = `${ROCK_SIZE}px Arial`;
            ctx.fillText("🪨", obj.x, obj.y + ROCK_SIZE); // Emoji de roca
        } else if (obj.type === "star") {
            ctx.fillStyle = "yellow";
            ctx.beginPath();
            ctx.arc(obj.x + STAR_SIZE / 2, obj.y + STAR_SIZE / 2, STAR_SIZE / 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (obj.type === "bullet") {
            ctx.fillStyle = "green";
            ctx.fillRect(obj.x, obj.y, BULLET_SIZE, BULLET_SIZE);
        }
    });
}

// Dibujar cohete
function drawRocket() {
    ctx.save(); // Guardar el estado actual del contexto
    ctx.translate(rocketPosition + ROCKET_WIDTH / 2, GAME_HEIGHT - ROCKET_HEIGHT / 2); // Mover el punto de origen
    ctx.rotate((-45 * Math.PI) / 180); // Rotar -45 grados
    ctx.font = "40px Arial";
    ctx.fillText("🚀", -ROCKET_WIDTH / 2, 0); // Dibujar el cohete
    ctx.restore(); // Restaurar el estado del contexto
}

// Crear roca
function createRock() {
    const lane = Math.floor(Math.random() * 5);
    return {
        x: lane * LANE_WIDTH + (LANE_WIDTH - ROCK_SIZE) / 2,
        y: -ROCK_SIZE,
        type: "rock",
        health: 5, // Las rocas requieren 5 golpes para destruirse
    };
}

// Crear estrella (power-up)
function createStar() {
    const lane = Math.floor(Math.random() * 5);
    return {
        x: lane * LANE_WIDTH + (LANE_WIDTH - STAR_SIZE) / 2,
        y: -STAR_SIZE,
        type: "star",
    };
}

// Crear bala
function createBullet(direction = 0) {
    return {
        x: rocketPosition + ROCKET_WIDTH / 2 - BULLET_SIZE / 2 + direction * 20,
        y: GAME_HEIGHT - ROCKET_HEIGHT,
        type: "bullet",
    };
}

// Mover cohete
function moveRocket(direction) {
    rocketPosition += direction * LANE_WIDTH;
    rocketPosition = Math.max(0, Math.min(GAME_WIDTH - ROCKET_WIDTH, rocketPosition));
}

// Disparar
function shoot() {
    objects.push(createBullet());
    if (multiShot) {
        objects.push(createBullet(-1)); // Disparar a la izquierda
        objects.push(createBullet(1));  // Disparar a la derecha
    }
    // Reproducir sonido de disparo
    shootSound.currentTime = 0; // Reiniciar el sonido si ya está reproduciéndose
    shootSound.play();
}

// Actualizar puntos en el backend
async function updateUserPoints(points) {
    if (!userWalletAddress) return;

    const response = await fetch("/update_points", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            wallet_address: userWalletAddress,
            points: points,
        }),
    });

    const result = await response.json();
    if (!response.ok) {
        console.error("Error al actualizar puntos:", result.error);
    }
}

// Actualizar objetos
function updateObjects() {
    objects = objects.map(obj => {
        if (obj.type === "rock") {
            obj.y += 1 * gameSpeed;
        } else if (obj.type === "bullet") {
            obj.y -= 3 * gameSpeed;
        } else if (obj.type === "star") {
            obj.y += 0.5 * gameSpeed;
        }
        return obj;
    }).filter(obj => obj.y > -ROCK_SIZE && obj.y < GAME_HEIGHT);

    // Colisiones
    objects = objects.filter(obj => {
        if (obj.type === "bullet") {
            const hitRock = objects.find(rock => rock.type === "rock" && Math.abs(rock.x - obj.x) < ROCK_SIZE && Math.abs(rock.y - obj.y) < ROCK_SIZE);
            if (hitRock) {
                hitRock.health -= 1;
                if (hitRock.health === 0) {
                    score += 1;
                    scoreDisplay.textContent = score;
                    updateUserPoints(1); // Actualizar puntos en el backend
                    rockDestroyedSound.currentTime = 0; // Reiniciar el sonido
                    rockDestroyedSound.play(); // Reproducir sonido de roca destruida
                    return false; // Eliminar la bala
                }
                return false; // Eliminar la bala
            }
        } else if (obj.type === "star") {
            const collisionWithRocket = obj.y + STAR_SIZE > GAME_HEIGHT - ROCKET_HEIGHT && Math.abs(obj.x - rocketPosition) < ROCKET_WIDTH;
            if (collisionWithRocket) {
                multiShot = true;
                setTimeout(() => multiShot = false, 5000); // Power-up dura 5 segundos
                return false; // Eliminar la estrella
            }
        }
        return true;
    });

    // Eliminar rocas con salud <= 0
    objects = objects.filter(obj => !(obj.type === "rock" && obj.health <= 0));

    // Colisión con el cohete
    const rocketCollision = objects.some(obj => obj.type === "rock" && obj.y + ROCK_SIZE > GAME_HEIGHT - ROCKET_HEIGHT && Math.abs(obj.x - rocketPosition) < ROCKET_WIDTH);
    if (rocketCollision) {
        gameOver = true;
        finalScoreDisplay.textContent = score;
        gameOverModal.style.display = "flex";
        backgroundMusic.pause(); // Pausar la música de fondo al perder
    }
}

// Reiniciar juego
function restartGame() {
    rocketPosition = GAME_WIDTH / 2 - ROCKET_WIDTH / 2;
    objects = [];
    score = 0;
    gameOver = false;
    gameSpeed = 1;
    multiShot = false;
    scoreDisplay.textContent = score;
    gameOverModal.style.display = "none";
    backgroundMusic.currentTime = 0;
    backgroundMusic.play();
    gameLoop();
}

// Bucle del juego
function gameLoop() {
    if (gameOver) return;

    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT); // Limpiar el canvas
    drawStars();
    drawObjects();
    drawRocket();
    updateObjects();

    // Generar nuevos objetos
    if (Math.random() < 0.02) objects.push(createRock());
    if (Math.random() < 0.001) objects.push(createStar()); // Estrellas menos frecuentes

    // Aumentar dificultad
    gameSpeed = Math.min(gameSpeed + 0.0005, 2);

    requestAnimationFrame(gameLoop);
}

// Eventos de control
document.getElementById('move-left').addEventListener('click', () => moveRocket(-1));
document.getElementById('move-right').addEventListener('click', () => moveRocket(1));
document.getElementById('shoot').addEventListener('click', shoot);
restartButton.addEventListener('click', restartGame);

// Iniciar juego
gameLoop();
