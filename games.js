(function () {
  const $ = (id) => document.getElementById(id);

  let canvas, ctx, stage;
  let backCanvas, backCtx; // offscreen logical buffer
  const LOGICAL_WIDTH = 640;
  const LOGICAL_HEIGHT = 400;

  let loop = null;
  let speed = 100;
  let currentGameKey = "snake";
  let games = {};

  // Visual FX helpers: lightweight particles and screen flash
  const fx = (() => {
    const particles = [];
    let flashAlpha = 0;
    let flashColor = "#ffffff";

    function emitBurst(x, y, color = "#ffffff", count = 10, speed = 2) {
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = speed * (0.5 + Math.random());
        particles.push({
          x,
          y,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v,
          life: 30 + Math.floor(Math.random() * 20),
          color,
        });
      }
    }
    function trail(x, y, color = "#ffffff", spread = 0.7) {
      // smaller, short-lived particles for motion trails
      const a = Math.random() * Math.PI * 2 * spread;
      particles.push({
        x: x + (Math.random() - 0.5) * 6,
        y: y + (Math.random() - 0.5) * 6,
        vx: Math.cos(a) * 0.6,
        vy: Math.sin(a) * 0.6,
        life: 14 + Math.floor(Math.random() * 8),
        color,
      });
    }
    function flash(color = "#ffffff", strength = 0.65) {
      flashColor = color;
      flashAlpha = Math.max(flashAlpha, strength);
    }
    function updateAndDraw(ctx) {
      // particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.02; // slight gravity for nicer look
        p.life -= 1;
        const a = Math.max(0, Math.min(1, p.life / 30));
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        if (p.life <= 0) particles.splice(i, 1);
      }
      // screen flash
      if (flashAlpha > 0.01) {
        ctx.fillStyle = flashColor;
        ctx.globalAlpha = flashAlpha * 0.35;
        ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
        ctx.globalAlpha = 1;
        flashAlpha *= 0.88;
      }
    }
    return { emitBurst, trail, flash, updateAndDraw };
  })();

  // Handle responsive sizing
  function resize() {
    if (!stage || !canvas) return;
    const padding = 0; // already has inner padding via border radius
    const maxW = stage.clientWidth - padding;
    const maxH = stage.clientHeight - padding;
    const scale = Math.min(maxW / LOGICAL_WIDTH, maxH / LOGICAL_HEIGHT);
    const targetW = Math.max(1, Math.floor(LOGICAL_WIDTH * scale));
    const targetH = Math.max(1, Math.floor(LOGICAL_HEIGHT * scale));
    canvas.width = targetW;
    canvas.height = targetH;
    // Clear visible canvas to avoid artifacts
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Trigger a redraw from current game if possible
    games[currentGameKey]?.redraw?.();
  }

  // Utility: draw from back buffer to visible canvas scaled
  function present() {
    if (!backCanvas) return;
    // paint background first (match previous look)
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      backCanvas,
      0,
      0,
      LOGICAL_WIDTH,
      LOGICAL_HEIGHT,
      0,
      0,
      canvas.width,
      canvas.height
    );
  }

  // ------------- Game: Snake -------------
  const Snake = () => {
    const GRID = 20,
      COLS = 32,
      ROWS = 20;
    let timer = null;
    let localSpeed = speed;
    let direction = { x: 1, y: 0 },
      nextDirection = { x: 1, y: 0 };
    let snake = [];
    let food = null;
    let bonus = null; // timed bonus fruit
    let score = 0;
    // Track whether the last state ended in game over
    let over = false;

    function updateScore() {
      const el = $("funroom-score");
      if (el) el.textContent = `Score: ${score}`;
    }

    function newGame() {
      direction = { x: 1, y: 0 };
      nextDirection = { x: 1, y: 0 };
      snake = [
        { x: 5, y: 10 },
        { x: 4, y: 10 },
        { x: 3, y: 10 },
      ];
      score = 0;
      over = false; // reset
      updateScore();
      spawnFood();
      bonus = null;
      draw();
    }

    function spawnFood() {
      while (true) {
        const x = Math.floor(Math.random() * COLS),
          y = Math.floor(Math.random() * ROWS);
        if (!snake.some((p) => p.x === x && p.y === y)) {
          food = { x, y };
          break;
        }
      }
    }
    function maybeSpawnBonus() {
      if (bonus || Math.random() > 0.28) return; // ~28% chance after eating
      while (true) {
        const x = Math.floor(Math.random() * COLS),
          y = Math.floor(Math.random() * ROWS);
        if (
          !snake.some((p) => p.x === x && p.y === y) &&
          !(food && food.x === x && food.y === y)
        ) {
          bonus = { x, y, ttl: 220 }; // ~3.5s at 100ms
          break;
        }
      }
    }

    function start() {
      if (timer) return;
      // If the game is over or never initialized, start fresh
      if (over || snake.length === 0) newGame();
      timer = setInterval(tick, localSpeed);
    }
    function pause() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }
    function restart() {
      pause();
      newGame();
      start();
    }
    function setSpeed(v) {
      localSpeed = parseInt(v, 10) || 100;
      if (timer) {
        pause();
        start();
      }
    }

    function handleKey(e) {
      const k = e.key.toLowerCase();
      if (k === "arrowup" || k === "w") setDir(0, -1);
      else if (k === "arrowdown" || k === "s") setDir(0, 1);
      else if (k === "arrowleft" || k === "a") setDir(-1, 0);
      else if (k === "arrowright" || k === "d") setDir(1, 0);
      else if (k === " ") {
        if (timer) pause();
        else start();
      }
    }
    function setDir(x, y) {
      if (x === -direction.x && y === -direction.y) return;
      nextDirection = { x, y };
    }

    function accelerateIfNeeded() {
      // every 50 points speed up slightly (min 55ms)
      const desired = Math.max(55, 120 - Math.floor(score / 50) * 10);
      if (desired !== localSpeed) {
        localSpeed = desired;
        if (timer) {
          pause();
          start();
        }
      }
    }

    function tick() {
      direction = nextDirection;
      const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
      if (head.x < 0 || head.y < 0 || head.x >= COLS || head.y >= ROWS)
        return gameOver();
      if (snake.some((p, i) => i > 0 && p.x === head.x && p.y === head.y))
        return gameOver();
      snake.unshift(head);
      if (food && head.x === food.x && head.y === food.y) {
        score += 10;
        updateScore();
        // celebratory particles
        fx.emitBurst(
          (food.x + 0.5) * GRID,
          (food.y + 0.5) * GRID,
          "#22c55e",
          18,
          2.4
        );
        spawnFood();
        maybeSpawnBonus();
        accelerateIfNeeded();
      } else if (bonus && head.x === bonus.x && head.y === bonus.y) {
        score += 30;
        updateScore();
        fx.emitBurst(
          (bonus.x + 0.5) * GRID,
          (bonus.y + 0.5) * GRID,
          "#fbbf24",
          26,
          3
        );
        bonus = null;
        accelerateIfNeeded();
      } else {
        snake.pop();
      }
      // decay bonus
      if (bonus) {
        bonus.ttl -= 1;
        if (bonus.ttl <= 0) bonus = null;
      }
      draw();
    }

    function draw() {
      // draw to back buffer in logical size
      // Background gradient
      const g = backCtx.createLinearGradient(0, 0, 0, LOGICAL_HEIGHT);
      g.addColorStop(0, "rgba(2,6,23,0.9)");
      g.addColorStop(1, "rgba(2,6,23,0.6)");
      backCtx.fillStyle = g;
      backCtx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

      // Grid
      backCtx.strokeStyle = "rgba(255,255,255,0.06)";
      backCtx.lineWidth = 1;
      for (let x = 0; x <= COLS; x++) {
        backCtx.beginPath();
        backCtx.moveTo(x * GRID, 0);
        backCtx.lineTo(x * GRID, LOGICAL_HEIGHT);
        backCtx.stroke();
      }
      for (let y = 0; y <= ROWS; y++) {
        backCtx.beginPath();
        backCtx.moveTo(0, y * GRID);
        backCtx.lineTo(LOGICAL_WIDTH, y * GRID);
        backCtx.stroke();
      }
      // Snake
      snake.forEach((p, i) => {
        const a = 0.9 - Math.min(i * 0.02, 0.6);
        fillRound(
          backCtx,
          p.x * GRID + 2,
          p.y * GRID + 2,
          GRID - 4,
          GRID - 4,
          4,
          `rgba(56,189,248,${a})`
        );
      });
      // Food
      if (food) {
        fillRound(
          backCtx,
          food.x * GRID + 3,
          food.y * GRID + 3,
          GRID - 6,
          GRID - 6,
          9,
          "rgba(36, 250, 21, 0.95)"
        );
      }
      // Bonus fruit (pulsing)
      if (bonus) {
        const pulse = 0.7 + 0.3 * Math.sin(Date.now() / 120);
        backCtx.globalAlpha = pulse;
        fillRound(
          backCtx,
          bonus.x * GRID + 2,
          bonus.y * GRID + 2,
          GRID - 4,
          GRID - 4,
          6,
          "#fbbf24"
        );
        backCtx.globalAlpha = 1;
      }

      fx.updateAndDraw(backCtx);
      present();
    }

    function gameOver() {
      pause();
      over = true; // mark over so Start acts as restart
      fx.flash("#ef4444", 0.8);
      overlay(backCtx, "Game Over", "Press Restart to play again");
      present();
    }

    function onEnter() {
      $("funroom-title").textContent = "Snake";
      $("funroom-help").textContent =
        "Use arrow keys or WASD to move. Eat food, grab bonus stars, avoid walls and yourself.";
      document.addEventListener("keydown", handleKey);
      newGame();
    }
    function onExit() {
      document.removeEventListener("keydown", handleKey);
      pause();
    }
    function redraw() {
      draw();
    }

    // Expose state for smart Start
    function getState() {
      return { running: !!timer, over };
    }

    return {
      start,
      pause,
      restart,
      setSpeed,
      onEnter,
      onExit,
      redraw,
      getState,
    };
  };

  // ------------- Game: Pong -------------
  const Pong = () => {
    let ball, leftY, rightY;
    const paddleH = 70,
      paddleW = 10;
    let up = false,
      down = false;
    let timer = null;
    const W = LOGICAL_WIDTH,
      H = LOGICAL_HEIGHT;

    // Scoring
    let playerScore = 0,
      aiScore = 0;
    // Serve countdown in frames (~16ms)
    let serveCountdown = 0;

    function updateScore() {
      const el = $("funroom-score");
      if (el) el.textContent = `Score: ${playerScore} - ${aiScore}`;
    }

    function reset(serveDir) {
      const vx = serveDir ? 3 * serveDir : Math.random() < 0.5 ? 3 : -3;
      const vy = (Math.random() < 0.5 ? 2 : -2) * (0.8 + Math.random() * 0.6);
      ball = { x: W / 2, y: H / 2, vx, vy, r: 6 };
      leftY = H / 2 - paddleH / 2;
      rightY = H / 2 - paddleH / 2;
      serveCountdown = 60; // ~1 second ready pause
    }
    function start() {
      if (timer) return;
      timer = setInterval(tick, 16);
    }
    function pause() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }
    function restart() {
      playerScore = 0;
      aiScore = 0;
      updateScore();
      reset();
      start();
    }
    function setSpeed(v) {}

    function keyDown(e) {
      if (e.key === "ArrowUp") up = true;
      if (e.key === "ArrowDown") down = true;
      if (e.key === " ") {
        if (timer) pause();
        else start();
      }
    }
    function keyUp(e) {
      if (e.key === "ArrowUp") up = false;
      if (e.key === "ArrowDown") down = false;
    }

    function ai() {
      // Basic prediction and slight random jitter
      const target = Math.max(
        0,
        Math.min(H - paddleH, ball.y - paddleH / 2 + (Math.random() - 0.5) * 8)
      );
      const aiSpeed = 2.6 + Math.min(2, (playerScore + aiScore) * 0.05);
      if (rightY < target - 2) rightY += aiSpeed;
      else if (rightY > target + 2) rightY -= aiSpeed;
      rightY = Math.max(0, Math.min(H - paddleH, rightY));
    }

    function reflectFromPaddle(centerY, isLeft) {
      // Angle based on where the ball hits the paddle
      const rel = (ball.y - centerY) / (paddleH / 2);
      const angle = rel * 1.0; // -1..1 radians-ish factor
      const speed = Math.min(7.5, Math.hypot(ball.vx, ball.vy) + 0.35);
      const dir = isLeft ? 1 : -1;
      ball.vx = Math.cos(angle) * speed * dir;
      ball.vy = Math.sin(angle) * speed;
    }

    function tick() {
      if (serveCountdown > 0) {
        serveCountdown--;
        draw();
        return;
      }
      if (up) leftY -= 4.2;
      if (down) leftY += 4.2;
      leftY = Math.max(0, Math.min(H - paddleH, leftY));
      ai();

      ball.x += ball.vx;
      ball.y += ball.vy;
      if (ball.y - ball.r < 0 || ball.y + ball.r > H) ball.vy *= -1;

      // Left paddle
      if (
        ball.x - ball.r < 30 + paddleW &&
        ball.x - ball.r > 30 &&
        ball.y > leftY &&
        ball.y < leftY + paddleH
      ) {
        reflectFromPaddle(leftY + paddleH / 2, true);
        fx.emitBurst(30 + paddleW, ball.y, "#38bdf8", 10, 2.4);
      }
      // Right paddle
      if (
        ball.x + ball.r > W - 30 - paddleW &&
        ball.x + ball.r < W - 30 &&
        ball.y > rightY &&
        ball.y < rightY + paddleH
      ) {
        reflectFromPaddle(rightY + paddleH / 2, false);
        fx.emitBurst(W - 30 - paddleW, ball.y, "#facc15", 10, 2.4);
      }

      // Scoring
      if (ball.x < 0) {
        aiScore++;
        updateScore();
        fx.flash("#facc15", 0.5);
        reset(1);
      } else if (ball.x > W) {
        playerScore++;
        updateScore();
        fx.flash("#38bdf8", 0.5);
        reset(-1);
      }
      draw();
    }

    function draw() {
      // Background
      const g = backCtx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "rgba(2,6,23,0.9)");
      g.addColorStop(1, "rgba(2,6,23,0.6)");
      backCtx.fillStyle = g;
      backCtx.fillRect(0, 0, W, H);

      // mid line
      backCtx.strokeStyle = "rgba(255,255,255,0.15)";
      backCtx.setLineDash([6, 6]);
      backCtx.beginPath();
      backCtx.moveTo(W / 2, 0);
      backCtx.lineTo(W / 2, H);
      backCtx.stroke();
      backCtx.setLineDash([]);
      // paddles
      backCtx.fillStyle = "rgba(56,189,248,0.9)";
      backCtx.fillRect(30, leftY, paddleW, paddleH);
      backCtx.fillStyle = "rgba(250,204,21,0.9)";
      backCtx.fillRect(W - 30 - paddleW, rightY, paddleW, paddleH);
      // ball
      backCtx.fillStyle = "#fff";
      backCtx.beginPath();
      backCtx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      backCtx.fill();

      // Serve countdown overlay
      if (serveCountdown > 0) {
        backCtx.fillStyle = "rgba(0,0,0,0.35)";
        backCtx.fillRect(0, 0, W, H);
        backCtx.fillStyle = "#fff";
        backCtx.font = "bold 28px Segoe UI, sans-serif";
        backCtx.textAlign = "center";
        const num = Math.max(1, Math.ceil(serveCountdown / 20));
        backCtx.fillText(num.toString(), W / 2, H / 2);
      }

      fx.updateAndDraw(backCtx);
      present();
    }

    function onEnter() {
      $("funroom-title").textContent = "Pong";
      $("funroom-help").textContent =
        "Up/Down arrows to move. Score points; ball angle depends on hit position.";
      playerScore = 0;
      aiScore = 0;
      updateScore();
      window.addEventListener("keydown", keyDown);
      window.addEventListener("keyup", keyUp);
      reset();
      draw();
    }
    function onExit() {
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      pause();
    }
    function redraw() {
      draw();
    }

    // Expose state (Pong has no terminal game-over)
    function getState() {
      return { running: !!timer, over: false };
    }

    return {
      start,
      pause,
      restart,
      setSpeed,
      onEnter,
      onExit,
      redraw,
      getState,
    };
  };

  // ------------- Game: Flappy -------------
  const Flappy = () => {
    const W = LOGICAL_WIDTH,
      H = LOGICAL_HEIGHT;
    const PIPE_W = 60;
    let bird,
      pipes,
      gravity = 0.35,
      flap = -6,
      timer = null,
      frame = 0,
      score = 0,
      alive = true,
      pipeSpeed = 3;

    function start() {
      if (timer) return;
      // If the player is on a Game Over screen, pressing Start restarts
      if (!alive) {
        restart();
        return;
      }
      timer = setInterval(tick, 16);
    }
    function pause() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }
    function restart() {
      pipes = [];
      bird = { x: 120, y: H / 2, vy: 0 };
      frame = 0;
      score = 0;
      alive = true;
      pipeSpeed = 3;
      updateScore();
      start();
    }
    function setSpeed(v) {}
    function keyDown(e) {
      if (
        e.key === " " ||
        e.key === "ArrowUp" ||
        e.key === "w" ||
        e.key === "W"
      ) {
        bird.vy = flap;
        fx.trail(bird.x - 10, bird.y, "#fb24a8");
      }
    }
    function updateScore() {
      const el = $("funroom-score");
      if (el) el.textContent = `Score: ${score}`;
    }

    function init() {
      pipes = [];
      bird = { x: 120, y: H / 2, vy: 0 };
      frame = 0;
      score = 0;
      alive = true;
      pipeSpeed = 3;
      updateScore();
      draw();
    }

    function tick() {
      if (!alive) {
        pause();
        overlay(backCtx, "Game Over", "Press Restart to try again");
        present();
        return;
      }
      frame++;
      // Difficulty scaling
      const gapBase = 120;
      const gap = Math.max(90, gapBase - score * 2);
      pipeSpeed = Math.min(6, 3 + score * 0.05);

      if (frame % 90 === 0) {
        const topH = 40 + Math.random() * (H - gap - 80);
        pipes.push({ x: W, top: topH, gap, scored: false });
      }
      // Move pipes left
      pipes.forEach((p) => (p.x -= pipeSpeed));
      if (pipes.length && pipes[0].x < -PIPE_W) pipes.shift();
      // Bird physics
      bird.vy += gravity;
      bird.y += bird.vy;
      if (bird.y < 0 || bird.y > H) alive = false;
      // Collisions and scoring
      pipes.forEach((p) => {
        const withinX = bird.x > p.x - 20 && bird.x < p.x + PIPE_W;
        const inGap = bird.y > p.top && bird.y < p.top + p.gap;
        if (withinX && !inGap) {
          alive = false;
          fx.flash("#ef4444", 0.8);
        }
        if (!p.scored && p.x + PIPE_W < bird.x) {
          p.scored = true;
          score++;
          updateScore();
          fx.emitBurst(bird.x, bird.y, "#fbbf24", 16, 2.2);
        }
      });
      draw();
    }

    function draw() {
      // Opaque background
      backCtx.setTransform(1, 0, 0, 1, 0, 0);
      backCtx.globalAlpha = 1;
      backCtx.globalCompositeOperation = "source-over";
      backCtx.shadowBlur = 0;
      backCtx.shadowColor = "transparent";
      backCtx.clearRect(0, 0, W, H);
      backCtx.fillStyle = "#0f172a";
      backCtx.fillRect(0, 0, W, H);

      // Pipes
      pipes.forEach((p) => {
        backCtx.fillStyle = "#3bc522ff";
        backCtx.fillRect(p.x, 0, PIPE_W, p.top);
        backCtx.fillRect(p.x, p.top + p.gap, PIPE_W, H - (p.top + p.gap));
      });

      // Bird
      backCtx.fillStyle = "#fb24a8ff";
      fillRound(
        backCtx,
        bird.x - 12,
        bird.y - 9,
        34,
        28,
        20,
        backCtx.fillStyle
      );

      fx.updateAndDraw(backCtx);
      present();
    }

    function onEnter() {
      $("funroom-title").textContent = "Flappy";
      $("funroom-help").textContent =
        "Space/Up to flap. Gap shrinks as you score. Restart to try again.";
      window.addEventListener("keydown", keyDown);
      init();
    }
    function onExit() {
      window.removeEventListener("keydown", keyDown);
      pause();
    }
    function redraw() {
      draw();
    }

    // Expose state for smart Start
    function getState() {
      return { running: !!timer, over: !alive };
    }

    return {
      start,
      pause,
      restart,
      setSpeed,
      onEnter,
      onExit,
      redraw,
      getState,
    };
  };

  // Helpers
  function fillRound(ctx, x, y, w, h, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
  }
  function overlay(ctxLocal, title, subtitle) {
    ctxLocal.fillStyle = "rgba(0,0,0,0.5)";
    ctxLocal.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    ctxLocal.fillStyle = "#fff";
    ctxLocal.font = "bold 28px Segoe UI, sans-serif";
    ctxLocal.textAlign = "center";
    ctxLocal.fillText(title, LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2 - 10);
    ctxLocal.font = "14px Segoe UI, sans-serif";
    ctxLocal.fillText(subtitle, LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2 + 18);
  }

  // New: fully clear current visuals (back buffer and visible) so switching games shows a clean slate
  function resetCanvasVisuals() {
    if (!backCtx || !ctx) return;
    backCtx.setTransform(1, 0, 0, 1, 0, 0);
    backCtx.globalAlpha = 1;
    backCtx.setLineDash([]);
    backCtx.clearRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    backCtx.fillStyle = "rgba(0,0,0,0.25)";
    backCtx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    if (typeof present === "function") {
      present();
    }
  }

  function startActive() {
    const g = games[currentGameKey];
    if (!g) return;
    const state = g.getState ? g.getState() : null;
    if (state) {
      if (state.over) {
        // Treat Start as Restart when game is over
        g.restart?.();
        return;
      }
      if (!state.running) {
        g.start?.();
        return;
      }
      // Already running: do nothing
      return;
    }
    // Fallback for games without state
    g.start?.();
  }
  function pauseActive() {
    games[currentGameKey]?.pause?.();
  }
  function restartActive() {
    games[currentGameKey]?.restart?.();
  }
  function setSpeedActive(v) {
    games[currentGameKey]?.setSpeed?.(v);
  }

  function switchGame(key) {
    if (currentGameKey === key) return;
    games[currentGameKey]?.onExit?.();
    resetCanvasVisuals();
    currentGameKey = key;
    games[currentGameKey]?.onEnter?.();
  }

  function init() {
    stage = $("funroom-stage");
    canvas = $("funroom-canvas");
    if (!stage || !canvas) return;
    ctx = canvas.getContext("2d");
    backCanvas = document.createElement("canvas");
    backCanvas.width = LOGICAL_WIDTH;
    backCanvas.height = LOGICAL_HEIGHT;
    backCtx = backCanvas.getContext("2d");
    backCtx.imageSmoothingEnabled = false;

    games = { snake: Snake(), pong: Pong(), flappy: Flappy() };

    $("funroom-start")?.addEventListener("click", startActive);
    $("funroom-pause")?.addEventListener("click", pauseActive);
    $("funroom-restart")?.addEventListener("click", restartActive);
    $("funroom-speed")?.addEventListener("change", (e) => {
      speed = parseInt(e.target.value, 10) || 100;
      setSpeedActive(speed);
    });
    $("funroom-game")?.addEventListener("change", (e) => {
      switchGame(e.target.value);
    });

    window.addEventListener("resize", resize);

    games[currentGameKey].onEnter();
    resize();
  }

  const observer = new MutationObserver(() => {
    const win = document.getElementById("games");
    if (win && win.classList.contains("active")) {
      setTimeout(() => {
        init();
        observer.disconnect();
      }, 50);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
