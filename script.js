let goldPrices = [];
const initialDisplayCount = 20;
let currentDisplayCount = initialDisplayCount;

async function fetchPrices() {
    showLoadingSpinner();
    try {
        const response = await fetch('https://raw.githubusercontent.com/Technoresult/GoldPriceCalculator/main/G_21Jul24.json');
        const data = await response.json();
        console.log('Fetched data:', data);
        
        goldPrices = data.gold_prices; // Ensure correct property access
        console.log('Processed gold prices:', goldPrices);
        
        clearPriceCards(); // Clear existing price cards
        populateCityDropdown(); // Populate the dropdown after fetching data
        calculateAveragePrice(); // Calculate averages after fetching data
        populateGoldPricesTable();
        hideLoadingSpinner();
    } catch (error) {
        console.error('Error fetching prices:', error);
        displayError('Failed to fetch prices: ' + error.message);
        hideLoadingSpinner();
    }
}

function populateGoldPricesTable() {
    const tableBody = document.querySelector('#goldPricesTable tbody');
    tableBody.innerHTML = '';

    if (!goldPrices || goldPrices.length === 0) {
        console.error('No gold prices available to display');
        displayError('No gold prices available to display');
        return;
    }

    const displayedPrices = goldPrices.slice(0, currentDisplayCount);

    displayedPrices.forEach(price => {
        const row = document.createElement('tr');
        
        const cityCell = document.createElement('td');
        cityCell.className = 'py-3 px-4 border-b';
        cityCell.textContent = price.City;
        
        const price24KCell = document.createElement('td');
        price24KCell.className = 'py-3 px-4 border-b';
        price24KCell.textContent = price['24K Today'];
        
        const price22KCell = document.createElement('td');
        price22KCell.className = 'py-3 px-4 border-b';
        price22KCell.textContent = price['22K Today'];
        
        const price18KCell = document.createElement('td');
        price18KCell.className = 'py-3 px-4 border-b';
        price18KCell.textContent = price['18K Today'];

        row.appendChild(cityCell);
        row.appendChild(price24KCell);
        row.appendChild(price22KCell);
        row.appendChild(price18KCell);

        tableBody.appendChild(row);
    });

    updateViewMoreButton();
}

function updateViewMoreButton() {
    const viewMoreBtn = document.getElementById('viewMoreBtn');
    if (currentDisplayCount >= goldPrices.length) {
        viewMoreBtn.style.display = 'none';
    } else {
        viewMoreBtn.style.display = 'inline-block';
    }
}

document.getElementById('viewMoreBtn').addEventListener('click', () => {
    currentDisplayCount += initialDisplayCount;
    populateGoldPricesTable();
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
    const avg24K = calculateAverage('24K Today');
    const avg22K = calculateAverage('22K Today');
    const avg18K = calculateAverage('18K Today');

    createPriceCard('24K', avg24K);
    createPriceCard('22K', avg22K);
    createPriceCard('18K', avg18K);
}

function calculateAverage(caratType) {
    if (!goldPrices.length) return 0;
    const sum = goldPrices.reduce((acc, price) => acc + parseIndianPrice(price[caratType]), 0);
    return sum / goldPrices.length;
}

function createPriceCard(carat, price) {
    const priceCardsContainer = document.getElementById('priceCards');
    if (!priceCardsContainer) {
        console.error('priceCardsContainer is not defined');
        return;
    }
    
    const card = document.createElement('div');
    card.className = 'bg-white rounded-xl shadow-2xl p-8 text-center price-card mb-4 w-full md:w-1/3';

    const title = document.createElement('h3');
    title.className = 'text-2xl font-bold text-indigo-800 mb-4';
    title.textContent = `${carat} Gold`;

    const priceElement = document.createElement('p');
    priceElement.className = 'text-xl text-gray-700';
    priceElement.textContent = `₹ ${price.toFixed(2)}`;

    card.appendChild(title);
    card.appendChild(priceElement);

    priceCardsContainer.appendChild(card);
}

function calculateAverage(caratType) {
    if (!goldPrices.length) return 0;
    const sum = goldPrices.reduce((acc, price) => acc + parseIndianPrice(price[caratType]), 0);
    return sum / goldPrices.length;
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
        goldPrices.forEach(price => {
            const option = document.createElement('option');
            option.value = price.City;
            option.textContent = price.City;
            select.appendChild(option);
        });
    });
}

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
    const cityData = goldPrices.find(price => price.City === selectedCity);
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

document.getElementById('refreshButton').addEventListener('click', fetchGoldPrices);
document.getElementById('calculateButton').addEventListener('click', calculateCustomPrice);

// Initial fetch on page load
fetchGoldPrices();
updateDateTime();
setInterval(updateDateTime, 1000); // Update date and time every second
