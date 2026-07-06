import { initCanvas, getCtx, getW, getH } from './canvas.js';
import { currentLat, currentLon, weatherState } from './state.js';
import { fetchWeather } from './api.js';
import { applyWeatherToScene } from './weather-engine.js';
import { resolveMoment } from './scene/moment.js';
import { initTerrain, drawTerrain, drawGrass, drawPuddles } from './scene/terrain.js';
import { initStars, drawSky, drawStars, drawSun, drawMoon } from './scene/sky.js';
import {
  initClouds, initFog, initBirds,
  drawClouds, drawRain, drawSnow, drawLightning, drawFog, drawBirds
} from './scene/atmosphere.js';
import { selectLocation, setupSearch, setupUnitToggle, setupGeolocate, setupClock, setupPanelToggle, setupRandomCity, updateUI, showLoadError } from './ui.js';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let time = 0;
let lastTs = 0;
let rafId = null;

function draw(ts) {
  const dt = Math.min((ts - lastTs) / 1000, 0.1);
  lastTs = ts;
  time += dt;
  const m = resolveMoment();
  const ctx = getCtx(), W = getW(), H = getH();
  ctx.clearRect(0, 0, W, H);
  drawSky(m);
  drawStars(m, time);
  drawSun(m);
  drawMoon(m);
  drawClouds(m, dt);
  drawTerrain(m);
  drawGrass(m, time);
  drawPuddles(m, time);
  drawFog(m, dt);
  drawRain(m, dt);
  drawSnow(m, time, dt);
  drawLightning(m, dt);
  drawBirds(m, dt);
  rafId = reduceMotion.matches ? null : requestAnimationFrame(draw);
}

function ensureFrame() {
  if (rafId === null) rafId = requestAnimationFrame(draw);
}

export async function init() {
  initCanvas();
  initTerrain();
  initStars();
  initClouds(weatherState.cloudCover);
  initFog();
  initBirds(weatherState.isDay, weatherState.code);

  window.addEventListener('canvas-resize', () => {
    initTerrain();
    initStars();
    initClouds(weatherState.cloudCover);
    initBirds(weatherState.isDay, weatherState.code);
    if (weatherState.code >= 45 && weatherState.code <= 48) initFog();
    ensureFrame();
  });
  window.addEventListener('weather-updated', ensureFrame);
  reduceMotion.addEventListener('change', ensureFrame);

  setupSearch();
  setupUnitToggle();
  setupGeolocate();
  setupClock();
  setupPanelToggle();
  setupRandomCity();

  ensureFrame();

  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem('weather_location'));
  } catch {
    localStorage.removeItem('weather_location');
  }

  try {
    if (saved) {
      await selectLocation(saved.lat, saved.lon, saved.name, saved.admin, saved.country);
    } else {
      await selectLocation(30.27, -97.74, 'Austin', 'Texas', 'United States');
    }
  } catch {
    showLoadError();
  } finally {
    setTimeout(() => document.getElementById('loading').classList.add('hidden'), 600);
  }

  setInterval(() => {
    if (currentLat !== null) {
      const lat = currentLat, lon = currentLon;
      fetchWeather(lat, lon).then(data => {
        if (lat !== currentLat || lon !== currentLon) return;
        applyWeatherToScene(data);
        updateUI(data);
      }).catch(() => {});
    }
  }, 900000);
}
