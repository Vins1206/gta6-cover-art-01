// Demo photos, drawn procedurally by this app's own code so the editor
// can be tried and screenshotted without any real person's photo.
// Each kind is an original illustrated scene: a sunset beach, a neon
// street, and a palm avenue. Nothing here is copied artwork.

export const DEMO_KINDS = [
  { id: 'beach', label: 'Sunset Beach' },
  { id: 'neon', label: 'Neon Street' },
  { id: 'avenue', label: 'Palm Avenue' },
];

function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawPalmSilhouette(ctx, x, y, s, lean) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(lean);
  ctx.scale(s, s);
  ctx.strokeStyle = '#160a24';
  ctx.fillStyle = '#160a24';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(8, -70, -8, -140);
  ctx.stroke();
  for (let i = 0; i < 6; i++) {
    const a = (-165 + i * 54) * (Math.PI / 180);
    ctx.beginPath();
    ctx.moveTo(-8, -140);
    ctx.quadraticCurveTo(-8 + Math.cos(a) * 48, -140 + Math.sin(a) * 40 - 20, -8 + Math.cos(a) * 92, -140 + Math.sin(a) * 60 + 30);
    ctx.quadraticCurveTo(-8 + Math.cos(a) * 52, -140 + Math.sin(a) * 34 + 8, -8, -140);
    ctx.fill();
  }
  ctx.restore();
}

function drawSun(ctx, cx, cy, r, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBeach(ctx, w, h, rnd) {
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.62);
  sky.addColorStop(0, '#3b0a6e');
  sky.addColorStop(0.5, '#ff4d6d');
  sky.addColorStop(1, '#ffb703');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h * 0.62);
  drawSun(ctx, w * 0.68, h * 0.42, h * 0.16, '#ffe9a8');
  // Clouds.
  ctx.fillStyle = 'rgba(255,233,168,0.5)';
  for (let i = 0; i < 5; i++) {
    const cx = rnd() * w;
    const cy = h * (0.08 + rnd() * 0.22);
    ctx.beginPath();
    ctx.ellipse(cx, cy, w * 0.09, h * 0.02, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Sea with sun glitter.
  const sea = ctx.createLinearGradient(0, h * 0.62, 0, h * 0.82);
  sea.addColorStop(0, '#ff8fa3');
  sea.addColorStop(1, '#2b0a4e');
  ctx.fillStyle = sea;
  ctx.fillRect(0, h * 0.62, w, h * 0.2);
  ctx.fillStyle = 'rgba(255,233,168,0.65)';
  for (let i = 0; i < 26; i++) {
    const y = h * (0.63 + rnd() * 0.17);
    const sw = w * (0.02 + rnd() * 0.08);
    ctx.fillRect(w * 0.62 + (rnd() - 0.5) * w * 0.3, y, sw, 2.5);
  }
  // Sand + road.
  ctx.fillStyle = '#e8b06a';
  ctx.fillRect(0, h * 0.82, w, h * 0.18);
  ctx.fillStyle = '#2b2b3a';
  ctx.beginPath();
  ctx.moveTo(w * 0.42, h);
  ctx.lineTo(w * 0.48, h * 0.82);
  ctx.lineTo(w * 0.58, h * 0.82);
  ctx.lineTo(w * 0.66, h);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = 4;
  ctx.setLineDash([18, 16]);
  ctx.beginPath();
  ctx.moveTo(w * 0.53, h * 0.84);
  ctx.lineTo(w * 0.55, h);
  ctx.stroke();
  ctx.setLineDash([]);
  drawPalmSilhouette(ctx, w * 0.1, h * 0.86, h / 430, -0.1);
  drawPalmSilhouette(ctx, w * 0.9, h * 0.84, h / 470, 0.12);
}

function drawNeonStreet(ctx, w, h, rnd) {
  ctx.fillStyle = '#0d0218';
  ctx.fillRect(0, 0, w, h);
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.6);
  sky.addColorStop(0, '#12002e');
  sky.addColorStop(1, '#3b0a6e');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h * 0.6);
  drawSun(ctx, w * 0.24, h * 0.2, h * 0.09, '#ff2e88');
  // Building blocks with lit windows.
  const neon = ['#00f0ff', '#ff2e88', '#ffd166', '#7cff6b'];
  for (let b = 0; b < 7; b++) {
    const bw = w * (0.1 + rnd() * 0.08);
    const bx = (b / 7) * w + rnd() * 10;
    const bh = h * (0.3 + rnd() * 0.35);
    ctx.fillStyle = b % 2 ? '#1a0b2e' : '#241040';
    ctx.fillRect(bx, h * 0.62 - bh, bw, bh + h * 0.05);
    for (let wy = 0; wy < 6; wy++) {
      for (let wx = 0; wx < 3; wx++) {
        if (rnd() > 0.45) {
          ctx.fillStyle = neon[Math.floor(rnd() * neon.length)];
          ctx.globalAlpha = 0.55 + rnd() * 0.45;
          ctx.fillRect(bx + 8 + wx * (bw / 3.4), h * 0.62 - bh + 12 + wy * (bh / 7), bw / 5, bh / 12);
        }
      }
    }
    ctx.globalAlpha = 1;
  }
  // Neon sign bars.
  ctx.save();
  ctx.shadowBlur = 24;
  for (let i = 0; i < 4; i++) {
    const c = neon[i % neon.length];
    ctx.shadowColor = c;
    ctx.fillStyle = c;
    ctx.fillRect(w * (0.08 + i * 0.22), h * (0.5 + (i % 2) * 0.06), w * 0.12, 8);
  }
  ctx.restore();
  // Wet road with reflections.
  ctx.fillStyle = '#160a2e';
  ctx.fillRect(0, h * 0.62, w, h * 0.38);
  ctx.globalAlpha = 0.35;
  for (let i = 0; i < 4; i++) {
    const c = neon[i % neon.length];
    ctx.fillStyle = c;
    ctx.fillRect(w * (0.1 + i * 0.22), h * 0.64, w * 0.1, h * 0.3);
  }
  ctx.globalAlpha = 1;
  // Car headlights.
  ctx.save();
  ctx.shadowBlur = 30;
  ctx.shadowColor = '#fff7cc';
  ctx.fillStyle = '#fff7cc';
  ctx.beginPath();
  ctx.arc(w * 0.42, h * 0.78, 10, 0, Math.PI * 2);
  ctx.arc(w * 0.58, h * 0.78, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#12041f';
  ctx.beginPath();
  ctx.moveTo(w * 0.34, h * 0.82);
  ctx.lineTo(w * 0.4, h * 0.74);
  ctx.lineTo(w * 0.6, h * 0.74);
  ctx.lineTo(w * 0.66, h * 0.82);
  ctx.closePath();
  ctx.fill();
}

