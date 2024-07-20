let goldPrices = [];
let displayedItems = 15; // Define globally
const itemsPerLoad = 15; // Define globally
let latestFileName;

// Function for Date and time
function updateDateTime() {
    const now = new Date();
    const dateString = now.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    document.getElementById('lastUpdated').innerHTML = `<span style="font-size: 1.2em; font-weight: bold;">${dateString}</span>`;
}

// This function finds the latest json file from the repo
async function getLatestJsonFileName() {
    const repoUrl = 'https://api.github.com/repos/Technoresult/GoldPriceCalculator/contents/';
    try {
        const response = await fetch(repoUrl);
        const files = await response.json();
        const jsonFiles = files.filter(file => file.name.endsWith('.json'));
        jsonFiles.sort((a, b) => new Date(b.name) - new Date(a.name));
        return jsonFiles[0].name;
    } catch (error) {
        console.error('Error fetching latest file name:', error);
        return null;
    }
}

// Function to fetch prices from the JSON file
async function fetchPrices() {
    showLoadingSpinner();
    try {
        const response = await fetch(`https://raw.githubusercontent.com/Technoresult/GoldPriceCalculator/main/${latestFileName}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        const data = JSON.parse(text);
        if (!data.gold_prices || !Array.isArray(data.gold_prices)) {
            throw new Error('Invalid data structure');
        }
        goldPrices = data.gold_prices;
        clearPriceCards();
        populateCityDropdowns();
        createAveragePriceCards();
        populateGoldPricesTable();
    } catch (error) {
        console.error('Error fetching prices:', error);
        displayError('Failed to fetch prices: ' + error.message);
    } finally {
        hideLoadingSpinner();
    }
}

// Function to clear existing price cards
function clearPriceCards() {
    const priceCardsContainer = document.getElementById('priceCards');
    priceCardsContainer.innerHTML = '';
}

// Function to create average price cards
function createAveragePriceCards() {
    const priceCardsContainer = document.getElementById('priceCards');
    const avg24K = calculateAverage('24K Today');
    const avg22K = calculateAverage('22K Today');
    const avg18K = calculateAverage('18K Today');

    const dateElement = document.createElement('div');
    dateElement.id = 'dateTime';
    dateElement.className = 'text-xl font-semibold text-indigo-700 mb-4';

    priceCardsContainer.appendChild(dateElement);

    createPriceCard('24K', avg24K);
    createPriceCard('22K', avg22K);
    createPriceCard('18K', avg18K);
}

// Function to create individual price cards
function createPriceCard(carat, price) {
    const priceCardsContainer = document.getElementById('priceCards');

    const card = document.createElement('div');
    card.className = 'bg-white rounded-xl shadow-2xl p-8 text-center price-card mb-4 w-full md:w-1/3';

    const title = document.createElement('h3');
    title.className = 'text-2xl font-bold text-indigo-800 mb-4';
    title.textContent = `${carat}`;

    const priceElement = document.createElement('p');
    priceElement.className = 'text-xl text-gray-700';
    priceElement.textContent = `₹ ${price.toFixed(2)}`;

    card.appendChild(title);
    card.appendChild(priceElement);

    priceCardsContainer.appendChild(card);
}

// Function to calculate average price for a specific carat type
function calculateAverage(caratType) {
    if (!goldPrices.length) return 0;

    const sum = goldPrices.reduce((acc, price) => acc + parseIndianPrice(price[caratType]), 0);
    return sum / goldPrices.length;
}

// Function to parse Indian price format to number
function parseIndianPrice(priceString) {
    const numericString = priceString.replace(/[^\d.]/g, '');
    return parseFloat(numericString);
}

// Function to populate the city dropdowns
function populateCityDropdowns() {
    const citySelectCustom = document.getElementById('citySelectCustom');
    const citySelectPrices = document.getElementById('citySelectPrices');
    
    [citySelectCustom, citySelectPrices].forEach(select => {
        select.innerHTML = '<option value="">Select City</option>';
        goldPrices.forEach(price => {
            const option = document.createElement('option');
            option.value = price.City;
            option.textContent = price.City;
            select.appendChild(option);
        });
    });
}

// Function to populate the gold prices table
function populateGoldPricesTable() {
    const tableBody = document.querySelector('#goldPricesTable tbody');
    tableBody.innerHTML = ''; // Clear existing rows

    goldPrices.slice(0, displayedItems).forEach(price => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="py-3 px-4 border-b">${price.City}</td>
            <td class="py-3 px-4 border-b">${price['24K Today']}</td>
            <td class="py-3 px-4 border-b">${price['22K Today']}</td>
            <td class="py-3 px-4 border-b">${price['18K Today']}</td>
        `;
        tableBody.appendChild(row);
    });

    updateViewMoreButton();
}

