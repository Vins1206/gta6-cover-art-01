// Vice Coast Cover Studio: editor wiring. Loads the user's own photos
// (read on their machine, never uploaded), keeps a live preview, and
// exports the cover as a PNG in the three common post sizes.

import { COVER_SIZES, COVER_GRADES, COVER_LAYOUTS, defaultCoverState, drawCover, coverSizeById } from './cover.js';
import { DEMO_KINDS, makeDemoPhoto } from './demo.js';

const state = defaultCoverState();
const preview = document.getElementById('preview');
const statusEl = document.getElementById('status');
const params = new URLSearchParams(window.location.search);
const shotMode = params.get('shot');

function setStatus(text) {
  statusEl.textContent = text;
}

function currentSize() {
  return coverSizeById(state.size);
}

function renderPreview() {
  const size = currentSize();
  if (preview.width !== size.w || preview.height !== size.h) {
    preview.width = size.w;
    preview.height = size.h;
  }
  const ctx = preview.getContext('2d');
  drawCover(ctx, state, size.w, size.h);
  document.querySelectorAll('[data-size]').forEach((b) => b.classList.toggle('active', b.dataset.size === state.size));
  document.querySelectorAll('[data-layout]').forEach((b) => b.classList.toggle('active', b.dataset.layout === state.layout));
  document.querySelectorAll('[data-grade]').forEach((b) => b.classList.toggle('active', b.dataset.grade === state.grade));
  document.querySelectorAll('.photo-slot').forEach((slot, i) => {
    slot.classList.toggle('filled', Boolean(state.photos[i]));
    slot.querySelector('.slot-name').textContent = state.photos[i] ? `Photo ${i + 1} loaded` : `Photo ${i + 1} empty`;
  });
}

function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read that image file.')); };
    img.src = url;
  });
}

async function loadPhotoSlot(index, file) {
  try {
    const img = await loadImageFile(file);
    state.photos[index] = img;
    state.adjustments[index] = { zoom: 1.0, panX: 0, panY: 0 };
    syncSlotControls(index);
    renderPreview();
    setStatus(`Photo ${index + 1} loaded — drag the zoom and position sliders to frame it.`);
  } catch (err) {
    setStatus(err.message);
  }
}

function loadDemoPhotos() {
  state.photos = [
    makeDemoPhoto('beach', 1080, 1080),
    makeDemoPhoto('neon', 1080, 1080),
    makeDemoPhoto('avenue', 1080, 1080),
  ];
  state.adjustments = [
    { zoom: 1.0, panX: 0, panY: 0 },
    { zoom: 1.0, panX: 0, panY: 0 },
    { zoom: 1.0, panX: 0, panY: 0 },
  ];
  [0, 1, 2].forEach(syncSlotControls);
  renderPreview();
}

function syncSlotControls(index) {
  const adj = state.adjustments[index];
  const zoom = document.getElementById(`zoom-${index}`);
  const panX = document.getElementById(`panx-${index}`);
  const panY = document.getElementById(`pany-${index}`);
  if (zoom) zoom.value = String(adj.zoom);
  if (panX) panX.value = String(adj.panX);
  if (panY) panY.value = String(adj.panY);
}

function exportCover(sizeId) {
  const size = coverSizeById(sizeId);
  const canvas = document.createElement('canvas');
  canvas.width = size.w;
  canvas.height = size.h;
  drawCover(canvas.getContext('2d'), state, size.w, size.h);
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve({ blob, size }), 'image/png');
  });
}

