// Vice Coast cover renderer: draws a multi-panel GTA-style poster cover
// onto any 2D canvas context. Every decoration here is original art drawn
// with canvas paths: retro sun, skyline, palm silhouettes, halftone dots.
// No Rockstar logo, artwork or font is used anywhere in this file.

export const COVER_SIZES = [
  { id: 'square', label: '1080 x 1080', w: 1080, h: 1080 },
  { id: 'portrait', label: '1080 x 1350', w: 1080, h: 1350 },
  { id: 'wide', label: '1920 x 1080', w: 1920, h: 1080 },
];

export const COVER_GRADES = [
  { id: 'sunset', label: 'Vice Sunset' },
  { id: 'neon', label: 'Neon Nights' },
  { id: 'pastel', label: 'Pastel Dawn' },
  { id: 'noir', label: 'Palm Noir' },
];

export const COVER_LAYOUTS = [
  { id: 'grid', label: 'Vice Grid' },
  { id: 'duo', label: 'Sunset Duo' },
  { id: 'triptych', label: 'Triptych' },
];

export function defaultCoverState() {
  return {
    title: 'VICE HEIST',
    subtitle: 'A COVER STORY IN THREE ACTS',
    tagline: 'VICE COAST',
    layout: 'grid',
    grade: 'sunset',
    size: 'wide',
    photos: [null, null, null],
    adjustments: [
      { zoom: 1.0, panX: 0, panY: 0 },
      { zoom: 1.0, panX: 0, panY: 0 },
      { zoom: 1.0, panX: 0, panY: 0 },
    ],
  };
}

// Panel rectangles for each layout, in fractions of the cover.
// The bottom 18% is always the title band.
export function coverPanels(layout, w, h) {
  const band = 0.18;
  const top = 1 - band;
  if (layout === 'duo') {
    return [
      { x: 0, y: 0, w: 0.5, h: top },
      { x: 0.5, y: 0, w: 0.5, h: top },
    ];
  }
  if (layout === 'triptych') {
    return [
      { x: 0, y: 0, w: 0.34, h: top },
      { x: 0.34, y: 0, w: 0.32, h: top },
      { x: 0.66, y: 0, w: 0.34, h: top },
    ];
  }
  return [
    { x: 0, y: 0, w: 0.62, h: top },
    { x: 0.62, y: 0, w: 0.38, h: top * 0.52 },
    { x: 0.62, y: top * 0.52, w: 0.38, h: top * 0.48 },
  ];
}

