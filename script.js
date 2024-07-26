let goldPrices = [];
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

async function fetchGoldPrices(dateString) {
    try {
        const url = `https://raw.githubusercontent.com/Technoresult/GoldPriceCalculator/main/Folder/G_${dateString}.json`;
        console.log('Fetching URL:', url);
        const response = await fetch(url);
        const data = await response.json();
        console.log('Parsed data:', data);
        return data.gold_prices;
    } catch (error) {
        console.error('Error fetching or parsing prices:', error);
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
            fetchGoldPrices(todayDateString),
            fetchGoldPrices(yesterdayDateString)
        ]);

        if (todayPrices && yesterdayPrices) {
            goldPrices = todayPrices;
            clearPriceCards();
            createAveragePriceCards(todayPrices, yesterdayPrices);
            displayAveragePriceComparison(todayPrices, yesterdayPrices);
            populateCityDropdowns();
            populateGoldPricesTable();
        }
    } catch (error) {
        console.error('Error fetching or comparing prices:', error);
        displayError('Failed to fetch or compare prices: ' + error.message);
    } finally {
        hideLoadingSpinner();
    }
}

function calculateAveragePrice(prices, carat) {
    const sum = prices.reduce((acc, price) => acc + parseIndianPrice(price[`${carat} Today`]), 0);
    return sum / prices.length;
}

function createAveragePriceCards(todayPrices, yesterdayPrices) {
    const priceCardsContainer = document.getElementById('priceCards');
    if (!priceCardsContainer) {
        console.error('priceCardsContainer is not defined');
        return;
    }
    
    const carats = ['24K', '22K', '18K'];
    
    carats.forEach(carat => {
        const todayAvg = calculateAveragePrice(todayPrices, carat);
        const yesterdayAvg = calculateAveragePrice(yesterdayPrices, carat);
        const difference = todayAvg - yesterdayAvg;
        
        createPriceCard(carat, todayAvg, difference);
    });
}