function drawAvenue(ctx, w, h, rnd) {
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.6);
  sky.addColorStop(0, '#ff9e5e');
  sky.addColorStop(0.55, '#ff6fa5');
  sky.addColorStop(1, '#7ec8ff');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h * 0.6);
  drawSun(ctx, w * 0.5, h * 0.52, h * 0.15, '#fff3c4');
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  for (let i = 0; i < 6; i++) {
    const cx = rnd() * w;
    const cy = h * (0.06 + rnd() * 0.25);
    ctx.beginPath();
    ctx.ellipse(cx, cy, w * 0.08, h * 0.018, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Road in perspective.
  ctx.fillStyle = '#3a2b4d';
  ctx.beginPath();
  ctx.moveTo(w * 0.44, h * 0.6);
  ctx.lineTo(w * 0.56, h * 0.6);
  ctx.lineTo(w * 0.78, h);
  ctx.lineTo(w * 0.22, h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#5dbb63';
  ctx.fillRect(0, h * 0.6, w * 0.44, h * 0.4);
  ctx.fillRect(w * 0.56, h, w * 0.44, -h * 0.4);
  ctx.strokeStyle = '#ffe9a8';
  ctx.lineWidth = 4;
  ctx.setLineDash([22, 18]);
  ctx.beginPath();
  ctx.moveTo(w * 0.5, h * 0.62);
  ctx.lineTo(w * 0.5, h);
  ctx.stroke();
  ctx.setLineDash([]);
  // Rows of palms shrinking toward the horizon.
  for (let i = 0; i < 5; i++) {
    const t = i / 5;
    const s = (h / 400) * (1 - t * 0.72);
    drawPalmSilhouette(ctx, w * (0.36 - t * 0.26), h * (0.98 - t * 0.36), s, -0.08);
    drawPalmSilhouette(ctx, w * (0.64 + t * 0.26), h * (0.98 - t * 0.36), s, 0.08);
  }
}

// Returns a canvas holding an original illustrated demo photo.
export function makeDemoPhoto(kind, w = 1080, h = 1080) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const seed = kind === 'beach' ? 11 : kind === 'neon' ? 23 : 37;
  const rnd = mulberry32(seed);
  if (kind === 'neon') drawNeonStreet(ctx, w, h, rnd);
  else if (kind === 'avenue') drawAvenue(ctx, w, h, rnd);
  else drawBeach(ctx, w, h, rnd);
  return canvas;
}
