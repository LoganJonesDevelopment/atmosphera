import { getCtx, getW, getH } from '../canvas.js';
import { weatherState } from '../state.js';

let clouds = [];
let raindrops = [];
let snowflakes = [];
let fogLayers = [];
let lightning = { active: false, timer: 0, bolts: [], flash: 0 };
let birds = [];

function makeCloud() {
  const W = getW(), H = getH();
  const w = 120 + Math.random() * 250;
  return {
    x: Math.random() * (W + 400) - 200,
    y: 30 + Math.random() * H * 0.3,
    width: w, height: w * (0.25 + Math.random() * 0.2),
    speed: 0.15 + Math.random() * 0.4,
    opacity: 0.3 + Math.random() * 0.5,
    puffs: Array.from({ length: 5 + Math.floor(Math.random() * 6) }, () => ({
      xOff: (Math.random() - 0.5) * w * 0.7,
      yOff: (Math.random() - 0.5) * w * 0.15,
      r: 20 + Math.random() * w * 0.25
    }))
  };
}

export function initClouds() {
  clouds = [];
  const count = 5 + Math.floor(weatherState.cloudCover / 15);
  for (let i = 0; i < count; i++) clouds.push(makeCloud());
}

export function initRain(intensity) {
  const W = getW(), H = getH();
  const count = intensity * 3;
  while (raindrops.length < count) {
    raindrops.push({
      x: Math.random() * W, y: Math.random() * H,
      speed: 12 + Math.random() * 8, length: 15 + Math.random() * 20,
      opacity: 0.2 + Math.random() * 0.4
    });
  }
  raindrops.length = Math.min(raindrops.length, count);
}

export function initSnow(intensity) {
  const W = getW(), H = getH();
  const count = intensity * 2;
  while (snowflakes.length < count) {
    snowflakes.push({
      x: Math.random() * W, y: Math.random() * H,
      speed: 0.5 + Math.random() * 1.5, size: 1.5 + Math.random() * 4,
      wobble: Math.random() * Math.PI * 2, wobbleSpeed: 0.5 + Math.random() * 1.5,
      opacity: 0.4 + Math.random() * 0.5
    });
  }
  snowflakes.length = Math.min(snowflakes.length, count);
}

export function clearRain() { raindrops = []; }
export function clearSnow() { snowflakes = []; }

export function initFog() {
  const H = getH();
  fogLayers = [];
  for (let i = 0; i < 6; i++) {
    fogLayers.push({
      y: H * 0.4 + Math.random() * H * 0.35,
      speed: 0.2 + Math.random() * 0.5,
      offset: Math.random() * 1000,
      opacity: 0.08 + Math.random() * 0.12,
      height: 60 + Math.random() * 100
    });
  }
}

export function clearFog() { fogLayers = []; }

export function initBirds() {
  const W = getW(), H = getH();
  birds = [];
  if (!weatherState.isDay || weatherState.code >= 61) return;
  for (let i = 0; i < 3 + Math.floor(Math.random() * 4); i++) {
    birds.push({
      x: Math.random() * W, y: 50 + Math.random() * H * 0.25,
      speed: 0.8 + Math.random() * 1.2, wingPhase: Math.random() * Math.PI * 2,
      size: 3 + Math.random() * 4
    });
  }
}

