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
    const finalScore = document.getElementById('finalScore');
    const restartBtn = document.getElementById('restartBtn');

    // --- Dashboard Logic ---
    
    // SVG Path Length for RPM is 415 (approx)
    const MAX_RPM_OFFSET = 415;
    
    function setRPM(percentage) {
        // percentage 0 to 100
        const val = Math.max(0, Math.min(100, percentage));
        const offset = MAX_RPM_OFFSET - (MAX_RPM_OFFSET * val / 100);
        rpmPath.style.strokeDashoffset = offset;
    }

    // Default state
    setRPM(0);

    // Hover effects on links to rev engine
    switchBtns.forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            if(isGameActive) return;
            const targetSpeed = btn.getAttribute('data-rpm');
            const targetGear = btn.getAttribute('data-gear');
            
            speedValue.textContent = targetSpeed;
            gearValue.textContent = targetGear;
            gearValue.style.color = '#ff1744'; // Red gear
            
            // Calc RPM percentage (mock)
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

    // --- Secret Game Logic ---
    let keyClicks = 0;
    let clickTimeout;
    let isGameActive = false;
    let gameLoop;

    ignitionKey.addEventListener('click', () => {
        keyClicks++;
        ignitionKey.classList.add('active');
        setTimeout(() => ignitionKey.classList.remove('active'), 200);

        clearTimeout(clickTimeout);
        
        if (keyClicks >= 3) {
            startGameSequence();
            keyClicks = 0;
        } else {
            clickTimeout = setTimeout(() => {
                keyClicks = 0;
            }, 600);
        }
    });

    function startGameSequence() {
        if(isGameActive) return;
        isGameActive = true;
        gameDisplay.classList.add('active');
        gameStartUI.classList.add('show');
        gameOverUI.classList.remove('show');
        
        // Wait for user to tap to actually start playing
    }

    // Game Variables
    let score = 0;
    let frames = 0;
    let isGameOver = false;
    let isPlaying = false;

    const bike = {
        x: 40,
        y: 150,
        width: 30,
        height: 15,
        dy: 0,
        gravity: 0.5,
        jumpPower: -8,
        grounded: false,
        draw() {
            // Bike body
            ctx.fillStyle = '#ff1744';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            // Wheels
            ctx.fillStyle = '#555';
            ctx.beginPath();
            ctx.arc(this.x + 5, this.y + this.height, 8, 0, Math.PI*2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.x + this.width - 5, this.y + this.height, 8, 0, Math.PI*2);
            ctx.fill();
            // Rider
            ctx.fillStyle = 'white';
            ctx.fillRect(this.x + 10, this.y - 10, 10, 10);
        },
        update() {
            this.dy += this.gravity;
            this.y += this.dy;
            if (this.y + this.height > canvas.height - 20) {
                this.y = canvas.height - 20 - this.height;
                this.dy = 0;
                this.grounded = true;
            }
        },
        jump() {
            if (this.grounded) {
                this.dy = this.jumpPower;
                this.grounded = false;
            }
        }
    };

    let obstacles = [];
    class Obstacle {
        constructor() {
            this.width = 15;
            this.height = Math.random() * 30 + 15;
            this.x = canvas.width;
            this.y = canvas.height - 20 - this.height;
            this.speed = 4 + (score * 0.1);
        }
        draw() {
            ctx.fillStyle = '#00e5ff'; // Cyan obstacles
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        update() {
            this.x -= this.speed;
        }
    }

    function drawGround() {
        ctx.fillStyle = '#222';
        ctx.fillRect(0, canvas.height - 20, canvas.width, 20);
        // Score
        ctx.fillStyle = 'white';
        ctx.font = '16px Lalezar';
        ctx.fillText('Score: ' + score, 10, 20);
    }

    function update() {
        if (isGameOver) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGround();
        
        bike.update();
        bike.draw();

        if (frames % 80 === 0) {
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

            if (obs.x + obs.width < 0) {
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
    }

    function resetGame() {
        obstacles = [];
        score = 0;
        frames = 0;
        bike.y = 150;
        bike.dy = 0;
        isGameOver = false;
        isPlaying = true;
        gameOverUI.classList.remove('show');
        gameStartUI.classList.remove('show');
        update();
    }

    // Controls
    function handleAction(e) {
        if (!isGameActive) return;
        e.preventDefault();
        
        if (!isPlaying && !isGameOver) {
            resetGame();
        } else if (isPlaying) {
            bike.jump();
        }
    }

    canvas.addEventListener('pointerdown', handleAction);
    
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            handleAction(e);
        }
    });

    restartBtn.addEventListener('click', resetGame);
});
