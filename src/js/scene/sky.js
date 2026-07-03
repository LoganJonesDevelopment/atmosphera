import { getCtx, getW, getH } from '../canvas.js';
import { weatherState } from '../state.js';
import { getSkyGradient } from '../color.js';

let stars = [];

export function initStars() {
  const W = getW(), H = getH();
  stars = [];
  for (let i = 0; i < 200; i++) {
    stars.push({
      x: Math.random() * W, y: Math.random() * H * 0.6,
      size: 0.5 + Math.random() * 2, twinkle: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.5 + Math.random() * 2
    });
  }
}

export function getSunProgress() {
  const now = new Date();
  const [sh, sm] = weatherState.sunrise.split(':').map(Number);
  const [eh, em] = weatherState.sunset.split(':').map(Number);
  const sunriseMin = sh * 60 + sm;
  const sunsetMin = eh * 60 + em;
  const nowMin = now.getHours() * 60 + now.getMinutes();
  if (nowMin < sunriseMin) return (nowMin + 1440 - sunsetMin) / (sunriseMin + 1440 - sunsetMin) * -0.5;
  if (nowMin > sunsetMin) return 1 + (nowMin - sunsetMin) / (1440 - sunsetMin + sunriseMin) * 0.5;
  return (nowMin - sunriseMin) / (sunsetMin - sunriseMin);
}

export function drawSky() {
  const ctx = getCtx(), W = getW(), H = getH();
  const sunP = getSunProgress();
  const [colors] = getSkyGradient(weatherState.isDay, weatherState.code, sunP);
  const grad = ctx.createLinearGradient(0, 0, 0, H * 0.75);
  grad.addColorStop(0, colors[0]);
  grad.addColorStop(0.5, colors[1]);
  grad.addColorStop(1, colors[2]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

export function drawStars(time) {
  const ctx = getCtx();
  const sunP = getSunProgress();
  if (weatherState.isDay && sunP > 0.1 && sunP < 0.9) return;
  const alpha = weatherState.isDay ? Math.max(0, 1 - sunP * 8) : 1;
  if (alpha <= 0) return;
  stars.forEach(s => {
    const twinkle = 0.4 + 0.6 * Math.sin(s.twinkle + time * s.twinkleSpeed);
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,240,${twinkle * alpha * 0.8})`;
    ctx.fill();
  });
}

export function drawSun() {
  if (!weatherState.isDay) return;
  const ctx = getCtx(), W = getW(), H = getH();
  const sunP = getSunProgress();
  if (sunP < 0 || sunP > 1) return;
  const sx = W * 0.15 + sunP * W * 0.7;
  const sy = H * 0.65 - Math.sin(sunP * Math.PI) * H * 0.55;
  const cloudFade = Math.max(0.2, 1 - weatherState.cloudCover / 120);

  const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, 120);
  glow.addColorStop(0, `rgba(255,220,100,${0.3 * cloudFade})`);
  glow.addColorStop(1, 'rgba(255,220,100,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(sx - 120, sy - 120, 240, 240);

  ctx.beginPath();
  ctx.arc(sx, sy, 22, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255,230,130,${cloudFade})`;
  ctx.fill();
}

export function drawMoon() {
  if (weatherState.isDay) return;
  const ctx = getCtx(), W = getW(), H = getH();
  const mx = W * 0.75, my = H * 0.15;

  const glow = ctx.createRadialGradient(mx, my, 0, mx, my, 80);
  glow.addColorStop(0, 'rgba(200,210,255,0.15)');
  glow.addColorStop(1, 'rgba(200,210,255,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(mx - 80, my - 80, 160, 160);

  ctx.beginPath();
  ctx.arc(mx, my, 18, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(220,225,240,0.9)';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(mx + 7, my - 4, 14, 0, Math.PI * 2);
  ctx.fillStyle = getSkyGradient(false, weatherState.code, 0)[0][0];
  ctx.fill();
}
