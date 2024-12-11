let lat = 48.3794;
let lon = 31.1656;
let m = 5;

document.querySelector('.menu-button').addEventListener('click', function() {
    document.querySelector('.sidebar').classList.toggle('open');
    document.body.classList.toggle('sidebar-open');
});

function searchWeather() {
    getCoordinates();
    getWeather();
}

async function getWeather() {
    const cityInput = document.getElementById('cityInput');
    const city = encodeURIComponent(cityInput.value.trim());

    if (!city) {
        alert('Будь ласка, введіть назву міста');
        return;
    }

    const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=c719263ca8bb1d6df089e31251468f9f&units=metric&lang=uk`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.cod === '404') {
            alert('Місто не знайдено. Спробуйте ввести назву англійською мовою.');
            return;
        }

        if (response.ok) {
            const weatherData = processWeatherData(data);
            updateWeatherBoxes(weatherData);
        } else {
            throw new Error(`HTTP помилка! статус: ${response.status}`);
        }
    } catch (error) {
        console.error("Помилка:", error);
        alert(`Сталася помилка при отриманні даних про погоду: ${error.message}`);
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
            lat = data[0].lat;
            lon = data[0].lon;
            m = 10;

            const { display_name } = data[0];
            resultDiv.innerHTML = `<strong>Місто:</strong> ${display_name}<br>`;

            const proxyUrl = `https://proxy-ten-sage.vercel.app/uk/weather/maps/#coords=${m}/${lat}/${lon}&map=temperature~hourly~auto~2%20m%20above%20gnd~none`;
            weatherMap.src = proxyUrl;
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

// Функція пошуку міста з автоматичним запуском пошуку погоди
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
