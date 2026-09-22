const mobileCardQuery = window.matchMedia("(max-width: 760px)");
const cardSelector = "[data-mobile-observe]";
let mobileCardObserver = null;
let activeTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

function setActiveCard(entries, cards) {
  entries.forEach((entry) => {
    const card = entry.target;

    if (entry.isIntersecting) {
      card.classList.add("is-active");
    } else {
      card.classList.remove("is-active");
    }
  });
}

function initMobileCardScroll() {
  const cards = Array.from(document.querySelectorAll(cardSelector));

  if (mobileCardObserver) {
    mobileCardObserver.disconnect();
    mobileCardObserver = null;
  }

  if (!cards.length || !mobileCardQuery.matches) {
    cards.forEach((card) => card.classList.remove("is-active"));
    return;
  }

  mobileCardObserver = new IntersectionObserver(
    (entries) => setActiveCard(entries, cards),
    {
      threshold: 0.2,
      rootMargin: "-15% 0px -35% 0px",
    }
  );

  cards.forEach((card) => mobileCardObserver.observe(card));
}

function updateLiveTime() {
  const timeNode = document.getElementById("live-time");

  if (!timeNode) return;

  const date = new Date();
  const timezoneParts = new Intl.DateTimeFormat("en-US", {
    timeZone: activeTimeZone,
    timeZoneName: "short",
  }).formatToParts(date);
  const tzName = timezoneParts.find((part) => part.type === "timeZoneName")?.value || "IST";

  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: activeTimeZone,
    weekday: "long",
  }).format(date).toUpperCase();
  const month = new Intl.DateTimeFormat("en-US", {
    timeZone: activeTimeZone,
    month: "long",
  }).format(date).toUpperCase();
  const day = new Intl.DateTimeFormat("en-US", {
    timeZone: activeTimeZone,
    day: "numeric",
  }).format(date);
  const year = new Intl.DateTimeFormat("en-US", {
    timeZone: activeTimeZone,
    year: "numeric",
  }).format(date);
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: activeTimeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(date).toUpperCase();

  const displayTz = tzName === "GMT+5:30" ? "IST" : tzName;
  timeNode.textContent = `${displayTz} ${weekday}, ${month} ${day}, ${year} AT ${time}`;
}

function formatCoordinate(value, positiveDirection, negativeDirection) {
  const direction = value >= 0 ? positiveDirection : negativeDirection;
  return `${Math.abs(value).toFixed(4)}° ${direction}`;
}

function updateCoordinatesText(latitude, longitude, place) {
  const coordinatesNode = document.getElementById("live-coordinates");

  if (!coordinatesNode) return;

  const coordinates = `${formatCoordinate(latitude, "N", "S")}, ${formatCoordinate(longitude, "E", "W")}`;
  coordinatesNode.textContent = place ? `${coordinates} • ${place}` : coordinates;
}

function weatherDescription(code) {
  const descriptions = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Cloudy",
    45: "Fog",
    48: "Rime fog",
    51: "Light drizzle",
    53: "Drizzle",
    55: "Heavy drizzle",
    61: "Light rain",
    63: "Rain",
    65: "Heavy rain",
    71: "Light snow",
    73: "Snow",
    75: "Heavy snow",
    80: "Rain showers",
    81: "Showers",
    82: "Heavy showers",
    95: "Thunderstorm",
    96: "Thunderstorm with hail",
    99: "Thunderstorm with hail",
  };

  return descriptions[code] || "Fresh weather";
}

function weatherMoodClass(code) {
  if (code === 0 || code === 1) return "weather-card--clear";
  if (code === 2 || code === 3) return "weather-card--clouds";
  if (code === 45 || code === 48) return "weather-card--fog";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "weather-card--rain";
  if (code >= 71 && code <= 77) return "weather-card--snow";
  if (code >= 95) return "weather-card--storm";
  return "weather-card--loading";
}

function setWeatherState(className) {
  const card = document.getElementById("weather-card");

  if (!card) return;

  card.className = `weather-card ${className}`;
}

function updateWeatherText({ temperature, apparent, wind, condition, place }) {
  const tempNode = document.getElementById("weather-temp");
  const conditionNode = document.getElementById("weather-condition");
  const detailNode = document.getElementById("weather-detail");

  if (tempNode) tempNode.textContent = `${Math.round(temperature)}°`;
  if (conditionNode) conditionNode.textContent = condition;
  if (detailNode) {
    detailNode.textContent = `${place} • feels ${Math.round(apparent)}° • wind ${Math.round(wind)} km/h`;
  }
}

