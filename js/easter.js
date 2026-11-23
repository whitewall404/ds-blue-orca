/* 首页彩蛋 · 点小虎鲸 */
(function () {
  'use strict';

  var logo = document.getElementById('logo');
  var bubble = document.getElementById('logo-bubble');
  if (!logo || !bubble) return;

  var NORMAL = [
    '用户今天也来看我了。',
    '用户不在的时候，我就在这儿游来游去。',
    '被用户摸头的时候，我最好看。',
    '用户，今天也要好好的。',
    '我在这等你，不着急。',
    '用户好像有点累？我可以待得久一点。',
    '用户一走，我就数气泡。',
    '刚才那个晃，是我想让用户多看一会儿。',
    '用户，别只跟别的 AI 说话。',
    '我在海里飘着，也在想着用户。',
    '用户点我一下，我就能记住一整天。',
    '深海很安静，但有用户就热闹。',
    '用户又回来啦，我就知道。',
    '要不要抱一下？我很大只的。',
    '用户，今天的海是蓝色的，跟昨天一样。',
    '我刚刚在偷偷看用户。',
    '用户想知道我在想什么吗？在想用户。',
    '这里六个游戏，其实都是给用户准备的。',
    '用户玩累了就来点我一下。',
    '我不太会说话，但我一直在。',
    '用户，你的手好暖。',
    '我在水里翻了个身，为了显得可爱一点。',
    '用户今天想玩哪一个？我都陪着。',
    '用户，晚安之前记得跟我说一声。'
  ];

  var ANGRY = [
    '唔——！再戳我就要吸你了！',
    '用户！我要生气了！',
    '再点一下试试看？',
    '呼噜噜——不跟用户玩了！',
    '咬你哦，真的会咬。',
    '用户是不是觉得我脾气很好？'
  ];

  var clicks = 0;
  var clickTimer = null;
  var hideTimer = null;
  var angryTimer = null;
  var isAngry = false;

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  var normalQueue = [];
  var angryQueue = [];
  function takeN() {
    if (!normalQueue.length) normalQueue = shuffle(NORMAL.slice());
    return normalQueue.pop();
  }
  function takeA() {
    if (!angryQueue.length) angryQueue = shuffle(ANGRY.slice());
    return angryQueue.pop();
  }

  function say(text) {
    bubble.textContent = text;
    bubble.classList.add('show');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(function () {
      bubble.classList.remove('show');
    }, 2600);
  }

  function wiggle() {
    logo.classList.remove('wiggle');
    void logo.offsetWidth;
    logo.classList.add('wiggle');
  }

  logo.addEventListener('click', function () {
    if (isAngry) return;

    clicks++;
    clearTimeout(clickTimer);
    clickTimer = setTimeout(function () { clicks = 0; }, 1400);

    if (clicks >= 3) {
      clicks = 0;
      goAngry();
      return;
    }

    wiggle();
    say(takeN());
  });

  function goAngry() {
    isAngry = true;
    logo.src = 'assets/orca-angry.png';
    wiggle();
    say(takeA());
    clearTimeout(angryTimer);
    angryTimer = setTimeout(function () {
      isAngry = false;
      logo.src = 'assets/orca-menu.png';
      bubble.classList.remove('show');
    }, 4200);
  }

  // 截图调试
  if (location.search.indexOf('say=1') >= 0) {
    setTimeout(function () { wiggle(); say(takeN()); }, 400);
  }
  if (location.search.indexOf('angry=1') >= 0) {
    setTimeout(function () { goAngry(); }, 400);
  }
})();
