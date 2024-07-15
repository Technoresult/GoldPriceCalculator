// Function to fetch prices from the API
function fetchPrices(callback) {
    console.log('Fetching prices...');
    const xhr = new XMLHttpRequest();

    xhr.addEventListener('readystatechange', function () {
        console.log('ReadyState:', this.readyState, 'Status:', this.status);
        if (this.readyState === this.DONE) {
            console.log('API Response:', this.responseText);
            if (this.status === 200) {
                try {
                    const data = JSON.parse(this.responseText);
                    console.log('Parsed data:', data);

                    if (data && data.length > 0) {
                        callback(null, data);
                    } else {
                        callback(new Error('Gold price data not found'), null);
                    }
                } catch (error) {
                    console.error('Error parsing API response:', error);
                    callback(new Error('Failed to parse API response'), null);
                }
            } else {
                console.error('API request failed with status', this.status);
                callback(new Error(`API request failed with status ${this.status}`), null);
            }
        }
    });

    xhr.open('GET', `http://localhost:5000/gold-prices`);
    xhr.send(null);
}

// Function to fetch extracted data from the server
async function fetchExtractedData() {
    showLoadingSpinner();
    try {
        const response = await fetch('http://localhost:3000/extract-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        if (response.ok) {
            createExtractedDataCard(data.extractedText);
        } else {
            displayError(data.error);
        }
    } catch (error) {
        displayError('Failed to fetch extracted data: ' + error.message);
    } finally {
        hideLoadingSpinner();
    }
}

// Function to create price cards
function createPriceCards(goldPrices) {
    const priceCardsContainer = document.getElementById('priceCards');
    priceCardsContainer.innerHTML = ''; // Clear existing cards

    goldPrices.forEach(price => {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-xl shadow-xl p-6 text-center transform transition duration-500 hover:scale-105';
        card.innerHTML = `
            <h2 class="text-2xl font-bold text-indigo-800 mb-4">${price.City}</h2>
            <p class="text-3xl font-semibold text-indigo-600">1 Gram: ₹ ${formatIndianPrice(Math.round(price['Gold 22K']))}</p>
            <p class="text-3xl font-semibold text-indigo-600 mt-2">10 Gram: ₹ ${formatIndianPrice(Math.round(price['Gold 24K'] * 10))}</p>
        `;
        priceCardsContainer.appendChild(card);
    });
}

// Function to create a card for the extracted data
function createExtractedDataCard(text) {
    const priceCardsContainer = document.getElementById('priceCards');
    const card = document.createElement('div');
    card.className = 'bg-white rounded-xl shadow-xl p-6 text-center transform transition duration-500 hover:scale-105';
    card.innerHTML = `
        <h2 class="text-2xl font-bold text-indigo-800 mb-4">Extracted Data</h2>
        <p class="text-3xl font-semibold text-indigo-600">${text}</p>
    `;
    priceCardsContainer.appendChild(card);
}

// Function to format price in Indian standard with commas
function formatIndianPrice(price) {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function showLoadingSpinner() {
    document.getElementById('loadingSpinner').classList.remove('hidden');
    document.getElementById('priceCards').classList.add('hidden');
}

function hideLoadingSpinner() {
    document.getElementById('loadingSpinner').classList.add('hidden');
    document.getElementById('priceCards').classList.remove('hidden');
}

function updatePrices() {
    console.log('Updating prices...');
    showLoadingSpinner();

    fetchPrices((error, goldPrices) => {
        hideLoadingSpinner();
        if (error) {
            console.error('Error fetching prices:', error);
            displayError(`Failed to fetch prices: ${error.message}`);
        } else {
            console.log('Gold prices fetched successfully:', goldPrices);
            createPriceCards(goldPrices);
            document.getElementById('errorMessage').classList.add('hidden');
        }
    });
}

// New function to calculate custom gram price
function calculateCustomPrice(carat, grams) {
    const priceCards = document.getElementById('priceCards');
    if (priceCards.children.length > 0) {
        const card = priceCards.children[0]; // Use the first card for calculation
        const pricePerGram = parseInt(card.querySelector(`p:nth-child(${carat === '22' ? 2 : 3})`).textContent.split('₹')[1].replace(/,/g, '').trim());
        const totalPrice = Math.round(pricePerGram * (carat === '22' ? 1 : 10) * grams / (carat === '22' ? 1 : 10));
        return formatIndianPrice(totalPrice);
    }
    return null;
}

// Event listener for the calculate button
document.getElementById('calculateButton').addEventListener('click', () => {
    const caratSelect = document.getElementById('caratSelect');
    const gramInput = document.getElementById('gramInput');
    const resultDiv = document.getElementById('calculationResult');
    
    const selectedCarat = caratSelect.value;
    const grams = parseFloat(gramInput.value);

    if (isNaN(grams) || grams <= 0) {
        resultDiv.textContent = 'Please enter a valid number of grams.';
        return;
    }

    const price = calculateCustomPrice(selectedCarat, grams);
    if (price) {
        resultDiv.textContent = `Price for ${grams} grams of ${selectedCarat}K gold: ₹ ${price}`;
    } else {
        resultDiv.textContent = 'Unable to calculate. Please refresh prices.';
    }
});

// Function to display error messages
function displayError(message) {
    const errorMessageElement = document.getElementById('errorMessage');
    errorMessageElement.textContent = message;
    errorMessageElement.classList.remove('hidden');
}

// Call the updatePrices function when the page loads
document.addEventListener('DOMContentLoaded', () => {
    updatePrices();
    fetchExtractedData();
});

// Call the updatePrices function when the refresh button is clicked
document.getElementById('refreshButton').addEventListener('click', () => {
    updatePrices();
    fetchExtractedData();
});