function seededRandom(seed) {
  let a = seed >>> 0;
  return function nextRandom() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gradeStops(grade) {
  if (grade === 'neon') {
    return { sky: ['#12002e', '#3b0a6e', '#ff2e88'], sun: '#00f0ff', warm: 'rgba(255,46,136,0.28)', cool: 'rgba(0,240,255,0.22)', band: ['#1a0033', '#ff2e88', '#00c2ff'] };
  }
  if (grade === 'pastel') {
    return { sky: ['#ffe3ec', '#ffc4d6', '#9fd8ff'], sun: '#ff9e5e', warm: 'rgba(255,158,94,0.20)', cool: 'rgba(159,216,255,0.18)', band: ['#ff9e5e', '#ff6fa5', '#7ec8ff'] };
  }
  if (grade === 'noir') {
    return { sky: ['#0b0b12', '#23232e', '#4a4a5e'], sun: '#f5d76e', warm: 'rgba(245,215,110,0.16)', cool: 'rgba(120,120,160,0.20)', band: ['#101018', '#2c2c3a', '#f5d76e'] };
  }
  return { sky: ['#2b0a4e', '#a4133c', '#ff6b35'], sun: '#ffd166', warm: 'rgba(255,107,53,0.30)', cool: 'rgba(164,19,60,0.22)', band: ['#2b0a4e', '#ff4d6d', '#ffb703'] };
}

function drawPhotoInto(ctx, photo, rect, adj, grade) {
  const px = rect.x;
  const py = rect.y;
  const pw = rect.w;
  const ph = rect.h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(px, py, pw, ph);
  ctx.clip();
  if (photo) {
    const iw = photo.width;
    const ih = photo.height;
    const scale = Math.max(pw / iw, ph / ih) * (adj?.zoom ?? 1);
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = px + (pw - dw) / 2 + (adj?.panX ?? 0) * pw * 0.25;
    const dy = py + (ph - dh) / 2 + (adj?.panY ?? 0) * ph * 0.25;
    ctx.drawImage(photo, dx, dy, dw, dh);
  } else {
    const g = gradeStops(grade);
    const sky = ctx.createLinearGradient(px, py, px, py + ph);
    sky.addColorStop(0, g.sky[0]);
    sky.addColorStop(0.55, g.sky[1]);
    sky.addColorStop(1, g.sky[2]);
    ctx.fillStyle = sky;
    ctx.fillRect(px, py, pw, ph);
    drawRetroSun(ctx, px + pw * 0.5, py + ph * 0.42, Math.min(pw, ph) * 0.22, g.sun);
  }
  // Warm sunset wash + cool shadow wash, then a soft vignette.
  const g = gradeStops(grade);
  ctx.globalCompositeOperation = 'overlay';
  const warm = ctx.createLinearGradient(px, py, px + pw, py + ph);
  warm.addColorStop(0, g.warm);
  warm.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = warm;
  ctx.fillRect(px, py, pw, ph);
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = g.cool;
  ctx.fillRect(px, py, pw, ph);
  ctx.globalCompositeOperation = 'source-over';
  const vig = ctx.createRadialGradient(px + pw / 2, py + ph / 2, Math.min(pw, ph) * 0.35, px + pw / 2, py + ph / 2, Math.max(pw, ph) * 0.75);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(10,0,20,0.38)');
  ctx.fillStyle = vig;
  ctx.fillRect(px, py, pw, ph);
  ctx.restore();
}

function drawRetroSun(ctx, cx, cy, r, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  // Slice the lower half into retro stripes.
  ctx.globalCompositeOperation = 'destination-out';
  let y = cy + r * 0.05;
  let gap = r * 0.07;
  while (y < cy + r) {
    ctx.fillRect(cx - r - 2, y, r * 2 + 4, gap);
    y += gap + r * 0.16;
    gap *= 1.35;
  }
  ctx.restore();
}

function drawSkyline(ctx, x, y, w, h, color) {
  const rnd = seededRandom(7);
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  let cx = x;
  while (cx < x + w) {
    const bw = w * (0.06 + rnd() * 0.09);
    const bh = h * (0.35 + rnd() * 0.6);
    ctx.lineTo(cx, y + h - bh);
    ctx.lineTo(cx + bw * 0.4, y + h - bh);
    if (rnd() > 0.6) ctx.lineTo(cx + bw * 0.5, y + h - bh - h * 0.18);
    ctx.lineTo(cx + bw * 0.6, y + h - bh);
    ctx.lineTo(cx + bw, y + h - bh);
    ctx.lineTo(cx + bw, y + h);
    cx += bw;
  }
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawPalmTree(ctx, x, y, s, color, lean) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(lean);
  ctx.scale(s, s);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(6, -60, -6, -118);
  ctx.stroke();
  for (let i = 0; i < 6; i++) {
    const a = (-160 + i * 52) * (Math.PI / 180);
    ctx.beginPath();
    ctx.moveTo(-6, -118);
    ctx.quadraticCurveTo(-6 + Math.cos(a) * 42, -118 + Math.sin(a) * 34 - 18, -6 + Math.cos(a) * 78, -118 + Math.sin(a) * 52 + 26);
    ctx.quadraticCurveTo(-6 + Math.cos(a) * 46, -118 + Math.sin(a) * 30 + 6, -6, -118);
    ctx.fill();
  }
  ctx.restore();
}

function drawHalftone(ctx, x, y, w, h, color) {
  ctx.save();
  ctx.fillStyle = color;
  const step = Math.max(14, w / 46);
  for (let row = 0; row * step < h; row++) {
    for (let col = 0; col * step < w; col++) {
      const r = Math.max(1, (1 - row * step / h) * step * 0.16);
      ctx.beginPath();
      ctx.arc(x + col * step + step / 2, y + row * step + step / 2, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawTitleBand(ctx, state, w, h) {
  const g = gradeStops(state.grade);
  const bandH = h * 0.18;
  const by = h - bandH;
  const band = ctx.createLinearGradient(0, by, w, h);
  band.addColorStop(0, g.band[0]);
  band.addColorStop(0.55, g.band[1]);
  band.addColorStop(1, g.band[2]);
  ctx.fillStyle = band;
  ctx.fillRect(0, by, w, bandH);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillRect(0, by, w, Math.max(3, h * 0.004));
  drawHalftone(ctx, w * 0.02, by + bandH * 0.12, w * 0.1, bandH * 0.7, 'rgba(255,255,255,0.16)');
  drawHalftone(ctx, w * 0.88, by + bandH * 0.12, w * 0.1, bandH * 0.7, 'rgba(255,255,255,0.16)');

  const title = (state.title || 'VICE HEIST').toUpperCase().slice(0, 24);
  const sub = (state.subtitle || '').toUpperCase().slice(0, 60);
  const cx = w / 2;
  const titleSize = Math.min(bandH * 0.52, (w * 0.92) / Math.max(6, title.length * 0.62));
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  try { ctx.letterSpacing = `${Math.max(2, titleSize * 0.04)}px`; } catch { /* older canvas: no letterSpacing */ }
  ctx.font = `900 ${titleSize}px "Arial Black", Impact, "Helvetica Neue", sans-serif`;
  const ty = by + bandH * 0.42;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#14001f';
  ctx.lineWidth = titleSize * 0.14;
  ctx.strokeText(title, cx, ty);
  const fill = ctx.createLinearGradient(0, ty - titleSize * 0.5, 0, ty + titleSize * 0.5);
  fill.addColorStop(0, '#ffffff');
  fill.addColorStop(1, '#ffe9a8');
  ctx.fillStyle = fill;
  ctx.fillText(title, cx, ty);
  // Accent underline bar under the title.
  const barW = Math.min(w * 0.5, title.length * titleSize * 0.42);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(cx - barW / 2, ty + titleSize * 0.52, barW, Math.max(3, bandH * 0.035));
  if (sub) {
    ctx.font = `700 ${Math.max(11, bandH * 0.13)}px "Arial Black", Impact, sans-serif`;
    try { ctx.letterSpacing = `${Math.max(2, bandH * 0.02)}px`; } catch { /* ignore */ }
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.fillText(sub, cx, by + bandH * 0.86);
  }
  ctx.restore();
}

function drawCornerBadge(ctx, state, w, h) {
  const tag = (state.tagline || 'VICE COAST').toUpperCase().slice(0, 18);
  const fs = Math.max(12, w * 0.016);
  ctx.save();
  ctx.font = `900 ${fs}px "Arial Black", Impact, sans-serif`;
  const tw = ctx.measureText(tag).width;
  const padX = fs * 0.9;
  const bw = tw + padX * 2;
  const bh = fs * 2.1;
  const bx = w * 0.03;
  const by = h * 0.03;
  ctx.fillStyle = 'rgba(20,0,31,0.82)';
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, bh / 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(2, w * 0.002);
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(tag, bx + bw / 2, by + bh / 2 + 1);
  ctx.restore();
}

// Draws the whole cover. `photos` are HTMLCanvasElement / HTMLImageElement
// (or null for an empty slot, which renders as a graded sunset sky).
export function drawCover(ctx, state, w, h) {
  ctx.save();
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#14001f';
  ctx.fillRect(0, 0, w, h);
  const panels = coverPanels(state.layout, w, h);
  const gutter = Math.max(4, w * 0.006);
  panels.forEach((p, i) => {
    const rect = {
      x: p.x * w + gutter,
      y: p.y * h + gutter,
      w: p.w * w - gutter * 2,
      h: p.h * h - gutter * 2,
    };
    const photo = state.photos[i] ?? state.photos[0] ?? null;
    drawPhotoInto(ctx, photo, rect, state.adjustments[i] ?? state.adjustments[0], state.grade);
    // White frame + thin dark inner line, the poster-panel look.
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = gutter;
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    ctx.strokeStyle = 'rgba(20,0,31,0.55)';
    ctx.lineWidth = Math.max(1, w * 0.0015);
    ctx.strokeRect(rect.x + gutter, rect.y + gutter, rect.w - gutter * 2, rect.h - gutter * 2);
    // Hero panel gets the skyline + palms; side panels get a small sun.
    if (i === 0) {
      const skyH = rect.h * 0.22;
      drawSkyline(ctx, rect.x, rect.y + rect.h - skyH, rect.w, skyH, 'rgba(16,0,28,0.88)');
      drawPalmTree(ctx, rect.x + rect.w * 0.06, rect.y + rect.h - gutter, Math.min(rect.w, rect.h) * 0.0022, 'rgba(16,0,28,0.95)', -0.08);
      drawPalmTree(ctx, rect.x + rect.w * 0.94, rect.y + rect.h - gutter, Math.min(rect.w, rect.h) * 0.0018, 'rgba(16,0,28,0.95)', 0.1);
    }
  });
  drawTitleBand(ctx, state, w, h);
  drawCornerBadge(ctx, state, w, h);
  ctx.restore();
}

export function coverSizeById(id) {
  return COVER_SIZES.find((s) => s.id === id) ?? COVER_SIZES[0];
}
