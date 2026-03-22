/**
 * Pixel-arcade background: warm void, gold floor grid, electric accents.
 * Simplex noise (esm.sh) — subtle warmth drift only, no blue atmosphere.
 */
import { createNoise2D } from 'https://esm.sh/simplex-noise@4.0.1';

const noise2D = createNoise2D(() => Math.random());

/* Palette aligned with CRT reference: chocolate void, #00AEEF, #FFD700 */
const COL = {
  void: [18, 10, 7],
  voidDeep: [10, 6, 4],
  brick: [55, 28, 22],
  electric: [0, 174, 239],
  electricDim: [10, 70, 90],
  gold: [255, 215, 0],
  goldDim: [140, 90, 20],
  cream: [248, 240, 228],
  redGlow: [180, 35, 45],
};

function rgb(a, alpha) {
  return 'rgba(' + a[0] + ',' + a[1] + ',' + a[2] + ',' + alpha + ')';
}

export function initArcadeBackground(options) {
  var reduceMotion = options && options.reduceMotion;
  var canvas = document.getElementById('bg-canvas');
  if (!canvas || !canvas.getContext) return function () {};

  var ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var w = 0;
  var h = 0;
  var horizon = 0;
  var cx = 0;

  var stars = [];
  var sparkles = [];
  var streaks = [];
  var t = 0;
  var raf = 0;
  var running = true;
  var resizeTimer = null;

  function starCount() {
    return Math.min(280, Math.max(70, Math.floor((w * h) / 7000)));
  }

  function initStars() {
    stars = [];
    var n = starCount();
    var i;
    for (i = 0; i < n; i++) {
      stars.push({
        x: Math.random() * w,
        y: Math.random() * horizon,
        z: Math.floor(Math.random() * 3),
        s: Math.random() * 1.6 + 0.35,
        tw: Math.random() * Math.PI * 2,
      });
    }
  }

  function initSparkles() {
    sparkles = [];
    var n = Math.min(36, Math.floor(w / 30));
    var i;
    for (i = 0; i < n; i++) {
      sparkles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vy: 0.25 + Math.random() * 1,
        r: 1 + Math.random() * 2,
        phase: Math.random() * Math.PI * 2,
        gold: Math.random() > 0.25,
      });
    }
  }

  /* Rare warm/gold horizontal streak (not cyan laser) */
  function maybeSpawnStreak() {
    if (Math.random() > 0.0022) return;
    streaks.push({
      y: horizon + 20 + Math.random() * (h - horizon - 40),
      w: 30 + Math.random() * 100,
      vx: 2.5 + Math.random() * 4,
      x: -160,
      life: 1,
      gold: Math.random() > 0.4,
    });
  }

  function resize() {
    w = window.innerWidth;
    h = window.innerHeight;
    horizon = h * 0.38;
    cx = w * 0.5;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    initStars();
    initSparkles();
  }

  function drawSkyGradient(time) {
    var n1 = noise2D(time * 0.06, 0.4) * 0.5 + 0.5;
    var n2 = noise2D(0.25, time * 0.05) * 0.5 + 0.5;
    var warm = 0.5 + 0.5 * Math.sin(time * 0.00035);

    var g = ctx.createLinearGradient(0, 0, w * 0.7, h);
    g.addColorStop(0, rgb(COL.voidDeep, 1));
    g.addColorStop(
      0.4,
      rgb(
        [22 + n1 * 14, 12 + n2 * 10, 8 + warm * 6],
        1
      )
    );
    g.addColorStop(0.72, rgb([14 + n1 * 8, 9 + n2 * 6, 6], 1));
    g.addColorStop(1, rgb(COL.void, 1));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    /* Subtle warm lamp — top-right gold (handheld sun) */
    var rg = ctx.createRadialGradient(w * 0.85, h * 0.08, 0, w * 0.85, h * 0.08, w * 0.4);
    rg.addColorStop(0, rgb(COL.gold, 0.06 * (0.6 + n2 * 0.4)));
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, w, h);

    /* Tiny electric rim — bottom-left, very low opacity */
    rg = ctx.createRadialGradient(0, h, 0, 0, h, w * 0.35);
    rg.addColorStop(0, rgb(COL.electric, 0.045));
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, w, h);

    /* Ground warmth */
    rg = ctx.createRadialGradient(cx, h * 1.02, 0, cx, h * 1.02, h * 0.85);
    rg.addColorStop(0, rgb(COL.brick, 0.12 * (0.5 + n1 * 0.5)));
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, w, h);
  }

  function drawStars(time) {
    var i;
    var st;
    var layerSpeed = [0.06, 0.14, 0.26];
    var alpha;
    for (i = 0; i < stars.length; i++) {
      st = stars[i];
      st.x += layerSpeed[st.z] * 0.12;
      if (st.x > w) st.x = 0;
      alpha = 0.3 + 0.7 * Math.sin(time * 0.002 + st.tw);
      if (st.z === 2) {
        ctx.fillStyle = rgb(COL.gold, 0.4 * alpha);
      } else {
        ctx.fillStyle = rgb(COL.cream, (0.12 + st.z * 0.1) * alpha);
      }
      ctx.fillRect(Math.floor(st.x), Math.floor(st.y), Math.max(1, st.s), Math.max(1, st.s));
    }
  }

  function drawPerspectiveGrid(time) {
    var rows = 16;
    var cols = 24;
    var y0 = horizon;
    var y1 = h + 4;
    var pulse = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(time * 0.00055));
    var scroll = (time * 0.028) % 1;

    /* Gold “floor” lines — dominant (platformer ground) */
    ctx.save();
    ctx.globalAlpha = 0.2 * pulse;
    ctx.lineWidth = 1;
    ctx.strokeStyle = rgb(COL.gold, 0.55);

    var j;
    var k;
    var tj;
    var y;
    var scale;
    for (j = 0; j < rows; j++) {
      tj = (j + scroll) / rows;
      y = y0 + tj * tj * (y1 - y0);
      scale = 0.2 + tj * 0.8;
      ctx.beginPath();
      ctx.moveTo(cx - w * scale, y);
      ctx.lineTo(cx + w * scale, y);
      ctx.stroke();
    }

    /* Electric verticals — sparse, not a blue wash */
    ctx.globalAlpha = 0.11 * pulse;
    ctx.strokeStyle = rgb(COL.electric, 0.65);
    for (k = -cols; k <= cols; k++) {
      var px = k / cols;
      ctx.beginPath();
      ctx.moveTo(cx + px * w * 0.08, y0);
      ctx.lineTo(cx + px * w * 1.08, y1);
      ctx.stroke();
    }
    ctx.restore();

    /* Horizon: thin gold + hairline electric — no cyan bloom */
    ctx.save();
    ctx.globalAlpha = 0.28 + 0.12 * Math.sin(time * 0.0009);
    var hz = ctx.createLinearGradient(0, y0 - 1, w, y0 + 4);
    hz.addColorStop(0, 'rgba(255,215,0,0)');
    hz.addColorStop(0.45, rgb(COL.gold, 0.35));
    hz.addColorStop(0.55, rgb(COL.electric, 0.25));
    hz.addColorStop(1, 'rgba(255,215,0,0)');
    ctx.fillStyle = hz;
    ctx.fillRect(0, y0 - 1, w, 6);
    ctx.restore();
  }

  function drawSparkles(time) {
    var i;
    var sp;
    var a;
    for (i = 0; i < sparkles.length; i++) {
      sp = sparkles[i];
      sp.y -= sp.vy;
      sp.phase += 0.035;
      if (sp.y < horizon) {
        sp.y = h + Math.random() * 50;
        sp.x = Math.random() * w;
      }
      a = 0.18 + 0.32 * Math.sin(sp.phase);
      ctx.fillStyle = sp.gold ? rgb(COL.gold, a) : rgb(COL.cream, a * 0.55);
      ctx.fillRect(Math.floor(sp.x), Math.floor(sp.y), sp.r, sp.r);
    }
  }

  function drawStreaks() {
    var i;
    for (i = streaks.length - 1; i >= 0; i--) {
      var S = streaks[i];
      S.x += S.vx;
      S.life -= 0.007;
      if (S.life <= 0 || S.x > w + 120) {
        streaks.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.globalAlpha = S.life * 0.4;
      var c = S.gold ? COL.gold : COL.redGlow;
      var g = ctx.createLinearGradient(S.x, 0, S.x + S.w, 0);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(0.5, rgb(c, 0.75));
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(S.x, S.y, S.w, 2);
      ctx.restore();
    }
  }

  function drawVignette() {
    var v = ctx.createRadialGradient(cx, horizon * 0.9, h * 0.12, cx, horizon * 0.5, h * 0.92);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(0.65, 'rgba(12, 6, 4, 0.22)');
    v.addColorStop(1, 'rgba(4, 2, 2, 0.58)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, w, h);
  }

  function tick() {
    if (!running) return;
    t += 16;
    ctx.clearRect(0, 0, w, h);

    drawSkyGradient(t * 0.001);
    drawStars(t);
    if (!reduceMotion) {
      drawPerspectiveGrid(t);
      drawSparkles(t);
      maybeSpawnStreak();
      drawStreaks();
    }
    drawVignette();

    raf = requestAnimationFrame(tick);
  }

  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      resize();
    }, 120);
  }

  function onVisibility() {
    if (document.hidden) {
      running = false;
      cancelAnimationFrame(raf);
    } else {
      running = true;
      raf = requestAnimationFrame(tick);
    }
  }

  resize();
  window.addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', onVisibility);

  if (reduceMotion) {
    t = 0;
    ctx.clearRect(0, 0, w, h);
    drawSkyGradient(0);
    drawStars(0);
    drawPerspectiveGrid(0);
    drawVignette();
  } else {
    raf = requestAnimationFrame(tick);
  }

  return function destroy() {
    running = false;
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', onResize);
    document.removeEventListener('visibilitychange', onVisibility);
  };
}
