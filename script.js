let lat = 48.3794;
let lon = 31.1656;
let m = 4.7;

function showModal() {
    const overlay = document.getElementById('modalOverlay');
    overlay.style.display = 'flex';
}

// Функція для приховування модального вікна
function hideModal() {
    const overlay = document.getElementById('modalOverlay');
    overlay.style.display = 'none';
}

document.querySelector('.menu-button').addEventListener('click', function() {
    document.querySelector('.sidebar').classList.toggle('open');
    document.body.classList.toggle('sidebar-open');
});

const searchInput = document.getElementById('citySearch');
const dropdown = document.getElementById('dropdown');
const loading = document.getElementById('loading');
let debounceTimer;

// Функція для дебаунсингу пошукових запитів
const debounce = (func, delay) => {
    return (...args) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => func.apply(this, args), delay);
    };
};

// Функція для пошуку міст
const searchCities = async (query) => {
    if (query.length < 2) {
        dropdown.classList.remove('active');
        return;
    }

    loading.classList.add('active');
    dropdown.classList.remove('active');

    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&accept-language=uk&q=${encodeURIComponent(query)}`
        );
        const cities = await response.json();

        // Фільтруємо результати
        const filteredCities = cities.filter(city =>
            ["village", "town", "city", "administrative"].includes(city.type)
        );

        displayResults(filteredCities);
    } catch (error) {
        console.error('Помилка пошуку:', error);
        dropdown.innerHTML = '<div class="dropdown-item">Помилка під час пошуку</div>';
    } finally {
        loading.classList.remove('active');
        dropdown.classList.add('active');
    }
};


// Функція для відображення результатів
const displayResults = (filteredCities) => {
    if (filteredCities.length === 0) {
        dropdown.innerHTML = '<div class="dropdown-item">Міста не знайдено</div>';
        return;
    }

    dropdown.innerHTML = filteredCities.map(city => `
                <div class="dropdown-item">
                    <div class="city-name">${city.name}</div>
                    <div class="city-address">${city.display_name}</div>
                </div>
            `).join('');
};


// Обробник події введення тексту
searchInput.addEventListener('input', debounce((e) => {
    searchCities(e.target.value);
}, 300));

dropdown.addEventListener('click', (e) => {
    const item = e.target.closest('.dropdown-item');
    if (!item) return;

    const cityAddress = item.querySelector('.city-address').textContent;
    searchInput.value = cityAddress;
    dropdown.classList.remove('active');
});

// Закриття випадаючого списку при кліку поза ним
document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
        dropdown.classList.remove('active');
    }
});

function searchWeather() {
    getCoordinates();
    getWeather();
}

async function showDropdown() {
    const cityInput = document.getElementById('cityInput');
    const query = cityInput.value.trim();
    const dropdown = document.getElementById('dropdown');

    if (query.length < 3) {
        dropdown.innerHTML = '';
        dropdown.style.display = 'none';
        return;
    }

    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&accept-language=uk&q=${encodeURIComponent(query)}`);
        const data = await response.json();

        if (data.length > 0) {
            dropdown.innerHTML = '';
            data.slice(0, 5).forEach(location => {
                const option = document.createElement('div');
                option.className = 'dropdown-item';
                option.textContent = location.display_name;
                option.onclick = () => {
                    cityInput.value = location.display_name;
                    dropdown.innerHTML = '';
                    dropdown.style.display = 'none';
                };
                dropdown.appendChild(option);
            });
            dropdown.style.display = 'block';
        } else {
            dropdown.innerHTML = '<div class="dropdown-item">Нічого не знайдено</div>';
            dropdown.style.display = 'block';
        }
    } catch (error) {
        console.error('Помилка завантаження:', error);
    }
}

