/**
 * DanizTori Bio Link - Motorcycle Dashboard Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // UI Elements
    const rpmPath = document.getElementById('rpmPath');
    const speedValue = document.getElementById('speedValue');
    const gearValue = document.getElementById('gearValue');
    const switchBtns = document.querySelectorAll('.switch-btn');
    
    // Game Elements
    const ignitionKey = document.getElementById('ignitionKey');
    const gameDisplay = document.getElementById('gameDisplay');
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const gameOverUI = document.getElementById('gameOverUI');
    const gameStartUI = document.getElementById('gameStartUI');
    const gameControlsUI = document.getElementById('gameControlsUI');
    const finalScore = document.getElementById('finalScore');
    const restartBtn = document.getElementById('restartBtn');
    const playBtn = document.getElementById('playBtn');
    const exitGameBtn = document.getElementById('exitGameBtn');
    const leftBtn = document.getElementById('leftBtn');
    const rightBtn = document.getElementById('rightBtn');

    // --- Dashboard Logic ---
    
    const MAX_RPM_OFFSET = 415;
    
    function setRPM(percentage) {
        const val = Math.max(0, Math.min(100, percentage));
        const offset = MAX_RPM_OFFSET - (MAX_RPM_OFFSET * val / 100);
        rpmPath.style.strokeDashoffset = offset;
    }

    setRPM(0);

    switchBtns.forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            if(isGameActive) return;
            const targetSpeed = btn.getAttribute('data-rpm');
            const targetGear = btn.getAttribute('data-gear');
            
            speedValue.textContent = targetSpeed;
            gearValue.textContent = targetGear;
            gearValue.style.color = '#ff1744';
            
            setRPM( (targetSpeed / 300) * 100 );
        });

        btn.addEventListener('mouseleave', () => {
            if(isGameActive) return;
            speedValue.textContent = '0';
            gearValue.textContent = 'N';
            gearValue.style.color = '#0f0';
            setRPM(0);
        });
    });

    // --- Secret Game Logic (Top-Down Dodger) ---
    let keyClicks = 0;
    let clickTimeout;
    let isGameActive = false;
    let gameLoop;
    
    let score = 0;
    let frames = 0;
    let isGameOver = false;
    let isPlaying = false;
    let roadY = 0;
    
    let moveLeft = false;
    let moveRight = false;

    // Bike (Player)
    const bike = {
        x: canvas.width / 2 - 10,
        y: canvas.height - 50,
        width: 20,
        height: 40,
        speed: 4,
        draw() {
            ctx.fillStyle = '#ff1744';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            // Wheels
            ctx.fillStyle = '#333';
            ctx.fillRect(this.x + 2, this.y - 5, 16, 8); // Front wheel
            ctx.fillRect(this.x + 2, this.y + this.height, 16, 8); // Rear wheel
            // Windshield / Rider
            ctx.fillStyle = '#00e5ff';
            ctx.fillRect(this.x + 5, this.y + 10, 10, 15);
        },
        update() {
            if (moveLeft && this.x > 10) this.x -= this.speed;
            if (moveRight && this.x < canvas.width - this.width - 10) this.x += this.speed;
        }
    };

    let obstacles = [];
    class Obstacle {
        constructor() {
            this.width = 30;
            this.height = 20;
            this.x = Math.random() * (canvas.width - this.width - 20) + 10;
            this.y = -this.height;
            this.speed = 3 + (score * 0.1);
        }
        draw() {
            ctx.fillStyle = '#ffb300'; // Yellow/Orange cars or obstacles
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        update() {
            this.y += this.speed;
        }
    }

    function drawRoad() {
        ctx.fillStyle = '#222';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Road lines
        ctx.strokeStyle = '#555';
        ctx.setLineDash([20, 20]);
        ctx.lineWidth = 4;
        
        roadY += 2 + (score * 0.1);
        if (roadY > 40) roadY = 0;
        
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, -40 + roadY);
        ctx.lineTo(canvas.width / 2, canvas.height);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Score
        ctx.fillStyle = 'white';
        ctx.font = '16px Lalezar';
        ctx.fillText('Score: ' + score, 10, 25);
    }

    function update() {
        if (!isPlaying || isGameOver) return;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawRoad();
        
        bike.update();
        bike.draw();

        if (frames % 60 === 0) {
            obstacles.push(new Obstacle());
        }

        for (let i = 0; i < obstacles.length; i++) {
            let obs = obstacles[i];
            obs.update();
            obs.draw();

            // Collision
            if (
                bike.x < obs.x + obs.width &&
                bike.x + bike.width > obs.x &&
                bike.y < obs.y + obs.height &&
                bike.y + bike.height > obs.y
            ) {
                crash();
            }

            if (obs.y > canvas.height) {
                obstacles.splice(i, 1);
                score++;
                i--;
            }
        }
        
        frames++;
        gameLoop = requestAnimationFrame(update);
    }

    function crash() {
        isGameOver = true;
        isPlaying = false;
        cancelAnimationFrame(gameLoop);
        finalScore.textContent = score;
        gameOverUI.classList.add('show');
        gameControlsUI.classList.remove('show');
    }

    function startGame() {
        obstacles = [];
        score = 0;
        frames = 0;
        bike.x = canvas.width / 2 - 10;
        moveLeft = false;
        moveRight = false;
        
        isGameOver = false;
        isPlaying = true;
        
        gameOverUI.classList.remove('show');
        gameStartUI.classList.remove('show');
        gameControlsUI.classList.add('show');
        
        update();
    }

    function openGameMode() {
        if(isGameActive) return;
        isGameActive = true;
        gameDisplay.classList.add('active');
        gameStartUI.classList.add('show');
        gameOverUI.classList.remove('show');
        gameControlsUI.classList.remove('show');
        // Clear canvas
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    function closeGameMode() {
        isGameActive = false;
        isPlaying = false;
        isGameOver = true;
        cancelAnimationFrame(gameLoop);
        gameDisplay.classList.remove('active');
    }

    // Interactions
    ignitionKey.addEventListener('click', () => {
        keyClicks++;
        ignitionKey.classList.add('active');
        setTimeout(() => ignitionKey.classList.remove('active'), 200);

        clearTimeout(clickTimeout);
        
        if (keyClicks >= 3) {
            openGameMode();
            keyClicks = 0;
        } else {
            clickTimeout = setTimeout(() => {
                keyClicks = 0;
            }, 600);
        }
    });

    exitGameBtn.addEventListener('click', closeGameMode);
    playBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', startGame);

    // Mobile / Screen Button Controls
    leftBtn.addEventListener('pointerdown', () => moveLeft = true);
    leftBtn.addEventListener('pointerup', () => moveLeft = false);
    leftBtn.addEventListener('pointerleave', () => moveLeft = false);
    
    rightBtn.addEventListener('pointerdown', () => moveRight = true);
    rightBtn.addEventListener('pointerup', () => moveRight = false);
    rightBtn.addEventListener('pointerleave', () => moveRight = false);

    // Keyboard Controls
    window.addEventListener('keydown', (e) => {
        if (!isPlaying) return;
        if (e.code === 'ArrowLeft') moveLeft = true;
        if (e.code === 'ArrowRight') moveRight = true;
    });
    
    window.addEventListener('keyup', (e) => {
        if (e.code === 'ArrowLeft') moveLeft = false;
        if (e.code === 'ArrowRight') moveRight = false;
    });

});
