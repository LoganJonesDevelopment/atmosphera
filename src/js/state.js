export const weatherState = {
  code: 0,
  temp: 20,
  windSpeed: 5,
  humidity: 50,
  isDay: true,
  sunriseMin: 360,
  sunsetMin: 1080,
  utcOffset: -new Date().getTimezoneOffset() * 60,
  cloudCover: 0,
  precipitation: 0,
};

export let useFahrenheit = true;
export let currentWeatherData = null;
export let currentLat = null;
export let currentLon = null;

export function setUseFahrenheit(val) { useFahrenheit = val; }
export function setCurrentWeatherData(val) { currentWeatherData = val; }
export function setCurrentLat(val) { currentLat = val; }
export function setCurrentLon(val) { currentLon = val; }

export function cToF(c) { return c * 9 / 5 + 32; }

export function formatTemp(c) {
  const v = useFahrenheit ? cToF(c) : c;
  return Math.round(v);
}
