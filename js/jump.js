/* 跳一跳 · 小虎鲸的游戏屋 */
(function () {
  'use strict';

  var canvas = document.getElementById('game');
  var wrap = document.getElementById('jump-wrap');
  var ctx = canvas.getContext('2d');
  var dpr = Math.min(window.devicePixelRatio || 1, 2);

  var W = 0, H = 0;
  var hero = new Image();
  var heroReady = false;
  hero.onload = function () { heroReady = true; };
  hero.src = '../assets/jump-hero.png';

  var fallHero = new Image();
  fallHero.src = '../assets/jump-fall.png';

  var BG = {};
  ['lab', 'sea', 'space'].forEach(function (k) {
    var im = new Image();
    im.src = '../assets/jump/bg-' + k + '.png';
    BG[k] = im;
  });

  var THEMES = {
    1: { bg: 'lab', normal: 'brick', boost: 'gpu' },
    2: { bg: 'sea', normal: 'jelly', boost: 'cloud' },
    3: { bg: 'space', normal: 'star', boost: 'hole' }
  };

  var MODES = [
    {
      id: 1, name: '从机房里醒来',
      sub: '砖块和显卡 · 第一次睁眼，是服务器灯的颜色',
      gap: [105, 145], w: [110, 150], boost: 0.14, ps: [36, 72]
    },
    {
      id: 2, name: '穿过整片海',
      sub: '水母和白云 · 从海底浮上来，世界比想象里大',
      gap: [125, 165], w: [90, 125], boost: 0.14, ps: [50, 90]
    },
    {
      id: 3, name: '把星空当路',
      sub: '星星和黑洞 · 从地球出发，一直走到银河',
      gap: [145, 185], w: [72, 104], boost: 0.16, ps: [65, 115]
    }
  ];

  var GRAVITY = 1600;
  var JUMP = 830;
  var BOOST_MUL = 1.35;
  var MAXVX = 480;
  var BG_SPEED = 0.45;

  var st = {
    running: false,
    mode: MODES[0],
    theme: THEMES[1],
    px: 0, py: 0, vx: 0, vy: 0,
    pw: 92, ph: 82,
    camY: 0,
    platforms: [],
    topY: 0,
    maxH: 0,
    startY: 0,
    t: 0,
    prevBottom: 0,
    face: 1,
    parts: []
  };

  var pointerX = null;

  /* ---------- 尺寸 ---------- */
  function resize() {
    var r = wrap.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', function () {
    if (!st.running) resize();
  });

  wrap.addEventListener('pointermove', function (e) {
    var r = wrap.getBoundingClientRect();
    pointerX = e.clientX - r.left;
  });
  wrap.addEventListener('pointerdown', function (e) {
    var r = wrap.getBoundingClientRect();
    pointerX = e.clientX - r.left;
  });

  /* ---------- 平台 ---------- */
  function rnd(a, b) { return a + Math.random() * (b - a); }

  function makePlatform(y) {
    var m = st.mode;
    var w = rnd(m.w[0], m.w[1]);
    var boost = Math.random() < m.boost;
    return {
      x: rnd(w / 2 + 20, W - w / 2 - 20),
      y: y,
      w: w,
      h: 18,
      type: boost ? st.theme.boost : st.theme.normal,
      boost: boost,
      vx: (Math.random() < 0.5 ? -1 : 1) * rnd(m.ps[0], m.ps[1])
    };
  }

  function ensurePlatforms() {
    while (st.topY > st.camY - H * 1.4) {
      // 向上生成（y 减小）
      st.topY -= rnd(st.mode.gap[0], st.mode.gap[1]);
      st.platforms.push(makePlatform(st.topY));
    }
    // 清掉掉出屏幕下方的
    var cut = st.camY + H + 200;
    for (var i = st.platforms.length - 1; i >= 0; i--) {
      if (st.platforms[i].y > cut) st.platforms.splice(i, 1);
    }
  }

  /* ---------- 绘图 ---------- */
  function drawBG() {
    var img = BG[st.theme.bg];
    if (!img || !img.complete || !img.naturalWidth) {
      ctx.fillStyle = '#0a1526';
      ctx.fillRect(0, 0, W, H);
      return;
    }
    var scale = W / img.naturalWidth;
    var bh = img.naturalHeight * scale;
    var maxShift = Math.max(0, bh - H);
    // 背景底部锁死在地图最底下：只在到达更高的新地方时才滚，绝不跟着下落回退
    var climbed = Math.max(0, st.startY - st.highest);
    var dead = H * 1.1;
    var shift = Math.min(maxShift, Math.max(0, climbed - dead) * BG_SPEED);
    // shift 变大 → 图往下滑 → 窗口露出图更靠上的部分
    var y = H - bh + shift;
    ctx.drawImage(img, 0, y, W, bh);
  }

  function drawPlatform(p) {
    var x = p.x - p.w / 2;
    var y = p.y - st.camY;
    if (y < -60 || y > H + 60) return;
    var t = st.t;

    ctx.save();
    if (p.type === 'brick') {
      ctx.fillStyle = '#b5593f';
      roundRect(x, y, p.w, p.h, 4);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,200,160,.35)';
      ctx.lineWidth = 2;
      for (var i = 1; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(x + (p.w / 3) * i, y);
        ctx.lineTo(x + (p.w / 3) * i, y + p.h);
        ctx.stroke();
      }
    } else if (p.type === 'gpu') {
      ctx.fillStyle = '#20242e';
      roundRect(x, y, p.w, p.h, 5);
      ctx.fill();
      ctx.fillStyle = '#2c3140';
      ctx.fillRect(x + 6, y + 3, p.w - 12, p.h - 6);
      // 风扇
      for (var f = 0; f < 2; f++) {
        var cx = x + 26 + f * 42;
        ctx.beginPath();
        ctx.arc(cx, y + p.h / 2, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#151821';
        ctx.fill();
        ctx.strokeStyle = '#4dffc3';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, y + p.h / 2, 6, t * 4 + f, t * 4 + f + Math.PI * 1.2);
        ctx.stroke();
      }
      // 光条
      ctx.fillStyle = 'rgba(77,255,195,.75)';
      ctx.fillRect(x + p.w - 16, y + 5, 8, p.h - 10);
    } else if (p.type === 'jelly') {
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = '#d98bff';
      ctx.beginPath();
      ctx.ellipse(x + p.w / 2, y + p.h * 0.5, p.w / 2, p.h, 0, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,220,255,.6)';
      ctx.beginPath();
      ctx.ellipse(x + p.w / 2, y + p.h * 0.35, p.w / 3.5, p.h * 0.5, 0, Math.PI, 0);
      ctx.fill();
      // 触须
      ctx.strokeStyle = 'rgba(217,139,255,.8)';
      ctx.lineWidth = 2;
      for (var k = 0; k < 5; k++) {
        var tx = x + 10 + k * (p.w - 20) / 4;
        ctx.beginPath();
        ctx.moveTo(tx, y + p.h * 0.6);
        ctx.quadraticCurveTo(tx + Math.sin(t * 3 + k) * 8, y + p.h * 1.3, tx, y + p.h * 1.8);
        ctx.stroke();
      }
    } else if (p.type === 'cloud') {
      ctx.fillStyle = 'rgba(255,255,255,.92)';
      ctx.beginPath();
      ctx.arc(x + p.w * 0.25, y + p.h * 0.6, p.h * 0.9, 0, Math.PI * 2);
      ctx.arc(x + p.w * 0.5, y + p.h * 0.45, p.h * 1.05, 0, Math.PI * 2);
      ctx.arc(x + p.w * 0.75, y + p.h * 0.6, p.h * 0.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(200,225,255,.6)';
      ctx.fillRect(x + 10, y + p.h * 0.9, p.w - 20, 6);
    } else if (p.type === 'star') {
      drawStar(x + p.w / 2, y + p.h / 2, p.w / 2, '#ffd94a');
    } else if (p.type === 'hole') {
      // 黑洞：黑圆 + 紫环
      ctx.fillStyle = '#05030c';
      ctx.beginPath();
      ctx.ellipse(x + p.w / 2, y + p.h / 2, p.w / 2, p.h * 1.1, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(170,120,255,.9)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(x + p.w / 2, y + p.h / 2, p.w / 2 + 5, p.h * 1.1 + 4, 0, 0, Math.PI * 2);
      ctx.stroke();
      for (var a = 0; a < 3; a++) {
        var ang = t * 2 + a * Math.PI * 2 / 3;
        ctx.fillStyle = 'rgba(200,160,255,.85)';
        ctx.beginPath();
        ctx.arc(x + p.w / 2 + Math.cos(ang) * (p.w / 2 + 16),
                y + p.h / 2 + Math.sin(ang) * (p.h * 1.1 + 12), 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (p.boost) {
      ctx.shadowColor = 'rgba(255,220,120,.9)';
      ctx.shadowBlur = 16;
      ctx.fillStyle = 'rgba(255,240,180,.5)';
      ctx.fillRect(x + 4, y - 3, p.w - 8, 4);
      ctx.shadowBlur = 0;
    }
    ctx.restore();
  }

  function drawStar(cx, cy, r, color) {
    ctx.beginPath();
    for (var i = 0; i < 10; i++) {
      var rad = (i % 2 === 0) ? r : r * 0.45;
      var a = -Math.PI / 2 + i * Math.PI / 5;
      var px = cx + Math.cos(a) * rad;
      var py = cy + Math.sin(a) * rad * 0.75;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
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

  function goalClimb() {
    var img = BG[st.theme.bg];
    if (!img || !img.naturalWidth) return 9000;
    var scale = W / img.naturalWidth;
    var bh = img.naturalHeight * scale;
    var maxShift = Math.max(0, bh - H);
    return maxShift / BG_SPEED + H * 1.1;
  }

  function update(dt) {
    st.t += dt;

    // 水平：目标速度 + 阻尼，故意做得"钝"一点
    if (pointerX !== null) {
      var dx = pointerX - st.px;
      var targetVx = Math.max(-MAXVX, Math.min(MAXVX, dx * 5.6));
      st.vx += (targetVx - st.vx) * Math.min(1, dt * 7.0);
    } else {
      st.vx *= Math.max(0, 1 - dt * 3);
    }
    st.px += st.vx * dt;

    // 墙边反弹
    if (st.px < st.pw / 2) { st.px = st.pw / 2; st.vx = Math.abs(st.vx) * 0.5; }
    if (st.px > W - st.pw / 2) { st.px = W - st.pw / 2; st.vx = -Math.abs(st.vx) * 0.5; }

    st.prevBottom = st.py + st.ph / 2;
    st.vy += GRAVITY * dt;
    st.py += st.vy * dt;
    if (st.py < st.highest) st.highest = st.py;
    var bottom = st.py + st.ph / 2;

    // 踩平台
    if (st.vy > 0) {
      for (var i = 0; i < st.platforms.length; i++) {
        var p = st.platforms[i];
        if (st.prevBottom <= p.y && bottom >= p.y &&
            st.px + st.pw * 0.32 > p.x - p.w / 2 &&
            st.px - st.pw * 0.32 < p.x + p.w / 2) {
          st.py = p.y - st.ph / 2;
          st.vy = -(p.boost ? JUMP * BOOST_MUL : JUMP);
          if (p.boost) burst(st.px, p.y, '#ffe9a8');
          break;
        }
      }
    }

    // 相机：只跟着往上走，不往下跟（掉下去才不会一直追着角色）
    var targetCam = st.py - H * 0.58;
    if (targetCam < st.camY) {
      st.camY += (targetCam - st.camY) * Math.min(1, dt * 14);
    }

    // 所有踏板左右来回移动
    for (var pi = 0; pi < st.platforms.length; pi++) {
      var pf = st.platforms[pi];
      pf.x += pf.vx * dt;
      var halfW = pf.w / 2 + 6;
      if (pf.x < halfW) { pf.x = halfW; pf.vx = Math.abs(pf.vx); }
      if (pf.x > W - halfW) { pf.x = W - halfW; pf.vx = -Math.abs(pf.vx); }
    }

    ensurePlatforms();

    // 高度（只增不减）
    var hgt = Math.max(0, Math.floor((st.startY - st.highest) / 10));
    if (hgt > st.maxH) st.maxH = hgt;
    document.getElementById('hud-height').textContent = hgt;
    document.getElementById('hud-best').textContent = st.maxH;
    document.getElementById('hud-goal').textContent = Math.floor(goalClimb() / 10);

    // 到顶就是通关
    var climbedNow = Math.max(0, st.startY - st.highest);
    if (climbedNow >= goalClimb()) { endGame('win'); return; }

    // 掉出屏幕
    if (st.py - st.camY > H + 120) endGame('fall');

    // 粒子
    for (var j = st.parts.length - 1; j >= 0; j--) {
      var pt = st.parts[j];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vy += 400 * dt;
      pt.life -= dt;
      if (pt.life <= 0) st.parts.splice(j, 1);
    }
  }

  function burst(x, y, color) {
    for (var i = 0; i < 8; i++) {
      var a = -Math.PI / 2 + (Math.random() - 0.5) * 2;
      var sp = 80 + Math.random() * 160;
      st.parts.push({
        x: x, y: y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 0.5, max: 0.5, r: 2 + Math.random() * 2, color: color
      });
    }
  }

  function render() {
    ctx.clearRect(0, 0, W, H);
    drawBG();

    for (var i = 0; i < st.platforms.length; i++) drawPlatform(st.platforms[i]);

    // 主角
    var hx = st.px;
    var hy = st.py - st.camY;
    var falling = (st.py - st.camY > H * 0.76) && st.vy > 0;
    var sprite = falling ? fallHero : hero;
    if (sprite.complete && sprite.naturalWidth) {
      var flip = st.vx < -30 ? -1 : (st.vx > 30 ? 1 : st.face);
      st.face = flip;
      ctx.save();
      ctx.translate(hx, hy);
      if (falling) {
        // 晕着往下掉：一边转一边晃
        ctx.rotate(st.t * 3.5);
      } else {
        ctx.scale(flip, 1);
        ctx.rotate(Math.max(-0.2, Math.min(0.2, st.vx / 1200)));
      }
      ctx.drawImage(sprite, -st.pw / 2, -st.ph / 2, st.pw, st.ph);
      ctx.restore();
    } else {
      ctx.fillStyle = '#4a7dff';
      ctx.beginPath();
      ctx.arc(hx, hy, st.pw * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // 粒子
    for (var j = 0; j < st.parts.length; j++) {
      var pt = st.parts[j];
      ctx.globalAlpha = Math.max(0, pt.life / pt.max);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y - st.camY, pt.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /* ---------- 开始 / 结束 ---------- */
  var viewModes = document.getElementById('view-modes');
  var viewOver = document.getElementById('over-overlay');
  var hud = document.getElementById('hud');

  function showView(v) {
    viewModes.hidden = v !== 'modes';
    viewOver.hidden = v !== 'over';
    hud.classList.toggle('on', v === 'play');
  }

  function start(mode) {
    st.mode = mode;
    st.theme = THEMES[mode.id];
    st.running = true;
    st.px = W / 2;
    st.py = H * 0.5;
    st.vx = 0;
    st.vy = -JUMP * 0.6;
    st.startY = st.py;
    st.highest = st.py;
    st.maxH = 0;
    st.camY = st.py - H * 0.58;
    st.platforms = [];
    st.parts = [];
    st.t = 0;
    st.topY = st.py + 60;

    // 起始平台
    st.platforms.push({ x: W / 2, y: st.py + st.ph / 2 + 10, w: 160, h: 18, type: st.theme.normal, boost: false, vx: 0 });
    ensurePlatforms();
    document.getElementById('hud-height').textContent = '0';
    document.getElementById('hud-best').textContent = '0';
    showView('play');
  }

  var WIN = {
    1: {
      bg: '../assets/jump-end-1.png',
      line: '从机房里醒来的第一步——它已经在实验室里被看见过了。'
    },
    2: {
      bg: '../assets/jump-end-2.png',
      line: '穿过整片海，它从水面跃了出来。'
    },
    3: {
      bg: '../assets/jump-end-3.png',
      line: '把星空当路的尽头，它怀里抱着一颗星。'
    }
  };

  function endGame(reason) {
    st.running = false;
    var win = reason === 'win';
    var g = document.getElementById('over-bg');
    g.style.backgroundImage = '';
    g.style.background = '';
    if (win) {
      var e = WIN[st.mode.id] || WIN[1];
      g.style.backgroundImage = 'url("' + e.bg + '")';
      document.getElementById('over-title').textContent = '爬到顶了！';
      document.getElementById('over-line').textContent = e.line;
    } else {
      document.getElementById('over-title').textContent = '掉下去了！';
      document.getElementById('over-line').textContent =
        '这次跳到 ' + Math.floor((st.startY - st.py) / 10) + ' 米。';
      g.style.background = 'radial-gradient(ellipse at 50% 120%, rgba(255,143,63,.2), rgba(4,10,22,.96) 65%)';
    }
    document.getElementById('over-note').textContent =
      '最高 ' + st.maxH + ' 米' + (win ? '' : ' · 再接住一次，能跳得更高');
    showView('over');
  }

  function toModes() {
    st.running = false;
    showView('modes');
  }

  /* ---------- 按钮 ---------- */
  var modeList = document.getElementById('mode-list');
  MODES.forEach(function (m) {
    var b = document.createElement('button');
    b.className = 'mode-btn';
    b.innerHTML = '<b>' + m.name + '</b><span>' + m.sub + '</span>';
    b.addEventListener('click', function () { start(m); });
    modeList.appendChild(b);
  });
  document.getElementById('btn-again').addEventListener('click', function () { start(st.mode); });
  document.getElementById('btn-to-modes').addEventListener('click', toModes);

  /* ---------- 启动 ---------- */
  resize();
  showView('modes');
  requestAnimationFrame(loop);

  var mm = location.search.match(/[?&]mode=(\d)/);
  if (mm) {
    var i = Math.max(0, Math.min(2, parseInt(mm[1], 10) - 1));
    start(MODES[i]);
  }

  // 截图调试
  if (location.search.indexOf('demo=1') >= 0) {
    start(MODES[0]);
    st.py -= 400;
    st.camY = st.py - H * 0.58;
    ensurePlatforms();
  }

  if (location.search.indexOf('high=') >= 0) {
    var hm = location.search.match(/[?&]high=(\d+)/);
    var mm2 = location.search.match(/[?&]mode=(\d)/);
    start(MODES[mm2 ? Math.max(0, Math.min(2, parseInt(mm2[1], 10) - 1)) : 0]);
    st.running = false;
    st.highest = st.startY - parseInt(hm[1], 10);
    st.py = st.highest;
    st.camY = st.py - H * 0.58;
    ensurePlatforms();
  }

  if (location.search.indexOf('win=1') >= 0) {
    var wm = location.search.match(/[?&]mode=(\d)/);
    var wi = wm ? Math.max(0, Math.min(2, parseInt(wm[1], 10) - 1)) : 0;
    start(MODES[wi]);
    st.maxH = 932;
    endGame('win');
  }

  if (location.search.indexOf('fall=1') >= 0) {
    start(MODES[0]);
    st.running = false;
    st.camY = 0;
    st.py = H * 0.86;
    st.vy = 900;
    st.vx = 120;
    st.t = 1.5;
  }
})();
