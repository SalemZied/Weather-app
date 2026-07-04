
'use strict';

import { fetchData, url } from './api.js';

const search = document.querySelector('.search');
const searchButton = document.querySelector('.button');
const cityName = document.querySelector('.city-name');
const dateTime = document.querySelector('.date-time');
const weatherInfo = document.querySelector('.weather-info');
const suggestionBox = document.querySelector('.suggestion-box');
const weatherIcon = document.querySelector('.weather-logo');
const infoContainer = document.querySelector('.info-container');
const historyContainer = document.querySelector('.history');
const loader = document.querySelector('.loader');
const clearHistory = document.querySelector('.clear-history');
const heading = document.querySelector('.heading-54');

class App {
    #map;
    #zoomLevel = 13;
    #pastSearches = [];
    #markers = [];

    constructor() {
        this._loadMap();
        searchButton.addEventListener('click', this._getSuggestion.bind(this));
        historyContainer.addEventListener('click', this._pastClickEvent.bind(this));
        this._getLocalStorage();
        clearHistory.addEventListener('click', this._clearHistory.bind(this));
        search.addEventListener('click', this._inputAnimation.bind(this));
        heading.addEventListener('click', () => location.reload());
    }

    async _loadMap() {
        try {
            this.#map = L.map('map').setView([23.185884, 79.974380], this.#zoomLevel);

            L.tileLayer('https://{s}.google.com/vt?lyrs=m&x={x}&y={y}&z={z}', {
                maxZoom: 20,
                subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
            }).addTo(this.#map);

            this.#map.on('click', this._mapClickEvent.bind(this));
        } catch (error) {
            alert('Try Reloading the page');
        }
    }

    _setView(latitude, longitude, zoom = 8) {
        this.#map.setView([latitude, longitude], zoom, {
            animate: true,
            pan: { duration: 0.5 }
        });
    }

    _setMarker(latitude, longitude, city) {
        if (this._isMarkerExists(city)) return;

        this._setView(latitude, longitude);
        const marker = L.marker([latitude, longitude], {
            autoClose: false,
            closeOnClick: false
        })
            .addTo(this.#map)
            .bindPopup(`${city}`, { autoClose: false, closeOnClick: false })
            .openPopup();

        this.#markers.push({ marker, city });
        this._setlocalStorage();
    }

    _isMarkerExists(city) {
        return this.#markers.some(({ marker }) => marker.getPopup().getContent() === city);
    }

    async _mapClickEvent(e) {
        const { lat, lng } = e.latlng;

        try {
            const weatherURL = url.currentWeather(lat, lng);
            fetchData(weatherURL, (weatherData) => {
                this.#updateInfo(weatherData);
            });
        } catch (error) {
            console.log('Error fetching data for clicked map location:', error);
        }
    }

    async _getSuggestion() {
        const input = search.value.trim();
        if (!input) {
            suggestionBox.innerHTML = '';
            return;
        }

        try {
            loader.style.display = 'block';
            suggestionBox.style.display = 'none';

            const geoURL = url.geo(input);
            fetchData(geoURL, (cities) => {
                loader.style.display = 'none';
                suggestionBox.innerHTML = '';
                this.#addSuggestionHTML(cities);
                suggestionBox.style.display = 'block';
            });
        } catch (error) {
            console.log('Error fetching city suggestions:', error);
            loader.style.display = 'none';
        }
    }

    async _suggestionEvent(e) {
        e.preventDefault();
        const { lat, lon } = e.target.dataset;

        try {
            const weatherURL = url.currentWeather(lat, lon);
            fetchData(weatherURL, (weatherData) => {
                this.#updateInfo(weatherData);
                suggestionBox.style.display = 'none';
            });
        } catch (error) {
            console.log('Error processing suggestion event:', error);
        }
    }

    #updateInfo(weatherData) {
        const { name, coord, main, weather } = weatherData;

        this._setMarker(coord.lat, coord.lon, name);
        infoContainer.style.display = 'block';

        cityName.textContent = name;
        weatherInfo.textContent = `${main.temp}°C`;
        weatherIcon.src = `https://openweathermap.org/img/wn/${weather[0].icon}@2x.png`;
        dateTime.textContent = new Date().toLocaleString();

        const currentInfo = {
            name,
            temp: main.temp,
            coords: { lat: coord.lat, lon: coord.lon },
            icon: weather[0].icon,
            status: weather[0].description,
            dateTime: new Date().toLocaleString()
        };

        if (!this.#pastSearches.some((entry) => entry.name === name)) {
            this.#pastSearches.push(currentInfo);
            this._updateHistory();
        }
        this._setlocalStorage();
    }

    #addSuggestionHTML(cities) {
        cities.forEach((city) => {
            const suggestion = document.createElement('li');
            const cityName = city.name || city.display_name; // Nom de la ville
            const countryName = city.country || 'Unknown';  // Nom du pays (par défaut à "Unknown" si non disponible)

            // Affichage du nom de la ville et du pays
            suggestion.textContent = `${cityName}, ${countryName}`;
            suggestion.dataset.lat = city.lat;
            suggestion.dataset.lon = city.lon;
            suggestion.addEventListener('click', this._suggestionEvent.bind(this));
            suggestionBox.insertAdjacentElement('afterbegin', suggestion);
        });
    }

    _updateHistory() {
        if (this.#pastSearches.length === 0) return;
        historyContainer.innerHTML = '';
        let curr = 1;
        this.#pastSearches.forEach((data) => {
            const html = `<li class="city-container" data-id=${curr++}>
          <div class="past-city-name-image-container">
            <p class="past-city-name">${data.name}</p>
            <div class="past-city-image-status-container">
              <img src="https://openweathermap.org/img/wn/${data.icon}@2x.png">
              <p class="past-status">${data.status}</p>
            </div>
          </div>
          <div class="past-weather-data-time-container">
            <p class="past-weather-data">${data.temp}&deg;C</p>
            <p class="past-time">${data.dateTime}</p>
            <a href="/map.html?lat=${data.coords.lat}&lon=${data.coords.lon}" class="past-time">more detail</a>
          </div>
        </li>`;
            historyContainer.insertAdjacentHTML('afterbegin', html);
        });
    }

    _pastClickEvent(e) {
        const clicked = e.target.closest('.city-container');
        if (!clicked) return;
        const { lat, lon } = this.#pastSearches[clicked.dataset.id - 1].coords;
        this._setView(lat, lon);
    }

    async _clearHistory() {
        this.#pastSearches = [];
        this._updateHistory();
        this.#clearMarkers();
        this._setlocalStorage();
        historyContainer.innerHTML = '';
    }

    #clearMarkers() {
        this.#markers.forEach(({ marker }) => this.#map.removeLayer(marker));
        this.#markers = [];
    }

    async _inputAnimation() {
        search.classList.add('search-animation');
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    _setlocalStorage() {
        localStorage.setItem('history', JSON.stringify(this.#pastSearches));
        localStorage.setItem('markers', JSON.stringify(this.#markers.map(({ marker, city }) => ({
            latitude: marker.getLatLng().lat,
            longitude: marker.getLatLng().lng,
            city
        }))));
    }

    _getLocalStorage() {
        const data = JSON.parse(localStorage.getItem('history'));
        const markersData = JSON.parse(localStorage.getItem('markers'));
        if (data) {
            this.#pastSearches = data;
            this._updateHistory();
        }
        if (markersData) {
            markersData.forEach(({ latitude, longitude, city }) => {
                this._setMarker(latitude, longitude, city);
            });
        }
    }
}

const weatherApp = new App();