import { weatherState } from './state.js';
import {
  initClouds, initRain, initSnow, clearRain, clearSnow,
  initFog, clearFog, initBirds
} from './scene/atmosphere.js';

export function applyWeatherToScene(data) {
  const c = data.current;
  weatherState.code = c.weather_code;
  weatherState.temp = c.temperature_2m;
  weatherState.windSpeed = c.wind_speed_10m;
  weatherState.humidity = c.relative_humidity_2m;
  weatherState.isDay = c.is_day === 1;
  weatherState.cloudCover = c.cloud_cover;
  weatherState.precipitation = c.precipitation;
  weatherState.sunrise = data.daily.sunrise[0].split('T')[1];
  weatherState.sunset = data.daily.sunset[0].split('T')[1];

  initClouds();
  initBirds();

  if ((c.weather_code >= 61 && c.weather_code < 70) || (c.weather_code >= 80 && c.weather_code < 85) || c.weather_code >= 95) {
    const intensity = c.weather_code >= 65 || c.weather_code >= 82 || c.weather_code >= 95 ? 200 : c.weather_code >= 63 || c.weather_code >= 81 ? 120 : 60;
    initRain(intensity);
    clearSnow();
  } else if (c.weather_code >= 51 && c.weather_code < 58) {
    initRain(40);
    clearSnow();
  } else if ((c.weather_code >= 71 && c.weather_code < 78) || (c.weather_code >= 85 && c.weather_code < 87)) {
    const intensity = c.weather_code >= 75 || c.weather_code >= 86 ? 200 : c.weather_code >= 73 ? 120 : 60;
    initSnow(intensity);
    clearRain();
  } else {
    clearRain();
    clearSnow();
  }

  if (c.weather_code >= 45 && c.weather_code <= 48) initFog();
  else clearFog();
}
