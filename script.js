let goldPrices = [];
const initialDisplayCount = 20;
let currentDisplayCount = initialDisplayCount;

function getTodayDateString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

async function fetchGoldPrices() {
    showLoadingSpinner();
    try {
        const dateString = getTodayDateString();
        const url = `https://stormy-hamlet-07077-2f9633159b11.herokuapp.com/data/gold_${dateString}.json`;
        console.log('Fetching URL:', url);
        const response = await fetch(url);
        const textData = await response.text(); // Get raw text
        console.log('Fetched text data:', textData);

        try {
            const data = JSON.parse(textData); // Parse JSON from text
            console.log('Parsed data:', data);
            goldPrices = data.gold_prices;
            console.log('Processed gold prices:', goldPrices);
            
            clearPriceCards();
            populateCityDropdowns();
            createAveragePriceCards();
            populateGoldPricesTable();
            hideLoadingSpinner();
        } catch (jsonError) {
            console.error('Error parsing JSON:', jsonError);
            displayError('Failed to parse JSON: ' + jsonError.message);
            hideLoadingSpinner();
        }
    } catch (fetchError) {
        console.error('Error fetching prices:', fetchError);
        displayError('Failed to fetch prices: ' + fetchError.message);
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
        
        ['City', '24K Today', '22K Today', '18K Today'].forEach((key, index) => {
            const cell = document.createElement('td');
            cell.className = 'py-3 px-4 border-b';
            cell.textContent = price[key];
            row.appendChild(cell);
        });

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

    ['24K', '22K', '18K'].forEach(carat => {
        const avgPrice = calculateAverage(`${carat} Today`);
        createPriceCard(carat, avgPrice);
    });
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

    ['24K', '22K', '18K'].forEach(carat => {
        const priceElement = cityPriceCard.querySelector(`.price-${carat}`);
        priceElement.textContent = `${carat}: ${cityData[`${carat} Today`]}`;
    });
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
