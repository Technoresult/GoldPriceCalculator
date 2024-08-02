let silverPrices = [];
const initialDisplayCount = 20;
let currentDisplayCount = initialDisplayCount;

function getTodayDateString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getYesterdayDateString() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const year = yesterday.getFullYear();
    const month = String(yesterday.getMonth() + 1).padStart(2, '0');
    const day = String(yesterday.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

async function fetchSilverPrices(dateString) {
    const url = `https://gold-price-api-c095eaf86dce.herokuapp.com/api/silver/date/${dateString}?cache_buster=${Date.now()}`;
    
    try {
        const response = await fetch(url, {
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid response: not an object');
        }
        
        let silverPrices;
        if (Array.isArray(data.silver_rates)) {
            silverPrices = data.silver_rates;
        } else if (data.data && Array.isArray(data.data.silver_rates)) {
            silverPrices = data.data.silver_rates;
        } else {
            throw new Error('Invalid data structure: silver_rates is missing or not an array');
        }
        
        return silverPrices;
    } catch (error) {
        displayError('Failed to fetch or parse prices: ' + error.message);
        return null;
    }
}

async function fetchAndComparePrices() {
    showLoadingSpinner();
    const todayDateString = getTodayDateString();
    const yesterdayDateString = getYesterdayDateString();

    try {
        const [todayPrices, yesterdayPrices] = await Promise.all([
            fetchSilverPrices(todayDateString),
            fetchSilverPrices(yesterdayDateString)
        ]);

        if (todayPrices && yesterdayPrices) {
            const todayAvg = calculateAveragePrice(todayPrices);
            const yesterdayAvg = calculateAveragePrice(yesterdayPrices);
            
            silverPrices = todayPrices;
            clearPriceCards();
            createAveragePriceCards(todayAvg, yesterdayAvg);
            displayAveragePriceComparison(todayAvg, yesterdayAvg);
            populateCityDropdowns();
            populatePriceTable();
            populateSilverSidebar();
        } else {
            throw new Error('Failed to fetch silver prices for today or yesterday');
        }
    } catch (error) {
        displayError('Failed to fetch or compare prices: ' + error.message);
    } finally {
        hideLoadingSpinner();
    }
}

function calculateAveragePrice(prices) {
    const sum = prices.reduce((acc, price) => acc + parseIndianPrice(price['10_gram']), 0);
    return sum / prices.length / 10; // Average price per gram
}

function createAveragePriceCards(todayAvg, yesterdayAvg) {
    const priceCardsContainer = document.getElementById('priceCards');
    if (!priceCardsContainer) {
        console.error('priceCardsContainer is not defined');
        return;
    }
    
    const weights = [1, 8, 10];
    
    weights.forEach(weight => {
        const todayPrice = todayAvg * weight;
        const yesterdayPrice = yesterdayAvg * weight;
        const difference = todayPrice - yesterdayPrice;
        
        createPriceCard(weight, todayPrice, difference);
    });
}

function createPriceCard(weight, price, difference) {
    const priceCardsContainer = document.getElementById('priceCards');
    
    const card = document.createElement('div');
    card.className = 'bg-white rounded-xl shadow-2xl p-8 text-center price-card mb-4 w-full md:w-1/3';

    const title = document.createElement('h3');
    title.className = 'text-2xl font-bold text-indigo-800 mb-4';
    title.textContent = `${weight} Gram${weight > 1 ? 's' : ''}`;

    const priceElement = document.createElement('p');
    priceElement.className = 'text-xl text-gray-700';
    priceElement.textContent = `₹ ${price.toFixed(2)}`;

    const differenceElement = document.createElement('p');
    differenceElement.className = `text-lg ${difference > 0 ? 'text-green-600' : 'text-red-600'}`;
    const arrow = difference > 0 ? '↑' : '↓';
    differenceElement.textContent = `${arrow} ${Math.abs(difference).toFixed(2)}`;

    card.appendChild(title);
    card.appendChild(priceElement);
    card.appendChild(differenceElement);

    priceCardsContainer.appendChild(card);
}

// In gold_script.js

// Function to populate the sidebar with silver prices in top cities
function populateSilverSidebar() {
    const topCitiesList = document.getElementById('topCitiesList');
    if (!topCitiesList) return;

    // Customize this list of top cities
    const topCities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Kerala', 'Pune'];

    topCitiesList.innerHTML = '';
    topCities.forEach(city => {
        const cityData = silverPrices.find(price => price.city === city);
        if (cityData) {
            const li = document.createElement('li');
            li.className = 'mb-4';
            
            const cityHeader = document.createElement('h3');
            cityHeader.className = 'text-lg font-semibold text-indigo-800 mb-2';
            cityHeader.textContent = `Silver Price in ${city}`;
            li.appendChild(cityHeader);

            const priceList = document.createElement('ul');
            priceList.className = 'list-none pl-0';

            ['10_gram', '100_gram', '1_kg'].forEach(weight => {
                const priceLi = document.createElement('li');
                priceLi.className = 'text-sm text-gray-600';
                priceLi.textContent = `${weight.replace('_', ' ')}: ${cityData[weight]}`;
                priceList.appendChild(priceLi);
            });

            li.appendChild(priceList);
            topCitiesList.appendChild(li);
        }
    });
}

// Call populateSilverSidebar() after fetching the data
// fetchSilverPrices() should be a function that fetches the silverPrices data and then calls populateSilverSidebar()

function displayCitySilverPrices(city) {
    const cityData = silverPrices.find(price => price.city === city);
    if (!cityData) {
        console.error(`No data found for city: ${city}`);
        return;
    }

    const citySilverPrices = document.getElementById('citySilverPrices');
    const selectedCityName = document.getElementById('selectedCityName');
    const price10Gram = document.getElementById('price10Gram');
    const price100Gram = document.getElementById('price100Gram');
    const price1Kg = document.getElementById('price1Kg');

    selectedCityName.textContent = `Silver Price in ${city}`;
    price10Gram.textContent = `10g: ${cityData['10_gram']}`;
    price100Gram.textContent = `100g: ${cityData['100_gram']}`;
    price1Kg.textContent = `1kg: ${cityData['1_kg']}`;

    citySilverPrices.classList.remove('hidden');
}




function displayAveragePriceComparison(todayAvg, yesterdayAvg) {
    const comparisonContainer = document.getElementById('priceComparison');
    comparisonContainer.innerHTML = ''; // Clear previous content

    const table = document.createElement('table');
    table.className = 'w-full bg-white shadow-lg rounded-lg overflow-hidden';

    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr class="bg-indigo-800 text-white">
            <th class="py-3 px-4 text-left">Today's Price</th>
            <th class="py-3 px-4 text-left">Yesterday's Price</th>
            <th class="py-3 px-4 text-left">Change</th>
        </tr>
    `;

    const tbody = document.createElement('tbody');
    const row = document.createElement('tr');
    const difference = todayAvg - yesterdayAvg;

    row.innerHTML = `
        <td class="py-3 px-4 border-b">₹ ${todayAvg.toFixed(2)}</td>
        <td class="py-3 px-4 border-b">₹ ${yesterdayAvg.toFixed(2)}</td>
        <td class="py-3 px-4 border-b ${difference > 0 ? 'text-green-600' : 'text-red-600'}">
            ${difference > 0 ? '↑' : '↓'} ${Math.abs(difference).toFixed(2)}
        </td>
    `;

    tbody.appendChild(row);
    table.appendChild(thead);
    table.appendChild(tbody);
    comparisonContainer.appendChild(table);
}

function populatePriceTable() {
    const tableBody = document.querySelector('#priceTable tbody');
    tableBody.innerHTML = '';

    if (!silverPrices || silverPrices.length === 0) {
        console.error('No silver prices available to display');
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

function clearPriceCards() {
    const priceCardsContainer = document.getElementById('priceCards');
    if (priceCardsContainer) {
        priceCardsContainer.innerHTML = '';
    }
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

document.addEventListener('DOMContentLoaded', () => {
    const refreshButton = document.getElementById('refreshButton');
    if (refreshButton) refreshButton.addEventListener('click', fetchAndComparePrices);

    const calculateButton = document.getElementById('calculateButton');
    if (calculateButton) calculateButton.addEventListener('click', calculateCustomPrice);

    const loadMoreButton = document.getElementById('loadMoreButton');
    if (loadMoreButton) {
        loadMoreButton.addEventListener('click', () => {
            currentDisplayCount += initialDisplayCount;
            populatePriceTable();
        });
    }

    const citySelectCustom = document.getElementById('citySelectCustom');
    if (citySelectCustom) {
        citySelectCustom.addEventListener('change', (event) => {
            const selectedCity = event.target.value;
            const citySelectPrices = document.getElementById('citySelectPrices');
            if (citySelectPrices) citySelectPrices.value = selectedCity;
            updateCityPrices(selectedCity);
        });
    }

    const citySelectPrices = document.getElementById('citySelectPrices');
    if (citySelectPrices) {
        citySelectPrices.addEventListener('change', (event) => {
            const selectedCity = event.target.value;
            const citySelectCustom = document.getElementById('citySelectCustom');
            if (citySelectCustom) citySelectCustom.value = selectedCity;
            updateCityPrices(selectedCity);
        });
    }

    // Initial fetch on page load
    fetchAndComparePrices();
    updateDateTime();
    setInterval(updateDateTime, 1000);
    populateSilverSidebar();
});

function updateCityPrices(selectedCity) {
    const cityData = silverPrices.find(price => price.city === selectedCity);
    if (cityData) {
        updateCityPriceCard(cityData);
    }
}
