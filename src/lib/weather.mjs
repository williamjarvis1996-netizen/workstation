function description(code) {
  if (code === 0) return 'Clear';
  if (code <= 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if (code <= 48) return 'Fog';
  if (code <= 57) return 'Drizzle';
  if (code <= 67) return 'Rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Rain showers';
  if (code <= 86) return 'Snow showers';
  return 'Thunderstorms';
}

export async function londonWeather(signal) {
  const query = new URLSearchParams({
    latitude: '51.5074', longitude: '-0.1278', timezone: 'Europe/London', forecast_days: '1',
    current: 'temperature_2m,weather_code', daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max',
  });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${query}`, { signal });
  if (!response.ok) throw new Error('Weather is temporarily unavailable.');
  const { current, daily } = await response.json();
  const temperature = Math.round(current.temperature_2m);
  const high = Math.round(daily.temperature_2m_max[0]);
  const low = Math.round(daily.temperature_2m_min[0]);
  const rain = daily.precipitation_probability_max[0];
  return {
    headline: `${temperature}° · ${description(current.weather_code)}`,
    details: `High ${high}° · Low ${low}° · ${rain}% chance of precipitation`,
  };
}
