// city-gold-prices.js

document.addEventListener('DOMContentLoaded', handleCityGoldPricesPage);

function handleCityGoldPricesPage() {
    const cityName = document.location.pathname.split('/').pop().replace('Gold-rate-', '').replace('.html', '');
    const formattedCityName = cityName.charAt(0).toUpperCase() + cityName.slice(1);
    const cityMappings = {
        'Assam': 'Guwahati'
    };
    const actualCityName = cityMappings[formattedCityName] || formattedCityName;

    if (actualCityName) {
        document.getElementById('cityTitle').textContent = `Gold Prices in Assam`;
        fetchAndDisplayCityGoldPrices(actualCityName);
    } else {
        document.getElementById('cityTitle').textContent = 'City Not Specified';
    }
}


function populateGoldSidebar() {
    const topCitiesList = document.getElementById('topGoldCitiesList');
    if (!topCitiesList) return;

    const topCities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Patna', 'Surat', 'Kanpur', 'Kochi', 'Indore', 'Bhopal', 'Varanasi', 'Goa', 'Ludhiana', 'Amritsar', 'Meerut', 'Raipur', 'Guwahati', 'Nagpur'];
    

    topCitiesList.innerHTML = '';
    topCities.forEach(city => {
        const li = document.createElement('li');
        li.className = 'mb-4';
        
        const cityLink = document.createElement('a');
        const citySlug = city.toLowerCase().replace(/\s+/g, '-');
        cityLink.href = `Gold-rate-${citySlug}.html`;
        cityLink.target = '_blank';
        cityLink.className = 'sidebar-city-name text-indigo-600 hover:text-indigo-800';
        cityLink.className = 'text-indigo-600 hover:text-indigo-800';
        cityLink.textContent = `Gold Price in ${city}`;
        li.appendChild(cityLink);

        topCitiesList.appendChild(li);
    });
}


async function fetchAndDisplayCityGoldPrices(city) {
    showLoadingSpinner();
    try {
        const todayDateString = getTodayDateString();
        const yesterdayDateString = getYesterdayDateString();
        const [todayPrices, yesterdayPrices] = await Promise.all([
            fetchGoldPrices(todayDateString),
            fetchGoldPrices(yesterdayDateString)
        ]);

        const todayCityData = todayPrices.find(price => price.City === city);
        const yesterdayCityData = yesterdayPrices.find(price => price.City === city);

        if (todayCityData && yesterdayCityData) {
            const goldPricesDiv = document.getElementById('goldPricesAssam');
            goldPricesDiv.innerHTML = `
                <div class="mb-8">
                    <p class="mb-4">Get real-time gold prices for TamilNadu 24K, 22K, and 18K Gold per gram in INR.</p>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        ${createPriceCard('24K Gold', todayCityData['24K Today'], yesterdayCityData['24K Today'])}
                        ${createPriceCard('22K Gold', todayCityData['22K Today'], yesterdayCityData['22K Today'])}
                        ${createPriceCard('18K Gold', todayCityData['18K Today'], yesterdayCityData['18K Today'])}
                    </div>
                </div>
                <div>
                    <h2 class="text-2xl font-bold text-indigo-800 mb-4">Price Comparison</h2>
                    ${createComparisonTable(todayCityData, yesterdayCityData)}
                </div>
            `;
        } else {
            displayError(`Unable to fetch gold prices for ${city}.`);
        }
    } catch (error) {
        displayError(`Error fetching gold prices: ${error.message}`);
    } finally {
        hideLoadingSpinner();
    }
}


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
    const url = `https://gold-price-api-c095eaf86dce.herokuapp.com/api/gold/date/${dateString}?cache_buster=${Date.now()}`;
    
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
        
        let goldPrices;
        if (Array.isArray(data.gold_prices)) {
            goldPrices = data.gold_prices;
        } else if (data.data && Array.isArray(data.data.gold_prices)) {
            goldPrices = data.data.gold_prices;
        } else {
            throw new Error('Invalid data structure: gold_prices is missing or not an array');
        }
        
        return goldPrices;
    } catch (error) {
        displayError('Failed to fetch or parse prices: ' + error.message);
        return null;
    }
}

function createPriceCard(title, todayPrice, yesterdayPrice) {
    const difference = parseFloat(todayPrice.replace('₹', '').replace(',', '')) - 
                       parseFloat(yesterdayPrice.replace('₹', '').replace(',', ''));
    const changeColor = difference >= 0 ? 'text-green-600' : 'text-red-600';
    const arrow = difference >= 0 ? '↑' : '↓';

    return `
        <div class="bg-white rounded-xl shadow-lg p-6">
            <h3 class="text-xl font-bold text-indigo-800 mb-2">${title}</h3>
            <p class="text-2xl font-bold mb-2">${todayPrice}</p>
            <p class="${changeColor}">${arrow} ${Math.abs(difference).toFixed(2)}</p>
        </div>
    `;
}

