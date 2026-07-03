import React, { useState, useCallback } from 'react';
import { FiArrowLeft, FiSearch, FiMapPin, FiWind, FiDroplet, FiSun, FiThermometer, FiClock } from 'react-icons/fi';

const weatherIcons = {
  0: { label: 'Clear sky', icon: '☀️' },
  1: { label: 'Mainly clear', icon: '🌤️' },
  2: { label: 'Partly cloudy', icon: '⛅' },
  3: { label: 'Overcast', icon: '☁️' },
  45: { label: 'Foggy', icon: '🌫️' },
  48: { label: 'Depositing rime fog', icon: '🌫️' },
  51: { label: 'Light drizzle', icon: '🌦️' },
  53: { label: 'Moderate drizzle', icon: '🌦️' },
  55: { label: 'Dense drizzle', icon: '🌧️' },
  61: { label: 'Slight rain', icon: '🌦️' },
  63: { label: 'Moderate rain', icon: '🌧️' },
  65: { label: 'Heavy rain', icon: '🌧️' },
  71: { label: 'Slight snow', icon: '🌨️' },
  73: { label: 'Moderate snow', icon: '🌨️' },
  75: { label: 'Heavy snow', icon: '❄️' },
  80: { label: 'Slight rain showers', icon: '🌦️' },
  81: { label: 'Moderate rain showers', icon: '🌧️' },
  82: { label: 'Violent rain showers', icon: '🌧️' },
  95: { label: 'Thunderstorm', icon: '⛈️' },
  96: { label: 'Thunderstorm with slight hail', icon: '⛈️' },
  99: { label: 'Thunderstorm with heavy hail', icon: '⛈️' },
};