async function downloadExport(sizeId) {
  const size = coverSizeById(sizeId);
  setStatus(`Exporting ${size.label} PNG…`);
  const { blob } = await exportCover(sizeId);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `vice-coast-cover-${size.w}x${size.h}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  setStatus(`Exported ${size.label} PNG — check your downloads.`);
  return blob;
}

// Test hook used by the maker's own local checks: exports every size and
// reports the PNG byte lengths into the page, so a headless run can read
// them without any download dialog.
async function runSelfTest() {
  const results = [];
  for (const size of COVER_SIZES) {
    const { blob } = await exportCover(size.id);
    const ok = blob && blob.size > 20000 && blob.type === 'image/png';
    results.push(`${size.w}x${size.h}: ${blob ? blob.size : 0} bytes ${ok ? 'OK' : 'FAIL'}`);
  }
  const pre = document.createElement('pre');
  pre.id = 'selftest';
  pre.textContent = `SELFTEST photos=${state.photos.filter(Boolean).length} layout=${state.layout} grade=${state.grade}\n${results.join('\n')}`;
  document.body.appendChild(pre);
  return results;
}

function buildControls() {
  const sizeRow = document.getElementById('size-row');
  COVER_SIZES.forEach((s) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.size = s.id;
    b.textContent = s.label;
    b.addEventListener('click', () => { state.size = s.id; renderPreview(); });
    sizeRow.appendChild(b);
  });
  const layoutRow = document.getElementById('layout-row');
  COVER_LAYOUTS.forEach((l) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.layout = l.id;
    b.textContent = l.label;
    b.addEventListener('click', () => { state.layout = l.id; renderPreview(); });
    layoutRow.appendChild(b);
  });
  const gradeRow = document.getElementById('grade-row');
  COVER_GRADES.forEach((g) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.grade = g.id;
    b.textContent = g.label;
    b.addEventListener('click', () => { state.grade = g.id; renderPreview(); });
    gradeRow.appendChild(b);
  });
  const slots = document.getElementById('photo-slots');
  DEMO_KINDS.forEach((kind, i) => {
    const slot = document.createElement('div');
    slot.className = 'photo-slot';
    slot.innerHTML = `
      <div class="slot-head"><span class="slot-name">Photo ${i + 1} empty</span><span class="slot-kind">${kind.label}</span></div>
      <div class="slot-actions">
        <label class="file-btn">Choose photo<input id="file-${i}" type="file" accept="image/*"></label>
        <button type="button" class="demo-btn" data-demo="${i}">Use demo</button>
      </div>
      <label class="slider">Zoom <input id="zoom-${i}" type="range" min="1" max="2.5" step="0.01" value="1"></label>
      <label class="slider">Left–right <input id="panx-${i}" type="range" min="-1" max="1" step="0.01" value="0"></label>
      <label class="slider">Up–down <input id="pany-${i}" type="range" min="-1" max="1" step="0.01" value="0"></label>`;
    slots.appendChild(slot);
    slot.querySelector(`#file-${i}`).addEventListener('change', (e) => {
      if (e.target.files[0]) loadPhotoSlot(i, e.target.files[0]);
    });
    slot.querySelector('.demo-btn').addEventListener('click', () => {
      state.photos[i] = makeDemoPhoto(kind.id, 1080, 1080);
      state.adjustments[i] = { zoom: 1.0, panX: 0, panY: 0 };
      syncSlotControls(i);
      renderPreview();
      setStatus(`Demo photo ${i + 1} (${kind.label}) loaded. Replace it with your own photo any time.`);
    });
    ['zoom', 'panx', 'pany'].forEach((key) => {
      slot.querySelector(`#${key}-${i}`).addEventListener('input', (e) => {
        const v = Number(e.target.value);
        if (key === 'zoom') state.adjustments[i].zoom = v;
        if (key === 'panx') state.adjustments[i].panX = v;
        if (key === 'pany') state.adjustments[i].panY = v;
        renderPreview();
      });
    });
  });
}

function applyShotParams() {
  const caption = params.get('caption');
  if (caption) state.title = caption.slice(0, 24);
  const layout = params.get('layout');
  if (layout && COVER_LAYOUTS.some((l) => l.id === layout)) state.layout = layout;
  const grade = params.get('grade');
  if (grade && COVER_GRADES.some((g) => g.id === grade)) state.grade = grade;
  const size = params.get('size');
  if (size) {
    const found = COVER_SIZES.find((s) => `${s.w}x${s.h}` === size || s.id === size);
    if (found) state.size = found.id;
  }
}

buildControls();
applyShotParams();
document.getElementById('title').addEventListener('input', (e) => { state.title = e.target.value; renderPreview(); });
document.getElementById('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; renderPreview(); });
document.getElementById('tagline').addEventListener('input', (e) => { state.tagline = e.target.value; renderPreview(); });
document.getElementById('export').addEventListener('click', () => downloadExport(state.size));
document.getElementById('export-all').addEventListener('click', async () => {
  for (const s of COVER_SIZES) {
    await downloadExport(s.id);
    await new Promise((r) => setTimeout(r, 300));
  }
});
document.getElementById('demo-all').addEventListener('click', () => {
  loadDemoPhotos();
  setStatus('Demo photos loaded in all three panels. Swap any of them for your own photo.');
});
document.getElementById('reset').addEventListener('click', () => {
  const fresh = defaultCoverState();
  Object.assign(state, fresh);
  document.getElementById('title').value = state.title;
  document.getElementById('subtitle').value = state.subtitle;
  document.getElementById('tagline').value = state.tagline;
  [0, 1, 2].forEach(syncSlotControls);
  renderPreview();
  setStatus('Reset to the default cover.');
});

// Screenshot modes: ?shot=editor shows the full editor with demo photos;
// ?shot=cover shows only the finished cover, full-bleed, for the cover shot.
if (shotMode === 'cover') {
  document.body.classList.add('shot-cover');
  loadDemoPhotos();
  renderPreview();
  window.__coverReady = true;
} else {
  if (shotMode === 'editor' || params.get('demo') === '1') loadDemoPhotos();
  renderPreview();
  setStatus('Load a photo into each panel, write your caption, pick a size, export the PNG.');
}
if (params.get('selftest') === '1') {
  loadDemoPhotos();
  renderPreview();
  window.__selftest = runSelfTest();
}
window.__viceCoast = { state, renderPreview, exportCover, loadDemoPhotos, runSelfTest };
