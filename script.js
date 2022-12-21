let APIkey = '2226bf37a7ad24ff66689b2b133a3dc1';

async function getGeo(city) {
  let coord = {};
  let callGeoURL = `http://api.openweathermap.org/geo/1.0/direct?q=${city}&appid=${APIkey}`
  let response = await fetch(callGeoURL, { mode: 'cors' });
  let geo = await response.json();
  coord.lat = geo[0].lat;
  coord.lon = geo[0].lon;
  return coord
}

async function callWeather(coord) {
  let { lat: lat, lon: lon } = coord;
  let callWeatherURL = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${APIkey}`;
  let response = await fetch(callWeatherURL, { mode: 'cors' });
  let weather = await response.json();
  let forecast = weather;
  return weather;
}

async function testCalls(city) {
  let ATL = await getGeo(city);
  let weather = await callWeather(ATL);
  console.log(weather);
}
testCalls('Atlanta');



// Current Date / Time: Not from API

// Overcast clouds: forecast.weather[0].description
// City: forecast.name
// Temp: forecast.main.temp (also temp_max and temp_min)
// Feels like: forecast.main.feels_like
// Humidity: forecast.main.Humidity
// Chance of rain:
// Wind Speed: forecast.main.wind.speed


/*

Things I don't know how to do yet:
- loading component that displays while waiting for API response

*/