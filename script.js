let goldPrices = [];

// Function for Date and time
function updateDateTime() {
    const now = new Date();
    const dateTimeString = now.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
    document.getElementById('dateTime').textContent = dateTimeString;
}

// Function to fetch prices from the JSON file
async function fetchPrices() {
    showLoadingSpinner();
    try {
        const response = await fetch('https://raw.githubusercontent.com/Technoresult/GoldPriceCalculator/main/Goldrates.json');
        const data = await response.json();
        goldPrices = data.gold_prices;
        clearPriceCards();
        populateCityDropdown();
        createAveragePriceCard();
        hideLoadingSpinner();
    } catch (error) {
        console.error('Error fetching prices:', error);
        displayError('Failed to fetch prices: ' + error.message);
        hideLoadingSpinner();
    }
}

// Function to clear existing price cards
function clearPriceCards() {
    const priceCardsContainer = document.getElementById('priceCards');
    priceCardsContainer.innerHTML = ''; 
}

// Function to create average price card
function createAveragePriceCard() {
    const priceCardsContainer = document.getElementById('priceCards');
    const avg24K = calculateAverage('24K Today');
    const avg22K = calculateAverage('22K Today');
    const avg18K = calculateAverage('18K Today');

    const card = document.createElement('div');
    card.className = 'bg-white rounded-xl shadow-2xl p-8 text-center price-card';

    const title = document.createElement('h2');
    title.className = 'text-2xl font-bold text-indigo-800 mb-4';
    title.textContent = 'Gold Price in India';

    const dateElement = document.createElement('div');
    dateElement.id = 'dateTime';
    dateElement.className = 'text-xl font-semibold text-indigo-700 mb-4';

    const price24K = document.createElement('p');
    price24K.className = 'text-xl text-gray-700';
    price24K.textContent = `24K: ₹ ${avg24K.toFixed(2)}`;

    const price22K = document.createElement('p');
    price22K.className = 'text-xl text-gray-700';
    price22K.textContent = `22K: ₹ ${avg22K.toFixed(2)}`;

    const price18K = document.createElement('p');
    price18K.className = 'text-xl text-gray-700';
    price18K.textContent = `18K: ₹ ${avg18K.toFixed(2)}`;

    card.appendChild(title);
    card.appendChild(dateElement);
    card.appendChild(price24K);
    card.appendChild(price22K);
    card.appendChild(price18K);

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

// Function to populate the city dropdown
function populateCityDropdown() {
    const citySelect = document.getElementById('citySelect');
    citySelect.innerHTML = '<option value="">Select City</option>';

    goldPrices.forEach(price => {
        const option = document.createElement('option');
        option.value = price.City;
        option.textContent = price.City;
        citySelect.appendChild(option);
    });
}

// Function to update city-wise price card
function updateCityPriceCard(cityData) {
    const cityPriceCard = document.getElementById('cityPriceCard');
    if (!cityPriceCard) return;

    const price24K = cityPriceCard.querySelector('.price-24K');
    const price22K = cityPriceCard.querySelector('.price-22K');
    const price18K = cityPriceCard.querySelector('.price-18K');

    price24K.textContent = `24K: ₹ ${cityData['24K Today'].replace('₹ ', '')}`;
    price22K.textContent = `22K: ₹ ${cityData['22K Today'].replace('₹ ', '')}`;
    price18K.textContent = `18K: ₹ ${cityData['18K Today'].replace('₹ ', '')}`;
}

// Function to create city-wise price card
function createCityPriceCard() {
    const cityPriceCard = document.createElement('div');
    cityPriceCard.id = 'cityPriceCard';
    cityPriceCard.className = 'bg-white rounded-xl shadow-2xl p-8 text-center price-card lg:w-1/3';

    const title = document.createElement('h2');
    title.className = 'text-2xl font-bold text-indigo-800 mb-4';
    title.textContent = 'City-wise Gold Prices';

    const price24K = document.createElement('p');
    price24K.className = 'text-xl text-gray-700 price-24K';
    price24K.textContent = `24K: ₹ 0`;

    const price22K = document.createElement('p');
    price22K.className = 'text-xl text-gray-700 price-22K';
    price22K.textContent = `22K: ₹ 0`;

    const price18K = document.createElement('p');
    price18K.className = 'text-xl text-gray-700 price-18K';
    price18K.textContent = `18K: ₹ 0`;

    cityPriceCard.appendChild(title);
    cityPriceCard.appendChild(price24K);
    cityPriceCard.appendChild(price22K);
    cityPriceCard.appendChild(price18K);

    document.querySelector('main').appendChild(cityPriceCard);
}

// Event listener for the city select dropdown
document.getElementById('citySelect').addEventListener('change', (event) => {
    const selectedCity = event.target.value;
    const cityData = goldPrices.find(price => price.City === selectedCity);

    if (cityData) {
        updateCityPriceCard(cityData);
    }
});

// Event listener for the calculate button
document.getElementById('calculateButton').addEventListener('click', () => {
    const caratSelect = document.getElementById('caratSelect');
    const gramInput = document.getElementById('gramInput');
    const resultDiv = document.getElementById('calculationResult');

    const selectedCarat = caratSelect.value;
    const grams = parseFloat(gramInput.value);

    if (isNaN(grams) || grams <= 0) {
        resultDiv.textContent = 'Please enter a valid number of grams.';
        return;
    }

    const price = calculateCustomPrice(selectedCarat, grams);
    if (price) {
        resultDiv.textContent = `Price for ${grams} grams of ${selectedCarat}K gold: ₹ ${price}`;
    } else {
        resultDiv.textContent = 'Unable to calculate. Please select a city.';
    }
});

// Function to calculate custom gram price
function calculateCustomPrice(carat, grams) {
    const selectedCity = document.getElementById('citySelect').value;
    const cityData = goldPrices.find(price => price.City === selectedCity);
    if (cityData) {
        const pricePerGram = parseIndianPrice(cityData[`${carat}K Today`]);
        const totalPrice = pricePerGram * grams;
        return totalPrice.toFixed(2);
    }
    return null;
}

// Function to display error messages
function displayError(message) {
    const errorMessageElement = document.getElementById('errorMessage');
    errorMessageElement.textContent = message;
    errorMessageElement.classList.remove('hidden');
}

// Function to show loading spinner
function showLoadingSpinner() {
    document.getElementById('loadingSpinner').classList.remove('hidden');
}

// Function to hide loading spinner
function hideLoadingSpinner() {
    document.getElementById('loadingSpinner').classList.add('hidden');
}

// Event listener for the refresh button
document.getElementById('refreshButton').addEventListener('click', fetchPrices);

// Initial setup
document.addEventListener('DOMContentLoaded', () => {
    fetchPrices();
    setInterval(updateDateTime, 1000);
    createCityPriceCard();
    document.getElementById('GoldPriceCalculator').onclick = function() {
        window.location.href = 'index.html';
    }
});
