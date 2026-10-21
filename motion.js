/* ==========================================================
   AEGIS motion layer (behaviour). Plain JavaScript, no libraries.
   Safe to delete: the site works without it.
   ========================================================== */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = window.matchMedia && matchMedia('(pointer: coarse)').matches;
  var isHome = !!doc.querySelector('.hero');
  function $(s, c) { return (c || doc).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); }
  function raf(fn) { return window.requestAnimationFrame(fn); }

  /* ---------- 1. intro ---------- */
  var intro = $('#intro');
  if (intro) {
    if (reduce || !root.classList.contains('intro')) {
      intro.parentNode.removeChild(intro);
      root.classList.remove('intro-lock');
    } else {
      try { sessionStorage.setItem('aegis-intro', '1'); } catch (e) {}
      var finished = false;
      var finish = function () {
        if (finished) return; finished = true;
        intro.classList.add('done');
        root.classList.remove('intro-lock');
        setTimeout(function () { if (intro.parentNode) intro.parentNode.removeChild(intro); }, 50);
      };
      var skip = function () {
        if (finished) return;
        root.style.setProperty('--hd', '.35s');
        intro.classList.add('skip');
        setTimeout(finish, 620);
      };
      intro.addEventListener('click', skip);
      intro.addEventListener('touchstart', skip, { passive: true });
      doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') skip(); });
      setTimeout(finish, 2950);
    }
  }

  /* ---------- 2. headline: split into words ---------- */
  function splitHeading(h) {
    if (!h || h.classList.contains('sw')) return;
    var idx = 0;
    var label = h.textContent.replace(/\s+/g, ' ').trim();
    function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var parts = n.textContent.split(/(\s+)/);
          var frag = doc.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(doc.createTextNode(' ')); return; }
            var w = doc.createElement('span'); w.className = 'w';
            var i = doc.createElement('span'); i.style.setProperty('--i', idx++); i.textContent = p;
            w.appendChild(i); frag.appendChild(w);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1) { walk(n); }
      });
    }
    walk(h);
    h.setAttribute('aria-label', label);
    $$('.w', h).forEach(function (w) { w.setAttribute('aria-hidden', 'true'); });
    h.classList.add('sw');
  }
  if (!reduce) { splitHeading($('.hero h1')); splitHeading($('.phero h1')); }

  /* ---------- 3. reveals with stagger ---------- */
  var auto = '.step,.tier,.panel,.note,details.q,.rules,.store,.fgrid>div,.split>*,.legal h2';
  $$(auto).forEach(function (e) { if (!e.classList.contains('rv') && !e.closest('.rv')) e.classList.add('rv'); });
  $$('.split>*').forEach(function (e, i) { /* alternate direction on two-column rows */
    var sib = $$(':scope > *', e.parentNode); var pos = sib.indexOf(e);
    if (sib.length === 2 && e.classList.contains('rv')) e.classList.add(pos === 0 ? 'rv-l' : 'rv-r');
  });
  $$('.grid,.steps,.tiers,.stores,.fgrid').forEach(function (g) {
    $$(':scope > .rv', g).forEach(function (c, i) { c.style.setProperty('--d', (i * 0.1).toFixed(2) + 's'); });
  });
  $$('h2 em').forEach(function (e) { if (!/\s/.test(e.textContent.trim())) e.classList.add('u'); });

  var tb = $('.trustbar');
  if (tb) $$('span', tb).forEach(function (s, i) { s.style.setProperty('--k', i); });

  /* solution cards: verification scan + green check */
  var chk = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
  $$('.verify .card').forEach(function (c, i) {
    c.style.setProperty('--k', i);
    var b = doc.createElement('span'); b.className = 'vb'; b.setAttribute('aria-hidden', 'true'); b.innerHTML = chk;
    c.appendChild(b);
  });

  var targets = $$('.rv,.trustbar,.head');
  function reveal(el) {
    el.classList.add('in');
    setTimeout(function () { el.classList.add('done'); }, 1900);
  }
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (x) { if (x.isIntersecting) { reveal(x.target); io.unobserve(x.target); } });
    }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
    targets.forEach(function (e) { io.observe(e); });
  } else { targets.forEach(function (e) { e.classList.add('in'); e.classList.add('done'); }); }

  /* ---------- 4. header: scroll state + progress bar ---------- */
  var hdr = $('.hdr');
  var bar = null;
  if (hdr && !reduce) { bar = doc.createElement('div'); bar.className = 'sp'; hdr.appendChild(bar); }
  var steps = $('.steps');
  var ticking = false;
  function onScroll() {
    ticking = false;
    var y = window.pageYOffset || root.scrollTop;
    if (hdr) hdr.classList.toggle('stuck', y > 24);
    if (bar) {
      var h = root.scrollHeight - window.innerHeight;
      root.style.setProperty('--p', h > 0 ? Math.min(1, y / h).toFixed(4) : 0);
      bar.style.setProperty('--p', h > 0 ? Math.min(1, y / h).toFixed(4) : 0);
    }
    if (steps) {
      var r = steps.getBoundingClientRect(), vh = window.innerHeight;
      var p = (vh * 0.72 - r.top) / Math.max(1, r.height);
      steps.style.setProperty('--sp', Math.max(0, Math.min(1, p)).toFixed(3));
    }
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; raf(onScroll); } }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  if (reduce) return;

  /* ---------- 5. cursor spotlight on cards (desktop) ---------- */
  if (!coarse) {
    var pend = null;
    doc.addEventListener('pointermove', function (e) {
      var t = e.target.closest && e.target.closest('.card,.step,.tier,.panel');
      if (!t) return;
      pend = { t: t, x: e.clientX, y: e.clientY };
      raf(function () {
        if (!pend) return;
        var r = pend.t.getBoundingClientRect();
        pend.t.style.setProperty('--mx', (pend.x - r.left) + 'px');
        pend.t.style.setProperty('--my', (pend.y - r.top) + 'px');
        pend = null;
      });
    }, { passive: true });

    /* magnetic buttons */
    $$('.hero .btn-gold,.dl .btn-gold,.hdr .btn-gold').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) / r.width, y = (e.clientY - r.top - r.height / 2) / r.height;
        b.style.transform = 'translate(' + (x * 8).toFixed(1) + 'px,' + (y * 6).toFixed(1) + 'px)';
      });
      b.addEventListener('pointerleave', function () { b.style.transform = ''; });
    });
  }

  /* ---------- 6. hero: logo tilt + network of trust ---------- */
  var hero = $('.hero');
  if (!hero) return;
  var tilt = $('.tilt', hero), stage = $('.stage', hero);
  var aura = $('.aura', hero), orb = $('.orbits', hero);
  var tx = 0, ty = 0, cx = 0, cy = 0, running = false, heroVisible = true;
  var px = -999, py = -999;

  if (!coarse && tilt) {
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
      px = e.clientX - r.left; py = e.clientY - r.top;
    }, { passive: true });
    hero.addEventListener('pointerleave', function () { tx = 0; ty = 0; px = -999; py = -999; });
  }
  function tiltLoop() {
    if (!heroVisible) { running = false; return; }
    cx += (tx - cx) * 0.07; cy += (ty - cy) * 0.07;
    if (tilt) tilt.style.transform = 'rotateY(' + (cx * 7).toFixed(2) + 'deg) rotateX(' + (-cy * 5).toFixed(2) + 'deg) translate3d(' + (cx * 6).toFixed(1) + 'px,' + (cy * 4).toFixed(1) + 'px,0)';
    if (orb) orb.style.transform = 'translate3d(' + (-cx * 10).toFixed(1) + 'px,' + (-cy * 8).toFixed(1) + 'px,0)';
    if (aura) aura.style.transform = '';
    raf(tiltLoop);
  }

  /* canvas: drifting points that link up, like a network of verified parties */
  var cv = doc.createElement('canvas'); cv.className = 'net'; cv.setAttribute('aria-hidden', 'true');
  hero.insertBefore(cv, hero.firstChild);
  var ctx = cv.getContext && cv.getContext('2d');
  var W = 0, H = 0, DPR = 1, pts = [];
  function size() {
    var r = hero.getBoundingClientRect();
    DPR = Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2);
    W = r.width; H = r.height;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    if (ctx) ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    var n = Math.round(Math.max(22, Math.min(coarse ? 34 : 64, W / 20)));
    pts = [];
    for (var i = 0; i < n; i++) {
      pts.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.28, vy: (Math.random() - 0.5) * 0.28,
        r: Math.random() * 1.4 + 0.6, g: Math.random() < 0.42 });
    }
  }
  var LINK = 128;
  function draw() {
    if (!heroVisible || doc.hidden) { running = false; return; }
    ctx.clearRect(0, 0, W, H);
    var i, j, a, b, dx, dy, d, al;
    for (i = 0; i < pts.length; i++) {
      a = pts[i];
      a.x += a.vx; a.y += a.vy;
      if (a.x < -10) a.x = W + 10; if (a.x > W + 10) a.x = -10;
      if (a.y < -10) a.y = H + 10; if (a.y > H + 10) a.y = -10;
      for (j = i + 1; j < pts.length; j++) {
        b = pts[j]; dx = a.x - b.x; dy = a.y - b.y; d = dx * dx + dy * dy;
        if (d < LINK * LINK) {
          al = (1 - Math.sqrt(d) / LINK) * 0.16;
          ctx.strokeStyle = 'rgba(150,175,235,' + al.toFixed(3) + ')';
          ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      dx = a.x - px; dy = a.y - py; d = dx * dx + dy * dy;
      if (d < 170 * 170) {
        al = (1 - Math.sqrt(d) / 170) * 0.42;
        ctx.strokeStyle = 'rgba(240,200,120,' + al.toFixed(3) + ')';
        ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(px, py); ctx.stroke();
        a.x += dx * -0.0009; a.y += dy * -0.0009;
      }
      ctx.fillStyle = a.g ? 'rgba(240,200,120,.75)' : 'rgba(150,175,235,.7)';
      ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, 6.2832); ctx.fill();
    }
    raf(draw);
  }
  function start() {
    if (running || !heroVisible) return;
    running = true;
    if (ctx) raf(draw);
    if (!coarse && tilt) raf(tiltLoop); else running = !!ctx;
  }
  if (ctx) {
    size();
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(size, 180); });
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      heroVisible = es[0].isIntersecting;
      if (heroVisible) start();
    }, { threshold: 0 }).observe(hero);
  }
  doc.addEventListener('visibilitychange', function () { if (!doc.hidden) start(); });
  start();
})();