function createComparisonTable(todayData, yesterdayData) {
    return `
        <div class="overflow-x-auto">
            <table class="w-full bg-white shadow-lg rounded-lg overflow-hidden mb-8">
                <thead class="bg-indigo-800 text-white">
                    <tr>
                        <th class="py-3 px-4 text-left">Carat</th>
                        <th class="py-3 px-4 text-left">Today's Price</th>
                        <th class="py-3 px-4 text-left">Yesterday's Price</th>
                        <th class="py-3 px-4 text-left">Change</th>
                    </tr>
                </thead>
                <tbody>
                    ${createTableRow('24K', todayData['24K Today'], yesterdayData['24K Today'])}
                    ${createTableRow('22K', todayData['22K Today'], yesterdayData['22K Today'])}
                    ${createTableRow('18K', todayData['18K Today'], yesterdayData['18K Today'])}
                </tbody>
            </table>
        </div>
        ${createDetailedPriceTable('24K', todayData['24K Today'], yesterdayData['24K Today'])}
        ${createDetailedPriceTable('22K', todayData['22K Today'], yesterdayData['22K Today'])}
    `;
}

function createDetailedPriceTable(carat, todayPrice, yesterdayPrice) {
    const today = parseFloat(todayPrice.replace('₹', '').replace(',', ''));
    const yesterday = parseFloat(yesterdayPrice.replace('₹', '').replace(',', ''));
    
    return `
        <div class="overflow-x-auto mb-8">
            <h3 class="text-xl font-bold text-indigo-800 mb-2">${carat} Gold Prices</h3>
            <table class="w-full bg-white shadow-lg rounded-lg overflow-hidden">
                <thead class="bg-indigo-800 text-white">
                    <tr>
                        <th class="py-3 px-4 text-left">Gram</th>
                        <th class="py-3 px-4 text-left">Today</th>
                        <th class="py-3 px-4 text-left">Yesterday</th>
                        <th class="py-3 px-4 text-left">Price Change</th>
                    </tr>
                </thead>
                <tbody>
                    ${createDetailedPriceRow(1, today, yesterday)}
                    ${createDetailedPriceRow(8, today, yesterday)}
                    ${createDetailedPriceRow(10, today, yesterday)}
                </tbody>
            </table>
        </div>
    `;
}

function createDetailedPriceRow(grams, todayPrice, yesterdayPrice) {
    const today = (todayPrice * grams).toFixed(0);
    const yesterday = (yesterdayPrice * grams).toFixed(0);
    const change = today - yesterday;
    const changeColor = change >= 0 ? 'text-green-600' : 'text-red-600';
    const arrow = change >= 0 ? '↑' : '↓';

    return `
        <tr class="border-b">
            <td class="py-3 px-4">${grams} gram${grams > 1 ? 's' : ''}</td>
            <td class="py-3 px-4">₹ ${today.toLocaleString('en-IN')}</td>
            <td class="py-3 px-4">₹ ${yesterday.toLocaleString('en-IN')}</td>
            <td class="py-3 px-4 ${changeColor}">${arrow} ₹ ${Math.abs(change).toLocaleString('en-IN')}</td>
        </tr>
    `;
}

function createTableRow(carat, todayPrice, yesterdayPrice) {
    const difference = parseFloat(todayPrice.replace('₹', '').replace(',', '')) - 
                       parseFloat(yesterdayPrice.replace('₹', '').replace(',', ''));
    const changeColor = difference >= 0 ? 'text-green-600' : 'text-red-600';
    const arrow = difference >= 0 ? '↑' : '↓';

    return `
        <tr class="border-b">
            <td class="py-3 px-4">${carat}</td>
            <td class="py-3 px-4">${todayPrice}</td>
            <td class="py-3 px-4">${yesterdayPrice}</td>
            <td class="py-3 px-4 ${changeColor}">${arrow} ${Math.abs(difference).toFixed(2)}</td>
        </tr>
    `;
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

document.addEventListener('DOMContentLoaded', () => {
    
    mainContainer.appendChild(chartSection);
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
    fetchAndDisplayCityGoldPrices();
    updateDateTime();
    setInterval(updateDateTime, 1000);
    populateGoldSidebar();
    handleCityGoldPricesPage()
});