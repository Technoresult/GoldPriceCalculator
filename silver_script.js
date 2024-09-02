let silverPrices = [];
const initialDisplayCount = 15;
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

//fetch silver historical data
async function fetchHistoricalSilverPrices(days = 10) {
    const url = `https://gold-price-api-c095eaf86dce.herokuapp.com/api/silver/history/${days}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching historical silver prices:', error);
        return null;
    }
}

//************************* */

async function fetchAndComparePrices() {
    showLoadingSpinner();
    const todayDateString = getTodayDateString();
    const yesterdayDateString = getYesterdayDateString();

    try {
        const [todayPrices, yesterdayPrices, historicalSilverPrices] = await Promise.all([
            fetchSilverPrices(todayDateString),
            fetchSilverPrices(yesterdayDateString),
            fetchHistoricalSilverPrices(20)

        ]);

        if (todayPrices && yesterdayPrices && historicalSilverPrices) {
            silverPrices = todayPrices;
            clearPriceCards();
            createMumbaiPriceCards(todayPrices, yesterdayPrices);
            displayMumbaiPriceComparison(todayPrices, yesterdayPrices);
            populateCityDropdowns();
            populatePriceTable();
            populateSilverSidebar();
            createHistoricalSilverPriceChart(historicalSilverPrices);
        } else {
            throw new Error('Failed to fetch silver prices for today or yesterday');
        }
    } catch (error) {
        displayError('Failed to fetch or compare prices: ' + error.message);
    } finally {
        hideLoadingSpinner();
    }
}

//*********************************** */

function createMumbaiPriceCards(todayPrices, yesterdayPrices) {
    const priceCardsContainer = document.getElementById('priceCards');
    if (!priceCardsContainer) {
        console.error('priceCardsContainer is not defined');
        return;
    }

    const todayMumbaiPrices = todayPrices.find(price => price.city === 'Mumbai');
    const yesterdayMumbaiPrices = yesterdayPrices.find(price => price.city === 'Mumbai');

    if (!todayMumbaiPrices || !yesterdayMumbaiPrices) {
        console.error('Mumbai prices not found');
        return;
    }

    const weights = [
        { label: '1', value: 1 },
        { label: '10', value: 10 },
        { label: '1 Kg', value: 1000 }
    ];

    weights.forEach(weight => {
        const todayPrice = parseIndianPrice(todayMumbaiPrices['10_gram']) / 10 * weight.value;
        const yesterdayPrice = parseIndianPrice(yesterdayMumbaiPrices['10_gram']) / 10 * weight.value;
        const difference = todayPrice - yesterdayPrice;

        createPriceCard(weight.label, todayPrice, difference);
    });
}

//Function for Historical data for silver

function createHistoricalSilverPriceChart(historicalData) {
    const ctx = document.getElementById('historicalSilverPriceChart').getContext('2d');

    // Prepare data for the chart
    const dates = historicalData.map(item => new Date(item.timestamp).toLocaleDateString());

    // Extract Mumbai silver prices
    const prices = historicalData.map(item => {
        const silverRates = item.data.silver_rates;
        const mumbaiRate = silverRates.find(rate => rate.city === 'Mumbai');
        return mumbaiRate ? parseIndianPrice(mumbaiRate['10_gram']) / 10 : null;
    }).filter(price => price !== null); // Remove null values

    // Ensure dates matches with prices length
    const validDates = dates.slice(0, prices.length);

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: validDates,
            datasets: [{
                label: 'Silver Price in Mumbai (per gram)',
                data: prices,
                borderColor: 'silver',
                backgroundColor: 'rgba(192, 192, 192, 0.1)',
                borderWidth: 2,
                pointRadius: 3,
                pointHoverRadius: 5,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Price (₹)'
                    },
                    beginAtZero: false
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            }
        }
    });
}

function parseIndianPrice(priceString) {
    const numericString = priceString.replace(/[^\d.]/g, '');
    return parseFloat(numericString);
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

// Today script edit for silver sidebar
function handleCitySilverPricesPage() {
    const cityName = document.location.pathname.split('/').pop().replace('Silver-rate-', '').replace('.html', '');
    const formattedCityName = cityName.charAt(0).toUpperCase() + cityName.slice(1);

    if (formattedCityName) {
        document.getElementById('cityTitle').textContent = `Silver Prices in ${formattedCityName}`;
        fetchAndDisplayCitySilverPrices(formattedCityName);
    } else {
        document.getElementById('cityTitle').textContent = 'City Not Specified';
    }
}

async function fetchAndDisplayCitySilverPrices(city) {
    showLoadingSpinner();
    try {
        const todayPrices = await fetchSilverPrices(getTodayDateString());
        const cityData = todayPrices.find(price => price.city === city);

        if (cityData) {
            const silverPricesDiv = document.getElementById('silverPrices');
            if (silverPricesDiv) {
                silverPricesDiv.innerHTML = `
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="card bg-white rounded-lg shadow-lg p-4">
                            <h3 class="text-2xl font-bold text-indigo-800 mb-4">10 Gram</h3>
                            <p class="text-xl">Price: ${cityData['10_gram']}</p>
                        </div>
                        <div class="card bg-white rounded-lg shadow-lg p-4">
                            <h3 class="text-2xl font-bold text-indigo-800 mb-4">100 Gram</h3>
                            <p class="text-xl">Price: ${cityData['100_gram']}</p>
                        </div>
                        <div class="card bg-white rounded-lg shadow-lg p-4">
                            <h3 class="text-2xl font-bold text-indigo-800 mb-4">1 Kg</h3>
                            <p class="text-xl">Price: ${cityData['1_kg']}</p>
                        </div>
                    </div>
                `;
            } else {
                console.error('silverPrices div not found');
            }
        } else {
            displayError(`Unable to fetch silver prices for ${city}.`);
        }
    } catch (error) {
        displayError(`Error fetching silver prices: ${error.message}`);
    } finally {
        hideLoadingSpinner();
    }
}

function populateSilverSidebar() {
    const topCitiesList = document.getElementById('topCitiesList');
    if (!topCitiesList) return;

    // Customize this list of top cities
    const topCities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Patna', 'Surat', 'Kanpur', 'Kochi', 'Indore', 'Bhopal', 'Varanasi', 'Goa', 'Ludhiana', 'Amritsar', 'Meerut', 'Raipur', 'Guwahati', 'Nagpur'];

    topCitiesList.innerHTML = '';
    topCities.forEach(city => {
        const li = document.createElement('li');
        li.className = 'mb-4';

        const cityLink = document.createElement('a');
        const citySlug = city.toLowerCase().replace(/\s+/g, '-');
        cityLink.href = `Silver-rate-${citySlug}.html`;
        cityLink.target = '_blank'; // Opens in a new tab
        cityLink.className = 'sidebar-city-name text-indigo-600 hover:text-indigo-800';
        cityLink.className = 'text-indigo-600 hover:text-indigo-800';
        cityLink.textContent = `Silver Price in ${city}`;
        li.appendChild(cityLink);

        topCitiesList.appendChild(li);
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




function displayMumbaiPriceComparison(todayPrices, yesterdayPrices) {
    const comparisonContainer = document.getElementById('priceComparison');
    comparisonContainer.innerHTML = ''; // Clear previous content

    const todayMumbaiPrices = todayPrices.find(price => price.city === 'Mumbai');
    const yesterdayMumbaiPrices = yesterdayPrices.find(price => price.city === 'Mumbai');

    if (!todayMumbaiPrices || !yesterdayMumbaiPrices) {
        console.error('Mumbai prices not found');
        return;
    }

    const table = document.createElement('table');
    table.className = 'w-full bg-white shadow-lg rounded-lg overflow-hidden';

    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr class="bg-indigo-800 text-white">
            <th class="py-3 px-4 text-left">Weight</th>
            <th class="py-3 px-4 text-left">Today's Price</th>
            <th class="py-3 px-4 text-left">Yesterday's Price</th>
            <th class="py-3 px-4 text-left">Change</th>
        </tr>
    `;

    const tbody = document.createElement('tbody');
    ['10_gram', '100_gram', '1_kg'].forEach(weight => {
        const row = document.createElement('tr');
        const todayPrice = parseIndianPrice(todayMumbaiPrices[weight]);
        const yesterdayPrice = parseIndianPrice(yesterdayMumbaiPrices[weight]);
        const difference = todayPrice - yesterdayPrice;

        row.innerHTML = `
            <td class="py-3 px-4 border-b">${weight.replace('_', ' ')}</td>
            <td class="py-3 px-4 border-b">₹ ${todayPrice.toFixed(2)}</td>
            <td class="py-3 px-4 border-b">₹ ${yesterdayPrice.toFixed(2)}</td>
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

        // Create the city cell with a link
        const cityCell = document.createElement('td');
        cityCell.className = 'p-4 border-b';
        const cityLink = document.createElement('a');
        cityLink.href = `Silver-rate-${price.city.toLowerCase().replace(/\s+/g, '')}.html`;
        cityLink.textContent = price.city;
        cityLink.className = 'text-indigo-600 hover:text-indigo-800';
        cityCell.appendChild(cityLink);

        // Create the other cells for silver prices
        const tenGramCell = document.createElement('td');
        tenGramCell.className = 'p-4 border-b';
        tenGramCell.textContent = price['10_gram'];

        const hundredGramCell = document.createElement('td');
        hundredGramCell.className = 'p-4 border-b';
        hundredGramCell.textContent = price['100_gram'];

        const oneKgCell = document.createElement('td');
        oneKgCell.className = 'p-4 border-b';
        oneKgCell.textContent = price['1_kg'];

        // Append cells to the row
        row.appendChild(cityCell);
        row.appendChild(tenGramCell);
        row.appendChild(hundredGramCell);
        row.appendChild(oneKgCell);

        // Append the row to the table body
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

document.addEventListener('DOMContentLoaded', () => {
    const mainContainer = document.querySelector('[role="main"]');
    const chartSection = document.createElement('div');
    chartSection.className = 'mt-8';
    chartSection.innerHTML = `<h2 class="text-2xl font-bold text-indigo-800 mb-4">Historical Silver Prices (Last 10 Days)</h2>
    <div class="bg-white rounded-xl shadow-2xl p-4">
        <canvas id="historicalSilverPriceChart" style="height: 300px;"></canvas>
    </div>`;
    mainContainer.appendChild(chartSection);

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
    handleCitySilverPricesPage();
});

function updateCityPrices(selectedCity) {
    const cityData = silverPrices.find(price => price.City === selectedCity);
    if (cityData) {
        updateCityPriceCard(cityData);
    }
}
