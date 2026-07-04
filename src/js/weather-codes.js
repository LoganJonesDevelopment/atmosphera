export const WMO_DESCRIPTIONS = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Foggy', 48: 'Depositing rime fog',
  51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
  56: 'Light freezing drizzle', 57: 'Dense freezing drizzle',
  61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
  66: 'Light freezing rain', 67: 'Heavy freezing rain',
  71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow',
  77: 'Snow grains', 80: 'Slight showers', 81: 'Moderate showers', 82: 'Violent showers',
  85: 'Slight snow showers', 86: 'Heavy snow showers',
  95: 'Thunderstorm', 96: 'Thunderstorm with slight hail', 99: 'Thunderstorm with heavy hail'
};

const icon = (content) =>
  `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${content}</svg>`;

const SUN = icon('<circle cx="12" cy="12" r="4"/><path d="M12 3.5V6M12 18v2.5M3.5 12H6M18 12h2.5M6 6l1.75 1.75M16.25 16.25 18 18M18 6l-1.75 1.75M7.75 16.25 6 18"/>');
const CLOUD_SUN = icon('<path d="M8 2.5V4M2.5 8H4M4.11 4.11l1.06 1.06M11.89 4.11l-1.06 1.06M4.5 11.5a3.5 3.5 0 1 1 6.95-.7"/><path d="M9.5 20.5h7.8a3.6 3.6 0 0 0 .9-7.08 5.4 5.4 0 0 0-10.44-.9 3.87 3.87 0 0 0 1.74 7.98Z"/>');
const CLOUD = icon('<path d="M7 18.5h9.8a4 4 0 0 0 1-7.87 6 6 0 0 0-11.6-1A4.3 4.3 0 0 0 7 18.5Z"/>');
const FOG = icon('<path d="M7 14.5h9.8a4 4 0 0 0 1-7.87 6 6 0 0 0-11.6-1A4.3 4.3 0 0 0 7 14.5Z"/><path d="M6 18h11M8 21h8"/>');
const DRIZZLE = icon('<path d="M7 15.5h9.8a4 4 0 0 0 1-7.87 6 6 0 0 0-11.6-1A4.3 4.3 0 0 0 7 15.5Z"/><path d="M8 18.5v1M12 18.5v1M16 18.5v1"/>');
const RAIN = icon('<path d="M7 15.5h9.8a4 4 0 0 0 1-7.87 6 6 0 0 0-11.6-1A4.3 4.3 0 0 0 7 15.5Z"/><path d="M8.5 18.5 8 21M12.5 18.5 12 21M16.5 18.5 16 21"/>');
const SNOW = icon('<path d="M7 15.5h9.8a4 4 0 0 0 1-7.87 6 6 0 0 0-11.6-1A4.3 4.3 0 0 0 7 15.5Z"/><path d="M8 18.5h.01M12 18.5h.01M16 18.5h.01M10 21h.01M14 21h.01"/>');
const THUNDER = icon('<path d="M7 14.5h9.8a4 4 0 0 0 1-7.87 6 6 0 0 0-11.6-1A4.3 4.3 0 0 0 7 14.5Z"/><path d="M12.5 12.5 10 17h4l-2.5 4.5"/>');

export const MOON_ICON = icon('<path d="M13 4a6.5 6.5 0 0 0 7 7 8 8 0 1 1-7-7Z"/>');
export const DEFAULT_ICON = SUN;

export const WMO_ICONS = {
  0: SUN, 1: CLOUD_SUN, 2: CLOUD_SUN, 3: CLOUD,
  45: FOG, 48: FOG,
  51: DRIZZLE, 53: DRIZZLE, 55: DRIZZLE,
  56: DRIZZLE, 57: DRIZZLE,
  61: RAIN, 63: RAIN, 65: RAIN,
  66: RAIN, 67: RAIN,
  71: SNOW, 73: SNOW, 75: SNOW,
  77: SNOW, 80: RAIN, 81: RAIN, 82: RAIN,
  85: SNOW, 86: SNOW,
  95: THUNDER, 96: THUNDER, 99: THUNDER
};
