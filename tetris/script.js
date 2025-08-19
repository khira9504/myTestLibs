const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const scoreElement = document.getElementById('score');

const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 20; // This should match canvas scale

context.scale(BLOCK_SIZE, BLOCK_SIZE);

let score = 0;

function createArena(width, height) {
    const matrix = [];
    while (height--) {
        matrix.push(new Array(width).fill(0));
    }
    return matrix;
}

const arena = createArena(COLS, ROWS);

function createPiece(type) {
    if (type === 'T') {
        return [
            [0, 0, 0],
            [1, 1, 1],
            [0, 1, 0],
        ];
    } else if (type === 'O') {
        return [
            [2, 2],
            [2, 2],
        ];
    } else if (type === 'L') {
        return [
            [0, 3, 0],
            [0, 3, 0],
            [0, 3, 3],
        ];
    } else if (type === 'J') {
        return [
            [0, 4, 0],
            [0, 4, 0],
            [4, 4, 0],
        ];
    } else if (type === 'I') {
        return [
            [0, 5, 0, 0],
            [0, 5, 0, 0],
            [0, 5, 0, 0],
            [0, 5, 0, 0],
        ];
    } else if (type === 'S') {
        return [
            [0, 6, 6],
            [6, 6, 0],
            [0, 0, 0],
        ];
    } else if (type === 'Z') {
        return [
            [7, 7, 0],
            [0, 7, 7],
            [0, 0, 0],
        ];
    }
}

const colors = [
    null,
    '#9B59B6', // T - Purple
    '#F1C40F', // O - Yellow
    '#E67E22', // L - Orange
    '#3498DB', // J - Blue
    '#1ABC9C', // I - Cyan
    '#2ECC71', // S - Green
    '#E74C3C', // Z - Red
    '#FFFFFF', // Flash color
];

const startButton = document.getElementById('start-button');
const nextPieceCanvas = document.getElementById('next-piece');
const nextPieceContext = nextPieceCanvas.getContext('2d');
nextPieceContext.scale(20, 20);

const player = {
    pos: {x: 0, y: 0},
    matrix: null,
};

let nextPieceType = null;
let level = 0;

let animationFrameId = null;
let isRunning = false;

function playerReset() {
    const pieces = 'TJLOSZI';
    player.matrix = createPiece(nextPieceType);
    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);

    nextPieceType = pieces[pieces.length * Math.random() | 0];
    drawNextPiece();

    if (collide(arena, player)) {
        // Game Over
        isRunning = false;
        cancelAnimationFrame(animationFrameId);
        startButton.style.display = 'block';
        alert('Game Over! Score: ' + score);
    }
}

function playerMove(dir) {
    if (!isRunning) return;
    player.pos.x += dir;
    if (collide(arena, player)) {
        player.pos.x -= dir;
    }
}

function playerDrop() {
    if (!isRunning) return;
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        updateScore();
        if (!arenaSweep()) {
            playerReset();
        }
    }
    dropCounter = 0;
}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [
                matrix[x][y],
                matrix[y][x],
            ] = [
                matrix[y][x],
                matrix[x][y],
            ];
        }
    }

    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

function playerRotate(dir) {
    if (!isRunning) return;
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}

function drawMatrix(contextToDraw, matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                contextToDraw.fillStyle = colors[value];
                contextToDraw.fillRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}

function draw() {
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);

    drawMatrix(context, arena, {x: 0, y: 0});
    if (isRunning) {
        drawMatrix(context, player.matrix, player.pos);
    }
}

function drawNextPiece() {
    nextPieceContext.fillStyle = '#000';
    nextPieceContext.fillRect(0, 0, nextPieceCanvas.width, nextPieceCanvas.height);

    const matrix = createPiece(nextPieceType);
    const offsetX = (nextPieceCanvas.width / 20 / 2) - (matrix[0].length / 2);
    const offsetY = (nextPieceCanvas.height / 20 / 2) - (matrix.length / 2);

    drawMatrix(nextPieceContext, matrix, {x: offsetX, y: offsetY});
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

function collide(arena, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
               (arena[y + o.y] &&
                arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function arenaSweep() {
    let rowCount = 1;
    const clearedRows = [];

    outer: for (let y = arena.length - 1; y > 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }
        clearedRows.push(y);
    }

    if (clearedRows.length > 0) {
        clearedRows.forEach(y => {
            arena[y].fill(8); // Mark for animation
            score += rowCount * 10;
            rowCount *= 2;
        });
        draw(); // Draw flashing rows

        setTimeout(() => {
            clearedRows.forEach(y => {
                const row = arena.splice(y, 1)[0].fill(0);
                arena.unshift(row);
            });

            const newLevel = Math.floor(score / 100);
            if (newLevel > level) {
                level = newLevel;
                dropInterval = Math.max(100, 1000 - level * 50);
            }
            updateScore();
            playerReset();
        }, 200);
        return true;
    }

    return false;
}

function updateScore() {
    scoreElement.innerText = score;
}

let dropCounter = 0;
let dropInterval = 1000; // 1 second

let lastTime = 0;
function update(time = 0) {
    if (!isRunning) {
        return;
    }

    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
    }

    draw();
    animationFrameId = requestAnimationFrame(update);
}

document.addEventListener('keydown', event => {
    if (!isRunning) return;
    if (event.key === 'ArrowLeft') {
        playerMove(-1);
    } else if (event.key === 'ArrowRight') {
        playerMove(1);
    } else if (event.key === 'ArrowDown') {
        playerDrop();
    } else if (event.key === 'q' || event.key === 'Q') {
        playerRotate(-1);
    } else if (event.key === 'w' || event.key === 'W' || event.key === 'ArrowUp') {
        playerRotate(1);
    }
});

function drawStartMessage() {
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.font = "1px 'Press Start 2P'";
    context.fillStyle = 'white';
    context.textAlign = 'center';
    context.fillText('PRESS', COLS / 2, ROWS / 2 - 1);
    context.fillText('START', COLS / 2, ROWS / 2 + 1);
}

function startGame() {
    isRunning = true;
    arena.forEach(row => row.fill(0));
    score = 0;
    level = 0;
    dropInterval = 1000;
    updateScore();

    const pieces = 'TJLOSZI';
    nextPieceType = pieces[pieces.length * Math.random() | 0];
    playerReset(); // This will use the first next piece and generate the second one.

    lastTime = 0;
    dropCounter = 0;
    update();
    startButton.style.display = 'none';
}

drawStartMessage();
startButton.addEventListener('click', startGame);
