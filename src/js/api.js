const API_BASE = 'https://api.open-meteo.com/v1';
const GEO_BASE = 'https://geocoding-api.open-meteo.com/v1';

export async function fetchWeather(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,cloud_cover,precipitation,is_day',
    hourly: 'temperature_2m,weather_code,is_day',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset',
    timezone: 'auto',
    forecast_days: 7
  });
  const resp = await fetch(`${API_BASE}/forecast?${params}`);
  return resp.json();
}

export async function geocode(query) {
  const params = new URLSearchParams({ name: query, count: 5, language: 'en' });
  const resp = await fetch(`${GEO_BASE}/search?${params}`);
  return resp.json();
}
