'use strict';


import { fetchData, url } from "./api.js";
let date1 = new Date();

let dateperso = date1.toLocaleString('Tunis', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
});

document.getElementById('p2').innerHTML = dateperso;

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const lat = urlParams.get('lat');
    const lon = urlParams.get('lon');

    if (lat && lon) {
        weatherByCoordinates(lat, lon);
    } else {
        weather("Tunis");
    }
    getWorldWeather();

    // Exemple d'utilisation avec le bouton
    document.getElementById('detailButton').addEventListener('click', function (e) {
        e.preventDefault(); 

        redirectToPageWithParams('map.html', {lat,lon});
    });
});

function redirectToPageWithParams(page, params) {
    // Construire l'URL avec les paramètres
    const urlParams = new URLSearchParams(params).toString();
    const url = `${page}?${urlParams}`;

    // Rediriger l'utilisateur vers l'URL
    window.location.href = url;
}

function weatherByCoordinates(lat, lon) {
    const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=8d198fb39cc17880e0fe676d046f90c1`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=8d198fb39cc17880e0fe676d046f90c1`;
    const reverseGeoUrl = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=5&appid=8d198fb39cc17880e0fe676d046f90c1`;

    fetch(reverseGeoUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error fetching location data: ${response.statusText} (Code: ${response.status})`);
            }
            return response.json();
        })
        .then(locationData => {
            const Name = locationData[0]?.name || "Unknown Location";
            const Country = locationData[0]?.country || "Unknown Country";
            updateCityName(Name, Country);
        })
        .catch(error => {
            console.error('Error:', error);
            alert(`Location Error: ${error.message}`);
        });

    fetch(currentWeatherUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error fetching weather data: ${response.statusText} (Code: ${response.status})`);
            }
            return response.json();
        })
        .then(data => displayWeather(data))
        .catch(error => {
            console.error('Error:', error);
            alert(`Current Weather Error: ${error.message}`);
        });

    fetch(forecastUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error fetching forecast data: ${response.statusText} (Code: ${response.status})`);
            }
            return response.json();
        })
        .then(data => displayHourlyForecast(data.list))
        .catch(error => {
            console.error('Error:', error);
            alert(`Forecast Error: ${error.message}`);
        });
}

function weather(city) {
    const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=8d198fb39cc17880e0fe676d046f90c1`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=8d198fb39cc17880e0fe676d046f90c1`;

    fetch(currentWeatherUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error fetching weather data: ${response.statusText} (Code: ${response.status})`);
            }
            return response.json();
        })
        .then(data => displayWeather(data))
        .catch(error => {
            console.error('Error:', error);
            alert(`Current Weather Error: ${error.message}`);
        });

    fetch(forecastUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error fetching forecast data: ${response.statusText} (Code: ${response.status})`);
            }
            return response.json();
        })
        .then(data => displayHourlyForecast(data.list))
        .catch(error => {
            console.error('Error:', error);
            alert(`Forecast Error: ${error.message}`);
        });
}

function displayWeather(data) {
    const tempDivInfo = document.getElementById('temp-div');
    const weatherInfoDiv = document.getElementById('weather-info');
    const cityname = document.getElementById('city-name');
    const wind_hum = document.getElementById('wind-hum');
    const weatherIcon = document.getElementById('weather-icon');
    const hourlyForecastDiv = document.getElementById('hourly-forecast');

    // Clear previous content
    weatherInfoDiv.innerHTML = '';
    hourlyForecastDiv.innerHTML = '';
    tempDivInfo.innerHTML = '';

    if (data.cod === '404') {
        weatherInfoDiv.innerHTML = `<p>${data.message}</p>`;
    } else {
        const cityName = data.name;
        const temperature = Math.round(data.main.temp - 273.15); // Convert to Celsius
        const description = data.weather[0].description;
        const iconCode = data.weather[0].icon;
        const Wind = (data.wind.speed * 3.6).toFixed(1);
        const Humidity = data.main.humidity;
        const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;

        const temperatureHTML = `
            <h2 class="fw-6 fs-95 lh-120 color-dark m-0">${temperature}<b>°</h2>
        `;

        const weatherHtml = `
            <p class="fw-6 mb-32 color-dark">${description}</p>
        `;

        const windhumHTML = `
            <div class="d-flex align-items-center justify-content-center mb-24">
                                        <span class="color-dark text-end">${Wind} km/h</span>
                                        <span class="color-dark text-start">Wind</span>
                                    </div>
                                    <div class="d-flex align-items-center justify-content-center">
                                        <span class="color-dark text-end">Hum</span>
                                        <span class="color-dark text-start">${Humidity} %</span>
                                    </div>
        `;

        wind_hum.innerHTML = windhumHTML;
        tempDivInfo.innerHTML = temperatureHTML;
        weatherInfoDiv.innerHTML = weatherHtml;
        weatherIcon.src = iconUrl;
        weatherIcon.alt = description;

        showImage();
    }
}

