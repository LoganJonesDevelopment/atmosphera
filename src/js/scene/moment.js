import { weatherState } from '../state.js';

// A SceneMoment is one renderable instant: every weather and astronomy
// input the renderer needs, with no reference to "now". The live path
// (momentFromConditions) and the forecast-sampling path (momentAt) both
// produce this same shape, so anything that can build a moment — the
// clock, a time scrubber, a time-lapse — can drive the whole scene.
//
// Fields: code, isDay, cloudCover, windSpeed, precipitation, temp,
// minuteOfDay, sunriseMin, sunsetMin, sunProgress, moonPhase.

let override = null;

// While set, the renderer draws this moment instead of live conditions.
export function setMomentOverride(m) { override = m; }

export function resolveMoment() {
  return override || momentFromConditions(weatherState, Date.now());
}

export function minutesOfDay(unixSec, utcOffsetSec) {
  const d = new Date((unixSec + utcOffsetSec) * 1000);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

// 0 at sunrise, 1 at sunset; negative before dawn, >1 after dusk, with
// the night span mapped to [-0.5, 0) and (1, 1.5].
export function sunProgress(minuteOfDay, sunriseMin, sunsetMin) {
  if (minuteOfDay < sunriseMin) {
    return ((minuteOfDay + 1440 - sunsetMin) / (sunriseMin + 1440 - sunsetMin)) * -0.5;
  }
  if (minuteOfDay > sunsetMin) {
    return 1 + ((minuteOfDay - sunsetMin) / (1440 - sunsetMin + sunriseMin)) * 0.5;
  }
  return (minuteOfDay - sunriseMin) / (sunsetMin - sunriseMin);
}

// 0 = new moon, 0.5 = full, measured against the synodic month from a
// known new moon (2000-01-06 18:14 UTC).
export function moonPhaseAt(ms) {
  const SYNODIC_MS = 29.530588853 * 86400000;
  const NEW_MOON_MS = Date.UTC(2000, 0, 6, 18, 14);
  return (((ms - NEW_MOON_MS) % SYNODIC_MS) + SYNODIC_MS) % SYNODIC_MS / SYNODIC_MS;
}

export function momentFromConditions(c, atMs) {
  const minuteOfDay = minutesOfDay(atMs / 1000, c.utcOffset);
  return {
    code: c.code,
    isDay: c.isDay,
    cloudCover: c.cloudCover,
    windSpeed: c.windSpeed,
    precipitation: c.precipitation,
    temp: c.temp,
    minuteOfDay,
    sunriseMin: c.sunriseMin,
    sunsetMin: c.sunsetMin,
    sunProgress: sunProgress(minuteOfDay, c.sunriseMin, c.sunsetMin),
    moonPhase: moonPhaseAt(atMs),
  };
}

function lerp(a, b, t) { return a + (b - a) * t; }

// Sample the full forecast payload at an arbitrary unix time (seconds).
// Continuous quantities interpolate between hours; categorical ones
// (weather code, day flag) step. This is the entry point a time
// scrubber or time-lapse drives.
export function momentAt(data, unixSec) {
  const h = data.hourly;
  let i = h.time.length - 1;
  for (let k = 0; k < h.time.length; k++) {
    if (h.time[k] > unixSec) { i = Math.max(0, k - 1); break; }
  }
  const next = Math.min(i + 1, h.time.length - 1);
  const t = next === i ? 0 : Math.min(Math.max((unixSec - h.time[i]) / (h.time[next] - h.time[i]), 0), 1);

  const daily = data.daily;
  const d = Math.min(Math.max(Math.floor((unixSec - daily.time[0]) / 86400), 0), daily.time.length - 1);
  const sunriseMin = minutesOfDay(daily.sunrise[d], data.utc_offset_seconds);
  const sunsetMin = minutesOfDay(daily.sunset[d], data.utc_offset_seconds);
  const minuteOfDay = minutesOfDay(unixSec, data.utc_offset_seconds);

  return {
    code: h.weather_code[i],
    isDay: h.is_day[i] === 1,
    cloudCover: h.cloud_cover ? lerp(h.cloud_cover[i], h.cloud_cover[next], t) : 0,
    windSpeed: h.wind_speed_10m ? lerp(h.wind_speed_10m[i], h.wind_speed_10m[next], t) : 0,
    precipitation: h.precipitation ? h.precipitation[i] : 0,
    temp: lerp(h.temperature_2m[i], h.temperature_2m[next], t),
    minuteOfDay,
    sunriseMin,
    sunsetMin,
    sunProgress: sunProgress(minuteOfDay, sunriseMin, sunsetMin),
    moonPhase: moonPhaseAt(unixSec * 1000),
  };
}
