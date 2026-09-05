/* ══════════════════════════════════════════════════════════
   molecular-bg.js — generated background animations

   Two scenes, chosen automatically by page:

   • SPLICING  (home page — any page containing #hero)
     The spliceosome cycle, drawn as a slow narrative loop:
     pre-mRNA → snRNP docking → lariat formation → exon
     ligation → intron release → reset. Mechanistically
     ordered: U1 at the 5' splice site, U2 at the branch
     point, tri-snRNP between them; the branch-point
     adenosine attacks the 5' splice site to form the lariat,
     then exon 1's 3'-OH attacks the 3' splice site.

   • SCALE  (every other page)
     Microbial size comparison at TRUE relative scale — one
     shared px-per-micron factor for every organism, so a
     100 nm virion really is 1/75th of a red blood cell.
     A scale bar is drawn so the comparison means something.

   All geometry is generated from parameters in this file.
   No images, no libraries, no network requests, no third-
   party assets of any kind.
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

  // ── palette ────────────────────────────────────────────
  var CYAN  = '103, 232, 249';
  var TEAL  = '45, 212, 191';
  var GREEN = '52, 211, 153';
  var DIM   = '120, 170, 190';

  var W = 0, H = 0, dpr = 1;
  var MODE = 'scale';                 // decided at mount

  function rand(a, b) { return a + Math.random() * (b - a); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp01(v) { return v < 0 ? 0 : (v > 1 ? 1 : v); }
  function ease(t) { return t * t * (3 - 2 * t); }          // smoothstep
  function rgba(hue, a) { return 'rgba(' + hue + ',' + (a < 0 ? 0 : a).toFixed(3) + ')'; }

  /* ════════════════════════════════════════════════════════
     SCENE 1 — SPLICING
     ════════════════════════════════════════════════════════ */

  // fractions along the transcript
  var U_5SS = 0.20;    // 5' splice site — exon 1 / intron boundary
  var U_BP  = 0.46;    // branch-point adenosine
  var U_3SS = 0.56;    // 3' splice site — intron / exon 2 boundary

  var CYCLE = 34;      // seconds per full splicing cycle

  var sp = { y: 0, amp: 0, x0: 0, x1: 0, wob: 0 };

  function splicingLayout() {
    sp.x0  = -0.06 * W;
    sp.x1  =  1.06 * W;
    sp.y   =  0.74 * H;
    sp.amp =  0.035 * H;
    sp.wob =  1.7;                    // waves across the width
  }

  // straight (unspliced) transcript position at fraction u
  function backbone(u, t) {
    var x = lerp(sp.x0, sp.x1, u);
    var y = sp.y + Math.sin(u * Math.PI * 2 * sp.wob + t * 0.22) * sp.amp;
    return { x: x, y: y };
  }

  // unit tangent / normal of the backbone at u
  function frame(u, t) {
    var d = 0.002;
    var a = backbone(Math.max(0, u - d), t), b = backbone(Math.min(1, u + d), t);
    var dx = b.x - a.x, dy = b.y - a.y;
    var m = Math.hypot(dx, dy) || 1;
    return { tx: dx / m, ty: dy / m, nx: -dy / m, ny: dx / m };
  }

  /* Lariat geometry.
     The intron segment from the 5' splice site to the branch point is
     wrapped onto a circle whose circumference equals that segment's
     length, tangent to the backbone at the branch point. p = 0 leaves it
     straight, p = 1 is a fully closed loop. */
  function lariatPoint(u, t, p) {
    var straight = backbone(u, t);
    if (p <= 0 || u < U_5SS || u > U_BP) { return straight; }

    var segLen = Math.abs(lerp(sp.x0, sp.x1, U_BP) - lerp(sp.x0, sp.x1, U_5SS));
    var R = segLen / (Math.PI * 2);
    var bp = backbone(U_BP, t);
    var f = frame(U_BP, t);
    // loop opens downward, away from the page content above
    var sgn = f.ny >= 0 ? 1 : -1;
    var cx = bp.x + f.nx * R * sgn, cy = bp.y + f.ny * R * sgn;

    var s = (u - U_5SS) / (U_BP - U_5SS);      // 0 at 5'SS, 1 at branch point
    var base = Math.atan2(bp.y - cy, bp.x - cx);
    var ang = base + (1 - s) * Math.PI * 2;
    var loop = { x: cx + Math.cos(ang) * R, y: cy + Math.sin(ang) * R };

    return { x: lerp(straight.x, loop.x, p), y: lerp(straight.y, loop.y, p) };
  }

  function strandPoints(uA, uB, t, p, dx, dy) {
    var n = Math.max(12, Math.round((uB - uA) * 190));
    var pts = [];
    for (var i = 0; i <= n; i++) {
      var u = lerp(uA, uB, i / n);
      var q = lariatPoint(u, t, p);
      pts.push({ x: q.x + (dx || 0), y: q.y + (dy || 0) });
    }
    return pts;
  }

  function stroke(pts, hue, alpha, width) {
    if (pts.length < 2 || alpha <= 0.002) { return; }
    ctx.strokeStyle = rgba(hue, alpha);
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (var i = 1; i < pts.length; i++) { ctx.lineTo(pts[i].x, pts[i].y); }
    ctx.stroke();
  }

  // nucleotide beads along a strand, spaced out so they read as residues
  function beads(pts, hue, alpha, r, every) {
    if (alpha <= 0.002) { return; }
    ctx.fillStyle = rgba(hue, alpha);
    for (var i = 0; i < pts.length; i += (every || 6)) {
      ctx.beginPath();
      ctx.arc(pts[i].x, pts[i].y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /* An snRNP drawn as a soft particle: outer envelope, an inner core,
     and a few protein lobes. Deliberately abstract — this is a
     silhouette, not a structural claim. */
  function snRNP(x, y, r, hue, alpha, seed) {
    if (alpha <= 0.004) { return; }
    var g = ctx.createRadialGradient(x, y, r * 0.15, x, y, r);
    g.addColorStop(0, rgba(hue, alpha * 0.55));
    g.addColorStop(0.6, rgba(hue, alpha * 0.18));
    g.addColorStop(1, rgba(hue, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = rgba(hue, alpha * 0.5);
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.62, 0, Math.PI * 2);
    ctx.stroke();

    // protein lobes — deliberately irregular. Evenly spaced equal circles
    // read as a flower motif, not a ribonucleoprotein.
    for (var i = 0; i < 6; i++) {
      var h1 = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
      var h2 = Math.sin(seed * 39.3468 + i * 11.135) * 24634.6345;
      var j1 = h1 - Math.floor(h1), j2 = h2 - Math.floor(h2);
      var a = seed + i * (Math.PI * 2 / 6) + (j1 - 0.5) * 0.9;
      var lr = r * (0.16 + 0.20 * j2);
      var dist = r * (0.30 + 0.32 * j1);
      var lx = x + Math.cos(a) * dist, ly = y + Math.sin(a) * dist;
      ctx.fillStyle = rgba(hue, alpha * 0.10);
      ctx.strokeStyle = rgba(hue, alpha * 0.30);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(lx, ly, lr, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  function drawSplicing(t) {
    var phase = (t % CYCLE) / CYCLE;

    // ── stage envelopes (all 0→1) ──
    var appear  = ease(clamp01(phase / 0.10));                       // strand fades in
    var dock    = ease(clamp01((phase - 0.14) / 0.16));              // snRNPs arrive
    var lariat  = ease(clamp01((phase - 0.34) / 0.20));              // loop closes
    var ligate  = ease(clamp01((phase - 0.56) / 0.14));              // exons join
    var release = ease(clamp01((phase - 0.68) / 0.16));              // intron leaves
    var fade    = 1 - ease(clamp01((phase - 0.90) / 0.10));          // reset

    var A = fade;                                                    // master alpha
    if (A <= 0.004) { return; }

    var g5 = backbone(U_5SS, t), gB = backbone(U_BP, t), g3 = backbone(U_3SS, t);

    // exon 1 slides right to meet the 3' splice site as the exons ligate
    var joinDx = (g3.x - g5.x) * ligate;

    // the excised lariat drifts up and away once released
    var relDx = release * 0.22 * W;
    var relDy = release * 0.22 * H;
    var relA  = (1 - release);

    // ── intron / lariat ──
    var intron = strandPoints(U_5SS, U_3SS, t, lariat, relDx, relDy);
    stroke(intron, TEAL, (0.55 + 0.35 * lariat) * A * relA, 2.6 + 0.9 * lariat);
    beads(intron, TEAL, 0.52 * A * relA, 2.2, 7);

    // branch-point adenosine — the nucleophile, marked while it matters
    if (lariat > 0.02 && relA > 0.02) {
      var bx = gB.x + relDx, by = gB.y + relDy;
      ctx.fillStyle = rgba(CYAN, 0.95 * A * relA * lariat);
      ctx.beginPath();
      ctx.arc(bx, by, 5.0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = rgba(CYAN, 0.60 * A * relA * lariat);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(bx, by, 11, 0, Math.PI * 2);
      ctx.stroke();
    }

    // ── exons ──
    var ex1 = strandPoints(0, U_5SS, t, 0, joinDx, 0);
    var ex2 = strandPoints(U_3SS, 1, t, 0, 0, 0);
    var exonA = A * (0.68 + 0.28 * ligate);
    stroke(ex1, CYAN, exonA, 3.8);
    stroke(ex2, GREEN, exonA, 3.8);
    beads(ex1, CYAN, exonA * 0.85, 2.9, 6);
    beads(ex2, GREEN, exonA * 0.85, 2.9, 6);

    // the new exon–exon junction lights up briefly
    if (ligate > 0.55) {
      var jf = ease(clamp01((ligate - 0.55) / 0.45));
      var jg = ctx.createRadialGradient(g3.x, g3.y, 0, g3.x, g3.y, 46);
      jg.addColorStop(0, rgba(GREEN, 0.55 * A * jf));
      jg.addColorStop(1, rgba(GREEN, 0));
      ctx.fillStyle = jg;
      ctx.beginPath();
      ctx.arc(g3.x, g3.y, 46, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── snRNPs ──
    // each drifts in from off-screen, sits on its site, then leaves
    var occupancy = dock * (1 - release);
    var glide = 1 - dock;
    var breathe = Math.sin(t * 0.7) * 2.2;

    var sites = [
      { g: g5, r: 78, hue: CYAN,  seed: 0.4, from: { x: -0.25 * W, y: 1.15 * H } },
      { g: gB, r: 68, hue: TEAL,  seed: 1.9, from: { x:  1.25 * W, y:  0.25 * H } },
      { g: { x: (g5.x + gB.x) / 2, y: (g5.y + gB.y) / 2 + 74 }, r: 96, hue: GREEN, seed: 3.1,
        from: { x: 0.5 * W, y: 1.3 * H } }
    ];

    for (var i = 0; i < sites.length; i++) {
      var s = sites[i];
      var px = lerp(s.from.x, s.g.x, dock) + relDx * release;
      var py = lerp(s.from.y, s.g.y, dock) + relDy * release + breathe;
      snRNP(px, py, s.r + glide * 18, s.hue, 1.15 * A * occupancy, s.seed);
    }
  }

  /* ════════════════════════════════════════════════════════
     SCENE 2 — TRUE-SCALE MICROBE COMPARISON
     ════════════════════════════════════════════════════════ */

  /* Sizes are real, in micrometres, and every organism is drawn with the
     SAME px-per-micron factor — that is the whole point. Values are
     conventional textbook figures for typical specimens; real cells vary. */
  var ORGANISMS = [
    { name: 'Influenza virion', um: 0.10, kind: 'virus',  hue: CYAN  },
    { name: 'Bacteriophage T4', um: 0.20, kind: 'phage',  hue: CYAN  },
    { name: 'Mitochondrion',    um: 1.00, kind: 'mito',   hue: TEAL  },
    { name: 'E. coli',          um: 2.00, kind: 'rod',    hue: TEAL  },
    { name: 'S. cerevisiae',    um: 5.00, kind: 'yeast',  hue: GREEN },
    { name: 'Red blood cell',   um: 7.50, kind: 'rbc',    hue: GREEN }
  ];

  var MAX_UM = 7.5;
  var pxPerUm = 1;
  var bugs = [];

  function scaleLayout() {
    // largest organism spans ~19% of the smaller viewport dimension
    pxPerUm = (0.28 * Math.min(W, H)) / MAX_UM;

    bugs = [];
    var lanes = ORGANISMS.length;
    for (var i = 0; i < lanes; i++) {
      var o = ORGANISMS[i];
      bugs.push({
        o: o,
        x: ((i * 0.37 + 0.08) % 1) * W,
        y: (i + 0.5) / lanes * H + rand(-0.05, 0.05) * H,
        vx: rand(-0.10, -0.03) * (0.4 + 0.6 * (MAX_UM - o.um) / MAX_UM),
        spin: rand(-0.05, 0.05),
        rot: rand(0, Math.PI * 2),
        bob: rand(0, Math.PI * 2)
      });
    }
  }

  function drawVirus(r, hue, a) {
    ctx.strokeStyle = rgba(hue, a * 0.9);
    ctx.fillStyle = rgba(hue, a * 0.22);
    ctx.lineWidth = Math.max(0.7, r * 0.12);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (r < 5) { return; }                     // too small for spikes — honest
    for (var i = 0; i < 14; i++) {
      var ang = i * (Math.PI * 2 / 14);
      ctx.beginPath();
      ctx.moveTo(Math.cos(ang) * r, Math.sin(ang) * r);
      ctx.lineTo(Math.cos(ang) * r * 1.28, Math.sin(ang) * r * 1.28);
      ctx.stroke();
    }
  }

  function drawPhage(r, hue, a) {
    ctx.strokeStyle = rgba(hue, a * 0.9);
    ctx.lineWidth = Math.max(0.7, r * 0.1);
    // icosahedral head, drawn as a hexagon
    ctx.beginPath();
    for (var i = 0; i < 6; i++) {
      var ang = -Math.PI / 2 + i * (Math.PI / 3);
      var px = Math.cos(ang) * r * 0.62, py = Math.sin(ang) * r * 0.62 - r * 0.30;
      if (i === 0) { ctx.moveTo(px, py); } else { ctx.lineTo(px, py); }
    }
    ctx.closePath();
    ctx.fillStyle = rgba(hue, a * 0.2);
    ctx.fill();
    ctx.stroke();
    if (r < 5) { return; }
    ctx.beginPath();                            // tail sheath
    ctx.moveTo(0, r * 0.28);
    ctx.lineTo(0, r * 0.92);
    ctx.stroke();
    for (var j = -1; j <= 1; j += 2) {          // tail fibres
      ctx.beginPath();
      ctx.moveTo(0, r * 0.92);
      ctx.lineTo(j * r * 0.42, r * 1.18);
      ctx.stroke();
    }
  }

  function drawMito(r, hue, a) {
    var rx = r, ry = r * 0.52;
    ctx.strokeStyle = rgba(hue, a * 0.85);
    ctx.fillStyle = rgba(hue, a * 0.16);
    ctx.lineWidth = Math.max(0.7, r * 0.06);
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (r < 10) { return; }
    ctx.lineWidth = Math.max(0.6, r * 0.045);   // cristae
    for (var i = -3; i <= 3; i++) {
      var x = (i / 4) * rx * 0.8;
      ctx.beginPath();
      ctx.moveTo(x, -ry * 0.72);
      ctx.quadraticCurveTo(x + rx * 0.16, 0, x, ry * 0.72);
      ctx.stroke();
    }
  }

  function drawRod(r, hue, a) {
    // stadium shape: E. coli is ~2 µm long, ~0.5 µm wide
    var L = r * 2, Rw = r * 0.5;
    ctx.strokeStyle = rgba(hue, a * 0.85);
    ctx.fillStyle = rgba(hue, a * 0.15);
    ctx.lineWidth = Math.max(0.7, r * 0.06);
    ctx.beginPath();
    ctx.moveTo(-L / 2 + Rw, -Rw);
    ctx.lineTo(L / 2 - Rw, -Rw);
    ctx.arc(L / 2 - Rw, 0, Rw, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(-L / 2 + Rw, Rw);
    ctx.arc(-L / 2 + Rw, 0, Rw, Math.PI / 2, -Math.PI / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    if (r < 12) { return; }
    ctx.lineWidth = Math.max(0.5, r * 0.035);   // flagella
    for (var k = -1; k <= 1; k += 2) {
      ctx.beginPath();
      ctx.moveTo(-L / 2, k * Rw * 0.4);
      for (var s = 0; s < 22; s++) {
        var f = s / 21;
        ctx.lineTo(-L / 2 - f * L * 0.8, k * Rw * 0.4 + Math.sin(f * 12) * Rw * 0.45);
      }
      ctx.stroke();
    }
  }

  function drawYeast(r, hue, a) {
    ctx.strokeStyle = rgba(hue, a * 0.85);
    ctx.fillStyle = rgba(hue, a * 0.13);
    ctx.lineWidth = Math.max(0.7, r * 0.05);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();                            // daughter bud
    ctx.arc(r * 1.05, -r * 0.55, r * 0.44, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (r < 14) { return; }
    ctx.beginPath();                            // nucleus
    ctx.arc(-r * 0.2, r * 0.15, r * 0.3, 0, Math.PI * 2);
    ctx.stroke();
  }

  function drawRBC(r, hue, a) {
    ctx.strokeStyle = rgba(hue, a * 0.85);
    ctx.fillStyle = rgba(hue, a * 0.12);
    ctx.lineWidth = Math.max(0.7, r * 0.05);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (r < 12) { return; }
    ctx.lineWidth = Math.max(0.6, r * 0.035);   // biconcave dimple
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.52, r * 0.46, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  var DRAW = { virus: drawVirus, phage: drawPhage, mito: drawMito,
               rod: drawRod, yeast: drawYeast, rbc: drawRBC };

  function drawScale(t) {
    for (var i = 0; i < bugs.length; i++) {
      var b = bugs[i];
      var r = Math.max(1.1, (b.o.um * pxPerUm) / 2);
      var a = 0.90;

      ctx.save();
      ctx.translate(b.x, b.y + Math.sin(t * 0.35 + b.bob) * 6);
      ctx.rotate(b.rot);
      DRAW[b.o.kind](r, b.o.hue, a);
      ctx.restore();

      // label — dim enough to sit behind page text, legible if you look
      if (r > 3) {
        ctx.fillStyle = rgba(DIM, 0.62);
        ctx.font = '500 10px "DM Mono", ui-monospace, monospace';
        ctx.textAlign = 'left';
        ctx.fillText(b.o.name.toUpperCase() + '  ' + b.o.um + ' µm',
                     b.x + r * 1.5 + 8, b.y + 4);
      }
    }
    drawScaleBar();
  }

  function drawScaleBar() {
    var um = 5;
    var len = um * pxPerUm;
    if (len < 20 || len > W * 0.5) { return; }
    var x = 34, y = H - 42;
    ctx.strokeStyle = rgba(DIM, 0.48);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x, y); ctx.lineTo(x + len, y);
    ctx.moveTo(x, y - 4); ctx.lineTo(x, y + 4);
    ctx.moveTo(x + len, y - 4); ctx.lineTo(x + len, y + 4);
    ctx.stroke();
    ctx.fillStyle = rgba(DIM, 0.50);
    ctx.font = '500 10px "DM Mono", ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(um + ' µm  ·  TRUE RELATIVE SCALE', x, y - 10);
  }

  function stepScale(dt) {
    for (var i = 0; i < bugs.length; i++) {
      var b = bugs[i];
      b.x += b.vx * dt * 0.06;
      b.rot += b.spin * dt * 0.0006;
      var pad = (b.o.um * pxPerUm) * 1.5 + 190;   // clear the label too
      if (b.x < -pad) { b.x = W + pad; }
      else if (b.x > W + pad) { b.x = -pad; }
    }
  }

  /* ════════════════════════════════════════════════════════
     SHARED PLUMBING
     ════════════════════════════════════════════════════════ */

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width  = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (MODE === 'splicing') { splicingLayout(); } else { scaleLayout(); }
  }

  function render(t) {
    ctx.clearRect(0, 0, W, H);
    if (MODE === 'splicing') { drawSplicing(t); } else { drawScale(t); }
  }

  var last = 0, elapsed = 0, running = true, rafId = null;

  function frameLoop(now) {
    rafId = requestAnimationFrame(frameLoop);
    if (!running) { return; }
    var dt = last ? Math.min(now - last, 60) : 16;
    last = now;
    elapsed += dt / 1000;
    if (MODE === 'scale') { stepScale(dt); }
    render(elapsed);
  }

  var resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      resize();
      if (reduceMotion) { render(staticFrame()); }
    }, 180);
  });

  document.addEventListener('visibilitychange', function () {
    running = !document.hidden;
    last = 0;
  });

  // a representative still: mid-lariat, so the reduced-motion frame is
  // recognisable rather than an empty transcript
  function staticFrame() { return CYCLE * 0.50; }

  function start() {
    document.body.insertBefore(canvas, document.body.firstChild);
    MODE = document.getElementById('hero') ? 'splicing' : 'scale';
    resize();
    if (reduceMotion) { render(staticFrame()); }
    else { rafId = requestAnimationFrame(frameLoop); }
  }

  if (document.body) { start(); }
  else { document.addEventListener('DOMContentLoaded', start); }
})();
