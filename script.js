let goldPrices = [];

// Function to fetch prices from the CSV file
async function fetchPrices() {
    showLoadingSpinner();
    try {
        const response = await fetch('https://github.com/Technoresult/GoldPriceCalculator/blob/main/Goldrates.json');
        const data = await response.json();
        console.log('Fetched data:', data);
        
        goldPrices = data.cities;
        console.log('Processed gold prices:', goldPrices);
        
        populateCityDropdown();
        calculateAveragePrice();
        hideLoadingSpinner();
    } catch (error) {
        console.error('Error fetching prices:', error);
        displayError('Failed to fetch prices: ' + error.message);
        hideLoadingSpinner();
    }
}
        
        console.log('Processed gold prices:', goldPrices);
        
        populateCityDropdown();
        calculateAveragePrice();
        hideLoadingSpinner();
    } catch (error) {
        console.error('Error fetching prices:', error);
        displayError('Failed to fetch prices: ' + error.message);
        hideLoadingSpinner();
    }
}

// Function to populate the city dropdown
function populateCityDropdown() {
    const citySelect = document.getElementById('citySelect');
    citySelect.innerHTML = '<option value="">Select City</option>';
    
    console.log('Populating dropdown with cities:', goldPrices.map(price => price.city));
    
    goldPrices.forEach(price => {
        const option = document.createElement('option');
        option.value = price.city;
        option.textContent = price.city;
        citySelect.appendChild(option);
    });
    
    console.log('Dropdown populated. Current options:', Array.from(citySelect.options).map(opt => opt.value));
}
// Function to calculate average price for India
function calculateAveragePrice() {
    if (goldPrices.length === 0) {
        console.error('No gold prices data available');
        return;
    }
    
    const sum24K = goldPrices.reduce((sum, price) => sum + price.gold24K, 0);
    const sum22K = goldPrices.reduce((sum, price) => sum + price.gold22K, 0);
    const sum18K = goldPrices.reduce((sum, price) => sum + price.gold18K, 0);
    const count = goldPrices.length;
    
    console.log('Sums and count:', { sum24K, sum22K, sum18K, count });
    
    const avg24K = sum24K / count;
    const avg22K = sum22K / count;
    const avg18K = sum18K / count;
    
    console.log('Calculated averages:', { avg24K, avg22K, avg18K });
    
    createAveragePriceCard(avg24K, avg22K, avg18K);
}

// Function to create price cards
function createPriceCards(cityData) {
    const priceCardsContainer = document.getElementById('priceCards');
    priceCardsContainer.innerHTML = ''; // Clear existing cards

    const card = document.createElement('div');
    card.className = 'bg-white rounded-xl shadow-xl p-6 text-center transform transition duration-500 hover:scale-105';
    card.innerHTML = `
        <h2 class="text-2xl font-bold text-indigo-800 mb-4">${cityData.city}</h2>
        <p class="text-xl font-semibold text-indigo-600">24K: ₹ ${formatIndianPrice(Math.round(cityData.gold24K))}/g</p>
        <p class="text-xl font-semibold text-indigo-600 mt-2">22K: ₹ ${formatIndianPrice(Math.round(cityData.gold22K))}/g</p>
        <p class="text-xl font-semibold text-indigo-600 mt-2">18K: ₹ ${formatIndianPrice(Math.round(cityData.gold18K))}/g</p>
    `;
    priceCardsContainer.appendChild(card);
}

// Function to create average price card for India
function createAveragePriceCard(avg24K, avg22K, avg18K) {
    const priceCardsContainer = document.getElementById('priceCards');
    const card = document.createElement('div');
    card.className = 'bg-white rounded-xl shadow-xl p-6 text-center transform transition duration-500 hover:scale-105';
    card.innerHTML = `
        <h2 class="text-2xl font-bold text-indigo-800 mb-4">India Average</h2>
        <p class="text-xl font-semibold text-indigo-600">24K: ₹ ${formatIndianPrice(Math.round(avg24K))}/g</p>
        <p class="text-xl font-semibold text-indigo-600 mt-2">22K: ₹ ${formatIndianPrice(Math.round(avg22K))}/g</p>
        <p class="text-xl font-semibold text-indigo-600 mt-2">18K: ₹ ${formatIndianPrice(Math.round(avg18K))}/g</p>
    `;
    priceCardsContainer.appendChild(card);
}

// Function to format price in Indian standard with commas
function formatIndianPrice(price) {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Function to calculate custom gram price
function calculateCustomPrice(carat, grams) {
    const selectedCity = document.getElementById('citySelect').value;
    const cityData = goldPrices.find(price => price.city === selectedCity);
    if (cityData) {
        const pricePerGram = cityData[`gold${carat}K`];
        const totalPrice = Math.round(pricePerGram * grams);
        return formatIndianPrice(totalPrice);
    }
    return null;
}

// Event listener for the city select dropdown
document.getElementById('citySelect').addEventListener('change', (event) => {
    const selectedCity = event.target.value;
    console.log('Selected city:', selectedCity);
    
    const cityData = goldPrices.find(price => price.city === selectedCity);
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
