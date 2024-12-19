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

function searchWeather() {
    getCoordinates();
    getWeather();
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
            m = 10

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
