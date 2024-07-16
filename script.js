document.addEventListener('DOMContentLoaded', () => {
    fetchPrices();
    setInterval(updateDateTime, 1000);

    document.getElementById('refreshButton').addEventListener('click', fetchPrices);
    document.getElementById('calculateButton').addEventListener('click', calculatePrice);
});

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

async function fetchPrices() {
    showLoadingSpinner();
    try {
        const response = await fetch('https://raw.githubusercontent.com/Technoresult/GoldPriceCalculator/main/Goldrates.json');
        const data = await response.json();
        goldPrices = data.gold_prices;

        clearPriceCards();
        createPriceCards();
        populateCityDropdown();
        hideLoadingSpinner();
    } catch (error) {
        console.error('Error fetching prices:', error);
        displayError('Failed to fetch prices: ' + error.message);
        hideLoadingSpinner();
    }
}

function clearPriceCards() {
    const priceCardsContainer = document.getElementById('priceCards');
    priceCardsContainer.innerHTML = '';
}

function createPriceCards() {
    const priceCardsContainer = document.getElementById('priceCards');

    const card24K = createPriceCard('24K', calculateAverage('24K Today'));
    const card22K = createPriceCard('22K', calculateAverage('22K Today'));
    const card18K = createPriceCard('18K', calculateAverage('18K Today'));

    priceCardsContainer.appendChild(card24K);
    priceCardsContainer.appendChild(card22K);
    priceCardsContainer.appendChild(card18K);
}

function createPriceCard(carat, price) {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-xl shadow-2xl p-8 text-center price-card';

    const title = document.createElement('h3');
    title.className = 'text-2xl font-bold text-indigo-800 mb-4';
    title.textContent = carat;

    const priceElement = document.createElement('p');
    priceElement.className = 'text-xl text-gray-700';
    priceElement.textContent = `₹ ${price.toFixed(2)}`;

    card.appendChild(title);
    card.appendChild(priceElement);

    return card;
}

function calculateAverage(caratType) {
    if (!goldPrices.length) return 0;

    const sum = goldPrices.reduce((acc, price) => acc + parseIndianPrice(price[caratType]), 0);
    return sum / goldPrices.length;
}

function parseIndianPrice(price) {
    return parseFloat(price.replace(/[^0-9.-]+/g, ''));
}

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

function calculatePrice() {
    const caratSelect = document.getElementById('caratSelect').value;
    const gramInput = parseFloat(document.getElementById('gramInput').value);

    if (isNaN(gramInput) || gramInput <= 0) {
        displayError('Please enter a valid number of grams');
        return;
    }

    const caratKey = `${caratSelect}K Today`;
    const avgPrice = calculateAverage(caratKey);

    if (avgPrice === 0) {
        displayError('Failed to calculate the price, please try again');
        return;
    }

    const totalPrice = avgPrice * gramInput;
    document.getElementById('calculationResult').textContent = `₹ ${totalPrice.toFixed(2)}`;
}
