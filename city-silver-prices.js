// city-silver-prices.js

document.addEventListener('DOMContentLoaded', handleCitySilverPricesPage);

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

function populateSilverSidebar() {
    const topCitiesList = document.getElementById('topCitiesList');
    if (!topCitiesList) return;

    const topCities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Patna', 'Surat', 'Kanpur', 'Kochi', 'Indore', 'Bhopal', 'Varanasi', 'Goa', 'Ludhiana', 'Amritsar', 'Meerut', 'Raipur', 'Guwahati', 'Nagpur'];

    topCitiesList.innerHTML = '';
    topCities.forEach(city => {
        const li = document.createElement('li');
        li.className = 'mb-4';
        
        const cityLink = document.createElement('a');
        const citySlug = city.toLowerCase().replace(/\s+/g, '-');
        cityLink.href = `Silver-rate-${citySlug}.html`;
        cityLink.target = '_blank';
        cityLink.className = 'sidebar-city-name text-indigo-600 hover:text-indigo-800';
        cityLink.className = 'text-indigo-600 hover:text-indigo-800';
        cityLink.textContent = `Silver Price in ${city}`;
        li.appendChild(cityLink);

        topCitiesList.appendChild(li);
    });
}

async function fetchAndDisplayCitySilverPrices(city) {
    showLoadingSpinner();
    try {
        const todayDateString = getTodayDateString();
        const yesterdayDateString = getYesterdayDateString();

        const [todayPrices, yesterdayPrices] = await Promise.all([
            fetchSilverPrices(todayDateString),
            fetchSilverPrices(yesterdayDateString)
        ]);

        const todayCityData = todayPrices.find(price => price.city === city);
        const yesterdayCityData = yesterdayPrices.find(price => price.city === city);

        if (todayCityData && yesterdayCityData) {
            silverPrices = todayPrices; 

            const silverPricesDiv = document.getElementById('silverPrices');
            if (silverPricesDiv) {
                silverPricesDiv.innerHTML = `
                    <div class="mb-8">
                        <p class="mb-4">Get real-time silver prices for ${city} per 10 gram, 100 gram, and 1 kg in INR.</p>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            ${createPriceCard('10 Gram', todayCityData['10_gram'], yesterdayCityData['10_gram'])}
                            ${createPriceCard('100 Gram', todayCityData['100_gram'], yesterdayCityData['100_gram'])}
                            ${createPriceCard('1 Kg', todayCityData['1_kg'], yesterdayCityData['1_kg'])}
                        </div>
                    </div>
                    <div>
                        <h2 class="text-2xl font-bold text-indigo-800 mb-4">Price Comparison</h2>
                        ${createComparisonTable(todayCityData, yesterdayCityData)}
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
            <table class="w-full bg-white shadow-lg rounded-lg overflow-hidden">
                <thead class="bg-indigo-800 text-white">
                    <tr>
                        <th class="py-3 px-4 text-left">Weight</th>
                        <th class="py-3 px-4 text-left">Today's Price</th>
                        <th class="py-3 px-4 text-left">Yesterday's Price</th>
                        <th class="py-3 px-4 text-left">Change</th>
                    </tr>
                </thead>
                <tbody>
                    ${createTableRow('10 Gram', todayData['10_gram'], yesterdayData['10_gram'])}
                    ${createTableRow('100 Gram', todayData['100_gram'], yesterdayData['100_gram'])}
                    ${createTableRow('1 Kg', todayData['1_kg'], yesterdayData['1_kg'])}
                </tbody>
            </table>
        </div>
    `;
}

function createTableRow(weight, todayPrice, yesterdayPrice) {
    const difference = parseFloat(todayPrice.replace('₹', '').replace(',', '')) - 
                       parseFloat(yesterdayPrice.replace('₹', '').replace(',', ''));
    const changeColor = difference >= 0 ? 'text-green-600' : 'text-red-600';
    const arrow = difference >= 0 ? '↑' : '↓';

    return `
        <tr class="border-b">
            <td class="py-3 px-4">${weight}</td>
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
    const mainContainer = document.getElementById('mainContainer');
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
