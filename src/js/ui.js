import { formatTemp, useFahrenheit, setUseFahrenheit, currentWeatherData, setCurrentWeatherData, setCurrentLat, setCurrentLon } from './state.js';
import { WMO_DESCRIPTIONS, WMO_ICONS } from './weather-codes.js';
import { fetchWeather, geocode } from './api.js';
import { applyWeatherToScene } from './weather-engine.js';

export function updateUI(data) {
  const c = data.current;
  document.getElementById('tempValue').textContent = formatTemp(c.temperature_2m);
  document.getElementById('weatherDesc').textContent = WMO_DESCRIPTIONS[c.weather_code] || 'Unknown';
  document.getElementById('windSpeed').textContent = Math.round(c.wind_speed_10m) + ' km/h';
  document.getElementById('humidity').textContent = Math.round(c.relative_humidity_2m) + '%';
  document.getElementById('feelsLike').textContent = formatTemp(c.apparent_temperature) + '\u00B0';
  document.getElementById('weatherPanel').style.display = 'block';

  const hourly = document.getElementById('hourly');
  hourly.innerHTML = '';
  if (data.hourly) {
    const now = new Date();
    const startIdx = data.hourly.time.findIndex(t => new Date(t) >= now);
    if (startIdx >= 0) {
      for (let i = startIdx; i < Math.min(startIdx + 24, data.hourly.time.length); i++) {
        const hour = new Date(data.hourly.time[i]);
        const h = hour.getHours();
        const label = i === startIdx ? 'Now' : (h === 0 ? '12a' : h < 12 ? h + 'a' : h === 12 ? '12p' : (h - 12) + 'p');
        const code = data.hourly.weather_code[i];
        const isDay = data.hourly.is_day[i];
        let icon = WMO_ICONS[code] || '\u2600';
        if (!isDay && code <= 1) icon = '\u{1F319}';
        else if (!isDay && code === 2) icon = '\u{1F319}';
        const div = document.createElement('div');
        div.className = 'hourly-item' + (i === startIdx ? ' hourly-now' : '');
        div.innerHTML = `
          <div class="hourly-time">${label}</div>
          <div class="hourly-icon">${icon}</div>
          <div class="hourly-temp">${formatTemp(data.hourly.temperature_2m[i])}\u00B0</div>
        `;
        hourly.appendChild(div);
      }
    }
  }

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const forecast = document.getElementById('forecast');
  forecast.innerHTML = '';
  for (let i = 1; i < Math.min(6, data.daily.time.length); i++) {
    const d = new Date(data.daily.time[i] + 'T00:00');
    const div = document.createElement('div');
    div.className = 'forecast-day';
    div.innerHTML = `
      <div class="day-name">${days[d.getDay()]}</div>
      <div class="day-icon">${WMO_ICONS[data.daily.weather_code[i]] || '\u2600'}</div>
      <div class="day-temps">${formatTemp(data.daily.temperature_2m_max[i])}\u00B0 <span class="lo">${formatTemp(data.daily.temperature_2m_min[i])}\u00B0</span></div>
    `;
    forecast.appendChild(div);
  }
}

export async function selectLocation(lat, lon, name, admin, country) {
  setCurrentLat(lat);
  setCurrentLon(lon);
  const parts = [name, admin, country].filter(Boolean);
  document.getElementById('locationName').textContent = parts.slice(0, 2).join(', ');
  localStorage.setItem('weather_location', JSON.stringify({ lat, lon, name, admin, country }));
  const data = await fetchWeather(lat, lon);
  setCurrentWeatherData(data);
  applyWeatherToScene(data);
  updateUI(data);
}

