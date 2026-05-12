let city = document.querySelector("#city");
let countryInput = document.querySelector("#countryInput");
let check = document.querySelector("#check");
let gpsBtn = document.querySelector("#gpsBtn");

let tempIcon = document.querySelector("#tempIcon");
let weatherCountry = document.querySelector("#weatherCountry");
let temperature = document.querySelector("#temperature");
let weatherDescription = document.querySelector("#weatherDescription");
let feelsLike = document.querySelector("#feelsLike");
let humidity = document.querySelector("#humidity");
let longitude = document.querySelector("#longitude");
let latitude = document.querySelector("#latitude");

let windSpeed = document.querySelector("#windSpeed");
let pressure = document.querySelector("#pressure");
let visibility = document.querySelector("#visibility");
let tempMinMax = document.querySelector("#tempMinMax");
let uvIndex = document.querySelector("#uvIndex");
let aqi = document.querySelector("#aqi");

const key = `bd4ea33ecf905116d12af172e008dbae`;

function updateWeatherUI(data) {
    if (data.cod !== 200 && data.cod !== "200") {
        alert(data.message || "City not found!");
        return;
    }

    console.log(data);
    
    let countryName = '';
    if (data.sys && data.sys.country) {
        countryName = new Intl.DisplayNames(['en'], {type: 'region'}).of(data.sys.country);
    }
    weatherCountry.innerText = `${data.name} ${countryName ? '/ ' + countryName : ''}`;

    temperature.innerHTML = `${data.main.temp}°<b>C</b>`;
    document.getElementById("container").style.backgroundImage = `url('https://picsum.photos/1600/900?random=${Math.random()}')`;

    data.weather.forEach(items => {
        weatherDescription.innerText = items.description;
        if (items.id < 250) {
            tempIcon.src = `tempicons/storm.svg`;
        } else if (items.id < 350) {
            tempIcon.src = `tempicons/drizzle.svg`;
        } else if (items.id < 550) {
            tempIcon.src = `tempicons/snow.svg`;
        } else if (items.id < 650) {
            tempIcon.src = `tempicons/rain.svg`;
        } else if (items.id < 800) {
            tempIcon.src = `tempicons/atmosphere.svg`;
        } else if (items.id === 800) {
            tempIcon.src = `tempicons/sun.svg`;
        } else if (items.id > 800) {
            tempIcon.src = `tempicons/clouds.svg`;
        }
    });

    feelsLike.innerText = `Feels Like: ${data.main.feels_like}°C`;
    humidity.innerText = `Humidity: ${data.main.humidity}%`;
    latitude.innerText = `Latitude: ${data.coord.lat}`;
    longitude.innerText = `Longitude: ${data.coord.lon}`;
    
    windSpeed.innerText = `Wind Speed: ${data.wind.speed} m/s`;
    pressure.innerText = `Pressure: ${data.main.pressure} hPa`;
    visibility.innerText = `Visibility: ${data.visibility / 1000} km`;
    tempMinMax.innerText = `Min/Max Temp: ${data.main.temp_min}°C / ${data.main.temp_max}°C`;

    fetchExtraData(data.coord.lat, data.coord.lon);
}