function updateCityName(Name, Country) {
    const cityname = document.getElementById('city-name');
    if (cityname) {
        const citynameHTML = `
            <h4 class="fw-6 color-dark m-0">${Name}, ${Country}</h4>
        `;
        cityname.innerHTML = citynameHTML;
    }
}

function displayHourlyForecast(hourlyData) {
    const hourlyForecastDiv = document.getElementById('hourly-forecast');

    hourlyForecastDiv.innerHTML = '';

    const next8Hours = hourlyData.slice(0, 8);

    next8Hours.forEach(item => {
        const dateTime = new Date(item.dt * 1000);
        let hour = dateTime.getHours();
        const temperature = Math.round(item.main.temp - 273.15);
        const iconCode = item.weather[0].icon;
        const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
        const description = item.weather[0].main;
        const humidity = item.main.humidity;
        const windSpeed = (item.wind.speed * 3.6).toFixed(1);


        const formattedHour = hour < 10 ? `0${hour}` : hour;

        // Create HTML for each hourly forecast
        const hourlyItemHtml = `
            <div class="slider-block">
                <div class="content text-center">
                    <img src="${iconUrl}" alt="${description}" class="mb-8" style="width: 40px; height: 40px;">
                    <p class="fs-28 fw-4 mb-1">${temperature}°</p>
                    <h2 class="fw-5 fs-19 mb-0">${description}</h2>
                    <div class="line"></div>
                    <div class="d-flex justify-content-center align-items-center mb-1">
                        <div class="weather-detail left-line">
                            <i class="fas fa-tint"></i>
                            <p class="fs-16 fw-4 lh-160 m-0">${humidity}%</p>
                        </div>
                        <div class="weather-detail">
                            <i class="fal fa-wind fa-flip-vertical"></i>
                            <p class="fs-16 fw-4 lh-160 m-0">${windSpeed} km/h</p>
                        </div>
                    </div>
                    <h2 class="fw-4 fs-19 m-0">${hour}:00 </h2>
                </div>
            </div>
        `;

        // Append the hourly forecast to the hourly forecast section
        hourlyForecastDiv.innerHTML += hourlyItemHtml;
    });

    // Reinitialize the slick slider after adding new content
    $('.hourly-slider').slick('unslick');
    $('.hourly-slider').slick({
        infinite: true,
        slidesToShow: 6,
        slidesToScroll: 1,
        responsive: [
            {
                breakpoint: 768,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1
                }
            }
        ]
    });
}

function showImage() {
    const weatherIcon = document.getElementById('weather-icon');
    weatherIcon.style.display = 'block'; // Make the image visible once it's loaded
}


///---------------------------------****************************************--------------------------------///

