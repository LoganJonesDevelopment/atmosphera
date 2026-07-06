import { formatTemp, useFahrenheit, setUseFahrenheit, currentWeatherData, setCurrentWeatherData, setCurrentLat, setCurrentLon } from './state.js';
import { WMO_DESCRIPTIONS, WMO_ICONS, MOON_ICON, DEFAULT_ICON } from './weather-codes.js';
import { fetchWeather, geocode } from './api.js';
import { applyWeatherToScene } from './weather-engine.js';

export function updateUI(data) {
  const c = data.current;
  document.getElementById('tempValue').textContent = formatTemp(c.temperature_2m);
  document.getElementById('weatherDesc').textContent = WMO_DESCRIPTIONS[c.weather_code] || 'Unknown';
  document.getElementById('windSpeed').textContent = useFahrenheit
    ? Math.round(c.wind_speed_10m * 0.621371) + ' mph'
    : Math.round(c.wind_speed_10m) + ' km/h';
  document.getElementById('humidity').textContent = Math.round(c.relative_humidity_2m) + '%';
  document.getElementById('feelsLike').textContent = formatTemp(c.apparent_temperature) + '\u00B0';
  document.getElementById('weatherPanel').style.display = 'block';

  const hourly = document.getElementById('hourly');
  hourly.innerHTML = '';
  if (data.hourly) {
    const nowSec = Date.now() / 1000;
    const startIdx = data.hourly.time.findIndex(t => t >= nowSec);
    if (startIdx >= 0) {
      for (let i = startIdx; i < Math.min(startIdx + 24, data.hourly.time.length); i++) {
        const hour = new Date((data.hourly.time[i] + data.utc_offset_seconds) * 1000);
        const h = hour.getUTCHours();
        const label = i === startIdx ? 'Now' : (h === 0 ? '12a' : h < 12 ? h + 'a' : h === 12 ? '12p' : (h - 12) + 'p');
        const code = data.hourly.weather_code[i];
        const isDay = data.hourly.is_day[i];
        let icon = WMO_ICONS[code] || DEFAULT_ICON;
        if (!isDay && code <= 2) icon = MOON_ICON;
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
    const d = new Date((data.daily.time[i] + data.utc_offset_seconds) * 1000);
    const div = document.createElement('div');
    div.className = 'forecast-day';
    div.innerHTML = `
      <div class="day-name">${days[d.getUTCDay()]}</div>
      <div class="day-icon">${WMO_ICONS[data.daily.weather_code[i]] || DEFAULT_ICON}</div>
      <div class="day-temps">${formatTemp(data.daily.temperature_2m_max[i])}\u00B0 <span class="lo">${formatTemp(data.daily.temperature_2m_min[i])}\u00B0</span></div>
    `;
    forecast.appendChild(div);
  }
}

export function showLoadError() {
  document.getElementById('weatherDesc').textContent = 'Could not load weather';
  document.getElementById('weatherPanel').style.display = 'block';
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
      const city = document.createElement('span');
      city.className = 'city';
      city.textContent = r.name;
      const region = document.createElement('span');
      region.className = 'region';
      region.textContent = [r.admin1, r.country].filter(Boolean).join(', ');
      item.append(city, region);
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
    selectLocation(r.latitude, r.longitude, r.name, r.admin1, r.country).catch(showLoadError);
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
      let data;
      try {
        data = await geocode(q);
      } catch {
        suggestionsEl.classList.remove('active');
        results = [];
        return;
      }
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
  const searchInput = document.getElementById('search');
  const defaultPlaceholder = searchInput.placeholder;
  document.getElementById('geoBtn').addEventListener('click', () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      selectLocation(latitude, longitude, 'Current Location', '', '').catch(showLoadError);
    }, () => {
      searchInput.placeholder = 'Location unavailable';
      setTimeout(() => { searchInput.placeholder = defaultPlaceholder; }, 3000);
    });
  });
}

export function setupPanelToggle() {
  const glass = document.querySelector('.weather-glass');
  const btn = document.getElementById('panelToggle');
  const mobile = window.matchMedia('(max-width: 768px)');
  let expanded = localStorage.getItem('weather_panel_expanded') === 'true';

  function apply() {
    const collapsed = mobile.matches && !expanded;
    glass.classList.toggle('collapsed', collapsed);
    btn.setAttribute('aria-expanded', String(!collapsed));
  }

  btn.addEventListener('click', () => {
    expanded = !expanded;
    localStorage.setItem('weather_panel_expanded', String(expanded));
    apply();
  });

  mobile.addEventListener('change', apply);
  apply();
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