const getWeatherIcon = (code) => weatherIcons[code] || { icon: '🌈', label: 'Unknown' };

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const WeatherDashboardDemo = ({ onBack }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recentCities, setRecentCities] = useState(() => {
    try { return JSON.parse(localStorage.getItem('recentCities')) || []; }
    catch { return []; }
  });

  const searchCities = useCallback(async (q) => {
    if (q.length < 2) { setSuggestions([]); return; }
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=5&language=en&format=json`);
      const data = await res.json();
      setSuggestions(data.results || []);
    } catch {
      setSuggestions([]);
    }
  }, []);

  let debounceTimer;
  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => searchCities(val), 300);
  };

  const fetchWeather = async (city) => {
    setLoading(true);
    setError('');
    setSelectedCity(city);
    setQuery(`${city.name}, ${city.admin1 || ''}, ${city.country_code}`.replace(', ,', ','));
    setSuggestions([]);

    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${city.latitude}&longitude=${city.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,uv_index&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum,wind_speed_10m_max&timezone=auto`
      );
      const data = await res.json();
      setWeather(data.current);
      setForecast(data.daily);

      const updated = [city.name, ...recentCities.filter((c) => c !== city.name)].slice(0, 5);
      setRecentCities(updated);
      localStorage.setItem('recentCities', JSON.stringify(updated));
    } catch {
      setError('Failed to fetch weather data');
    }
    setLoading(false);
  };

  const selectRecent = (cityName) => {
    searchCities(cityName);
    setTimeout(() => {
      if (suggestions.length > 0) fetchWeather(suggestions[0]);
    }, 400);
  };

  const maxTemp = forecast ? Math.max(...forecast.temperature_2m_max) : 40;
  const minTemp = forecast ? Math.min(...forecast.temperature_2m_min) : -10;
  const tempRange = maxTemp - minTemp || 1;

  return (
    <section className="weather-demo">
      <div className="container">
        <div className="demo-header">
          <button className="btn-back" onClick={onBack}>
            <FiArrowLeft size={20} /> Back to Portfolio
          </button>
          <h2 className="section-title">Weather Dashboard Demo</h2>
          <p className="section-subtitle">Real-time weather data powered by Open-Meteo API</p>
        </div>

        <div className="weather-layout">
          <div className="weather-sidebar">
            <div className="weather-search-box">
              <div className="search-input-wrap">
                <FiSearch className="search-input-icon" size={18} />
                <input
                  type="text"
                  placeholder="Search city..."
                  value={query}
                  onChange={handleQueryChange}
                />
              </div>
              {suggestions.length > 0 && (
                <div className="weather-suggestions">
                  {suggestions.map((city, i) => (
                    <button key={i} className="suggestion-item" onClick={() => fetchWeather(city)}>
                      <FiMapPin size={14} />
                      <span>{city.name}, {city.admin1 || ''} {city.country_code}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {recentCities.length > 0 && (
              <div className="recent-section">
                <h4><FiClock size={14} /> Recent</h4>
                {recentCities.map((city) => (
                  <button key={city} className="recent-item" onClick={() => selectRecent(city)}>
                    {city}
                  </button>
                ))}
              </div>
            )}

            {weather && selectedCity && (
              <div className="weather-current-mini">
                <h4>Now in {selectedCity.name}</h4>
                <div className="mini-temp">{Math.round(weather.temperature_2m)}°C</div>
                <div className="mini-icon">{getWeatherIcon(weather.weather_code).icon}</div>
                <div className="mini-desc">{getWeatherIcon(weather.weather_code).label}</div>
              </div>
            )}
          </div>

          <div className="weather-main">
            {error && <div className="weather-error">{error}</div>}

            {!weather && !loading && (
              <div className="weather-empty">
                <img src="https://openweathermap.org/img/wn/02d@2x.png" alt="" style={{ opacity: 0.5, width: 120 }} />
                <h3>Check the Weather</h3>
                <p>Search for a city to get current conditions and forecast</p>
              </div>
            )}

            {loading && (
              <div className="weather-loading">
                <div className="loading-spinner"></div>
                <p>Fetching weather data...</p>
              </div>
            )}

            {weather && !loading && (
              <>
                <div className="weather-current-card">
                  <div className="weather-current-left">
                    <div className="weather-main-icon">{getWeatherIcon(weather.weather_code).icon}</div>
                    <div className="weather-temp">{Math.round(weather.temperature_2m)}°C</div>
                    <div className="weather-desc">{getWeatherIcon(weather.weather_code).label}</div>
                    <div className="weather-feels">Feels like {Math.round(weather.apparent_temperature)}°C</div>
                  </div>
                  <div className="weather-current-right">
                    <div className="weather-detail-grid">
                      <div className="weather-detail-item">
                        <FiDroplet size={20} />
                        <div>
                          <span className="detail-label">Humidity</span>
                          <span className="detail-value">{weather.relative_humidity_2m}%</span>
                        </div>
                      </div>
                      <div className="weather-detail-item">
                        <FiWind size={20} />
                        <div>
                          <span className="detail-label">Wind</span>
                          <span className="detail-value">{weather.wind_speed_10m} km/h</span>
                        </div>
                      </div>
                      <div className="weather-detail-item">
                        <FiThermometer size={20} />
                        <div>
                          <span className="detail-label">Feels Like</span>
                          <span className="detail-value">{Math.round(weather.apparent_temperature)}°</span>
                        </div>
                      </div>
                      <div className="weather-detail-item">
                        <FiSun size={20} />
                        <div>
                          <span className="detail-label">UV Index</span>
                          <span className="detail-value">{weather.uv_index}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {forecast && (
                  <div className="weather-forecast">
                    <h3>7-Day Forecast</h3>
                    <div className="forecast-grid">
                      {forecast.time.map((date, i) => {
                        const dayName = i === 0 ? 'Today' : DAY_NAMES[new Date(date).getDay()];
                        const high = Math.round(forecast.temperature_2m_max[i]);
                        const low = Math.round(forecast.temperature_2m_min[i]);
                        const icon = getWeatherIcon(forecast.weather_code[i]);
                        return (
                          <div key={i} className="forecast-card">
                            <span className="forecast-day">{dayName}</span>
                            <span className="forecast-icon">{icon.icon}</span>
                            <div className="forecast-bar-wrap">
                              <div className="forecast-bar">
                                <div
                                  className="forecast-fill"
                                  style={{
                                    left: `${((low - minTemp) / tempRange) * 100}%`,
                                    width: `${((high - low) / tempRange) * 100}%`,
                                  }}
                                ></div>
                              </div>
                              <div className="forecast-bar-labels">
                                <span>{low}°</span>
                                <span>{high}°</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WeatherDashboardDemo;