function getWorldWeather() {
    const countries = [
        {
            name: "Portugal",
            image: "./assets/js/image/Portugal.jpg",
            flag: "https://upload.wikimedia.org/wikipedia/commons/c/ce/Flag_of_Tunisia.svg"
        },
        {
            name: "Espagne",
            image: "./assets/js/image/spain.jpg",
            flag: "https://upload.wikimedia.org/wikipedia/en/a/a4/Flag_of_the_United_States.svg"
        },
        {
            name: "France",
            image: "./assets/js/image/france.jpg",
            flag: "https://upload.wikimedia.org/wikipedia/en/c/c3/Flag_of_France.svg"
        },
        {
            name: "Japan",
            image: "./assets/js/image/japan.jpg",
            flag: "https://upload.wikimedia.org/wikipedia/en/9/9e/Flag_of_Japan.svg"
        },
        {
            name: "Germany",
            image: "./assets/js/image/germany.jpg",
            flag: "https://upload.wikimedia.org/wikipedia/en/b/ba/Flag_of_Germany.svg"
        },
        {
            name: "Russia",
            image: "./assets/js/image/Russia.jpg",
            flag: "https://upload.wikimedia.org/wikipedia/en/a/ae/Flag_of_the_United_Kingdom.svg"
        },
        {
            name: "USA",
            image: "./assets/js/image/USA.jpg",
            flag: "https://upload.wikimedia.org/wikipedia/en/4/41/Flag_of_India.svg"
        },
        {
            name: "Canada",
            image: "./assets/js/image/canada.jpg",
            flag: "https://upload.wikimedia.org/wikipedia/commons/c/cf/Flag_of_Canada.svg"
        },
        {
            name: "Australia",
            image: "./assets/js/image/australia.jpg",
            flag: "https://upload.wikimedia.org/wikipedia/en/b/b9/Flag_of_Australia.svg"
        },
        {
            name: "Italy",
            image: "./assets/js/image/italy.jpg",
            flag: "https://upload.wikimedia.org/wikipedia/en/0/03/Flag_of_Italy.svg"
        },
        {
            name: "Argentine",
            image: "./assets/js/image/argentine.jpg",
            flag: "https://upload.wikimedia.org/wikipedia/en/0/05/Flag_of_Brazil.svg"
        },
        {
            name: "Dubai",
            image: "./assets/js/image/Dubai.jpg",
            flag: "https://upload.wikimedia.org/wikipedia/en/0/05/Flag_of_Brazil.svg"
        },
        {
            name: "Greece",
            image: "./assets/js/image/Greece.jpg",
            flag: "https://upload.wikimedia.org/wikipedia/en/0/05/Flag_of_Brazil.svg"
        },

    ];

    // Select 5 random unique countries
    const selectedCountries = [];
    while (selectedCountries.length < 5) {
        const randomIndex = Math.floor(Math.random() * countries.length);
        const country = countries[randomIndex];
        if (!selectedCountries.includes(country)) {
            selectedCountries.push(country);
        }
    }


    selectedCountries.forEach(country => fetchWeatherData(country));
}

function fetchWeatherData(country) {
    const apiKey = '8d198fb39cc17880e0fe676d046f90c1';
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${country.name}&appid=${apiKey}`;

    fetch(weatherUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error fetching weather data: ${response.statusText} (Code: ${response.status})`);
            }
            return response.json();
        })
        .then(data => displayWorldWeather(data, country))
        .catch(error => {
            console.error('Error:', error);
            alert(`Weather Error for ${country.name}: ${error.message}`);
        });
}

function displayWorldWeather(data, country) {
    const worldForecastDiv = document.getElementById("world-forecast");
    worldForecastDiv.innerHTML = ''; // Clear the forecast container

    const cityImage = country.image;
    const cityName = data.name; 
    const iconCode = data.weather[0].icon; 
    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    const temperature = Math.round(data.main.temp - 273.15);
    const description = data.weather[0].main; 

    // HTML structure for displaying weather
    const worldItemHtml = `
         <div class="slider-block" style="background-image: url('${cityImage}');">
                        <a href="map.html" class="content">
                            <img src="${iconUrl}" alt="${description}" class="mb-8" style="width: 130px; height: 130px;">
                            <p class="">${temperature}°</p>
                            <h4>(${description})</h4>
                            <h2>${cityName}</h2>
                        </a>
                    </div>
    `;

    worldForecastDiv.innerHTML += worldItemHtml; 

    // Reinitialize the slider after content update
    $('.recent-slider').slick('unslick');
    $('.recent-slider').slick({
        infinite: true,
        centerMode: true,
        arrows: true,
        centerPadding: '0px',
        slidesToShow: 4,
        responsive: [
            {
                breakpoint: 768,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1
                }
            }
        ]
    });
}

