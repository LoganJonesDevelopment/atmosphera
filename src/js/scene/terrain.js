import { getW, getH, getCtx } from '../canvas.js';
import { layoutRng } from './rng.js';

let terrainPoints = [];
let grassBlades = [];
let puddles = [];

export function initTerrain() {
  const W = getW(), H = getH();
  const rnd = layoutRng('terrain');
  terrainPoints = [];
  const segments = Math.ceil(W / 8) + 1;
  for (let layer = 0; layer < 3; layer++) {
    const points = [];
    const baseY = H * (0.7 - layer * 0.06);
    for (let i = 0; i <= segments; i++) {
      const x = (i / segments) * W;
      let y = baseY;
      y += Math.sin(i * 0.02 + layer * 2) * 30;
      y += Math.sin(i * 0.05 + layer) * 15;
      y += Math.sin(i * 0.01 + layer * 5) * 50;
      points.push({ x, y });
    }
    terrainPoints.push(points);
  }

  grassBlades = [];
  for (let i = 0; i < 300; i++) {
    const x = rnd() * W;
    const terrainY = getTerrainY(x, 0);
    grassBlades.push({
      x, y: terrainY, height: 8 + rnd() * 16,
      sway: rnd() * Math.PI * 2, swaySpeed: 0.5 + rnd() * 1.5
    });
  }

  puddles = [];
  for (let i = 0; i < 8; i++) {
    const x = rnd() * W;
    puddles.push({ x, y: getTerrainY(x, 0) + 3 });
  }
}

export function getTerrainY(x, layer) {
  const W = getW();
  const pts = terrainPoints[layer];
  if (!pts) return getH() * 0.7;
  const seg = (x / W) * (pts.length - 1);
  const i = Math.floor(seg);
  const t = seg - i;
  if (i >= pts.length - 1) return pts[pts.length - 1].y;
  return pts[i].y * (1 - t) + pts[i + 1].y * t;
}

export function drawTerrain(m) {
  const ctx = getCtx(), W = getW(), H = getH();
  for (let layer = 2; layer >= 0; layer--) {
    const pts = terrainPoints[layer];
    if (!pts || pts.length === 0) continue;
    const depth = (2 - layer) / 2;
    let r, g, b;
    if (m.isDay) {
      if (m.code >= 71) {
        r = Math.round(200 + depth * 40);
        g = Math.round(205 + depth * 35);
        b = Math.round(215 + depth * 30);
      } else {
        r = Math.round(25 + depth * 15);
        g = Math.round(60 + depth * 50);
        b = Math.round(25 + depth * 10);
      }
    } else {
      r = Math.round(8 + depth * 8);
      g = Math.round(15 + depth * 15);
      b = Math.round(12 + depth * 10);
    }
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fill();
  }
}

export function drawGrass(m, time) {
  if (m.code >= 71) return;
  const ctx = getCtx();
  const baseColor = m.isDay ? [30, 90, 30] : [10, 25, 12];
  grassBlades.forEach(g => {
    const sway = Math.sin(g.sway + time * g.swaySpeed) * (m.windSpeed * 0.4 + 2);
    ctx.beginPath();
    ctx.moveTo(g.x - 1, g.y);
    ctx.quadraticCurveTo(g.x + sway * 0.5, g.y - g.height * 0.5, g.x + sway, g.y - g.height);
    ctx.strokeStyle = `rgba(${baseColor[0]},${baseColor[1]},${baseColor[2]},0.6)`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });
}

export function drawPuddles(m, time) {
  if (m.code < 63) return;
  const ctx = getCtx();
  puddles.forEach((p, i) => {
    const ripple = Math.sin(time * 3 + i * 2) * 2;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, 15 + ripple, 3 + ripple * 0.3, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(100,140,180,0.1)';
    ctx.fill();
  });
}