export function setupSearch() {
  let searchTimeout;
  let activeIndex = -1;
  let results = [];
  const searchInput = document.getElementById('search');
  const suggestionsEl = document.getElementById('suggestions');

  function renderSuggestions() {
    suggestionsEl.innerHTML = '';
    results.forEach((r, i) => {
      const item = document.createElement('div');
      item.className = 'suggestion-item' + (i === activeIndex ? ' active-item' : '');
      item.innerHTML = `<span class="city">${r.name}</span><span class="region">${[r.admin1, r.country].filter(Boolean).join(', ')}</span>`;
      item.addEventListener('click', () => commitSelection(r));
      item.addEventListener('mouseenter', () => {
        activeIndex = i;
        updateHighlight();
      });
      suggestionsEl.appendChild(item);
    });
    suggestionsEl.classList.add('active');
  }

  function updateHighlight() {
    const items = suggestionsEl.querySelectorAll('.suggestion-item');
    items.forEach((el, i) => el.classList.toggle('active-item', i === activeIndex));
    if (activeIndex >= 0 && items[activeIndex]) {
      items[activeIndex].scrollIntoView({ block: 'nearest' });
    }
  }

  function commitSelection(r) {
    selectLocation(r.latitude, r.longitude, r.name, r.admin1, r.country);
    close();
  }

  function close() {
    suggestionsEl.classList.remove('active');
    suggestionsEl.innerHTML = '';
    searchInput.value = '';
    searchInput.blur();
    results = [];
    activeIndex = -1;
  }

  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    activeIndex = -1;
    const q = searchInput.value.trim();
    if (q.length < 2) { suggestionsEl.classList.remove('active'); results = []; return; }
    searchTimeout = setTimeout(async () => {
      const data = await geocode(q);
      if (!data.results || data.results.length === 0) {
        suggestionsEl.classList.remove('active');
        results = [];
        return;
      }
      results = data.results;
      activeIndex = -1;
      renderSuggestions();
    }, 300);
  });

  searchInput.addEventListener('keydown', (e) => {
    if (!results.length) {
      if (e.key === 'Escape') { close(); e.preventDefault(); }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        activeIndex = activeIndex < results.length - 1 ? activeIndex + 1 : 0;
        updateHighlight();
        break;
      case 'ArrowUp':
        e.preventDefault();
        activeIndex = activeIndex > 0 ? activeIndex - 1 : results.length - 1;
        updateHighlight();
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < results.length) {
          commitSelection(results[activeIndex]);
        } else if (results.length > 0) {
          commitSelection(results[0]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        close();
        break;
      case 'Tab':
        if (results.length > 0) {
          e.preventDefault();
          activeIndex = activeIndex < results.length - 1 ? activeIndex + 1 : 0;
          updateHighlight();
        }
        break;
    }
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-wrap')) {
      suggestionsEl.classList.remove('active');
      results = [];
      activeIndex = -1;
    }
  });
}

export function setupUnitToggle() {
  document.getElementById('unitToggle').addEventListener('click', () => {
    setUseFahrenheit(!useFahrenheit);
    document.getElementById('unitToggle').innerHTML = useFahrenheit ? '&deg;F' : '&deg;C';
    const data = currentWeatherData;
    if (data) updateUI(data);
  });
}

export function setupGeolocate() {
  document.getElementById('geoBtn').addEventListener('click', () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      const geo = await geocode(`${latitude.toFixed(2)}`);
      const name = geo.results?.[0]?.name || 'Current Location';
      const admin = geo.results?.[0]?.admin1 || '';
      const country = geo.results?.[0]?.country || '';
      selectLocation(latitude, longitude, name, admin, country);
    });
  });
}

export function setupClock() {
  function update() {
    const now = new Date();
    const h = now.getHours() % 12 || 12;
    const m = String(now.getMinutes()).padStart(2, '0');
    const ampm = now.getHours() >= 12 ? 'pm' : 'am';
    document.getElementById('clock').textContent = `${h}:${m} ${ampm}`;
    const opts = { weekday: 'long', month: 'long', day: 'numeric' };
    document.getElementById('dateDisplay').textContent = now.toLocaleDateString('en-US', opts);
  }
  update();
  setInterval(update, 10000);
}