// Function to update "View More" button visibility
function updateViewMoreButton() {
    const viewMoreBtn = document.getElementById('viewMoreBtn');
    if (displayedItems >= goldPrices.length) {
        viewMoreBtn.style.display = 'none';
    } else {
        viewMoreBtn.style.display = 'inline-block';
    }
}

// Function to update city-wise price card
function updateCityPriceCard(cityData) {
    const cityPriceCard = document.getElementById('cityPriceCard');
    if (!cityPriceCard) return;

    const price24K = cityPriceCard.querySelector('.price-24K');
    const price22K = cityPriceCard.querySelector('.price-22K');
    const price18K = cityPriceCard.querySelector('.price-18K');

    price24K.textContent = `24K: ${cityData['24K Today']}`;
    price22K.textContent = `22K: ${cityData['22K Today']}`;
    price18K.textContent = `18K: ${cityData['18K Today']}`;
}

// Function to calculate custom price
function calculateCustomPrice() {
    const city = document.getElementById('citySelectCustom').value;
    const carat = document.getElementById('caratSelect').value;
    const grams = parseFloat(document.getElementById('gramInput').value);

    if (!city || !carat || isNaN(grams)) {
        alert('Please fill in all fields correctly.');
        return;
    }

    const cityData = goldPrices.find(price => price.City === city);
    if (!cityData) {
        alert('City data not found.');
        return;
    }

    const pricePerGram = parseIndianPrice(cityData[`${carat}K Today`]);
    const totalPrice = pricePerGram * grams;

    document.getElementById('calculationResult').textContent = `Total Price: ₹ ${totalPrice.toFixed(2)}`;
}

function updateCityPrices(selectedCity) {
    const cityData = goldPrices.find(price => price.City === selectedCity);
    if (cityData) {
        updateCityPriceCard(cityData);
    }
}

// Function to show loading spinner
function showLoadingSpinner() {
    document.getElementById('loadingSpinner').classList.remove('hidden');
}

// Function to hide loading spinner
function hideLoadingSpinner() {
    document.getElementById('loadingSpinner').classList.add('hidden');
}

// Function to display error messages
function displayError(message) {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    setTimeout(() => {
        errorMessage.classList.add('hidden');
    }, 5000);
}

// New initialization function
async function initializeAndFetchPrices() {
    try {
        latestFileName = await getLatestJsonFileName();
        if (latestFileName) {
            await fetchPrices();
        } else {
            throw new Error('Could not retrieve the latest file name');
        }
    } catch (error) {
        console.error('Error initializing:', error);
        displayError('Failed to initialize: ' + error.message);
    }
}

// Event listeners
document.getElementById('viewMoreBtn').addEventListener('click', () => {
    displayedItems += itemsPerLoad;
    populateGoldPricesTable();
});

document.getElementById('citySelectCustom').addEventListener('change', (event) => {
    const selectedCity = event.target.value;
    document.getElementById('citySelectPrices').value = selectedCity;
    updateCityPrices(selectedCity);
});

document.getElementById('citySelectPrices').addEventListener('change', (event) => {
    const selectedCity = event.target.value;
    document.getElementById('citySelectCustom').value = selectedCity;
    updateCityPrices(selectedCity);
});

document.getElementById('refreshButton').addEventListener('click', initializeAndFetchPrices);
document.getElementById('calculateButton').addEventListener('click', calculateCustomPrice);

// Initial fetch on page load
initializeAndFetchPrices();
updateDateTime();
setInterval(updateDateTime, 1000); // Update date and time every second
