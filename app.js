/**
 * DanizTori Bio Link - Motorcycle Dashboard Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- Audio & Haptics Setup ---
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    let audioCtx;

    function initAudio() {
        if (!audioCtx) audioCtx = new AudioContext();
        if (audioCtx.state === 'suspended') audioCtx.resume();
    }

    function haptic() {
        if (navigator.vibrate) {
            navigator.vibrate(15); // Light 15ms vibration
        }
    }

    function playClickSound() {
        initAudio();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.05);
    }

    function playRevSound() {
        initAudio();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(60, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(150, audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
    }

    // Bind common sounds/haptics to buttons
    document.body.addEventListener('pointerdown', () => initAudio(), { once: true });

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
    const exitGameBtn1 = document.getElementById('exitGameBtn1');
    const exitGameBtn2 = document.getElementById('exitGameBtn2');
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

    let idleInterval;
    let isHovering = false;

    function startIdleSpeed() {
        idleInterval = setInterval(() => {
            if (!isHovering && !isGameActive) {
                let idleSpeed = Math.floor(Math.random() * (30 - 10 + 1)) + 10;
                speedValue.textContent = idleSpeed;
                setRPM((idleSpeed / 300) * 100);
            }
        }, 800);
    }
    startIdleSpeed();

    // Mobile optimized touches on links
    switchBtns.forEach(btn => {
        btn.addEventListener('touchstart', () => {
            haptic();
            playClickSound();
        }, {passive: true});

        btn.addEventListener('mouseenter', () => {
            if(isGameActive) return;
            isHovering = true;
            playRevSound();
            const targetSpeed = btn.getAttribute('data-rpm');
            const targetGear = btn.getAttribute('data-gear');
            
            speedValue.textContent = targetSpeed;
            gearValue.textContent = targetGear;
            gearValue.style.color = '#ff1744';
            
            setRPM( (targetSpeed / 300) * 100 );
        });

        btn.addEventListener('mouseleave', () => {
            if(isGameActive) return;
            isHovering = false;
            let idleSpeed = Math.floor(Math.random() * (30 - 10 + 1)) + 10;
            speedValue.textContent = idleSpeed;
            gearValue.textContent = 'N';
            gearValue.style.color = '#0f0';
            setRPM((idleSpeed / 300) * 100);
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
        speed: 5,
        draw() {
            ctx.fillStyle = '#ff1744';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            // Wheels
            ctx.fillStyle = '#333';
            ctx.fillRect(this.x + 2, this.y - 5, 16, 8); 
            ctx.fillRect(this.x + 2, this.y + this.height, 16, 8);
            // Rider
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
            this.width = 25;
            this.height = 20;
            this.x = Math.random() * (canvas.width - this.width - 20) + 10;
            this.y = -this.height;
            this.speed = 2 + (score * 0.05);
        }
        draw() {
            ctx.fillStyle = '#ffb300'; 
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        update() {
            this.y += this.speed;
        }
    }

    function drawRoad() {
        ctx.fillStyle = '#222';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
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

        if (frames % 90 === 0) {
            obstacles.push(new Obstacle());
        }

        for (let i = 0; i < obstacles.length; i++) {
            let obs = obstacles[i];
            obs.update();
            obs.draw();

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
        haptic();
        if(navigator.vibrate) navigator.vibrate([50, 50, 100]); // Crash vibrate pattern
        isGameOver = true;
        isPlaying = false;
        cancelAnimationFrame(gameLoop);
        finalScore.textContent = score;
        gameOverUI.classList.add('show');
        gameControlsUI.classList.remove('show');
    }

    function startGame() {
        haptic();
        playClickSound();
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
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    function closeGameMode() {
        haptic();
        playClickSound();
        isGameActive = false;
        isPlaying = false;
        isGameOver = true;
        cancelAnimationFrame(gameLoop);
        gameDisplay.classList.remove('active');
        let idleSpeed = Math.floor(Math.random() * (30 - 10 + 1)) + 10;
        speedValue.textContent = idleSpeed;
        setRPM((idleSpeed / 300) * 100);
    }

    // Interactions
    ignitionKey.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        haptic();
        playClickSound();
        keyClicks++;
        ignitionKey.classList.add('active');
        setTimeout(() => ignitionKey.classList.remove('active'), 200);

        clearTimeout(clickTimeout);
        
        if (keyClicks >= 3) {
            playRevSound();
            openGameMode();
            keyClicks = 0;
        } else {
            clickTimeout = setTimeout(() => {
                keyClicks = 0;
            }, 600);
        }
    });

    exitGameBtn1.addEventListener('pointerdown', (e) => { e.preventDefault(); closeGameMode(); });
    exitGameBtn2.addEventListener('pointerdown', (e) => { e.preventDefault(); closeGameMode(); });
    playBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); startGame(); });
    restartBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); startGame(); });

    // Mobile / Screen Button Controls (Optimized for 0 delay)
    const handleMoveLeft = (e) => { e.preventDefault(); moveLeft = true; haptic(); playClickSound(); };
    const handleMoveRight = (e) => { e.preventDefault(); moveRight = true; haptic(); playClickSound(); };
    const stopMove = (e) => { e.preventDefault(); moveLeft = false; moveRight = false; };

    leftBtn.addEventListener('touchstart', handleMoveLeft, {passive: false});
    leftBtn.addEventListener('mousedown', handleMoveLeft);
    leftBtn.addEventListener('touchend', stopMove, {passive: false});
    leftBtn.addEventListener('mouseup', stopMove);
    leftBtn.addEventListener('mouseleave', stopMove);
    
    rightBtn.addEventListener('touchstart', handleMoveRight, {passive: false});
    rightBtn.addEventListener('mousedown', handleMoveRight);
    rightBtn.addEventListener('touchend', stopMove, {passive: false});
    rightBtn.addEventListener('mouseup', stopMove);
    rightBtn.addEventListener('mouseleave', stopMove);

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
