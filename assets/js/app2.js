'use strict';
import { fetchData, url } from "./api.js";
/**
 * 
 * @param {NodeList} elements Elemetns node array
 * @param {String} eventType Event Type e.g: "click","mouseover"
 * @param {Function} callback callback function
 */
const addEventOnElements = (elements, eventType, callback) => {
    for (const element of elements)
        element.addEventListener(eventType, callback);
}
const searchView = document.querySelector("[data-search-view]");
const searchTogglers = document.querySelectorAll("[data-search-toggler]");
const toggleSearch = () => {
    searchView.classList.toggle("active");
}
addEventOnElements(searchTogglers, "click", toggleSearch);

// search integration

const searchField = document.querySelector("[data-search-field]");
const searchResult = document.querySelector("[data-search-result]");

let searchTimeOut = null;
let searchTimeOutDuration = 500;

// Gestion de la recherche
searchField.addEventListener("input", () => {
    searchTimeOut ?? clearTimeout(searchTimeOut);
    if (!searchField.value) {
        searchResult.classList.remove("active");
        searchResult.innerHTML = "";
        searchField.classList.remove("searching");
    } else {
        searchField.classList.add("searching");
    }
    if (searchField.value) {
        clearTimeout(searchTimeOut);
        searchTimeOut = setTimeout(() => {
            fetchData(url.geo(searchField.value), (locations) => {
                searchField.classList.remove("searching");
                searchResult.classList.add("active");
                searchResult.innerHTML = `
                    <ul class="view-list" data-search-list></ul>
                `;
                const items = [];
                for (const { name, lat, lon, country, state } of locations) {
                    const searchItem = document.createElement("li");
                    searchItem.classList.add("view-item");
                    searchItem.innerHTML = `
                        <span class="m-icon">location_on</span>
                        <div>
                            <p class="item-title">${name}</p>
                            <p class="label-2 item-subtitle">${state || ""} ${country}</p>
                        </div>
                        <a href="/accueil.html?lat=${lat}&lon=${lon}" class="item-link has-state" aria-label="${name} weather" data-search-toggler></a>
                    `;
                    searchResult.querySelector("[data-search-list]").appendChild(searchItem);
                    const link = searchItem.querySelector("[data-search-toggler]");

                    // Stocke dans localStorage lorsque l'item est cliqué
                    link.addEventListener("click", (event) => {
                        event.preventDefault();
                        const newItem = { name, lat, lon, country };

                        if (!dataQueue.some(item => item.name === newItem.name && item.lat === newItem.lat && item.lon === newItem.lon)) {
                            dataQueue.push(newItem);
                            updateDisplayAndStorage();
                        }

                        window.location.href = link.href;
                    });

                    items.push(link);
                }
            });
        }, searchTimeOutDuration);
    }
});


//événement global pour détecter les clics extérieurs
document.addEventListener("click", (event) => {
    if (
        !searchField.contains(event.target) &&
        !searchResult.contains(event.target)
    ) {
        searchResult.classList.remove("active");
        searchResult.innerHTML = "";
        searchField.classList.remove("searching");
    }
});

// Sélectionner les éléments nécessaires
const locationButton = document.querySelector('.location-button');
const inputField = document.querySelector('.form-control');

// Fonction pour gérer la géolocalisation
function getCurrentLocation() {
    if (navigator.geolocation) {

        navigator.geolocation.getCurrentPosition(
            (position) => {

                const latitude = 35.8288175;
                const longitude = 10.6405392;


                const redirectUrl = `accueil.html?lat=${latitude}&lon=${longitude}`;
                window.location.href = redirectUrl;
            },
            (error) => {
                console.error("Erreur lors de la récupération de la localisation :", error.message);
                alert("Impossible d'accéder à votre localisation. Veuillez vérifier vos paramètres.");
            }
        );
    } else {
        alert("La géolocalisation n'est pas supportée par votre navigateur.");
    }
}
locationButton.addEventListener('click', (e) => {
    e.preventDefault(); 
    getCurrentLocation();
});


///---------------------------------*****************************--------------------------------///
// Initialisation de la file de données depuis localStorage
const dataQueue = JSON.parse(localStorage.getItem('dataQueue')) || [];

// Sélection des éléments nécessaires
const clearButton = document.getElementById('clearButton');
const historyCanvas = document.getElementById('historyCanvas');
const historyList = document.getElementById('historyList');

// Fonction pour mettre à jour l'affichage et stocker dans localStorage
const updateDisplayAndStorage = () => {
    localStorage.setItem('dataQueue', JSON.stringify(dataQueue));
    updateHistoryList();
};

// Fonction pour mettre à jour la liste historique
const updateHistoryList = () => {
    historyList.innerHTML = '';
    if (dataQueue.length === 0) {
        historyCanvas.classList.add('d-none'); 
        return;
    }
    dataQueue.forEach((item) => {
        const listItem = document.createElement('li');
        listItem.textContent = item.name; 

        listItem.addEventListener('click', () => {
            window.location.href = `/accueil.html?lat=${item.lat}&lon=${item.lon}`;
        });

        historyList.appendChild(listItem);
    });
};

// Initialisation de l'affichage
updateDisplayAndStorage();

// Cacher le canvas de l'historique au chargement si vide
if (dataQueue.length === 0) {
    historyCanvas.classList.add('d-none');
}

// Ajoute un événement pour détecter la touche Entrée dans le champ de texte
inputField.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        const userInput = inputField.value.trim();
        if (userInput) {
            const urlParams = new URLSearchParams(window.location.search);
            const lat = urlParams.get('lat');
            const lon = urlParams.get('lon');

            if (lat && lon) {
                const newItem = { name: userInput, lat, lon };

                if (!dataQueue.some(item => item.name === newItem.name && item.lat === newItem.lat && item.lon === newItem.lon)) {
                    dataQueue.push(newItem);
                    updateDisplayAndStorage();
                }
            } else {
                alert('Latitude et longitude non trouvées dans l’URL.');
            }

            inputField.value = '';
        } else {
            alert('Veuillez entrer une valeur.');
        }
        historyCanvas.classList.add('d-none'); // Cache le canvas
    }
});

// Affiche le canvas contenant l'historique lorsque l'input est cliqué
inputField.addEventListener('click', () => {
    if (dataQueue.length > 0) {
        historyCanvas.classList.remove('d-none');
    }
});

// Cache le canvas lorsque l'utilisateur clique à l'extérieur ou commence à écrire
document.addEventListener('click', (event) => {
    if (!historyCanvas.contains(event.target) && event.target !== inputField) {
        historyCanvas.classList.add('d-none');
    }
});

inputField.addEventListener('input', () => {
    historyCanvas.classList.add('d-none');
});

// Ajoute un événement pour supprimer toutes les données
clearButton.addEventListener('click', () => {
    dataQueue.length = 0; 
    updateDisplayAndStorage(); 
});

// Gestion du bouton de géolocalisation
locationButton.addEventListener('click', (e) => {
    e.preventDefault(); 
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;
                const redirectUrl = `accueil.html?lat=${latitude}&lon=${longitude}`;
                window.location.href = redirectUrl;
            },
            (error) => {
                console.error("Erreur lors de la récupération de la localisation :", error.message);
                alert("Impossible d'accéder à votre localisation. Veuillez vérifier vos paramètres.");
            }
        );
    } else {
        alert("La géolocalisation n'est pas supportée par votre navigateur.");
    }
});