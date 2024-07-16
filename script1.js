let goldPrices = [];

// Function to fetch prices from the JSON file
async function fetchPrices() {
    showLoadingSpinner();
    try {
        const response = await fetch('https://raw.githubusercontent.com/Technoresult/GoldPriceCalculator/main/Goldrates.json');
        const data = await response.json();
        console.log('Fetched data:', data);
        
        goldPrices = data.gold_prices; // Ensure correct property access
        console.log('Processed gold prices:', goldPrices);
        
        clearPriceCards(); // Clear existing price cards
        populateCityDropdown(); // Populate the dropdown after fetching data
        calculateAveragePrice(); // Calculate averages after fetching data
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
    priceCardsContainer.innerHTML = ''; // Clear existing cards
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

// Function to calculate average price for India
function calculateAveragePrice() {
    if (goldPrices.length === 0) {
        console.error('No gold prices data available');
        return;
    }
    
    const sum24K = goldPrices.reduce((sum, price) => sum + parseIndianPrice(price['24K Today']), 0);
    const sum22K = goldPrices.reduce((sum, price) => sum + parseIndianPrice(price['22K Today']), 0);
    const sum18K = goldPrices.reduce((sum, price) => sum + parseIndianPrice(price['18K Today']), 0);
    const count = goldPrices.length;
    
    console.log('Sums and count:', { sum24K, sum22K, sum18K, count });
    
    const avg24K = sum24K / count;
    const avg22K = sum22K / count;
    const avg18K = sum18K / count;
    
    console.log('Calculated averages:', { avg24K, avg22K, avg18K });
    
    clearAveragePriceCard(); // Clear existing average price card
    createAveragePriceCard(avg24K, avg22K, avg18K); // Create new average price card
}

// Function to clear existing average price card
function clearAveragePriceCard() {
    const existingAverageCard = document.getElementById('averagePriceCard');
    if (existingAverageCard) {
        existingAverageCard.remove();
    }
}

// Function to parse Indian price format to number
function parseIndianPrice(priceString) {
    // Example input format: "₹ 7,451"
    const numericString = priceString.replace(/[^\d.]/g, '');
    return parseFloat(numericString);
}

// Function to create price cards
function createPriceCards(cityData) {
    const priceCardsContainer = document.getElementById('priceCards');
    clearPriceCards(); // Clear existing cards

    const card = document.createElement('div');
    card.className = 'bg-white rounded-xl shadow-xl p-6 text-center transform transition duration-500 hover:scale-105';
    card.innerHTML = `
        <h2 class="text-2xl font-bold text-indigo-800 mb-4">${cityData.City}</h2>
        <p class="text-xl font-semibold text-indigo-600">24K: ₹ ${cityData['24K Today'].replace('₹ ', '')}</p>
        <p class="text-xl font-semibold text-indigo-600 mt-2">22K: ₹ ${cityData['22K Today'].replace('₹ ', '')}</p>
        <p class="text-xl font-semibold text-indigo-600 mt-2">18K: ₹ ${cityData['18K Today'].replace('₹ ', '')}</p>
    `;
    priceCardsContainer.appendChild(card);
}

// Function to create average price card for India
function createAveragePriceCard(avg24K, avg22K, avg18K) {
    const priceCardsContainer = document.getElementById('priceCards');
    const card = document.createElement('div');
    card.id = 'averagePriceCard'; // Set an ID to identify the average price card
    card.className = 'bg-white rounded-xl shadow-xl p-6 text-center transform transition duration-500 hover:scale-105';
    card.innerHTML = `
        <h2 class="text-2xl font-bold text-indigo-800 mb-4">Gold Price in India</h2>
        <p class="text-xl font-semibold text-indigo-600">24K: ₹ ${avg24K.toFixed(2)}</p>
        <p class="text-xl font-semibold text-indigo-600 mt-2">22K: ₹ ${avg22K.toFixed(2)}</p>
        <p class="text-xl font-semibold text-indigo-600 mt-2">18K: ₹ ${avg18K.toFixed(2)}</p>
    `;
    priceCardsContainer.appendChild(card);
}

// Event listener for the city select dropdown
document.getElementById('citySelect').addEventListener('change', (event) => {
    const selectedCity = event.target.value;
    console.log('Selected city:', selectedCity);
    
    const cityData = goldPrices.find(price => price.City === selectedCity);
    console.log('City data:', cityData);
    
    if (cityData) {
        createPriceCards(cityData);
    } else {
        console.error('No data found for selected city');
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

function showLoadingSpinner() {
    document.getElementById('loadingSpinner').classList.remove('hidden');
}

function hideLoadingSpinner() {
    document.getElementById('loadingSpinner').classList.add('hidden');
}

// Call the fetchPrices function when the page loads
document.addEventListener('DOMContentLoaded', () => {
    fetchPrices();
});

// Call the fetchPrices function when the refresh button is clicked
document.getElementById('refreshButton').addEventListener('click', () => {
    fetchPrices();
});
