function populateGoldSidebar() {
    const topCitiesList = document.getElementById('topGoldCitiesList');
    if (!topCitiesList) return;

    
    const topCities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Patna', 'Surat', 'Kanpur', 'Kochi', 'Indore', 'Bhopal', 'Varanasi', 'Goa', 'Ludhiana', 'Amritsar', 'Meerut', 'Raipur', 'Guwahati', 'Nagpur'];

    topCitiesList.innerHTML = '';
    topCities.forEach(city => {
        const li = document.createElement('li');
        li.className = 'mb-4';
        
        const cityLink = document.createElement('a');
        cityLink.href = `city_gold_prices.html?city=${encodeURIComponent(city)}`;
        cityLink.target = '_blank'; // Opens in a new tab
        cityLink.className = 'sidebar-city-name text-indigo-600 hover:text-indigo-800';
        cityLink.textContent = `Gold Price in ${city}`;
        li.appendChild(cityLink);

        topCitiesList.appendChild(li);
    });
}


this i need to change

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
        cityLink.href = `https://goldcalculatorindia.in/Gold-rate-${citySlug}.html`;
        cityLink.target = '_blank'; // Opens in a new tab
        cityLink.className = 'sidebar-city-name text-indigo-600 hover:text-indigo-800';
        cityLink.textContent = `Gold Price in ${city}`;
        li.appendChild(cityLink);

        topCitiesList.appendChild(li);
    });
}