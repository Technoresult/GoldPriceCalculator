let silverPrices=[];const initialDisplayCount=20;let currentDisplayCount=20;function getTodayDateString(){let e=new Date,t=e.getFullYear(),r=String(e.getMonth()+1).padStart(2,"0"),a=String(e.getDate()).padStart(2,"0");return`${t}-${r}-${a}`}function getYesterdayDateString(){let e=new Date;e.setDate(e.getDate()-1);let t=e.getFullYear(),r=String(e.getMonth()+1).padStart(2,"0"),a=String(e.getDate()).padStart(2,"0");return`${t}-${r}-${a}`}async function fetchSilverPrices(e){try{let t=await fetch(`https://raw.githubusercontent.com/Technoresult/GoldPriceCalculator/main/Folder/S_${e}.json`),r=await t.json();if(console.log("Fetched data:",r),!r.silver_rates)throw Error("No silver rates found in the fetched data");return r.silver_rates}catch(a){return console.error("Error fetching prices:",a),displayError("Failed to fetch prices: "+a.message),null}}async function fetchAndComparePrices(){showLoadingSpinner();let e=getTodayDateString(),t=getYesterdayDateString();try{let[r,a]=await Promise.all([fetchSilverPrices(e),fetchSilverPrices(t)]);if(r&&a){let n=calculateAveragePrice(r),i=calculateAveragePrice(a);silverPrices=r,clearPriceCards(),createAveragePriceCards(n,i),displayAveragePriceComparison(n,i),populateCityDropdowns(),populatePriceTable(),populateSilverSidebar()}}catch(l){console.error("Error fetching or comparing prices:",l),displayError("Failed to fetch or compare prices: "+l.message)}finally{hideLoadingSpinner()}}function calculateAveragePrice(e){let t=e.reduce((e,t)=>e+parseIndianPrice(t["10_gram"]),0);return t/e.length/10}function createAveragePriceCards(e,t){let r=document.getElementById("priceCards");if(!r){console.error("priceCardsContainer is not defined");return}[1,8,10].forEach(r=>{let a=e*r;createPriceCard(r,a,a-t*r)})}function createPriceCard(e,t,r){let a=document.getElementById("priceCards"),n=document.createElement("div");n.className="bg-white rounded-xl shadow-2xl p-8 text-center price-card mb-4 w-full md:w-1/3";let i=document.createElement("h3");i.className="text-2xl font-bold text-indigo-800 mb-4",i.textContent=`${e} Gram${e>1?"s":""}`;let l=document.createElement("p");l.className="text-xl text-gray-700",l.textContent=`₹ ${t.toFixed(2)}`;let c=document.createElement("p");c.className=`text-lg ${r>0?"text-green-600":"text-red-600"}`,c.textContent=`${r>0?"↑":"↓"} ${Math.abs(r).toFixed(2)}`,n.appendChild(i),n.appendChild(l),n.appendChild(c),a.appendChild(n)}function populateSilverSidebar(){let e=document.getElementById("topCitiesList");e&&(e.innerHTML="",["Mumbai","Delhi","Bangalore","Chennai","Kolkata","Hyderabad","Kerala","Pune"].forEach(t=>{let r=silverPrices.find(e=>e.city===t);if(r){let a=document.createElement("li");a.className="mb-4";let n=document.createElement("h3");n.className="text-lg font-semibold text-indigo-800 mb-2",n.textContent=`Silver Price in ${t}`,a.appendChild(n);let i=document.createElement("ul");i.className="list-none pl-0",["10_gram","100_gram","1_kg"].forEach(e=>{let t=document.createElement("li");t.className="text-sm text-gray-600",t.textContent=`${e.replace("_"," ")}: ${r[e]}`,i.appendChild(t)}),a.appendChild(i),e.appendChild(a)}}))}function displayCitySilverPrices(e){let t=silverPrices.find(t=>t.city===e);if(!t){console.error(`No data found for city: ${e}`);return}let r=document.getElementById("citySilverPrices"),a=document.getElementById("selectedCityName"),n=document.getElementById("price10Gram"),i=document.getElementById("price100Gram"),l=document.getElementById("price1Kg");a.textContent=`Silver Price in ${e}`,n.textContent=`10g: ${t["10_gram"]}`,i.textContent=`100g: ${t["100_gram"]}`,l.textContent=`1kg: ${t["1_kg"]}`,r.classList.remove("hidden")}function displayAveragePriceComparison(e,t){let r=document.getElementById("priceComparison");r.innerHTML="";let a=document.createElement("table");a.className="w-full bg-white shadow-lg rounded-lg overflow-hidden";let n=document.createElement("thead");n.innerHTML=`
        <tr class="bg-indigo-800 text-white">
            <th class="py-3 px-4 text-left">Today's Price</th>
            <th class="py-3 px-4 text-left">Yesterday's Price</th>
            <th class="py-3 px-4 text-left">Change</th>
        </tr>
    `;let i=document.createElement("tbody"),l=document.createElement("tr"),c=e-t;l.innerHTML=`
        <td class="py-3 px-4 border-b">₹ ${e.toFixed(2)}</td>
        <td class="py-3 px-4 border-b">₹ ${t.toFixed(2)}</td>
        <td class="py-3 px-4 border-b ${c>0?"text-green-600":"text-red-600"}">
            ${c>0?"↑":"↓"} ${Math.abs(c).toFixed(2)}
        </td>
    `,i.appendChild(l),a.appendChild(n),a.appendChild(i),r.appendChild(a)}function populatePriceTable(){let e=document.querySelector("#priceTable tbody");if(e.innerHTML="",!silverPrices||0===silverPrices.length){console.error("No silver prices available to display"),displayError("No silver prices available to display");return}let t=silverPrices.slice(0,currentDisplayCount);t.forEach(t=>{let r=document.createElement("tr"),a=document.createElement("td");a.className="p-4 border-b",a.textContent=t.city;let n=document.createElement("td");n.className="p-4 border-b",n.textContent=t["10_gram"];let i=document.createElement("td");i.className="p-4 border-b",i.textContent=t["100_gram"];let l=document.createElement("td");l.className="p-4 border-b",l.textContent=t["1_kg"],r.appendChild(a),r.appendChild(n),r.appendChild(i),r.appendChild(l),e.appendChild(r)}),updateLoadMoreButton()}function updateLoadMoreButton(){let e=document.getElementById("loadMoreButton");currentDisplayCount>=silverPrices.length?e.style.display="none":e.style.display="block"}function clearPriceCards(){let e=document.getElementById("priceCards");e&&(e.innerHTML="")}function parseIndianPrice(e){let t=e.replace(/[^\d.]/g,"");return parseFloat(t)}function populateCityDropdowns(){let e=document.getElementById("citySelectCustom"),t=document.getElementById("citySelectPrices");[e,t].forEach(e=>{e.innerHTML='<option value="">Select City</option>',silverPrices.forEach(t=>{let r=document.createElement("option");r.value=t.city,r.textContent=t.city,e.appendChild(r)})})}function updateCityPriceCard(e){let t=document.getElementById("cityPriceCardSection");if(!t)return;let r=t.querySelector(".price-999");r.textContent=`999: ${e["10_gram"]}`}function calculateCustomPrice(){let e=document.getElementById("citySelectCustom").value,t=parseFloat(document.getElementById("gramInput").value);if(!e||isNaN(t)){alert("Please fill in all fields correctly.");return}let r=silverPrices.find(t=>t.city===e);if(!r){alert("City data not found.");return}let a=parseIndianPrice(r["10_gram"])/10;document.getElementById("calculationResult").textContent=`Total Price: ₹ ${(a*t).toFixed(2)}`}function updateCityPrices(e){let t=silverPrices.find(t=>t.city===e);t&&updateCityPriceCard(t)}function showLoadingSpinner(){document.getElementById("loadingSpinner").classList.remove("hidden")}function hideLoadingSpinner(){document.getElementById("loadingSpinner").classList.add("hidden")}function displayError(e){let t=document.getElementById("errorMessage");t.textContent=e,t.classList.remove("hidden")}function updateDateTime(){let e=new Date,t=e.toLocaleDateString("en-IN",{year:"numeric",month:"long",day:"numeric"});document.getElementById("lastUpdated").innerHTML=`<span style="font-size: 1.2em; font-weight: bold;">${t}</span>`}document.getElementById("refreshButton").addEventListener("click",fetchAndComparePrices),document.getElementById("calculateButton").addEventListener("click",calculateCustomPrice),document.getElementById("loadMoreButton").addEventListener("click",()=>{currentDisplayCount+=20,populatePriceTable()}),document.getElementById("citySelectCustom").addEventListener("change",e=>{let t=e.target.value;document.getElementById("citySelectPrices").value=t,updateCityPrices(t)}),document.getElementById("citySelectPrices").addEventListener("change",e=>{let t=e.target.value;document.getElementById("citySelectCustom").value=t,updateCityPrices(t)}),fetchAndComparePrices(),populateSilverSidebar(),updateDateTime(),setInterval(updateDateTime,1e3);
