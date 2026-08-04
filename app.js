/**
 * DanizTori Bio Link - Biker Theme & Mini Game
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // Elements
    const ignitionBtn = document.getElementById('ignitionBtn');
    const avatarImg = document.getElementById('avatarImg');
    const gameModal = document.getElementById('gameModal');
    const closeGameBtn = document.getElementById('closeGameBtn');
    
    // Game Elements
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const gameScoreEl = document.getElementById('gameScore');
    const gameOverScreen = document.getElementById('gameOverScreen');
    const finalScoreEl = document.getElementById('finalScore');
    const restartBtn = document.getElementById('restartBtn');

    // --- Game Logic ---
    let gameLoop;
    let score = 0;
    let frames = 0;
    let isGameOver = false;

    // Bike (Player)
    const bike = {
        x: 50,
        y: 300,
        width: 60,
        height: 30,
        dy: 0,
        gravity: 0.6,
        jumpPower: -10,
        grounded: false,
        draw: function() {
            // Draw minimalist bike
            ctx.fillStyle = '#a0a0a0'; // Silver frame
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
            // Wheels
            ctx.fillStyle = '#ff3333'; // Red rims
            ctx.beginPath();
            ctx.arc(this.x + 10, this.y + this.height, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.x + this.width - 10, this.y + this.height, 15, 0, Math.PI * 2);
            ctx.fill();
            
            // Rider (minimalist)
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(this.x + 20, this.y - 20, 20, 20);
        },
        update: function() {
            this.dy += this.gravity;
            this.y += this.dy;

            // Ground collision
            if (this.y + this.height > canvas.height - 20) {
                this.y = canvas.height - 20 - this.height;
                this.dy = 0;
                this.grounded = true;
            } else {
                this.grounded = false;
            }
        },
        jump: function() {
            if (this.grounded) {
                this.dy = this.jumpPower;
                this.grounded = false;
            }
        }
    };

    // Obstacles
    let obstacles = [];
    
    class Obstacle {
        constructor() {
            this.width = 30;
            this.height = Math.random() * 40 + 20; // 20 to 60
            this.x = canvas.width;
            this.y = canvas.height - 20 - this.height;
            this.speed = 5 + (score * 0.05); // Increases speed as score goes up
        }
        
        draw() {
            ctx.fillStyle = '#ff3333'; // Red obstacles (cones/barriers)
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        
        update() {
            this.x -= this.speed;
        }
    }

    function handleObstacles() {
        if (frames % 100 === 0) {
            obstacles.push(new Obstacle());
        }

        for (let i = 0; i < obstacles.length; i++) {
            obstacles[i].draw();
            obstacles[i].update();

            // Collision Detection
            if (
                bike.x < obstacles[i].x + obstacles[i].width &&
                bike.x + bike.width > obstacles[i].x &&
                bike.y < obstacles[i].y + obstacles[i].height &&
                bike.y + bike.height > obstacles[i].y
            ) {
                gameOver();
            }

            // Remove off-screen obstacles and increase score
            if (obstacles[i].x + obstacles[i].width < 0) {
                obstacles.splice(i, 1);
                score++;
                gameScoreEl.textContent = score;
                i--;
            }
        }
    }

    // Ground
    function drawGround() {
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(0, canvas.height - 20, canvas.width, 20);
        
        // Track lines
        ctx.strokeStyle = '#a0a0a0';
        ctx.setLineDash([20, 20]);
        ctx.beginPath();
        ctx.moveTo(0, canvas.height - 10);
        ctx.lineTo(canvas.width, canvas.height - 10);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    function updateGame() {
        if (isGameOver) return;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        drawGround();
        bike.update();
        bike.draw();
        handleObstacles();
        
        frames++;
        gameLoop = requestAnimationFrame(updateGame);
    }

    function initGame() {
        obstacles = [];
        score = 0;
        frames = 0;
        bike.y = 300;
        bike.dy = 0;
        isGameOver = false;
        gameScoreEl.textContent = score;
        gameOverScreen.classList.add('hidden');
        updateGame();
    }

    function gameOver() {
        isGameOver = true;
        cancelAnimationFrame(gameLoop);
        finalScoreEl.textContent = score;
        gameOverScreen.classList.remove('hidden');
    }

    // Controls
    window.addEventListener('keydown', (e) => {
        if ((e.code === 'Space' || e.code === 'ArrowUp') && gameModal.classList.contains('active')) {
            e.preventDefault();
            bike.jump();
        }
    });

    canvas.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        bike.jump();
    });

    restartBtn.addEventListener('click', initGame);

    // --- Modal Logic & Easter Egg ---
    
    let clickCount = 0;
    let clickTimer;

    function openGame() {
        gameModal.classList.add('active');
        initGame();
    }

    function closeGame() {
        gameModal.classList.remove('active');
        isGameOver = true;
        cancelAnimationFrame(gameLoop);
    }

    ignitionBtn.addEventListener('click', openGame);
    closeGameBtn.addEventListener('click', closeGame);

    // Secret 3-click on avatar
    avatarImg.addEventListener('click', () => {
        clickCount++;
        clearTimeout(clickTimer);
        
        if (clickCount >= 3) {
            openGame();
            clickCount = 0;
        } else {
            clickTimer = setTimeout(() => {
                clickCount = 0;
            }, 500);
        }
    });

    // Close game if click outside container
    gameModal.addEventListener('click', (e) => {
        if (e.target === gameModal) {
            closeGame();
        }
    });
});
