// 背景气泡，所有页面共用
(function () {
  const box = document.getElementById('bubbles');
  if (!box) return;
  for (let i = 0; i < 16; i++) {
    const b = document.createElement('i');
    const size = 6 + Math.random() * 26;
    b.style.width = size + 'px';
    b.style.height = size + 'px';
    b.style.left = (Math.random() * 100) + '%';
    b.style.animationDuration = (9 + Math.random() * 12) + 's';
    b.style.animationDelay = (-Math.random() * 18) + 's';
    box.appendChild(b);
  }
})();

// 视口调试：?debug=1 时在底部显示实际尺寸
(function () {
  if (location.search.indexOf('debug=1') < 0) return;
  var d = document.createElement('div');
  d.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:99999;' +
    'background:#000;color:#0f0;font:12px/1.5 monospace;padding:6px 8px;text-align:center;';
  function upd() {
    d.textContent = 'vw ' + window.innerWidth + 'x' + window.innerHeight +
      ' dpr ' + window.devicePixelRatio +
      ' body ' + document.body.scrollWidth +
      ' doc ' + document.documentElement.scrollWidth;
  }
  upd();
  window.addEventListener('resize', upd);
  document.body.appendChild(d);
})();
