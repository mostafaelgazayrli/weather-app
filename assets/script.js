// API key for OpenWeatherMap
const apiKey = "b1dc0c5d88876fe10c78ebc1ce193ac0";
// Base URL for OpenWeatherMap API
const weatherUrl = 'https://api.openweathermap.org';

// Array to store search history
const searchHistory = [];
// DOM elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById("search-btn");
const cityNameH1 = document.getElementById('city-name');
const dateOfDayH1 = document.getElementById('today-date');
const tempH1 = document.getElementById('temp');
const windH1 = document.getElementById('wind');
const humiH1 = document.getElementById('hum');
const display = document.getElementById('display-area');
const iconH1 = document.getElementById("icon-img");
const daysCards = document.getElementById('days-cards');
const historyH1 = document.getElementById('history');

// Extend dayjs with plugins
dayjs.extend(window.dayjs_plugin_utc);
dayjs.extend(window.dayjs_plugin_timezone);

/**
 * Function to handle errors during fetch operations
 * @param {Response} response - The response object from the fetch operation
 * @returns {Promise} - JSON promise from the response
 */
function handleFetchErrors(response) {
    if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
    }
    return response.json();
}

/**
 * Function to render search history buttons
 */
function renderSearchHistory() {
    // Clear the existing buttons
    historyH1.innerHTML = '';

    // Loop through the searchHistory array in reverse order
    for (let i = searchHistory.length - 1; i >= 0; i--) {
        const btn = document.createElement('button');
        btn.setAttribute('type', 'button');
        btn.setAttribute('aria-controls', 'today forecast');
        btn.classList.add('history-btn', 'btn-history');

        // `data-search` allows access to city name when click handler is invoked
        btn.setAttribute('data-search', searchHistory[i]);
        btn.textContent = searchHistory[i];

        // Attach an event listener to the button to trigger a new search
        btn.addEventListener('click', function () {
            fetchC(this.getAttribute('data-search'));
        });

        // Append the button to the history div
        historyH1.appendChild(btn);
    }
}

/**
 * Function to add a search term to the search history
 * @param {string} search - The search term to be added to the history
 */
function appendToHistory(search) {
    // If the search term is already in the history, return
    if (searchHistory.indexOf(search) !== -1) {
        return;
    }

    // Add the search term to the searchHistory array
    searchHistory.push(search);

    // Update local storage with the new searchHistory array
    localStorage.setItem('search-history', JSON.stringify(searchHistory));

    // Render the updated search history
    renderSearchHistory();
}

/**
 * Function to initialize search history from local storage
 */
function initSearchHistory() {
    // Retrieve search history from local storage
    const storedHistory = localStorage.getItem('search-history');

    // If search history exists in local storage, parse and set it to searchHistory
    if (storedHistory) {
        searchHistory = JSON.parse(storedHistory);
    } else {
        // If there is no search history in local storage, set it to an empty array
        searchHistory = [];
    }

    // Render the initial search history
    renderSearchHistory();
}

/**
 * Function to display current weather information
 * @param {string} city - The city name
 * @param {Object} weather - The current weather data
 */
function currentCity(city, weather) {
    const date = dayjs().format('M/D/YYYY');
    const tempF = weather.main.temp;
    const windMPH = weather.wind.speed;
    const humidity = weather.main.humidity;
    const iconUrl = `https://openweathermap.org/img/w/${weather.weather[0].icon}.png`;

    cityNameH1.innerHTML = city;
    dateOfDayH1.innerHTML = date;
    tempH1.innerHTML = `${tempF}°F`;
    windH1.innerHTML = `${windMPH} MPH`;
    humiH1.innerHTML = `${humidity}%`;
    iconH1.src = iconUrl;
}

/**
 * Function to create elements for a day in the 5-day forecast and append them to the DOM
 * @param {Object} forecast - The forecast data for a day
 */
