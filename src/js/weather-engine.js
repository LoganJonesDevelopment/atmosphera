import { weatherState } from './state.js';
import {
  initClouds, initRain, initSnow, clearRain, clearSnow,
  initFog, clearFog, initBirds
} from './scene/atmosphere.js';

const HEAVY_RAIN = [65, 67, 82, 95, 96, 99];
const MODERATE_RAIN = [63, 81];
const HEAVY_SNOW = [75, 86];
const MODERATE_SNOW = [73];

function minutesOfDay(unixTime, utcOffset) {
  const d = new Date((unixTime + utcOffset) * 1000);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

export function applyWeatherToScene(data) {
  const c = data.current;
  weatherState.code = c.weather_code;
  weatherState.temp = c.temperature_2m;
  weatherState.windSpeed = c.wind_speed_10m;
  weatherState.humidity = c.relative_humidity_2m;
  weatherState.isDay = c.is_day === 1;
  weatherState.cloudCover = c.cloud_cover;
  weatherState.precipitation = c.precipitation;
  weatherState.utcOffset = data.utc_offset_seconds;
  weatherState.sunriseMin = minutesOfDay(data.daily.sunrise[0], data.utc_offset_seconds);
  weatherState.sunsetMin = minutesOfDay(data.daily.sunset[0], data.utc_offset_seconds);

  initClouds();
  initBirds();

  if ((c.weather_code >= 61 && c.weather_code < 70) || (c.weather_code >= 80 && c.weather_code < 85) || c.weather_code >= 95) {
    const intensity = HEAVY_RAIN.includes(c.weather_code) ? 200 : MODERATE_RAIN.includes(c.weather_code) ? 120 : 60;
    initRain(intensity);
    clearSnow();
  } else if (c.weather_code >= 51 && c.weather_code < 58) {
    initRain(40);
    clearSnow();
  } else if ((c.weather_code >= 71 && c.weather_code < 78) || (c.weather_code >= 85 && c.weather_code < 87)) {
    const intensity = HEAVY_SNOW.includes(c.weather_code) ? 200 : MODERATE_SNOW.includes(c.weather_code) ? 120 : 60;
    initSnow(intensity);
    clearRain();
  } else {
    clearRain();
    clearSnow();
  }

  if (c.weather_code >= 45 && c.weather_code <= 48) initFog();
  else clearFog();
}
