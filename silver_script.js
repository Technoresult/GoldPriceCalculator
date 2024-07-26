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
        }
    } catch (error) {
        console.error('Error fetching or comparing prices:', error);
        displayError('Failed to fetch or compare prices: ' + error.message);
    } finally {
        hideLoadingSpinner();
    }
}

async function fetchSilverPrices(dateString) {
    try {
        const response = await fetch(`https://raw.githubusercontent.com/Technoresult/GoldPriceCalculator/main/Folder/S_${dateString}.json`);
        const data = await response.json();
        console.log('Fetched data:', data);
        if (!data.silver_rates) {
            throw new Error('No silver rates found in the fetched data');
        }
        return data.silver_rates;
    } catch (error) {
        console.error('Error fetching prices:', error);
        displayError('Failed to fetch prices: ' + error.message);
        return null;
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

document.getElementById('refreshButton').addEventListener('click', fetchAndComparePrices);
document.getElementById('calculateButton').addEventListener('click', calculateCustomPrice);
document.getElementById('loadMoreButton').addEventListener('click', () => {
    currentDisplayCount += initialDisplayCount;
    populatePriceTable();
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

// Initial fetch on page load
fetchAndComparePrices();
updateDateTime();
setInterval(updateDateTime, 1000); // Update date and time every second
