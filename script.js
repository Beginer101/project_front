let lat = 48.3794;
let lon = 31.1656;
let m = 5;

async function getWeather() {
    const cityInput = document.getElementById('cityInput'); // Виправлено id
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
            updateWeatherBoxes(weatherData); // Додаємо бокси
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

    const sevenDaysForecast = data.list.reduce((acc, item) => {
        const date = new Date(item.dt * 1000);
        const dayKey = date.toISOString().split('T')[0];
        if (!acc[dayKey]) {
            acc[dayKey] = item;
        }
        return acc;
    }, {});

    Object.values(sevenDaysForecast).slice(0, 7).forEach((dayData) => {
        const date = new Date(dayData.dt * 1000);
        const dayName = date.toLocaleDateString('uk-UA', { weekday: 'long' });

        weatherData.temperature.push({ day: dayName, value: dayData.main.temp });
        weatherData.conditions.push({ day: dayName, value: dayData.weather[0].main });
    });

    return weatherData;
}

function updateWeatherBoxes(weatherData) {
    const weatherBoxesContainer = document.getElementById('weather-boxes');
    weatherBoxesContainer.innerHTML = ''; // Очищуємо попередній вміст

    weatherData.conditions.forEach((item, index) => {
        const temp = weatherData.temperature[index].value;

        const box = document.createElement('div');
        box.classList.add('weather-box');
        box.innerHTML = `
            <div class="date">${new Date().toLocaleDateString('uk-UA', { month: 'long', day: 'numeric' })}</div>
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
    // Функція для визначення іконки за погодним станом
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
        // Виконуємо запит до OpenStreetMap
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&accept-language=uk&q=${encodeURIComponent(city)}`);
        const data = await response.json();

        if (data.length > 0) {
            lat = data[0].lat;
            lon = data[0].lon;
            m = 10

            const { display_name } = data[0];

            // Виводимо інформацію про місто
            resultDiv.innerHTML = `<strong>Місто:</strong> ${display_name}<br>`;

            // Встановлюємо URL до проксі-сервера
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

// Додаємо обробник для натискання клавіші Enter
document.getElementById('cityInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        getCoordinates();
        getWeather();
    }
});

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

