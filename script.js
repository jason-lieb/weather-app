const APIkey = '2226bf37a7ad24ff66689b2b133a3dc1';
let units = 'imperial';
let history = [];

// Query selectors
const search = document.querySelector('#search');
const searchBtn = document.querySelector('#searchBtn');
const historyBtns = document.querySelector('#history');
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
historyBtns.addEventListener('click', getCityFromHistory);

init();

function init() {
  loadHistory();
  if (history.length === 0) {
    getWeather('Atlanta');
  } else {
    getWeather(history[0]);
  }
}

// Function to make API calls and parse responses for end data
async function getWeather(city) {
  city = typeof city === 'object' ? search.value : city;
  search.value = '';
  let cityGeo = await getGeo(city);
  let weather = await callWeather(cityGeo);
  let current = grabCurrent(weather);
  updateCurrentDOM(current);
  let fiveDay = grab5day(weather);
  create5dayCards(fiveDay);
  addNewCityToHistory(city);
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
  let currentDesc = weather.currentWeather.weather[0].main;
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
      let description = weather.fiveDay.list[i].weather[0].main;
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

// Update values in today section of forecast
function updateCurrentDOM(current) {
  city.textContent = `Weather in ${current.cityName}`;
  todayDate.textContent = current.date;
  todayTemp.innerHTML = `${current.temp}&#8457`;
  todayDesc.textContent = current.currentDesc;
  todayWind.textContent = `Wind Speed: ${current.windSpeed} MPH`;
  todayHumidty.textContent = `Humidity: ${current.humidity}%`;
  todayIcon.src = chooseWeatherIcon(current.currentDesc);
  todayIcon.alt = current.currentDesc;
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

function chooseWeatherIcon(description) {
  let output;
  switch (description) {
    case 'Thunderstorm':
      output = './icons/thunder.svg';
      break;
    case 'Clear':
      output = './icons/clear.svg';
      break;
    case 'Drizzle' || 'Rain':
      output = './icons/rainy.svg';
      break;
    case 'Snow':
      output = './icons/snowy.svg';
      break;
    default:
      output = './icons/cloudy.svg';
    }
  return output
}

// Handles all conditions that need to be considered when adding a new city to history
function addNewCityToHistory(city) {
  // Check if city is already in history
  for (let i = 0; i < history.length; i++) {
    if (history[i] === city) {
      history.splice(i, 1);
      historyBtns.removeChild(document.querySelector(`#${cityToDashes(city)}`));
    }
  }
  // Limit history to 10 cities
  if (history.length > 9) history.pop();
  // Add new city and update local storage and DOM
  history.unshift(city);
  localStorage.setItem('history', JSON.stringify(history));
  updateHistoryDOM(city);
}

// Add cities to history list
function updateHistoryDOM(city) {
  let newCity = document.createElement('button');
  newCity.className = 'btn btn-secondary';
  newCity.id = cityToDashes(city);
  newCity.textContent = city;
  historyBtns.prepend(newCity);
}

// Function to replace spaces with dashes in city names for query selectors
function cityToDashes(city) {
  return city.split(' ').join('-');
}

function loadHistory() {
  history = JSON.parse(localStorage.getItem('history')) || [];
  for (let i = history.length - 1; i >= 0; i--) {
    updateHistoryDOM(history[i]);
  }
}

function clearHistory() {
  localStorage.removeItem('history');
}

function getCityFromHistory(e) {
  getWeather(e.target.textContent)
}


/*

Nice to haves:




*/