const APIkey = '2226bf37a7ad24ff66689b2b133a3dc1';
let units = 'imperial';

init();

function init() {
  getWeather('Atlanta');
}

// Function to make API calls and parse responses for end data
async function getWeather(city) {
  let cityGeo = await getGeo(city);
  let weather = await callWeather(cityGeo);
  let current = grabCurrent(weather);
  console.log(current); ////////////////////////
  let fiveDay = grab5day(weather);
  console.log(fiveDay); ////////////////////////
}

// Get coordinates of city from Geo API
async function getGeo(city) {
  let coord = {};
  let callGeoURL = `http://api.openweathermap.org/geo/1.0/direct?q=${city}&appid=${APIkey}`
  let response = await fetch(callGeoURL, { mode: 'cors' });
  let geo = await response.json();
  coord.lat = geo[0].lat;
  coord.lon = geo[0].lon;
  return coord
}

// Get current and 5-day forecast from Weather API
async function callWeather(coord) {
  let { lat, lon } = coord;
  // Get current weather forecast
  let callCurrentWeatherURL = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${APIkey}&units=${units}`;
  let responseCurrent = await fetch(callCurrentWeatherURL, { mode: 'cors' });
  let currentWeather = await responseCurrent.json();
  // Get 5 day weather forecast
  let call5dayForecastURL = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${APIkey}&units=${units}`;
  let response5day = await fetch(call5dayForecastURL, { mode: 'cors' });
  let fiveDay = await response5day.json();
  return { currentWeather, fiveDay };
}

// Parse current weather forecast
function grabCurrent(weather) {
  let current = {};
  let cityName = weather.currentWeather.name;
  let currentDesc = weather.currentWeather.weather[0].description;
  let date = new Date();
  date = date.toDateString(); // Format with Dayjs
  let temp = Math.round(weather.currentWeather.main.temp);
  let windSpeed = Math.round(weather.currentWeather.wind.speed);
  let humidity = Math.round(weather.currentWeather.main.humidity);
  current = { cityName, currentDesc, date, temp, windSpeed, humidity }
  return current
}

// Parse 5-day weather forecast
function grab5day(weather) {
  let fiveDay = {};
  let fiveDayKeys = [];
  let today = new Date();
  // Grab all data from API response
  for(let i = 0; i < weather.fiveDay.list.length; i++) {
    let date = new Date(weather.fiveDay.list[i].dt * 1000);
    // Only use data from days that are not today
    if (today.getDate() !== date.getDate()) {
      let tempMin = weather.fiveDay.list[i].main.temp_min;
      let tempMax = weather.fiveDay.list[i].main.temp_max;
      let humidity = weather.fiveDay.list[i].main.humidity;
      let windSpeed = weather.fiveDay.list[i].wind.speed;
      let description = weather.fiveDay.list[i].weather[0].description
      let data = { tempMin, tempMax, humidity, windSpeed, description }
      if (!fiveDay[date.getDate()]) {
        fiveDay[date.getDate()] = [];
        fiveDayKeys.push(date.getDate());
      }
      fiveDay[date.getDate()].push(data);
    }
  }
  // Summarize data by days
  let fiveDaySummary = [];
  for(let i = 0; i < 5; i++) {
    // Calculate daily average
    let tempMin = fiveDay[fiveDayKeys[i]].reduce((avg, data) => avg += data.tempMin / fiveDay[fiveDayKeys[i]].length, 0);
    let tempMax = fiveDay[fiveDayKeys[i]].reduce((avg, data) => avg += data.tempMax / fiveDay[fiveDayKeys[i]].length, 0);
    let humidity = fiveDay[fiveDayKeys[i]].reduce((avg, data) => avg += data.humidity / fiveDay[fiveDayKeys[i]].length, 0);
    let windSpeed = fiveDay[fiveDayKeys[i]].reduce((avg, data) => avg += data.windSpeed / fiveDay[fiveDayKeys[i]].length, 0);
    // Round to whole numbers
    tempMin = Math.round(tempMin);
    tempMax = Math.round(tempMax);
    humidity = Math.round(humidity);
    windSpeed = Math.round(windSpeed);
    // Find description to sum up whole day
    let descriptionCount = {};
    fiveDay[fiveDayKeys[i]].forEach(data => {
      if(!descriptionCount[data.description]) descriptionCount[data.description] = 0;
      descriptionCount[data.description]++;
    })
    let description = '';
    let maxDescriptionCount = 0;
    for (let key in descriptionCount) {
      if (descriptionCount[key] > maxDescriptionCount) {
        maxDescriptionCount = descriptionCount[key];
        description = key;
      }
    }

    fiveDaySummary.push({ tempMin, tempMax, humidity, windSpeed, description })
  }
  return fiveDaySummary
}

/*

Initialize function
- get stored cities from local storage
- default city or use current location? => what happens when nothing is loaded

Function to save cities to local storage

Add data to DOM
- function to create today card
- function to create cards for next 5 days

Function to search for new city

Function to store previous cities
- No duplicates in list
- Max length of list: 10?

Input validation for search function

Error handling for API requests

Degrees Celsius &#8451
Degrees Farenheit &#8457

Nice to haves:


Converting units
- temp k => f or c
- wind speed (default m/s, imperial gives mph)

*/