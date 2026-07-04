'use strict';
import { fetchData, url } from "./api.js";
import * as module from "./module.js";

/**
 * 
 * @param {NodeList} elements Elements node array
 * @param {String} eventType Event Type e.g: "click","mouseover"
 * @param {Function} callback callback function
 */


document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const lat = urlParams.get('lat');
    const lon = urlParams.get('lon');

    if (lat && lon) {
        updateWeather(lat, lon);
        windymap(lat, lon)
    } else {
        updateWeather(36.8002068, 10.1857757);
    }
});

const container = document.querySelector("[data-container]");
const loading = document.querySelector("[data-loading]");
const errorContent = document.querySelector("[data-error-content]");
let forecastChartInstance;

function updateWeather(lat, lon) {
    // Ensure elements exist before modifying them
    if (loading) loading.style.display = "grid";
    if (container) container.classList.remove("fade-in");
    if (errorContent) errorContent.style.display = "none";

    const currentWeatherSection = document.querySelector("[data-current-weather]");
    const highlightSection = document.querySelector("[data-highlights]");
    const hourlySection = document.querySelector("[data-hourly-forecast]");
    const forecastSection = document.querySelector("[data-5-day-forecast]");

    // Clear previous content
    if (currentWeatherSection) currentWeatherSection.innerHTML = "";
    if (highlightSection) highlightSection.innerHTML = "";
    if (hourlySection) hourlySection.innerHTML = "";
    if (forecastSection) forecastSection.innerHTML = "";

    // Fetch current weather
    fetchData(url.currentWeather(lat, lon), (currentWeather) => {
        console.log(currentWeather);
        const {
            weather,
            dt: dateUnix,
            sys: { sunrise: sunriseUnixUTC, sunset: sunsetUnixUTC },
            main: { main, temp, feels_like, pressure, humidity },
            visibility,
            timezone
        } = currentWeather;
        const [{ description, icon }] = weather;
        const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;

        const card = document.createElement("div");

        card.classList.add("card-lg", "current-weather-card");
        card.innerHTML = `
        <div class="container">
            <div class="row">
                <div class="col pt-5 px-5" style="margin-right:5.5em;margin-left:5.5em;box-shadow: 0 0 10px rgb(0 0 0 / 36%); background-color: var(--black-alpha-10)">
                    <h2 class="title-2 card-title color-dark">Current Weather</h2>
                    <div class="weapper">
                        <p class="heading-2 color-dark"">${parseInt(temp)}&deg;C</p>
                        <img src="${iconUrl} " width="70px" height="64px" alt="${description}" class="weather-icon">
                    </div>
                    <p class="body-3">${description}</p>

                    <ul class="meta-list">
                        <li class="meta-item">
                            <span class="title-3"><i class="fas fa-calendar"></i></span>
                            <p class="title-3 meta-text">${module.getDate(dateUnix, timezone)}</p>
                        </li>
                        <li class="meta-item">
                            <span class="title-3"><i class="fas fa-map-marker-alt"></i></span>
                            <p class="title-3 meta-text" data-location></p>
                        </li>
                    </ul>
                </div>
                <div class="col">
                    <div class="mapouter">
                        <div class="gmap_canvas">
                            <span gmap-canvas> </span>
                            
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;

        fetchData(url.reverseGeo(lat, lon), ([{ name, country }]) => {
            const locationElement = card.querySelector("[data-location]");
            const gmapCanvas = card.querySelector("[gmap-canvas]")
            if (locationElement) locationElement.innerHTML = `${name}, ${country}`;
            if (gmapCanvas) gmapCanvas.innerHTML = `<iframe allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://maps.google.com/maps?q=${name}&t=&z=13&ie=UTF8&iwloc=&output=embed" width="600" height="500" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" id="google-map" ></iframe>`
        });

        if (currentWeatherSection) currentWeatherSection.appendChild(card);

        // Fetch today's highlights (air quality, sunrise, sunset, etc.)
        fetchData(url.airPollution(lat, lon), (airPollution) => {
            const [{ main: { aqi }, components: { no2, o3, so2, pm2_5 } }] = airPollution.list;

            const highlightCard = document.createElement("div");
            highlightCard.classList.add("card-lg");
            highlightCard.innerHTML = `
            
                <div class="highlight-list">
                    <div class="card card-sm highlight-card one" style="box-shadow: 0 0 10px rgb(0 0 0 / 36%)">
                        <h3 class="title-3 color-dark">Air Quality Index</h3>
                        <div class="wrapper">
                            <span class="title-2"><i class="fas fa-wind"></i></span>
                            <ul class="card-list">
                                <li class="card-item">
                                    <p class="title-2">${pm2_5.toPrecision(3)}</p>
                                    <p class="label-2 p-0">PM<sub>2.5</sub></p>
                                </li>
                                <li class="card-item">
                                    <p class="title-2">${so2.toPrecision(3)}</p>
                                    <p class="label-2">SO<sub>2</sub></p>
                                </li>
                                <li class="card-item">
                                    <p class="title-2">${no2.toPrecision(3)}</p>
                                    <p class="label-2">No<sub>2</sub></p>
                                </li>
                                <li class="card-item">
                                    <p class="title-2">${o3.toPrecision(3)}</p>
                                    <p class="label-2">O<sub>3</sub></p>
                                </li>
                            </ul>
                        </div>
                        <span class="color-dark badge aqi-${aqi} lable-${aqi}" title="${module.aqiText[aqi].message}" style="padding:1em; background-color:#FFAD51">
                            ${module.aqiText[aqi].level}
                        </span> 
                    </div>
                    <div class="card card-sm highlight-card two" style="box-shadow: 0 0 10px rgb(0 0 0 / 36%)">
                        <h3 class="title-3 color-dark">Sunrise & Sunset</h3>
                        <div class="wrapper">
                            <div class="card-list">
                                <div class="card-item">
                                    <span class="title-2"><i class="fas fa-sun"></i></span>
                                    <div class="lable-1">
                                        <p class="lable-1">Sunrise</p>
                                        <p class="title-2">${module.getTime(sunriseUnixUTC, timezone)}</p>
                                    </div>
                                </div>
                                <div class="card-item">
                                    <span class="title-2"><i class="fas fa-moon"></i></span>
                                    <div class="lable-1">
                                        <p class="lable-1">Sunset</p>
                                        <p class="title-2">${module.getTime(sunsetUnixUTC, timezone)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                <div class="card card-sm highlight-card" style="box-shadow: 0 0 10px rgb(0 0 0 / 36%)">
                    <h3 class="title-3 color-dark">Humidity</h3>
                    <div class="wrapper">
                        <span class="title-2"><i class="fas fa-tint"></i></span>
                        <p class="title-2">${humidity}%</p>
                    </div>
                </div>
                <div class="card card-sm highlight-card" style="box-shadow: 0 0 10px rgb(0 0 0 / 36%)">
                    <h3 class="title-3 color-dark">Pressure</h3>
                    <div class="wrapper">
                        <span class="title-2"><i class="fas fa-compress-arrows-alt"></i></span>
                        <p class="title-2">${pressure} <sub>hba</sup></p>
                    </div>
                </div>
                <div class="card card-sm highlight-card" style="box-shadow: 0 0 10px rgb(0 0 0 / 36%)">
                    <h3 class="title-3 color-dark">Visibility</h3>
                    <div class="wrapper">
                        <span class="title-2"><i class="fas fa-eye"></i></span>
                        <p class="title-2">${visibility / 1000} <sub>KM</sub></p>
                    </div>
                </div>
                <div class="card card-sm highlight-card" style="box-shadow: 0 0 10px rgb(0 0 0 / 36%)">
                    <h3 class="title-3 color-dark">Feels Like</h3>
                    <div class="wrapper">
                        <span class="title-2"><i class="fas fa-thermometer-half"></i></span>
                        <p class="title-2">${parseInt(feels_like)}&deg;<sup>c</sup></p>
                    </div>
                </div>
            </div>
            `;

            if (highlightSection) highlightSection.appendChild(highlightCard);
        });

        // Fetch 24h forecast
        fetchData(url.forecast(lat, lon), (forecast) => {
            const { list: forecastList, city: { timezone } } = forecast;

            if (hourlySection) {
                hourlySection.innerHTML = `
                    <h2 class="title-2 color-dark">Today Highlights</h2>
                    <div class="slider-container" >
                        <ul class="slider-list" data-temp style="padding-left:0px;list-style-type: none;"></ul>
                        <ul class="slider-list" data-wind style="padding-left:0px;list-style-type: none;"></ul>
                    </div>
                `;
            }

            for (const [index, data] of forecastList.entries()) {
                if (index > 7) break;
                const {
                    dt: dateTimeUnix,
                    main: { temp },
                    weather,
                    wind: { deg: windDirection, speed: windSpeed }
                } = data;
                const [{ icon, description }] = weather;

                const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;
                const tempLi = document.createElement("li");
                tempLi.classList.add("slider-item");
                tempLi.innerHTML = `
                    <div class="card card-sm slider-card" style="background-color:var(--black-alpha-10)">
                        <p class="title-3">${module.getTime(dateTimeUnix, timezone)}</p>
                        <img src="${iconUrl}" width="70px" height="64px" loading="lazy" alt="${description}" class="weather-icon" title="${description}">
                        <p class="title-3">${temp}&deg;</p>
                    </div>
                `;
                if (hourlySection.querySelector("[data-temp]")) {
                    hourlySection.querySelector("[data-temp]").appendChild(tempLi);
                }

                const windLi = document.createElement("li");
                windLi.classList.add("slider-item");
                windLi.innerHTML = `
                    <div class="card card-sm slider-card" style="background-color:var(--black-alpha-10)">
                        <p class="title-3">${module.getTime(dateTimeUnix, timezone)}</p>
                        <img src="./assets/js/image/weather_icon/direction.png"width="70px" height="64px" loading="lazy" alt="" class="weather-icon" style="transform :rotate(${windDirection - 180}deg)">
                        <p class="title-3">${parseInt(module.mps_to_kmh(windSpeed))}Km/h</p>
                    </div>
                `;
                if (hourlySection.querySelector("[data-wind]")) {
                    hourlySection.querySelector("[data-wind]").appendChild(windLi);
                }

            }

            // Fetch 5-day forecast
            if (forecastSection) {
                forecastSection.innerHTML = `
                    <h2 class="title-2 color-dark" id="forecast-label">5 Days Forecast</h2>
                    <div class="card card-lg forecast-card" style="padding:40px 16px; background-color:var(--black-alpha-10)">
                        <ul data-forecast-list style="padding-left:0"></ul>
                    </div>
                `;
            }

            for (let i = 7, len = forecastList.length; i < len; i += 8) {
                const { main: { temp_max }, weather, dt_txt } = forecastList[i];
                const [{ icon, description }] = weather;
                const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;
                const date = new Date(dt_txt);
                const li = document.createElement("li");
                li.classList.add("card-item");
                li.innerHTML = `
                    <div class="icon-wrapper">
                        <img src="${iconUrl}" width="36" height="36" alt="${description}" class="weather-icon">
                        <span class="span">
                            <p class="tiltl-2">${parseInt(temp_max)}&deg;</p>
                        </span>
                    </div>
                    <p class="label-1">${date.getDate()} ${module.monthNames[date.getMonth()]}</p>
                    <p class="label-1 float-end">${module.weekDayNames[date.getUTCDay()]}</p>
                `;
                if (forecastSection.querySelector("[data-forecast-list]")) {
                    forecastSection.querySelector("[data-forecast-list]").appendChild(li);
                }
            }

            const temperatures24h = [];
            const timeIntervals = [];
            const temperatures7d = [];
            const days = [];
            
            // Construire les données pour les 24 heures
            for (const [index, data] of forecastList.entries()) {
                if (index >= 8) break; // Limiter aux 24 premières heures (1 jour, 3 heures par intervalle)
            
                const {
                    dt: dateTimeUnix,
                    main: { temp },
                } = data;
            
                temperatures24h.push(temp);
                timeIntervals.push(module.getTime(dateTimeUnix, timezone)); // Obtenir l'heure formatée
            }
            
            // Construire les données pour les 7 jours
            for (let i = 7, len = forecastList.length; i < len; i += 8) {
                const { main: { temp_max }, dt_txt } = forecastList[i]; // Extraire `temp_max` et `dt_txt`
                const date = new Date(dt_txt); // Créer un objet Date à partir de `dt_txt`
            
                temperatures7d.push(temp_max); // Ajouter la température max au tableau
                days.push(`${date.getDate()} ${module.monthNames[date.getMonth()]}`); // Formater le jour et le mois
            }
            
            // Créer un graphique combiné
            combinedForecastChart(temperatures24h, timeIntervals, temperatures7d, days);
            

            if (loading) loading.style.display = "none";
            if (container) container.classList.add("fade-in");
        });
    });
};

