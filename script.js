const API_KEY = "7ce32eb5b962149fc52c972bb74b2b1a";

const cityInput = document.getElementById("city-input");
const weatherBtn = document.getElementById("btn");
const currentWeatherDiv = document.getElementById("box");
const forecastDiv = document.getElementById("forecast");

weatherBtn.addEventListener("click", () => {
    const city = cityInput.value.trim();

    if (!city) {
        alert("Podaj nazwę miasta!");
        return;
    }

    currentWeatherDiv.innerHTML = "Ładowanie bieżącej pogody...";
    forecastDiv.innerHTML = "Ładowanie prognozy 4-dniowej...";

    getCurrentWeatherXHR(city);   
    getForecastFetch(city);       
});


function getCurrentWeatherXHR(city) {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=pl`;

    const xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);

    xhr.onload = function () {
        if (xhr.status === 200) {
            const data = JSON.parse(xhr.responseText);

            console.log("Current Weather response:", data);

            renderCurrentWeather(data);
        } else {
            currentWeatherDiv.innerHTML = `Błąd podczas pobierania danych: ${xhr.status}`;
            console.error("Błąd XHR:", xhr.status, xhr.responseText);
        }
    };

    xhr.onerror = function () {
        currentWeatherDiv.innerHTML = "Wystąpił błąd sieci podczas pobierania pogody.";
        console.error("Błąd sieci XHR");
    };

    xhr.send();
}

function renderCurrentWeather(data) {
    if (!data || !data.main) {
        currentWeatherDiv.innerHTML = "Brak danych dla podanego miasta.";
        return;
    }

    const miasto = data.name;
    const kraj = data.sys && data.sys.country ? data.sys.country : "";
    const temp = data.main.temp;
    const opis = data.weather && data.weather[0] ? data.weather[0].description : "brak opisu";
    const wilgotnosc = data.main.humidity;
    const wiatr = data.wind ? data.wind.speed : "brak";

    currentWeatherDiv.innerHTML = `
        <p><strong>${miasto}, ${kraj}</strong></p>
        <p>Temperatura: ${temp.toFixed(1)} °C</p>
        <p>Opis: ${opis}</p>
        <p>Wilgotność: ${wilgotnosc}%</p>
        <p>Wiatr: ${wiatr} m/s</p>
    `;
}


function getForecastFetch(city) {
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=pl`;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error("HTTP error: " + response.status);
            }
            return response.json();
        })
        .then(data => {
            console.log("4 Day Forecast response:", data);

            renderForecast(data);
        })
        .catch(error => {
            forecastDiv.innerHTML = "Wystąpił błąd podczas pobierania prognozy.";
            console.error("Błąd Fetch (forecast):", error);
        });
}

function renderForecast(data) {
    if (!data || !data.list || data.list.length === 0) {
        forecastDiv.innerHTML = "Brak danych prognozy.";
        return;
    }

    let html = "";

    for (let i = 0; i < 4*8; i += 8) {
        const item = data.list[i];
        const dataCzas = item.dt_txt;
        const temp = item.main.temp;
        const opis = item.weather && item.weather[0] ? item.weather[0].description : "brak opisu";

        html += `
            <div class="forecast-item">
                <p><strong>${dataCzas}</strong></p>
                <p>Temperatura: ${temp.toFixed(1)} °C</p>
                <p>Opis: ${opis}</p>
            </div>
        `;
    }

    forecastDiv.innerHTML = html;
}