function get5days(forecast) {
    const iconUrl = `https://openweathermap.org/img/w/${forecast.weather[0].icon}.png`;
    const tempF = forecast.main.temp;
    const windMPH = forecast.wind.speed;
    const humidity = forecast.main.humidity;
    const dayCard = document.createElement('div');
    dayCard.id = 'day-card';
    daysCards.appendChild(dayCard);

    // Create elements within the day card
    const dateElement = document.createElement('h4');
    dateElement.textContent = dayjs(forecast.dt_txt).format('M/D/YYYY');

    const weatherIcon = document.createElement('img');
    weatherIcon.setAttribute('src', iconUrl);

    const tempElement = document.createElement('p');
    tempElement.innerHTML = `Temp: ${tempF}°F`;

    const windElement = document.createElement('p');
    windElement.innerHTML = `Wind: ${windMPH}MPH`;

    const humidityElement = document.createElement('p');
    humidityElement.innerHTML = `Humidity:${humidity}%`;

    dayCard.appendChild(dateElement);
    dayCard.appendChild(weatherIcon);
    dayCard.appendChild(tempElement);
    dayCard.appendChild(windElement);
    dayCard.appendChild(humidityElement);
}

/**
 * Function to render the 5-day weather forecast
 * @param {Array} dailyForecast - The 5-day forecast data
 */
function renderForecast(dailyForecast) {
    const startDt = dayjs().add(1, 'day').startOf('day').unix();
    const endDt = dayjs().add(6, 'day').startOf('day').unix();

    const uniqueDays = new Set();

    for (let i = 0; i < dailyForecast.length; i++) {
        if (dailyForecast[i].dt >= startDt && dailyForecast[i].dt < endDt) {
            const day = dayjs(dailyForecast[i].dt_txt).format('M/D/YYYY');

            // Check if the day is not already added
            if (!uniqueDays.has(day) && dailyForecast[i].dt_txt.slice(11, 13) === '15') {
                get5days(dailyForecast[i]);
                uniqueDays.add(day);

                // Break the loop if we have found the first occurrence for each unique day
                if (uniqueDays.size === 5) {
                    break;
                }
            }
        }
    }
}

/**
 * Function to render both the current weather and the 5-day forecast
 * @param {string} city - The city name
 * @param {Object} data - The weather data
 */
function renderItems(city, data) {
    currentCity(city, data.list[0], data.city.timezone);
    renderForecast(data.list);
}

/**
 * Function to fetch weather data for a given location
 * @param {Object} location - The location object containing latitude, longitude, and name
 */
function fetchWeather(location) {
    const { lat, lon } = location;
    const city = location.name;

    const apiUrl = `${weatherUrl}/data/2.5/forecast?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`;

    fetch(apiUrl)
        .then(handleFetchErrors)
        .then(function (data) {
            renderItems(city, data);
        })
        .catch(function (err) {
            console.error(err);
            // Handle error, e.g., show an error message to the user
        });
}

/**
 * Function to fetch location data and initiate weather fetch
 * @param {string} search - The search term for the location
 */
function fetchC(search) {
    const apiUrl = `${weatherUrl}/geo/1.0/direct?q=${search}&limit=5&appid=${apiKey}`;

    fetch(apiUrl)
        .then(handleFetchErrors)
        .then(function (data) {
            if (data[0]) {
                appendToHistory(search);
                fetchWeather(data[0]);
            } else {
                // Location not found, show an alert
                alert('Location not found');
            }
        })
        .catch(function (err) {
            console.error(err);
            // Handle error, e.g., show an error message to the user
            alert('Error fetching data. Please try again.');
        });
}

/**
 * Function to handle form submission and initiate weather fetch
 */
function handleSearchFormSubmit() {
    // Trim leading and trailing whitespaces
    const searchValue = searchInput.value.trim();

    // Don't continue if the search input is empty
    if (!searchValue) {
        alert('Please enter a valid location.');
        return;
    }

    // Fetch weather data for the entered location
    fetchC(searchValue);

    // Clear the search input
    searchInput.value = '';
}

/**
 * Function to handle click events on search history buttons
 * @param {Event} e - The click event
 */
function handleSearchHistoryClick(e) {
    // Don't do search if the current element is not a search history button
    if (!e.target.matches('.btn-history')) {
        return;
    }
    // display.classList.remove('hide')
    const btn = e.target;
    const search = btn.getAttribute('data-search');
    display.classList.remove('hide');
    fetchC(search);
}

// Event listener for search button click
searchBtn.addEventListener('click', function () {
    handleSearchFormSubmit();
});

// Event listener for Enter key press in the search input field
searchInput.addEventListener('keyup', function (event) {
    if (event.key === 'Enter') {
        handleSearchFormSubmit();
    }
});

// Event listener for click events on history buttons
historyH1.addEventListener('click', handleSearchHistoryClick);

// Initialize search history on page load
initSearchHistory();