function createPriceCard(carat, price, difference) {
    const priceCardsContainer = document.getElementById('priceCards');
    
    const card = document.createElement('div');
    card.className = 'bg-white rounded-xl shadow-2xl p-8 text-center price-card mb-4 w-full md:w-1/3';

    const title = document.createElement('h3');
    title.className = 'text-2xl font-bold text-indigo-800 mb-4';
    title.textContent = `${carat} Gold`;

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

function displayAveragePriceComparison(todayPrices, yesterdayPrices) {
    const comparisonContainer = document.getElementById('priceComparison');
    if (!comparisonContainer) {
        console.error('priceComparison element not found');
        return;
    }
    comparisonContainer.innerHTML = ''; // Clear previous content

    const table = document.createElement('table');
    table.className = 'w-full bg-white shadow-lg rounded-lg overflow-hidden';

    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr class="bg-indigo-800 text-white">
            <th class="py-3 px-4 text-left">Carat</th>
            <th class="py-3 px-4 text-left">Today's Price</th>
            <th class="py-3 px-4 text-left">Yesterday's Price</th>
            <th class="py-3 px-4 text-left">Change</th>
        </tr>
    `;

    const tbody = document.createElement('tbody');

    ['24K', '22K', '18K'].forEach(carat => {
        const todayAvg = calculateAveragePrice(todayPrices, carat);
        const yesterdayAvg = calculateAveragePrice(yesterdayPrices, carat);
        const difference = todayAvg - yesterdayAvg;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="py-3 px-4 border-b">${carat}</td>
            <td class="py-3 px-4 border-b">₹ ${todayAvg.toFixed(2)}</td>
            <td class="py-3 px-4 border-b">₹ ${yesterdayAvg.toFixed(2)}</td>
            <td class="py-3 px-4 border-b ${difference > 0 ? 'text-green-600' : 'text-red-600'}">
                ${difference > 0 ? '↑' : '↓'} ${Math.abs(difference).toFixed(2)}
            </td>
        `;
        tbody.appendChild(row);
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    comparisonContainer.appendChild(table);
}

function populateCityDropdowns() {
    const citySelectCustom = document.getElementById('citySelectCustom');
    const citySelectPrices = document.getElementById('citySelectPrices');

    [citySelectCustom, citySelectPrices].forEach(select => {
        if (select) {
            select.innerHTML = '<option value="">Select City</option>';
            goldPrices.forEach(price => {
                const option = document.createElement('option');
                option.value = price.City;
                option.textContent = price.City;
                select.appendChild(option);
            });
        }
    });
}

function updateCityPriceCard(cityData) {
    const cityPriceCard = document.getElementById('cityPriceCard');
    if (!cityPriceCard) return;

    ['24K', '22K', '18K'].forEach(carat => {
        const priceElement = cityPriceCard.querySelector(`.price-${carat}`);
        if (priceElement) {
            priceElement.textContent = `${carat}: ${cityData[`${carat} Today`]}`;
        }
    });
}

function calculateCustomPrice() {
    const city = document.getElementById('citySelectCustom')?.value;
    const carat = document.getElementById('caratSelect')?.value;
    const grams = parseFloat(document.getElementById('gramInput')?.value);

    if (!city || !carat || isNaN(grams)) {
        alert('Please fill in all fields correctly.');
        return;
    }

    const cityData = goldPrices.find(price => price.City === city);
    if (!cityData) {
        alert('City data not found.');
        return;
    }

    const pricePerGramString = cityData[`${carat} Today`];
    if (!pricePerGramString) {
        alert(`Price data for ${carat} not available for ${city}.`);
        return;
    }

    const pricePerGram = parseIndianPrice(pricePerGramString);
    const totalPrice = pricePerGram * grams;

    const resultElement = document.getElementById('calculationResult');
    if (resultElement) {
        resultElement.textContent = `Total Price: ₹ ${totalPrice.toFixed(2)}`;
    }
}

function populateGoldPricesTable() {
    const tableBody = document.querySelector('#goldPricesTable tbody');
    if (!tableBody) {
        console.error('Gold prices table body not found');
        return;
    }
    tableBody.innerHTML = '';

    if (!goldPrices || goldPrices.length === 0) {
        console.error('No gold prices available to display');
        displayError('No gold prices available to display');
        return;
    }

    const displayedPrices = goldPrices.slice(0, currentDisplayCount);

    displayedPrices.forEach(price => {
        const row = document.createElement('tr');

        ['City', '24K Today', '22K Today', '18K Today'].forEach((key) => {
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
    if (viewMoreBtn) {
        viewMoreBtn.style.display = currentDisplayCount >= goldPrices.length ? 'none' : 'inline-block';
    }
}

function parseIndianPrice(priceString) {
    return parseFloat(priceString.replace(/[^\d.]/g, ''));
}

function showLoadingSpinner() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) spinner.classList.remove('hidden');
}

function hideLoadingSpinner() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) spinner.classList.add('hidden');
}

function displayError(message) {
    const errorMessage = document.getElementById('errorMessage');
    if (errorMessage) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
    }
}

function updateDateTime() {
    const now = new Date();
    const dateString = now.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const lastUpdated = document.getElementById('lastUpdated');
    if (lastUpdated) {
        lastUpdated.innerHTML = `<span style="font-size: 1.2em; font-weight: bold;">${dateString}</span>`;
    }
}

function clearPriceCards() {
    const priceCardsContainer = document.getElementById('priceCards');
    if (priceCardsContainer) {
        priceCardsContainer.innerHTML = '';
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const refreshButton = document.getElementById('refreshButton');
    if (refreshButton) refreshButton.addEventListener('click', fetchAndComparePrices);

    const calculateButton = document.getElementById('calculateButton');
    if (calculateButton) calculateButton.addEventListener('click', calculateCustomPrice);

    const viewMoreBtn = document.getElementById('viewMoreBtn');
    if (viewMoreBtn) {
        viewMoreBtn.addEventListener('click', () => {
            currentDisplayCount += initialDisplayCount;
            populateGoldPricesTable();
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
});

function updateCityPrices(selectedCity) {
    const cityData = goldPrices.find(price => price.City === selectedCity);
    if (cityData) {
        updateCityPriceCard(cityData);
    }
}