export const error404 = () => {
    if (errorContent) errorContent.style.display = "flex";
};

function windymap(latinitial, loninitial) {
    const options = {
        key: 'zrWWohVHYYvGxqxmBd16xOUftqkCfM90',
        lat: latinitial,
        lon: loninitial,
        zoom: 6,

        timestamp: Date.now() + 3 * 24 * 60 * 60 * 1000,

        hourFormat: '12h',

    };

    windyInit(options, windyAPI => {
        const { store } = windyAPI;
        // All the params are stored in windyAPI.store

        const levels = store.getAllowed('availLevels');

        let i = 0;
        setInterval(() => {
            i = i === levels.length - 1 ? 0 : i + 1;

            store.set('level', levels[i]);
        }, 500);


        store.on('level', level => {
            console.log(`Level was changed: ${level}`);
        });
    });

}



// Fonction combinée du graphique avec gestion de l’échelle dynamique
function combinedForecastChart(todayTemperatures, timeIntervals) {
    const combinedChart = document
        .getElementById("today-chart") // Utilisation de "today-chart" pour afficher le graphique combiné
        .getContext("2d");

    if (forecastChartInstance) {
        forecastChartInstance.destroy();
    }

    forecastChartInstance = new Chart(combinedChart, {
        type: "line", // Type de graphique (ligne)
        data: {
            labels: timeIntervals, // Combiner les étiquettes des deux graphiques
            datasets: [
                {
                    label: "Temperature (°C)", // Données des 24 heures
                    data: todayTemperatures,
                    borderColor: "#FFAD51",
                    backgroundColor: "rgba(190, 195, 48, 0.2)",
                    borderWidth: 2,
                    pointStyle: "circle",
                    pointRadius: 5,
                    tension: 0.4, 
                    hidden: false, 
                },
            ],
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true,
                    position: "top",
                },
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: "Time",
                    },
                },
                y: {
                    title: {
                        display: true,
                        text: "Temperature (°C)",
                    },
                    
                },
            },
        },
    });
}


