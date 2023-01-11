const APIkey = '2226bf37a7ad24ff66689b2b133a3dc1';
let units = 'imperial';

// Query selectors
const search = document.querySelector('#search');
const searchBtn = document.querySelector('#searchBtn');
const city = document.querySelector('#city');
const todayDate = document.querySelector('#todayDate');
const todayTemp = document.querySelector('#todayTemp');
const todayDesc = document.querySelector('#todayDesc');
const todayIcon = document.querySelector('#todayIcon');
const todayWind = document.querySelector('#todayWind');
const todayHumidty = document.querySelector('#todayHumidity');
const cards = document.querySelector('#cards');

// Event Listeners
searchBtn.addEventListener('click', getWeather);

init();

function init() {
  getWeather('Atlanta');
}

// Function to make API calls and parse responses for end data
async function getWeather(city) {
  city = typeof city === 'object' ? search.value : city;
  let cityGeo = await getGeo(city);
  let weather = await callWeather(cityGeo);
  let current = grabCurrent(weather);
  updateCurrentDOM(current);
  let fiveDay = grab5day(weather);
  create5dayCards(fiveDay);
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
  date = date.toDateString();
  date = dayjs(date).format('dddd, MMMM D, YYYY');
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
      let temp = weather.fiveDay.list[i].main.temp;
      let humidity = weather.fiveDay.list[i].main.humidity;
      let windSpeed = weather.fiveDay.list[i].wind.speed;
      let description = weather.fiveDay.list[i].weather[0].description
      let data = { date, temp, humidity, windSpeed, description }
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
    let temp = fiveDay[fiveDayKeys[i]].reduce((avg, data) => avg += data.temp / fiveDay[fiveDayKeys[i]].length, 0);
    let humidity = fiveDay[fiveDayKeys[i]].reduce((avg, data) => avg += data.humidity / fiveDay[fiveDayKeys[i]].length, 0);
    let windSpeed = fiveDay[fiveDayKeys[i]].reduce((avg, data) => avg += data.windSpeed / fiveDay[fiveDayKeys[i]].length, 0);
    let date = fiveDay[fiveDayKeys[i]][0].date;
    // Round to whole numbers
    temp = Math.round(temp);
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
    fiveDaySummary.push({ date, temp, humidity, windSpeed, description })
  }
  return fiveDaySummary
}

function updateCurrentDOM(current) {
  city.textContent = `Weather in ${current.cityName}`;
  todayDate.textContent = current.date;
  todayTemp.innerHTML = `${current.temp}&#8457`;
  todayDesc.textContent = current.currentDesc;
  todayWind.textContent = `Wind Speed: ${current.windSpeed} MPH`;
  todayHumidty.textContent = `Humidity: ${current.humidity}%`;
    // todayIcon /////////// Choose icon based on description
}

function create5dayCards(forecast) {
  clear5dayCards();
  let today = dayjs(new Date());
  for (let i = 0; i < 5; i++) {
    let card = document.createElement('div');
    card.innerHTML = `
      <div class="card-body">
        <h3 class="card-title">${dayjs(forecast[i].date).format('dddd')}</h3>
        <h4 class="card-subtitle">${dayjs(forecast[i].date).format('MMM D, YYYY')}</h4>
        <img class="card-img" src="${chooseWeatherIcon(forecast[i].description)}" alt="${forecast[i].description}">
        <p>Temp: ${forecast[i].temp}&#8457</p>
        <p>Wind: ${forecast[i].windSpeed} MPH</p>
        <p>Humidity: ${forecast[i].humidity}%</p>
      </div>
      `
    card.className = 'card col-md mx-2';
    cards.appendChild(card);
  }
}

function clear5dayCards() {
  cards.innerHTML = '';
}

function chooseWeatherIcon(description) { ////////////////////////////////
  return './icons/rainy.svg'
}

/*

Clear 5 day forecast

Initialize function
- get stored cities from local storage
- default city or use current location? => what happens when nothing is loaded

Function to save cities to local storage

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