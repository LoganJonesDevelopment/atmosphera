import { initCanvas, getCtx, getW, getH } from './canvas.js';
import { currentLat, currentLon, weatherState } from './state.js';
import { fetchWeather } from './api.js';
import { applyWeatherToScene } from './weather-engine.js';
import { initTerrain, drawTerrain, drawGrass, drawPuddles } from './scene/terrain.js';
import { initStars, drawSky, drawStars, drawSun, drawMoon } from './scene/sky.js';
import {
  initClouds, initFog, initBirds,
  drawClouds, drawRain, drawSnow, drawLightning, drawFog, drawBirds
} from './scene/atmosphere.js';
import { selectLocation, setupSearch, setupUnitToggle, setupGeolocate, setupClock, setupPanelToggle, updateUI, showLoadError } from './ui.js';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let time = 0;
let lastTs = 0;
let rafId = null;

function draw(ts) {
  const dt = Math.min((ts - lastTs) / 1000, 0.1);
  lastTs = ts;
  time += dt;
  const ctx = getCtx(), W = getW(), H = getH();
  ctx.clearRect(0, 0, W, H);
  drawSky();
  drawStars(time);
  drawSun();
  drawMoon();
  drawClouds(dt);
  drawTerrain();
  drawGrass(time);
  drawPuddles(time);
  drawFog(dt);
  drawRain(dt);
  drawSnow(time, dt);
  drawLightning(dt);
  drawBirds(dt);
  rafId = reduceMotion.matches ? null : requestAnimationFrame(draw);
}

function ensureFrame() {
  if (rafId === null) rafId = requestAnimationFrame(draw);
}

export async function init() {
  initCanvas();
  initTerrain();
  initStars();
  initClouds();
  initFog();
  initBirds();

  window.addEventListener('canvas-resize', () => {
    initTerrain();
    initStars();
    initClouds();
    initBirds();
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
      fetchWeather(currentLat, currentLon).then(data => {
        applyWeatherToScene(data);
        updateUI(data);
      }).catch(() => {});
    }
  }, 900000);
}
