import { initCanvas, getCtx, getW, getH } from './canvas.js';
import { currentLat, currentLon } from './state.js';
import { fetchWeather } from './api.js';
import { applyWeatherToScene } from './weather-engine.js';
import { initTerrain, drawTerrain, drawGrass, drawPuddles } from './scene/terrain.js';
import { initStars, drawSky, drawStars, drawSun, drawMoon } from './scene/sky.js';
import {
  initClouds, initFog, initBirds,
  drawClouds, drawRain, drawSnow, drawLightning, drawFog, drawBirds
} from './scene/atmosphere.js';
import { selectLocation, setupSearch, setupUnitToggle, setupGeolocate, setupClock, updateUI } from './ui.js';

let time = 0;

function draw() {
  time += 0.016;
  const ctx = getCtx(), W = getW(), H = getH();
  ctx.clearRect(0, 0, W, H);
  drawSky();
  drawStars(time);
  drawSun();
  drawMoon();
  drawClouds();
  drawTerrain();
  drawGrass(time);
  drawPuddles(time);
  drawFog();
  drawRain();
  drawSnow(time);
  drawLightning();
  drawBirds();
  requestAnimationFrame(draw);
}

export async function init() {
  initCanvas();
  initTerrain();
  initStars();
  initClouds();
  initFog();
  initBirds();

  window.addEventListener('canvas-resize', () => initTerrain());

  setupSearch();
  setupUnitToggle();
  setupGeolocate();
  setupClock();

  draw();

  const saved = localStorage.getItem('weather_location');
  if (saved) {
    const loc = JSON.parse(saved);
    await selectLocation(loc.lat, loc.lon, loc.name, loc.admin, loc.country);
  } else {
    await selectLocation(30.27, -97.74, 'Austin', 'Texas', 'United States');
  }

  setTimeout(() => document.getElementById('loading').classList.add('hidden'), 600);

  setInterval(() => {
    if (currentLat !== null) {
      fetchWeather(currentLat, currentLon).then(data => {
        applyWeatherToScene(data);
        updateUI(data);
      });
    }
  }, 900000);
}