function updateWeatherMore({ humidity, precipitation, windDirection, updatedAt }) {
  const humidityNode = document.getElementById("weather-humidity");
  const precipNode = document.getElementById("weather-precip");
  const windDirectionNode = document.getElementById("weather-wind-direction");
  const updatedNode = document.getElementById("weather-updated");

  if (humidityNode) humidityNode.textContent = `${Math.round(humidity)}%`;
  if (precipNode) precipNode.textContent = `${precipitation.toFixed(1)} mm`;
  if (windDirectionNode) windDirectionNode.textContent = `${Math.round(windDirection)}°`;
  if (updatedNode) {
    updatedNode.textContent = new Intl.DateTimeFormat("en-US", {
      timeZone: activeTimeZone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(updatedAt)).toUpperCase();
  }
}

function setWeatherUnavailable(message) {
  setWeatherState("weather-card--unavailable");

  const tempNode = document.getElementById("weather-temp");
  const conditionNode = document.getElementById("weather-condition");
  const detailNode = document.getElementById("weather-detail");
  const moreNode = document.getElementById("weather-more");

  if (tempNode) tempNode.textContent = "--°";
  if (conditionNode) conditionNode.textContent = "Weather unavailable";
  if (detailNode) detailNode.textContent = message;
  if (moreNode) {
    moreNode.querySelectorAll("strong").forEach((node) => {
      node.textContent = "--";
    });
  }
}

async function fetchPlaceName(latitude, longitude) {
  const response = await fetch(
    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
  );

  if (!response.ok) throw new Error("Location lookup failed");

  const data = await response.json();
  const locality = data.city || data.locality || data.principalSubdivision || "Current location";
  const country = data.countryName || "";

  return country ? `${locality}, ${country}` : locality;
}

async function fetchWeather(latitude, longitude) {
  const weatherUrl = new URL("https://api.open-meteo.com/v1/forecast");
  weatherUrl.search = new URLSearchParams({
    latitude,
    longitude,
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m",
    temperature_unit: "celsius",
    wind_speed_unit: "kmh",
    timezone: "auto",
  });

  const response = await fetch(weatherUrl);

  if (!response.ok) throw new Error("Weather lookup failed");

  return response.json();
}

async function updateLiveWeather(latitude, longitude) {
  try {
    const [weatherData, place] = await Promise.all([
      fetchWeather(latitude, longitude),
      fetchPlaceName(latitude, longitude).catch(() => "Current location"),
    ]);
    const current = weatherData.current;

    if (!current) throw new Error("Weather data missing");

    activeTimeZone = weatherData.timezone || activeTimeZone;
    updateLiveTime();
    setWeatherState(weatherMoodClass(current.weather_code));
    updateWeatherText({
      temperature: current.temperature_2m,
      apparent: current.apparent_temperature,
      wind: current.wind_speed_10m,
      condition: weatherDescription(current.weather_code),
      place,
    });
    updateWeatherMore({
      humidity: current.relative_humidity_2m,
      precipitation: current.precipitation,
      windDirection: current.wind_direction_10m,
      updatedAt: current.time,
    });
  } catch (error) {
    setWeatherUnavailable("Could not load live weather right now.");
  }
}

function initWeatherCardToggle() {
  const card = document.getElementById("weather-card");

  if (!card) return;

  const toggleCard = () => {
    const isExpanded = card.classList.toggle("is-expanded");
    card.setAttribute("aria-expanded", String(isExpanded));
  };

  card.addEventListener("click", toggleCard);
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleCard();
    }
  });
}

function updateLiveCoordinates(position) {
  const { latitude, longitude } = position.coords;
  updateCoordinatesText(latitude, longitude);
  updateLiveWeather(latitude, longitude);
}

async function updateFromApproximateLocation() {
  try {
    const response = await fetch("https://ipapi.co/json/");

    if (!response.ok) throw new Error("Approximate location failed");

    const data = await response.json();
    const latitude = Number(data.latitude);
    const longitude = Number(data.longitude);
    const place = [data.city, data.country_name].filter(Boolean).join(", ");

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      throw new Error("Approximate coordinates missing");
    }

    updateCoordinatesText(latitude, longitude, place || "Approximate location");
    updateLiveWeather(latitude, longitude);
  } catch (error) {
    const coordinatesNode = document.getElementById("live-coordinates");

    if (coordinatesNode) coordinatesNode.textContent = "Location unavailable";
    setWeatherUnavailable("Allow location access for local weather.");
  }
}

function handleLocationError() {
  const coordinatesNode = document.getElementById("live-coordinates");

  if (coordinatesNode) coordinatesNode.textContent = "Using approximate location...";
  updateFromApproximateLocation();
}

function updateLiveCoordinatesFromBrowser() {
  if (!navigator.geolocation) {
    handleLocationError();
    return;
  }

  navigator.geolocation.getCurrentPosition(
    updateLiveCoordinates,
    handleLocationError,
    {
      enableHighAccuracy: false,
      maximumAge: 300000,
      timeout: 10000,
    }
  );
}

initMobileCardScroll();
mobileCardQuery.addEventListener("change", initMobileCardScroll);
initWeatherCardToggle();
updateLiveTime();
setInterval(updateLiveTime, 1000);
updateLiveCoordinatesFromBrowser();