async function getWeather() {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=c719263ca8bb1d6df089e31251468f9f&units=metric&lang=uk`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (response.ok) {
            const weatherData = processWeatherData(data);
            updateWeatherBoxes(weatherData);

        } else {
            document.getElementById('weather-result').innerHTML = `<p>Помилка: ${data.message}</p>`;
        }
    } catch (error) {
        document.getElementById('weather-result').innerHTML = `<p>Сталася помилка при отриманні даних.</p>`;
    }
}

function processWeatherData(data) {
    const weatherData = {
        temperature: [],
        conditions: []
    };

    // Беремо перші 7 днів з прогнозу
    data.list.slice(0, 7).forEach((dayData, index) => {
        const date = new Date();
        date.setDate(date.getDate() + index);

        const dayName = date.toLocaleDateString('uk-UA', { weekday: 'long' });
        const formattedDate = date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' });

        weatherData.temperature.push({
            day: dayName,
            date: formattedDate,
            value: dayData.main.temp
        });
        weatherData.conditions.push({
            day: dayName,
            date: formattedDate,
            value: dayData.weather[0].main
        });
    });
    return weatherData;
}

function updateWeatherBoxes(weatherData) {
    const weatherBoxesContainer = document.getElementById('weather-boxes');
    weatherBoxesContainer.innerHTML = '';

    weatherData.conditions.forEach((item, index) => {
        const temp = weatherData.temperature[index].value;

        const box = document.createElement('div');
        box.classList.add('weather-box');
        box.innerHTML = `
                    <div class="date">${item.date}</div>
                    <div class="day">${item.day}</div>
                    <div class="icon">${getWeatherIcon(item.value)}</div>
                    <div class="temperature">
                        <span>${temp.toFixed(1)}°C</span><br>
                    </div>
                `;

        weatherBoxesContainer.appendChild(box);

        if (index === 0){
            setBodyBack(item.value)
        }
    });
}

function getWeatherIcon(condition) {
    const icons = {
        Clear: "☀️",
        Clouds: "☁️",
        Rain: "🌧️",
        Snow: "❄️",
        Thunderstorm: "⚡",
        Drizzle: "🌦️",
        Mist: "🌫️"
    };

    return icons[condition] || "❓";
}

function setBodyBack(condition) {
    const body = document.body;

    const backgrounds = {
        Clear: "url('./img/Clear.jpg')",
        Clouds: "url('./img/Clouds.jpg')",
        Rain: "url('./img/Rain.jpg')",
        Snow: "url('./img/Snow.jpg')",
        Thunderstorm: "url('./img/Thunderstorm.jpg')",
        Drizzle: "url('./img/Drizzle.jpg')",
        Mist: "url('./img/Mist.jpg')",
        Main: "url('./img/Main.jpg')"
    };

    const normalizedCondition = condition?.trim() || "Main";
    const background = backgrounds[normalizedCondition] || backgrounds.Main;

    body.style.backgroundImage = background;
    body.style.backgroundSize = "cover";
    body.style.backgroundPosition = "center";
    body.style.backgroundRepeat = "no-repeat";
}


async function getCoordinates() {
    const city = document.getElementById('cityInput').value;
    const resultDiv = document.getElementById('result');
    const weatherMap = document.getElementById('weatherMap');
    if (!weatherMap) {
        console.error('Елемент iframe з id="weatherMap" не знайдено.');
        return;
    }

    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&accept-language=uk&q=${encodeURIComponent(city)}`);
        const data = await response.json();

        if (data.length > 0) {
            const filteredData = data.filter(item => ["village", "town", "city", "administrative"].includes(item.type));

            if (filteredData.length > 0) {
                lat = filteredData[0].lat;
                lon = filteredData[0].lon;

                if (filteredData[0].type === "administrative"){
                    m = 10;
                }
                else if (filteredData[0].type === "city"){
                    m = 11;
                }
                else if (filteredData[0].type === "town") {
                    m = 12.7;
                }
                else if (filteredData[0].type === "village") {
                    m = 13.4;
                }

                const { display_name } = filteredData[0];
                resultDiv.innerHTML = `<strong>Місто:</strong> ${display_name}<br>`;
                const proxyUrl = `https://proxy-ten-sage.vercel.app/uk/weather/maps/#coords=${m}/${lat}/${lon}&map=temperature~hourly~auto~2%20m%20above%20gnd~none`;
                weatherMap.src = proxyUrl;
            } else {
                resultDiv.innerHTML = 'Введіть місто!';
            }
        } else {
            resultDiv.innerHTML = 'Місто не знайдено';
        }
    } catch (error) {
        resultDiv.innerHTML = 'Помилка завантаження координат';
        console.error(error);
    }
}

document.getElementById('cityInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        searchWeather();
    }
});

function searchCity(cityName) {
    const cityInput = document.getElementById('cityInput');
    cityInput.value = cityName;
    getCoordinates();
    getWeather();
}

function updateMap(mapType) {
    const weatherMap = document.getElementById('weatherMap');
    const proxyUrl = `https://proxy-ten-sage.vercel.app/uk/weather/maps/#coords=${m}/${lat}/${lon}&map=${mapType}&_=${Date.now()}`;
    weatherMap.src = '';
    weatherMap.src = proxyUrl;
}

document.getElementById('precipitation').addEventListener('click', () => {
    updateMap('precipitationProbability~hourly~auto~0.1%20mm~none');
});

document.getElementById('temperature').addEventListener('click', () => {
    updateMap('temperature~hourly~auto~2%20m%20above%20gnd~none');
});

document.getElementById('wind').addEventListener('click', () => {
    updateMap('windAnimation~rainbow~auto~10%20m%20above%20gnd~none');
});