export function drawClouds() {
  const ctx = getCtx(), W = getW(), H = getH();
  clouds.forEach(c => {
    c.x += c.speed * (weatherState.windSpeed / 10 + 0.3);
    if (c.x > W + c.width) { c.x = -c.width - 50; c.y = 30 + Math.random() * H * 0.3; }
    const isDark = weatherState.code >= 61 || !weatherState.isDay;
    const baseR = isDark ? 60 : 240;
    const baseG = isDark ? 65 : 245;
    const baseB = isDark ? 75 : 250;
    const alpha = c.opacity * (weatherState.cloudCover / 100) * (isDark ? 0.9 : 0.7);
    c.puffs.forEach(p => {
      ctx.beginPath();
      ctx.arc(c.x + p.xOff, c.y + p.yOff, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${baseR},${baseG},${baseB},${alpha})`;
      ctx.fill();
    });
  });
}

export function drawRain() {
  const ctx = getCtx(), W = getW(), H = getH();
  const wind = weatherState.windSpeed * 0.3;
  raindrops.forEach(r => {
    r.y += r.speed;
    r.x += wind;
    if (r.y > H || r.x > W + 50) { r.y = -20; r.x = Math.random() * W; }
    ctx.beginPath();
    ctx.moveTo(r.x, r.y);
    ctx.lineTo(r.x + wind * 0.5, r.y + r.length);
    ctx.strokeStyle = `rgba(170,200,230,${r.opacity})`;
    ctx.lineWidth = 1.2;
    ctx.stroke();
  });
}

export function drawSnow(time) {
  const ctx = getCtx(), W = getW(), H = getH();
  snowflakes.forEach(s => {
    s.y += s.speed;
    s.x += Math.sin(s.wobble + time * s.wobbleSpeed) * 0.5 + weatherState.windSpeed * 0.1;
    if (s.y > H) { s.y = -10; s.x = Math.random() * W; }
    if (s.x > W) s.x = 0;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${s.opacity})`;
    ctx.fill();
  });
}

export function drawLightning() {
  if (weatherState.code < 95) { lightning.active = false; return; }
  const ctx = getCtx(), W = getW(), H = getH();
  lightning.timer -= 1;
  if (lightning.timer <= 0) {
    lightning.timer = 120 + Math.random() * 300;
    lightning.active = true;
    lightning.flash = 1;
    lightning.bolts = [];
    const startX = W * 0.2 + Math.random() * W * 0.6;
    let x = startX, y = 0;
    const points = [{ x, y }];
    while (y < H * 0.65) {
      x += (Math.random() - 0.5) * 60;
      y += 15 + Math.random() * 25;
      points.push({ x, y });
      if (Math.random() < 0.25) {
        const branch = [];
        let bx = x, by = y;
        for (let i = 0; i < 3 + Math.random() * 4; i++) {
          bx += (Math.random() - 0.5) * 40 + 10;
          by += 10 + Math.random() * 15;
          branch.push({ x: bx, y: by });
        }
        lightning.bolts.push(branch);
      }
    }
    lightning.bolts.unshift(points);
  }
  if (lightning.flash > 0) {
    ctx.fillStyle = `rgba(255,255,255,${lightning.flash * 0.15})`;
    ctx.fillRect(0, 0, W, H);
    lightning.bolts.forEach((bolt, bi) => {
      ctx.beginPath();
      ctx.moveTo(bolt[0].x, bolt[0].y);
      bolt.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.strokeStyle = `rgba(200,220,255,${lightning.flash * (bi === 0 ? 0.9 : 0.4)})`;
      ctx.lineWidth = bi === 0 ? 2.5 : 1;
      ctx.stroke();
      if (bi === 0) {
        ctx.strokeStyle = `rgba(255,255,255,${lightning.flash * 0.5})`;
        ctx.lineWidth = 5;
        ctx.stroke();
      }
    });
    lightning.flash *= 0.92;
    if (lightning.flash < 0.01) lightning.flash = 0;
  }
}

export function drawFog() {
  if (weatherState.code < 45 || weatherState.code > 48) return;
  const ctx = getCtx(), W = getW();
  fogLayers.forEach(f => {
    f.offset += f.speed;
    for (let x = -200; x < W + 200; x += 80) {
      const waveY = f.y + Math.sin((x + f.offset * 30) * 0.005) * 30;
      ctx.beginPath();
      ctx.ellipse(x, waveY, 160, f.height, 0, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(180,190,200,${f.opacity})`;
      ctx.fill();
    }
  });
}

export function drawBirds() {
  const ctx = getCtx(), W = getW(), H = getH();
  birds.forEach(b => {
    b.x += b.speed;
    b.wingPhase += 0.08;
    if (b.x > W + 50) { b.x = -50; b.y = 50 + Math.random() * H * 0.25; }
    const wing = Math.sin(b.wingPhase) * b.size;
    ctx.beginPath();
    ctx.moveTo(b.x - b.size, b.y + wing);
    ctx.quadraticCurveTo(b.x - b.size * 0.3, b.y - wing * 0.3, b.x, b.y);
    ctx.quadraticCurveTo(b.x + b.size * 0.3, b.y - wing * 0.3, b.x + b.size, b.y + wing);
    ctx.strokeStyle = weatherState.isDay ? 'rgba(30,30,30,0.5)' : 'rgba(200,200,200,0.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });
}
