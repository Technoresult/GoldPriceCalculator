let silverPrices = [];
const initialDisplayCount = 20;
let currentDisplayCount = initialDisplayCount;

function getTodayDateString() {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = today.toLocaleString('default', { month: 'short' });
    const year = today.getFullYear().toString().substr(-2);
    return `${day}${month}${year}`;
}

async function fetchSilverPrices() {
    showLoadingSpinner();
    try {
        const dateString = getTodayDateString();
        const response = await fetch(`https://raw.githubusercontent.com/Technoresult/GoldPriceCalculator/main/Folder/S_${dateString}.json`);
        const data = await response.json();
        console.log('Fetched data:', data);
        if (!data.silver_rates) {
            throw new Error('No silver rates found in the fetched data');
        }
        silverPrices = data.silver_rates;
        clearPriceCards();
        populateCityDropdowns();
        createAveragePriceCards();
        populatePriceTable();
    } catch (error) {
        console.error('Error fetching prices:', error);
        displayError('Failed to fetch prices: ' + error.message);
    } finally {
        hideLoadingSpinner();
    }
}

function populatePriceTable() {
    const tableBody = document.querySelector('#priceTable tbody');
    tableBody.innerHTML = '';

    if (!silverPrices || silverPrices.length === 0) {
        console.error('No silver prices available to display'); // Debugging line
        displayError('No silver prices available to display');
        return;
    }

    const displayedPrices = silverPrices.slice(0, currentDisplayCount);

    displayedPrices.forEach(price => {
        const row = document.createElement('tr');
        
        const cityCell = document.createElement('td');
        cityCell.className = 'p-4 border-b';
        cityCell.textContent = price.city;
        
        const tenGramCell = document.createElement('td');
        tenGramCell.className = 'p-4 border-b';
        tenGramCell.textContent = price['10_gram'];
        
        const hundredGramCell = document.createElement('td');
        hundredGramCell.className = 'p-4 border-b';
        hundredGramCell.textContent = price['100_gram'];
        
        const oneKgCell = document.createElement('td');
        oneKgCell.className = 'p-4 border-b';
        oneKgCell.textContent = price['1_kg'];

        row.appendChild(cityCell);
        row.appendChild(tenGramCell);
        row.appendChild(hundredGramCell);
        row.appendChild(oneKgCell);

        tableBody.appendChild(row);
    });

    updateLoadMoreButton();
}

function updateLoadMoreButton() {
    const loadMoreButton = document.getElementById('loadMoreButton');
    if (currentDisplayCount >= silverPrices.length) {
        loadMoreButton.style.display = 'none';
    } else {
        loadMoreButton.style.display = 'block';
    }
}

document.getElementById('loadMoreButton').addEventListener('click', () => {
    currentDisplayCount += initialDisplayCount;
    populatePriceTable();
});

function clearPriceCards() {
    const priceCardsContainer = document.getElementById('priceCards');
    if (priceCardsContainer) {
        priceCardsContainer.innerHTML = '';
    }
}

function createAveragePriceCards() {
    const priceCardsContainer = document.getElementById('priceCards');
    if (!priceCardsContainer) {
        console.error('priceCardsContainer is not defined');
        return;
    }
    const avg1Gram = calculateAverage('10_gram') / 10;
    const avg10Gram = avg1Gram * 10;

    createPriceCard('1 Gram', avg1Gram);
    createPriceCard('10 Gram', avg10Gram);
}

function createPriceCard(weight, price) {
    const priceCardsContainer = document.getElementById('priceCards');
    if (!priceCardsContainer) {
        console.error('priceCardsContainer is not defined');
        return;
    }
    
    const card = document.createElement('div');
    card.className = 'bg-white rounded-xl shadow-2xl p-8 text-center price-card mb-4 w-full md:w-1/2';

    const title = document.createElement('h3');
    title.className = 'text-2xl font-bold text-indigo-800 mb-4';
    title.textContent = `${weight} Silver`;

    const priceElement = document.createElement('p');
    priceElement.className = 'text-xl text-gray-700';
    priceElement.textContent = `₹ ${price.toFixed(2)}`;

    card.appendChild(title);
    card.appendChild(priceElement);

    priceCardsContainer.appendChild(card);
}

function calculateAverage(priceType) {
    if (!silverPrices.length) return 0;
    const sum = silverPrices.reduce((acc, price) => acc + parseIndianPrice(price[priceType]), 0);
    return sum / silverPrices.length;
}

function parseIndianPrice(priceString) {
    const numericString = priceString.replace(/[^\d.]/g, '');
    return parseFloat(numericString);
}

function populateCityDropdowns() {
    const citySelectCustom = document.getElementById('citySelectCustom');
    const citySelectPrices = document.getElementById('citySelectPrices');

    [citySelectCustom, citySelectPrices].forEach(select => {
        select.innerHTML = '<option value="">Select City</option>';
        silverPrices.forEach(price => {
            const option = document.createElement('option');
            option.value = price.city;
            option.textContent = price.city;
            select.appendChild(option);
        });
    });
}

function updateCityPriceCard(cityData) {
    const cityPriceCard = document.getElementById('cityPriceCardSection');
    if (!cityPriceCard) return;

    const price999 = cityPriceCard.querySelector('.price-999');
    price999.textContent = `999: ${cityData['10_gram']}`;
}

function calculateCustomPrice() {
    const city = document.getElementById('citySelectCustom').value;
    const grams = parseFloat(document.getElementById('gramInput').value);

    if (!city || isNaN(grams)) {
        alert('Please fill in all fields correctly.');
        return;
    }

    const cityData = silverPrices.find(price => price.city === city);
    if (!cityData) {
        alert('City data not found.');
        return;
    }

    const pricePerGram = parseIndianPrice(cityData['10_gram']) / 10;
    const totalPrice = pricePerGram * grams;

    document.getElementById('calculationResult').textContent = `Total Price: ₹ ${totalPrice.toFixed(2)}`;
}

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

function updateCityPrices(selectedCity) {
    const cityData = silverPrices.find(price => price.city === selectedCity);
    if (cityData) {
        updateCityPriceCard(cityData);
    }
}

function showLoadingSpinner() {
    document.getElementById('loadingSpinner').classList.remove('hidden');
}

function hideLoadingSpinner() {
    document.getElementById('loadingSpinner').classList.add('hidden');
}

function displayError(message) {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
}

function updateDateTime() {
    const now = new Date();
    const dateString = now.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    document.getElementById('lastUpdated').innerHTML = `<span style="font-size: 1.2em; font-weight: bold;">${dateString}</span>`;
}

document.getElementById('refreshButton').addEventListener('click', fetchSilverPrices);
document.getElementById('calculateButton').addEventListener('click', calculateCustomPrice);

// Initial fetch on page load
fetchSilverPrices();
updateDateTime();
setInterval(updateDateTime, 1000); // Update date and time every second
