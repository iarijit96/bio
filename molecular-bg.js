/* ══════════════════════════════════════════════════════════
   molecular-bg.js
   Generated structural-biology background layer.

   Draws two things onto a fixed full-viewport canvas:
     1. Nucleic-acid helices — parametric double strands with
        base-pair rungs, drifting and slowly precessing.
     2. A bond network — particles joined when within a cutoff
        radius, i.e. a contact map / molecular mesh.

   No images, no libraries, no network requests.
   Self-contained: creates its own <canvas id="molecular-bg">.
   ══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var canvas = document.createElement('canvas');
  canvas.id = 'molecular-bg';
  canvas.setAttribute('aria-hidden', 'true');
  var ctx = canvas.getContext('2d');
  if (!ctx) { return; }

  function mount() {
    if (document.body) { document.body.insertBefore(canvas, document.body.firstChild); }
  }
  if (document.body) { mount(); }
  else { document.addEventListener('DOMContentLoaded', mount); }

  // ── palette ────────────────────────────────────────────
  var CYAN  = '103, 232, 249';
  var TEAL  = '45, 212, 191';
  var GREEN = '52, 211, 153';

  var W = 0, H = 0, dpr = 1;
  var helices = [], nodes = [];

  function rand(a, b) { return a + Math.random() * (b - a); }

  function build() {
    // ── helices ──
    // count scales with viewport area, capped so phones stay cheap
    var hCount = Math.max(4, Math.min(9, Math.round(W / 220)));
    helices = [];
    for (var i = 0; i < hCount; i++) {
      var depth = rand(0.35, 1.0);              // 0 = far, 1 = near
      helices.push({
        x: rand(-0.1, 1.1) * W,
        y: rand(-0.1, 1.1) * H,
        len: rand(0.55, 1.15) * Math.min(W, H), // strand length in px
        amp: rand(26, 58) * depth,              // helix radius
        pitch: rand(58, 96),                    // px per turn
        angle: rand(0, Math.PI * 2),            // orientation on screen
        phase: rand(0, Math.PI * 2),
        spin: rand(0.10, 0.26) * (Math.random() < 0.5 ? -1 : 1),
        drift: rand(0.006, 0.018),
        driftAngle: rand(0, Math.PI * 2),
        depth: depth,
        hue: Math.random() < 0.5 ? TEAL : (Math.random() < 0.5 ? CYAN : GREEN)
      });
    }

    // ── bond network ──
    var nCount = Math.max(45, Math.min(140, Math.round((W * H) / 14000)));
    nodes = [];
    for (var j = 0; j < nCount; j++) {
      var d = rand(0.3, 1.0);
      nodes.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: rand(-0.10, 0.10) * d,
        vy: rand(-0.10, 0.10) * d,
        r: rand(0.9, 2.3) * d,
        depth: d
      });
    }
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width  = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    build();
  }

  // ── drawing ────────────────────────────────────────────

  function drawHelix(h, t) {
    // sample ~16 points per helical turn so the backbone reads as a curve,
    // not a sawtooth (undersampling is what makes procedural helices look wrong)
    var steps = Math.max(64, Math.min(280, Math.round((h.len / h.pitch) * 16)));
    var ca = Math.cos(h.angle), sa = Math.sin(h.angle);
    var A = [], B = [];

    for (var i = 0; i <= steps; i++) {
      var s = (i / steps) * h.len - h.len / 2;      // position along axis
      var th = (s / h.pitch) * Math.PI * 2 + h.phase + t * h.spin;
      // taper the ends so strands fade out instead of stopping dead
      var taper = Math.sin((i / steps) * Math.PI);
      var oA = Math.cos(th) * h.amp;
      var oB = Math.cos(th + Math.PI) * h.amp;
      // depth cue: the strand nearer the viewer is drawn thicker/brighter
      A.push({ x: h.x + ca * s - sa * oA, y: h.y + sa * s + ca * oA,
               z: Math.sin(th), a: taper });
      B.push({ x: h.x + ca * s - sa * oB, y: h.y + sa * s + ca * oB,
               z: Math.sin(th + Math.PI), a: taper });
    }

    // base-pair rungs first, so backbones sit on top
    ctx.lineWidth = 1;
    for (var k = 0; k < A.length; k += 2) {
      var alpha = 0.42 * A[k].a * h.depth * (0.45 + 0.55 * (A[k].z + 1) / 2);
      ctx.strokeStyle = 'rgba(' + h.hue + ',' + alpha.toFixed(3) + ')';
      ctx.beginPath();
      ctx.moveTo(A[k].x, A[k].y);
      ctx.lineTo(B[k].x, B[k].y);
      ctx.stroke();
    }

    [A, B].forEach(function (strand) {
      for (var m = 0; m < strand.length - 1; m++) {
        var p = strand[m], q = strand[m + 1];
        var front = (p.z + 1) / 2;                  // 0 back, 1 front
        var al = (0.22 + 0.62 * front) * p.a * h.depth;
        ctx.strokeStyle = 'rgba(' + h.hue + ',' + al.toFixed(3) + ')';
        ctx.lineWidth = (0.9 + 2.1 * front) * h.depth;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
      }
      // phosphate atoms on the front face only
      for (var n = 0; n < strand.length; n += 3) {
        var pt = strand[n];
        if (pt.z < 0.35) { continue; }
        ctx.fillStyle = 'rgba(' + h.hue + ',' + (0.62 * pt.a * h.depth).toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 2.1 * h.depth, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  function drawNetwork() {
    var cutoff = Math.min(150, Math.max(90, W / 11));
    var cut2 = cutoff * cutoff;
    for (var i = 0; i < nodes.length; i++) {
      var a = nodes[i];
      for (var j = i + 1; j < nodes.length; j++) {
        var b = nodes[j];
        var dx = a.x - b.x, dy = a.y - b.y;
        var d2 = dx * dx + dy * dy;
        if (d2 > cut2) { continue; }
        var al = (1 - d2 / cut2) * 0.26 * Math.min(a.depth, b.depth);
        ctx.strokeStyle = 'rgba(' + TEAL + ',' + al.toFixed(3) + ')';
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(' + GREEN + ',' + (0.55 * a.depth).toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function step(dt) {
    var i, h, n;
    for (i = 0; i < helices.length; i++) {
      h = helices[i];
      h.x += Math.cos(h.driftAngle) * h.drift * dt;
      h.y += Math.sin(h.driftAngle) * h.drift * dt;
      h.angle += 0.000012 * dt * (h.spin > 0 ? 1 : -1);
      var m = h.len;                                  // wrap margin
      if (h.x < -m) { h.x = W + m; } else if (h.x > W + m) { h.x = -m; }
      if (h.y < -m) { h.y = H + m; } else if (h.y > H + m) { h.y = -m; }
    }
    for (i = 0; i < nodes.length; i++) {
      n = nodes[i];
      n.x += n.vx * dt * 0.06;
      n.y += n.vy * dt * 0.06;
      if (n.x < -20) { n.x = W + 20; } else if (n.x > W + 20) { n.x = -20; }
      if (n.y < -20) { n.y = H + 20; } else if (n.y > H + 20) { n.y = -20; }
    }
  }

  function render(t) {
    ctx.clearRect(0, 0, W, H);
    drawNetwork();
    for (var i = 0; i < helices.length; i++) { drawHelix(helices[i], t); }
  }

  // ── loop ───────────────────────────────────────────────
  var last = 0, elapsed = 0, running = true, rafId = null;

  function frame(now) {
    rafId = requestAnimationFrame(frame);
    if (!running) { return; }
    var dt = last ? Math.min(now - last, 60) : 16;
    last = now;
    elapsed += dt / 1000;
    step(dt);
    render(elapsed);
  }

  var resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      resize();
      if (reduceMotion) { render(0); }
    }, 180);
  });

  document.addEventListener('visibilitychange', function () {
    running = !document.hidden;
    last = 0;
    if (running && !reduceMotion && rafId === null) { rafId = requestAnimationFrame(frame); }
  });

  resize();
  if (reduceMotion) {
    render(0);              // one static frame, no animation loop
  } else {
    rafId = requestAnimationFrame(frame);
  }
})();
