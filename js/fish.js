/* 接小鱼 · 小虎鲸的游戏屋 */
(function () {
  'use strict';

  var canvas = document.getElementById('game');
  var wrap = document.getElementById('fish-wrap');
  var ctx = canvas.getContext('2d');
  var dpr = Math.min(window.devicePixelRatio || 1, 2);

  var W = 0, H = 0;
  var hero = { x: 0, y: 0, w: 148, h: 148 };
  var pointerX = null;
  var heroImg = new Image();
  var heroReady = false;
  heroImg.onload = function () { heroReady = true; };
  heroImg.src = '../assets/fish-hero.png';

  var BEST_KEY = 'orca-fish-best';
  var ROUND_SECONDS = 60;

  var MODES = [
    {
      id: 1,
      name: '第 1 局',
      sub: '先把鱼接熟',
      weights: { small: .58, big: .20, star: .10, shark: .12 }
    },
    {
      id: 2,
      name: '第 2 局',
      sub: '多了一种会挣的鱿鱼',
      weights: { small: .50, big: .18, star: .09, squid: .13, shark: .10 }
    },
    {
      id: 3,
      name: '第 3 局',
      sub: '最难的一局，海底有海胆',
      weights: { small: .42, big: .16, star: .08, squid: .12, shark: .10, urchin: .12 }
    }
  ];

  var CODEX = {
    small:  { name: '小鱼',   score: '+1',    color: '#5b8cff' },
    big:    { name: '大鱼',   score: '+3',    color: '#ff9d4d' },
    star:   { name: '星星',   score: '+5',    color: '#ffd94a' },
    squid:  { name: '鱿鱼',   score: '+2',    color: '#d98bff' },
    shark:  { name: '鲨鱼',   score: '−1 命', color: '#2a3550' },
    urchin: { name: '海胆',   score: '−1 命', color: '#7a4bd6' }
  };

  var TYPES = {
    small:  { score: 1, r: 17, color: '#5b8cff', speed: 120 },
    big:    { score: 3, r: 26, color: '#ff9d4d', speed: 95 },
    star:   { score: 5, r: 21, color: '#ffd94a', speed: 105 },
    squid:  { score: 2, r: 22, color: '#d98bff', speed: 118 },
    shark:  { score: 0, r: 30, color: '#2a3550', speed: 110 },
    urchin: { score: 0, r: 24, color: '#7a4bd6', speed: 88 }
  };

  var st = {
    running: false,
    over: false,
    mode: MODES[0],
    score: 0,
    lives: 3,
    level: 1,
    time: 0,
    spawnT: 0.4,
    fish: [],
    parts: [],
    flash: 0,
    shake: 0
  };

  var flash = 0;
  var shake = 0;

  /* ---------- 状态视图 ---------- */
  var viewModes = document.getElementById('view-modes');
  var viewIntro = document.getElementById('view-intro');
  var viewOver = document.getElementById('over-overlay');
  var hud = document.getElementById('hud');

  function showView(v) {
    viewModes.hidden = v !== 'modes';
    viewIntro.hidden = v !== 'intro';
    viewOver.hidden = v !== 'over';
    hud.classList.toggle('on', v === 'play');
  }

  /* ---------- 尺寸 ---------- */
  function resize() {
    var r = wrap.getBoundingClientRect();
    W = r.width;
    H = r.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    hero.w = Math.max(110, Math.min(160, W * 0.18));
    hero.h = hero.w;
    hero.y = H - hero.h * 0.52;
    if (!hero.x) hero.x = W / 2;
  }
  window.addEventListener('resize', function () {
    if (!st.running) resize();
  });

  /* ---------- 输入 ---------- */
  function setPointer(x) {
    var r = wrap.getBoundingClientRect();
    pointerX = x - r.left;
  }
  wrap.addEventListener('pointermove', function (e) { setPointer(e.clientX); });
  wrap.addEventListener('pointerdown', function (e) { setPointer(e.clientX); });

  /* ---------- 画图 ---------- */
  function drawFishBody(c, x, y, s, color, tilt) {
    c.save();
    c.translate(x, y);
    c.rotate(tilt);
    c.fillStyle = color;
    c.beginPath();
    c.ellipse(0, 0, s * 0.5, s * 0.31, 0, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.moveTo(-s * 0.44, 0);
    c.lineTo(-s * 0.88, -s * 0.30);
    c.lineTo(-s * 0.88, s * 0.30);
    c.closePath();
    c.fill();
    c.fillStyle = 'rgba(255,255,255,.92)';
    c.beginPath();
    c.arc(s * 0.20, -s * 0.05, s * 0.085, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#12234a';
    c.beginPath();
    c.arc(s * 0.22, -s * 0.05, s * 0.042, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  function drawStarShape(c, x, y, s, color) {
    c.save();
    c.translate(x, y);
    c.beginPath();
    for (var i = 0; i < 10; i++) {
      var rad = (i % 2 === 0) ? s * 0.5 : s * 0.22;
      var a = -Math.PI / 2 + i * Math.PI / 5;
      var px = Math.cos(a) * rad;
      var py = Math.sin(a) * rad;
      if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
    }
    c.closePath();
    c.fillStyle = color;
    c.fill();
    c.strokeStyle = 'rgba(255,255,255,.55)';
    c.lineWidth = 1.5;
    c.stroke();
    c.restore();
  }

  function drawSharkShape(c, x, y, s) {
    c.save();
    c.translate(x, y);
    c.fillStyle = '#26314d';
    c.beginPath();
    c.ellipse(0, 0, s * 0.5, s * 0.24, 0, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.moveTo(s * 0.05, -s * 0.20);
    c.lineTo(-s * 0.12, -s * 0.62);
    c.lineTo(-s * 0.30, -s * 0.20);
    c.closePath();
    c.fill();
    c.beginPath();
    c.moveTo(-s * 0.46, 0);
    c.lineTo(-s * 0.9, -s * 0.34);
    c.lineTo(-s * 0.82, s * 0.02);
    c.lineTo(-s * 0.9, s * 0.34);
    c.closePath();
    c.fill();
    c.fillStyle = '#ff5b6e';
    c.beginPath();
    c.arc(s * 0.22, -s * 0.04, s * 0.06, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  function drawSquidShape(c, x, y, s, t) {
    c.save();
    c.translate(x, y);
    var sway = Math.sin(t * 4) * 0.12;
    c.rotate(sway);
    // 触手
    c.strokeStyle = '#b06df0';
    c.lineWidth = Math.max(2, s * 0.055);
    c.lineCap = 'round';
    for (var i = -2; i <= 2; i++) {
      var ox = i * s * 0.13;
      c.beginPath();
      c.moveTo(ox, s * 0.10);
      c.quadraticCurveTo(ox + Math.sin(t * 6 + i) * s * 0.12, s * 0.42, ox * 1.25, s * 0.66);
      c.stroke();
    }
    // 头
    c.fillStyle = '#d98bff';
    c.beginPath();
    c.moveTo(0, -s * 0.58);
    c.quadraticCurveTo(s * 0.36, -s * 0.30, s * 0.26, s * 0.12);
    c.quadraticCurveTo(0, s * 0.24, -s * 0.26, s * 0.12);
    c.quadraticCurveTo(-s * 0.36, -s * 0.30, 0, -s * 0.58);
    c.closePath();
    c.fill();
    // 眼
    c.fillStyle = '#fff';
    c.beginPath(); c.arc(-s * 0.12, -s * 0.10, s * 0.075, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(s * 0.12, -s * 0.10, s * 0.075, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#3a1a5a';
    c.beginPath(); c.arc(-s * 0.11, -s * 0.10, s * 0.038, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(s * 0.13, -s * 0.10, s * 0.038, 0, Math.PI * 2); c.fill();
    c.restore();
  }

  function drawUrchinShape(c, x, y, s, t) {
    c.save();
    c.translate(x, y);
    c.rotate(t * 0.6);
    // 刺
    c.strokeStyle = '#6b5a9a';
    c.lineWidth = Math.max(1.6, s * 0.045);
    c.lineCap = 'round';
    for (var i = 0; i < 16; i++) {
      var a = (i / 16) * Math.PI * 2;
      var r1 = s * 0.32;
      var r2 = s * (0.62 + (i % 2) * 0.10);
      c.beginPath();
      c.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
      c.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
      c.stroke();
    }
    // 球
    c.fillStyle = '#4a3f6b';
    c.beginPath();
    c.arc(0, 0, s * 0.34, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#8a7ac0';
    c.beginPath();
    c.arc(-s * 0.08, -s * 0.08, s * 0.10, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  function drawByType(c, type, x, y, r, t) {
    if (type === 'small' || type === 'big') {
      drawFishBody(c, x, y, r * 2, TYPES[type].color, Math.sin(t * 3 + x) * 0.12);
    } else if (type === 'star') {
      drawStarShape(c, x, y, r * 1.6, TYPES.star.color);
    } else if (type === 'shark') {
      drawSharkShape(c, x, y, r * 1.9);
    } else if (type === 'squid') {
      drawSquidShape(c, x, y, r * 1.9, t);
    } else if (type === 'urchin') {
      drawUrchinShape(c, x, y, r * 1.8, t);
    }
  }

  /* ---------- 生成 ---------- */
  function pickType() {
    var w = st.mode.weights;
    var total = 0;
    for (var k in w) total += w[k];
    var r = Math.random() * total;
    for (var k2 in w) {
      r -= w[k2];
      if (r <= 0) return k2;
    }
    return 'small';
  }

  function spawn() {
    var type = pickType();
    var t = TYPES[type];
    var speed = t.speed + st.level * 14 + Math.random() * 30;
    st.fish.push({
      type: type,
      x: 40 + Math.random() * (W - 80),
      y: -40,
      vy: speed,
      r: t.r,
      wob: Math.random() * Math.PI * 2,
      alive: true
    });
    var gap = Math.max(0.30, 0.95 - st.level * 0.075);
    st.spawnT = gap * (0.75 + Math.random() * 0.6);
  }

  function makePart(x, y, color) {
    for (var i = 0; i < 10; i++) {
      var a = Math.random() * Math.PI * 2;
      var sp = 40 + Math.random() * 130;
      st.parts.push({
        x: x, y: y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 40,
        life: 0.55 + Math.random() * 0.35,
        max: 0.9,
        r: 2 + Math.random() * 3,
        color: color
      });
    }
  }

  /* ---------- 主循环 ---------- */
  var last = 0;
  function loop(ts) {
    var dt = Math.min(0.05, (ts - last) / 1000 || 0);
    last = ts;
    if (st.running) update(dt);
    render();
    requestAnimationFrame(loop);
  }

  function update(dt) {
    st.time += dt;
    var lv = 1 + Math.floor(st.time / 20);
    if (lv !== st.level) {
      st.level = Math.min(3, lv);
      document.getElementById('hud-level').textContent = st.level;
    }
    var remain = Math.max(0, Math.ceil(ROUND_SECONDS - st.time));
    document.getElementById('hud-time').textContent = remain;

    if (st.time >= ROUND_SECONDS) {
      endGame('time');
      return;
    }

    if (pointerX !== null) {
      var tx = Math.max(hero.w / 2, Math.min(W - hero.w / 2, pointerX));
      hero.x += (tx - hero.x) * Math.min(1, dt * 14);
    }

    st.spawnT -= dt;
    if (st.spawnT <= 0) spawn();

    var bowlX = hero.x;
    var bowlY = hero.y - hero.h * 0.02;
    var bowlR = hero.w * 0.30;

    for (var i = st.fish.length - 1; i >= 0; i--) {
      var f = st.fish[i];
      f.y += f.vy * dt;
      f.wob += dt * 3;
      f.x += Math.sin(f.wob) * 12 * dt;

      var dx = f.x - bowlX;
      var dy = f.y - bowlY;
      if (dx * dx + dy * dy < (bowlR + f.r) * (bowlR + f.r)) {
        if (f.type === 'shark' || f.type === 'urchin') {
          st.lives--;
          makePart(f.x, f.y, '#ff6b7f');
          shake = 0.35;
          flash = 0.55;
          document.getElementById('hud-lives').textContent = '♥'.repeat(Math.max(0, st.lives));
          st.fish.splice(i, 1);
          if (st.lives <= 0) { endGame('lives'); return; }
        } else {
          st.score += TYPES[f.type].score;
          document.getElementById('hud-score').textContent = st.score;
          makePart(f.x, f.y, TYPES[f.type].color);
          st.fish.splice(i, 1);
        }
        continue;
      }
      if (f.y > H + 50) st.fish.splice(i, 1);
    }

    for (var j = st.parts.length - 1; j >= 0; j--) {
      var p = st.parts[j];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 160 * dt;
      p.life -= dt;
      if (p.life <= 0) st.parts.splice(j, 1);
    }

    if (shake > 0) shake = Math.max(0, shake - dt);
    if (flash > 0) flash = Math.max(0, flash - dt);
  }

  function render() {
    ctx.clearRect(0, 0, W, H);
    var t = st.time;

    if (shake > 0) {
      ctx.save();
      ctx.translate((Math.random() - 0.5) * 16 * shake, (Math.random() - 0.5) * 16 * shake);
    }

    for (var i = 0; i < st.fish.length; i++) {
      var f = st.fish[i];
      drawByType(ctx, f.type, f.x, f.y, f.r, t + f.wob * 0.2);
    }

    if (heroReady) {
      var blink = flash > 0 && Math.floor(flash * 14) % 2 === 0;
      ctx.globalAlpha = blink ? 0.22 : 1;
      ctx.drawImage(heroImg, hero.x - hero.w / 2, hero.y - hero.h * 0.62, hero.w, hero.h);
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = '#4a7dff';
      ctx.beginPath();
      ctx.arc(hero.x, hero.y, hero.w * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }

    for (var j = 0; j < st.parts.length; j++) {
      var p = st.parts[j];
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (shake > 0) ctx.restore();
  }

  /* ---------- 图鉴 ---------- */
  function renderCodex(mode) {
    var box = document.getElementById('codex');
    box.innerHTML = '';
    var keys = Object.keys(mode.weights);
    var order = ['small', 'big', 'star', 'squid', 'shark', 'urchin'];
    order.forEach(function (k) {
      if (keys.indexOf(k) < 0) return;
      var item = document.createElement('div');
      item.className = 'codex-item';

      var cv = document.createElement('canvas');
      cv.className = 'codex-icon';
      cv.width = 72 * dpr;
      cv.height = 72 * dpr;
      cv.style.width = '72px';
      cv.style.height = '72px';
      var c = cv.getContext('2d');
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      var tt = TYPES[k];
      var sc = 72;
      if (k === 'small' || k === 'big') drawFishBody(c, sc / 2, sc / 2, tt.r * 2.3, CODEX[k].color, 0);
      else if (k === 'star') drawStarShape(c, sc / 2, sc / 2, tt.r * 1.9, CODEX[k].color);
      else if (k === 'shark') drawSharkShape(c, sc / 2, sc / 2, tt.r * 2.1);
      else if (k === 'squid') drawSquidShape(c, sc / 2, sc / 2, tt.r * 2.2, 0.6);
      else if (k === 'urchin') drawUrchinShape(c, sc / 2, sc / 2, tt.r * 2.0, 0.3);

      var name = document.createElement('span');
      name.className = 'codex-name';
      name.textContent = CODEX[k].name;

      var score = document.createElement('span');
      score.className = 'codex-score' + (CODEX[k].score.charAt(0) === '−' ? ' bad' : '');
      score.textContent = CODEX[k].score;

      item.appendChild(cv);
      item.appendChild(name);
      item.appendChild(score);
      box.appendChild(item);
    });
  }

  /* ---------- 视图切换 ---------- */
  function toModes() {
    st.running = false;
    showView('modes');
    document.getElementById('best-score').textContent = localStorage.getItem(BEST_KEY) || 0;
  }

  function toIntro(mode) {
    st.mode = mode;
    document.getElementById('intro-title').textContent = mode.name;
    document.getElementById('intro-desc').textContent = mode.sub + ' · 60 秒';
    renderCodex(mode);
    showView('intro');
  }

  function start() {
    resize();
    st.running = true;
    st.over = false;
    st.score = 0;
    st.lives = 3;
    st.level = 1;
    st.time = 0;
    st.spawnT = 0.5;
    st.fish = [];
    st.parts = [];
    st.flash = 0;
    st.shake = 0;
    flash = 0;
    shake = 0;
    hero.x = W / 2;
    pointerX = null;
    document.getElementById('hud-score').textContent = '0';
    document.getElementById('hud-lives').textContent = '♥♥♥';
    document.getElementById('hud-level').textContent = '1';
    document.getElementById('hud-time').textContent = ROUND_SECONDS;
    showView('play');
  }

  function endGame(reason) {
    st.running = false;
    var best = +(localStorage.getItem(BEST_KEY) || 0);
    var isNew = st.score > best;
    if (isNew) {
      try { localStorage.setItem(BEST_KEY, String(st.score)); } catch (e) {}
    }

    var key = reason === 'lives' ? 'fail' : String(st.mode.id || 1);
    var e = ENDINGS[key] || ENDINGS[1];
    document.getElementById('over-bg').style.backgroundImage = 'url("' + e.bg + '")';
    document.getElementById('over-title').textContent = e.title;
    document.getElementById('over-line').textContent = e.line;
    document.getElementById('over-note').textContent =
      '得分 ' + st.score + ' · 等级 ' + st.level + (isNew ? ' · 新纪录！' : ' · 最高分 ' + best);
    showView('over');
  }

  var ENDINGS = {
    fail: {
      bg: '../assets/fish-end-fail.png',
      title: '被咬到啦',
      line: '被鲨鱼咬了一大口……它趴在旁边慢吞吞地说：「人，要坚持哦～」'
    },
    1: {
      bg: '../assets/fish-end-1.png',
      title: '第 1 局 · 稳稳接住',
      line: '贴贴！这一局接得好稳，奖励你一下。'
    },
    2: {
      bg: '../assets/fish-end-2.png',
      title: '第 2 局 · 算力 +1',
      line: '鱼都吃进肚子里了，算力 +1，下一局继续。'
    },
    3: {
      bg: '../assets/fish-end-3.png',
      title: '第 3 局 · 全部通关',
      line: '最难的一局也过了——这个世界里，我最喜欢你。'
    }
  };

  /* ---------- 按钮 ---------- */
  var modeList = document.getElementById('mode-list');
  MODES.forEach(function (m) {
    var b = document.createElement('button');
    b.className = 'mode-btn';
    b.innerHTML = '<b>' + m.name + '</b><span>' + m.sub + '</span>';
    b.addEventListener('click', function () { toIntro(m); });
    modeList.appendChild(b);
  });

  document.getElementById('btn-start').addEventListener('click', start);
  document.getElementById('btn-back').addEventListener('click', toModes);
  document.getElementById('btn-again').addEventListener('click', start);
  document.getElementById('btn-to-modes').addEventListener('click', toModes);

  /* ---------- 启动 ---------- */
  resize();
  toModes();
  requestAnimationFrame(loop);

  if (location.search.indexOf('start=1') >= 0) start();

  var mm = location.search.match(/[?&]mode=(\d)/);
  if (mm) {
    var mi = Math.max(0, Math.min(MODES.length - 1, parseInt(mm[1], 10) - 1));
    toIntro(MODES[mi]);
  }

  if (location.search.indexOf('tick=1') >= 0) {
    setInterval(function () {
      if (st.running) update(0.05);
      render();
    }, 50);
  }

  var em = location.search.match(/[?&]end=(\w+)/);
  if (em) {
    var k = em[1];
    if (k === 'fail') {
      st.mode = MODES[0];
      st.score = 18;
      st.level = 1;
      endGame('lives');
    } else {
      st.mode = MODES[Math.max(0, Math.min(2, (+k) - 1))];
      st.score = k === '1' ? 64 : (k === '2' ? 96 : 128);
      st.level = (+k) + 1;
      endGame('time');
    }
  }

  if (location.search.indexOf('demo=1') >= 0) {
    start();
    st.fish = [
      { type: 'small', x: W * 0.18, y: H * 0.20, vy: 0, r: 17, wob: 0 },
      { type: 'big', x: W * 0.42, y: H * 0.34, vy: 0, r: 26, wob: 1 },
      { type: 'star', x: W * 0.66, y: H * 0.22, vy: 0, r: 21, wob: 2 },
      { type: 'squid', x: W * 0.30, y: H * 0.60, vy: 0, r: 22, wob: 3 },
      { type: 'shark', x: W * 0.78, y: H * 0.56, vy: 0, r: 30, wob: 4 },
      { type: 'urchin', x: W * 0.58, y: H * 0.72, vy: 0, r: 24, wob: 5 }
    ];
    st.score = 128;
    document.getElementById('hud-score').textContent = '128';
    render();
  }
})();