function calculateAQI(pm25) {
    const breakpoints = [
        { cLow: 0.0, cHigh: 12.0, iLow: 0, iHigh: 50 },
        { cLow: 12.1, cHigh: 35.4, iLow: 51, iHigh: 100 },
        { cLow: 35.5, cHigh: 55.4, iLow: 101, iHigh: 150 },
        { cLow: 55.5, cHigh: 150.4, iLow: 151, iHigh: 200 },
        { cLow: 150.5, cHigh: 250.4, iLow: 201, iHigh: 300 },
        { cLow: 250.5, cHigh: 350.4, iLow: 301, iHigh: 400 },
        { cLow: 350.5, cHigh: 500.4, iLow: 401, iHigh: 500 },
    ];
    
    let bp = breakpoints.find(b => pm25 >= b.cLow && pm25 <= b.cHigh);
    if (!bp) {
        if (pm25 > 500.4) return 500;
        return 0;
    }
    
    let aqi = ((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (pm25 - bp.cLow) + bp.iLow;
    return Math.round(aqi);
}

function fetchExtraData(lat, lon) {
    // Fetch UV Index
    let uvUrl = `https://api.openweathermap.org/data/2.5/uvi?lat=${lat}&lon=${lon}&appid=${key}`;
    fetch(uvUrl).then(res => res.json()).then(uvData => {
        uvIndex.innerText = `UV Index: ${uvData.value}`;
    }).catch(err => {
        uvIndex.innerText = `UV Index: N/A`;
    });

    // Fetch AQI
    let aqiUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${key}`;
    fetch(aqiUrl).then(res => res.json()).then(aqiData => {
        if (aqiData.list && aqiData.list.length > 0) {
            let pm25 = aqiData.list[0].components.pm2_5;
            let realAqi = calculateAQI(pm25);
            
            let status = "Good";
            if (realAqi > 50) status = "Moderate";
            if (realAqi > 100) status = "Unhealthy for Sensitive Groups";
            if (realAqi > 150) status = "Unhealthy";
            if (realAqi > 200) status = "Very Unhealthy";
            if (realAqi > 300) status = "Hazardous";
            
            aqi.innerText = `AQI: ${realAqi} (${status})`;
        }
    }).catch(err => {
        aqi.innerText = `AQI: N/A`;
    });
}

check.addEventListener("click", async () => {
    let c = city.value.trim();
    let country = countryInput.value.trim();
    if (!c && !country) return;
    
    let url = '';
    
    if (c && country) {
        let countryCode = country;
        try {
            let countryRes = await fetch(`https://restcountries.com/v3.1/name/${country}`);
            if (countryRes.ok) {
                let countryData = await countryRes.json();
                if (countryData && countryData.length > 0 && countryData[0].cca2) {
                    countryCode = countryData[0].cca2;
                }
            }
        } catch (e) {
            console.log("Failed to fetch country code.");
        }
        url = `https://api.openweathermap.org/data/2.5/weather?q=${c},${countryCode}&lang=en&units=metric&appid=${key}`;
    } else if (c) {
        url = `https://api.openweathermap.org/data/2.5/weather?q=${c}&lang=en&units=metric&appid=${key}`;
    } else if (country) {
        try {
            let countryRes = await fetch(`https://restcountries.com/v3.1/name/${country}?fullText=true`);
            if (countryRes.ok) {
                let countryData = await countryRes.json();
                if (countryData && countryData[0] && countryData[0].capital) {
                    let capital = countryData[0].capital[0];
                    let countryCode = countryData[0].cca2;
                    url = `https://api.openweathermap.org/data/2.5/weather?q=${capital},${countryCode}&lang=en&units=metric&appid=${key}`;
                }
            }
        } catch (e) {
            console.log("API failed.");
        }
        if (!url) {
            url = `https://api.openweathermap.org/data/2.5/weather?q=${country}&lang=en&units=metric&appid=${key}`;
        }
    }

    fetch(url)
        .then(response => response.json())
        .then(data => updateWeatherUI(data))
        .catch(err => alert("Error fetching weather data!"));
    
    city.value = "";
    countryInput.value = "";
});

gpsBtn.addEventListener("click", () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            let lat = position.coords.latitude;
            let lon = position.coords.longitude;
            let url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&lang=en&units=metric&appid=${key}`;
            
            fetch(url)
                .then(response => response.json())
                .then(data => updateWeatherUI(data))
                .catch(err => alert("Error fetching weather data!"));
        }, err => {
            alert("Geolocation error: " + err.message);
        });
    } else {
        alert("Geolocation is not supported by your browser.");
    }
});

// Add Enter key support on the inputs
document.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && (document.activeElement === city || document.activeElement === countryInput)) {
        check.click();
    }
});
