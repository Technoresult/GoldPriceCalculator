let goldPrices = [];
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

//Function to fetch the historical price rates from server

async function fetchHistoricalPrices(days = 10) {
    const url = `https://gold-price-api-c095eaf86dce.herokuapp.com/api/gold/history/${days}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching historical prices:', error);
      return null;
    }
  }

  //************************************** */

  async function fetchAndComparePrices() {
    showLoadingSpinner();
    const todayDateString = getTodayDateString();
    const yesterdayDateString = getYesterdayDateString();

    try {
        const [todayPrices, yesterdayPrices, historicalPrices] = await Promise.all([
            fetchGoldPrices(todayDateString),
            fetchGoldPrices(yesterdayDateString),
            fetchHistoricalPrices(20)
        ]);

        if (todayPrices && yesterdayPrices && historicalPrices) {
            goldPrices = todayPrices;
            clearPriceCards();
            createMumbaiPriceCards(todayPrices, yesterdayPrices);
            displayMumbaiPriceComparison(todayPrices, yesterdayPrices);
            populateGoldPriceComparison(todayPrices, yesterdayPrices);
            populateCityDropdowns();
            populateGoldPricesTable();
            populateGoldSidebar();
            createHistoricalPriceChart(historicalPrices);
        } else {
            throw new Error('Failed to fetch gold prices for today, yesterday, or historical data');
        }
        
    } catch (error) {
        displayError('Failed to fetch or compare prices: ' + error.message);
    } finally {
        hideLoadingSpinner();
    }
}


function createMumbaiPriceCards(todayPrices, yesterdayPrices) {
    const priceCardsContainer = document.getElementById('priceCards');
    if (!priceCardsContainer) {
        console.error('priceCardsContainer is not defined');
        return;
    }
    
    const carats = ['24K', '22K', '18K'];
    
    const todayMumbaiPrices = todayPrices.find(price => price.City === 'Mumbai');
    const yesterdayMumbaiPrices = yesterdayPrices.find(price => price.City === 'Mumbai');
    
    if (!todayMumbaiPrices || !yesterdayMumbaiPrices) {
        console.error('Mumbai prices not found');
        return;
    }
    
    carats.forEach(carat => {
        const todayPrice = parseIndianPrice(todayMumbaiPrices[`${carat} Today`]);
        const yesterdayPrice = parseIndianPrice(yesterdayMumbaiPrices[`${carat} Today`]);
        const difference = todayPrice - yesterdayPrice;
        
        createPriceCard(carat, todayPrice, difference);
    });
}

// Helper function to parse Indian price string to number
function parseIndianPrice(priceStr) {
    return parseFloat(priceStr.replace('₹', '').replace(',', '').trim());
}

// Function to create the historical price charts
function createHistoricalPriceChart(historicalData) {
    const ctx = document.getElementById('historicalPriceChart').getContext('2d');

    // Prepare data for the chart
    const dates = historicalData.map(item => new Date(item.timestamp).toLocaleDateString());
    const prices24K = historicalData.map(item => {
        const mumbaiPrice = item.data.gold_prices.find(price => price.City === 'Mumbai');
        return mumbaiPrice ? parseIndianPrice(mumbaiPrice['24K Today']) : null;
    });
    const prices22K = historicalData.map(item => {
        const mumbaiPrice = item.data.gold_prices.find(price => price.City === 'Mumbai');
        return mumbaiPrice ? parseIndianPrice(mumbaiPrice['22K Today']) : null;
    });
    const prices18K = historicalData.map(item => {
        const mumbaiPrice = item.data.gold_prices.find(price => price.City === 'Mumbai');
        return mumbaiPrice ? parseIndianPrice(mumbaiPrice['18K Today']) : null;
    });

    // Filter out null values
    const filteredDates = dates.filter((_, index) => prices24K[index] !== null);
    const filteredPrices24K = prices24K.filter(price => price !== null);
    const filteredPrices22K = prices22K.filter(price => price !== null);
    const filteredPrices18K = prices18K.filter(price => price !== null);

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: filteredDates,
            datasets: [
                {
                    label: '24K Gold Price',
                    data: filteredPrices24K,
                    borderColor: 'gold',
                    backgroundColor: 'rgba(255, 215, 0, 0.1)',
                    borderWidth: 2,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    fill: true
                },
                {
                    label: '22K Gold Price',
                    data: filteredPrices22K,
                    borderColor: 'silver',
                    backgroundColor: 'rgba(192, 192, 192, 0.1)',
                    borderWidth: 2,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    fill: true
                },
                {
                    label: '18K Gold Price',
                    data: filteredPrices18K,
                    borderColor: 'bronze',
                    backgroundColor: 'rgba(139, 69, 19, 0.1)',
                    borderWidth: 2,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    fill: true
                }
            ]
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


//****************************************************************** */


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
// TOday gold price details
function handleCityGoldPricesPage() {
    const cityName = document.location.pathname.split('/').pop().replace('Gold-rate-', '').replace('.html', '');
    const formattedCityName = cityName.charAt(0).toUpperCase() + cityName.slice(1);
    
    if (formattedCityName) {
        document.getElementById('cityTitle').textContent = `Gold Prices in ${formattedCityName}`;
        fetchAndDisplayCityGoldPrices(formattedCityName);
    } else {
        document.getElementById('cityTitle').textContent = 'City Not Specified';
    }
}
// function for Gold price comparison 22k and 24k table

function populateGoldPriceComparison(todayPrices, yesterdayPrices) {
    const table24K = document.getElementById('goldPriceComparisonBody24K');
    const table22K = document.getElementById('goldPriceComparisonBody22K');
    
    if (!table24K || !table22K) {
      console.error('Gold price comparison table bodies not found');
      return;
    }
  
    table24K.innerHTML = '';
    table22K.innerHTML = '';
  
    const todayMumbaiPrices = todayPrices.find(price => price.City === 'Mumbai');
    const yesterdayMumbaiPrices = yesterdayPrices.find(price => price.City === 'Mumbai');
  
    if (!todayMumbaiPrices || !yesterdayMumbaiPrices) {
      console.error('Mumbai prices not found');
      return;
    }
  
    const gramWeights = [1, 8, 10];
    const carats = ['24K', '22K'];
  
    carats.forEach(carat => {
      const tableBody = carat === '24K' ? table24K : table22K;
      const todayPrice = parseIndianPrice(todayMumbaiPrices[`${carat} Today`]);
      const yesterdayPrice = parseIndianPrice(yesterdayMumbaiPrices[`${carat} Today`]);
  
      gramWeights.forEach(weight => {
        const row = document.createElement('tr');
        const todayTotalPrice = todayPrice * weight;
        const yesterdayTotalPrice = yesterdayPrice * weight;
        const priceChange = todayTotalPrice - yesterdayTotalPrice;
  
        row.innerHTML = `
          <td class="py-3 px-4 border-b">${weight} gram${weight > 1 ? 's' : ''}</td>
          <td class="py-3 px-4 border-b">₹ ${todayTotalPrice.toFixed(2)}</td>
          <td class="py-3 px-4 border-b">₹ ${yesterdayTotalPrice.toFixed(2)}</td>
          <td class="py-3 px-4 border-b ${priceChange > 0 ? 'text-green-600' : priceChange < 0 ? 'text-red-600' : ''}">
            ${priceChange > 0 ? '↑' : priceChange < 0 ? '↓' : ''} ₹ ${Math.abs(priceChange).toFixed(2)}
          </td>
        `;
  
        tableBody.appendChild(row);
      });
  
      // Add a header row for the next carat (if it's 24K)
      if (carat === '24K') {
        const headerRow = document.createElement('tr');
        headerRow.innerHTML = `
          <td colspan="4" class="py-3 px-4 bg-indigo-100 font-bold">22K Gold Prices</td>
        `;
        table22K.appendChild(headerRow);
      }
    });
  }


///

async function fetchAndDisplayCityGoldPrices(city) {
    showLoadingSpinner();
    try {
        const todayPrices = await fetchGoldPrices(getTodayDateString());
        const cityData = todayPrices.find(price => price.City.toLowerCase() === city.toLowerCase());

        if (cityData) {
            const goldPricesDiv = document.getElementById('goldPrices');
            goldPricesDiv.innerHTML = `
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="card bg-white rounded-lg shadow-lg p-4">
                        <h3 class="text-2xl font-bold text-indigo-800 mb-4">24K Gold</h3>
                        <p class="text-xl">Price: ${cityData['24K Today']}</p>
                    </div>
                    <div class="card bg-white rounded-lg shadow-lg p-4">
                        <h3 class="text-2xl font-bold text-indigo-800 mb-4">22K Gold</h3>
                        <p class="text-xl">Price: ${cityData['22K Today']}</p>
                    </div>
                    <div class="card bg-white rounded-lg shadow-lg p-4">
                        <h3 class="text-2xl font-bold text-indigo-800 mb-4">18K Gold</h3>
                        <p class="text-xl">Price: ${cityData['18K Today']}</p>
                    </div>
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



function populateGoldSidebar() {
    const topCitiesList = document.getElementById('topGoldCitiesList');
    if (!topCitiesList) return;

    const topCities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Patna', 'Surat', 'Kanpur', 'Kochi', 'Indore', 'Bhopal', 'Varanasi', 'Goa', 'Ludhiana', 'Amritsar', 'Meerut', 'Raipur', 'Guwahati', 'Nagpur'];

    topCitiesList.innerHTML = '';
    topCities.forEach(city => {
        const li = document.createElement('li');
        li.className = 'mb-4';
        
        const cityLink = document.createElement('a');
        // Convert the city name to lowercase and replace spaces with hyphens for the URL
        const citySlug = city.toLowerCase().replace(/\s+/g, '-');
        cityLink.href = `Gold-rate-${citySlug}.html`;
        cityLink.target = '_blank'; // Opens in a new tab
        cityLink.className = 'sidebar-city-name text-indigo-600 hover:text-indigo-800';
        cityLink.className = 'text-indigo-600 hover:text-indigo-800';
        cityLink.textContent = `Gold Price in ${city}`;
        li.appendChild(cityLink);

        topCitiesList.appendChild(li);
    });
}
//Today script



// This function will display Gold Prices

function displayCityGoldPrices(city) {
    const cityData = goldPrices.find(price => price.City === city);
    if (!cityData) {
        console.error(`No data found for city: ${city}`);
        return;
    }

    const cityGoldPrices = document.getElementById('cityGoldPrices');
    const selectedCityName = document.getElementById('selectedCityName');
    const price24K = document.getElementById('price24K');
    const price22K = document.getElementById('price22K');
    const price18K = document.getElementById('price18K');

    selectedCityName.textContent = `Gold Price in ${city}`;
    price24K.textContent = `24K: ${cityData['24K Today']}`;
    price22K.textContent = `22K: ${cityData['22K Today']}`;
    price18K.textContent = `18K: ${cityData['18K Today']}`;

    cityGoldPrices.classList.remove('hidden');
}



function displayMumbaiPriceComparison(todayPrices, yesterdayPrices) {
    const comparisonContainer = document.getElementById('priceComparison');
    if (!comparisonContainer) {
        console.error('priceComparison element not found');
        return;
    }
    comparisonContainer.innerHTML = ''; // Clear previous content

    const todayMumbaiPrices = todayPrices.find(price => price.City === 'Mumbai');
    const yesterdayMumbaiPrices = yesterdayPrices.find(price => price.City === 'Mumbai');

    if (!todayMumbaiPrices || !yesterdayMumbaiPrices) {
        console.error('Mumbai prices not found');
        return;
    }

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
        const todayPrice = parseIndianPrice(todayMumbaiPrices[`${carat} Today`]);
        const yesterdayPrice = parseIndianPrice(yesterdayMumbaiPrices[`${carat} Today`]);
        const difference = todayPrice - yesterdayPrice;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="py-3 px-4 border-b">${carat}</td>
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

        // Create city cell with a link
        const cityCell = document.createElement('td');
        cityCell.className = 'py-3 px-4 border-b';
        
        const cityLink = document.createElement('a');
        const citySlug = price['City'].toLowerCase().replace(/\s+/g, '-'); // Convert city name to slug
        cityLink.href = `Gold-rate-${citySlug}.html`;
        cityLink.textContent = price['City'];
        cityLink.className = 'text-indigo-600 hover:text-indigo-800';
        
        cityCell.appendChild(cityLink);
        row.appendChild(cityCell);

        // Create cells for 24K, 22K, and 18K prices
        ['24K Today', '22K Today', '18K Today'].forEach((key) => {
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
    const mainContainer = document.querySelector('[role="main"]');
    const chartSection = document.createElement('div');
    chartSection.className = 'mt-8';
    chartSection.innerHTML = `<h2 class="text-2xl font-bold text-indigo-800 mb-4">Historical Gold Prices (Last 10 Days)</h2>
    <div class="bg-white rounded-xl shadow-2xl p-4">
      <canvas id="historicalPriceChart" style="height: 300px;"></canvas>
    </div>`;
    mainContainer.appendChild(chartSection);

    // FAQ Section
    const faqSection = document.createElement('section');
    faqSection.className = 'mt-8 bg-white rounded-xl shadow-2xl p-8';
    faqSection.innerHTML = `
        <h2 class="text-2xl font-bold text-indigo-800 mb-4">Frequently Asked Questions</h2>
        <div class="space-y-6">
            <div>
                <h3 class="text-xl font-semibold text-indigo-700">1. About Gold Calculator</h3>
                <p class="text-gray-700">A Gold Rate Calculator, also referred to as a Gold Price Calculator, is a user-friendly online tool designed to help you determine the current market value of your gold holdings. Whether you own gold jewelry, coins, or bars, this calculator provides an accurate estimate of your gold's worth based on the latest gold prices.</p>
                <p class="text-gray-700 mb-4">The tool works by taking into account several key factors:</p>
                <ul class="list-disc list-inside text-gray-700 mb-4">
                    <li><strong>Current Gold Rate per Gram:</strong> The calculator uses the most up-to-date market prices for gold, typically available in various carats like 24K, 22K, and 18K, to calculate the value of your gold.</li>
                    <li><strong>Weight of the Gold Item:</strong> You can input the exact weight of your gold item in grams. Whether it's a gold necklace, ring, or any other piece of jewelry, the calculator can handle it.</li>
                    <li><strong>Purity of Gold:</strong> Different gold items have varying levels of purity, usually indicated by the carat value. The calculator considers this to provide an accurate valuation.</li>
                    <li><strong>Currency Conversion:</strong> The calculator typically provides the estimated value in the local currency, which, in the case of India, is the Indian Rupee (INR).</li>
                </ul>
                <p class="text-gray-700">By inputting these details, the Gold Rate Calculator quickly provides you with an approximate value of your gold. This tool is particularly useful for those looking to sell or insure their gold, as it offers a reliable estimate of what their gold is currently worth in the market.</p>
            </div>
            <div>
                <h3 class="text-xl font-semibold text-indigo-700">2. How Gold Calculator Works</h3>
                <p class="text-gray-700">The calculator fetches the latest gold prices from reliable sources and allows you to input the weight of your gold in grams and select the purity (Carat) to calculate its current value.</p>
            </div>
            <div>
                <h3 class="text-xl font-semibold text-indigo-700">3. What is Gold Carat?</h3>
                <p class="text-gray-700">Gold carat (or Karat) measures the purity of gold. 24K gold is 100% pure, 22K gold contains 22 parts gold and 2 parts other metals, and 18K gold contains 18 parts gold and 6 parts other metals.</p>
            </div>
            <div>
                <h3 class="text-xl font-semibold text-indigo-700">4. Formula for Gold Value Calculation</h3>
                <p class="text-gray-700">The value of gold is calculated using the formula: <br>
                <strong>Gold Value (₹) = (Weight in grams) × (Gold Rate per gram) × (Purity / 24) + Making Charges per Gram + GST on (Jewellery Price + Making Charges)</strong></p>
            </div>
        </div>`;
    mainContainer.appendChild(faqSection);

    
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
    populateGoldSidebar();
    handleCityGoldPricesPage()
});

function updateCityPrices(selectedCity) {
    const cityData = goldPrices.find(price => price.City === selectedCity);
    if (cityData) {
        updateCityPriceCard(cityData);
    }
}
