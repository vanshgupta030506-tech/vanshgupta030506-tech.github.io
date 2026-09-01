const mobileCardQuery = window.matchMedia("(max-width: 760px)");
const cardSelector = "[data-mobile-observe]";
let mobileCardObserver = null;

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
  const timeZone = "Asia/Kolkata";
  const timezoneParts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "short",
  }).formatToParts(date);
  const tzName = timezoneParts.find((part) => part.type === "timeZoneName")?.value || "IST";

  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
  }).format(date).toUpperCase();
  const month = new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "long",
  }).format(date).toUpperCase();
  const day = new Intl.DateTimeFormat("en-US", {
    timeZone,
    day: "numeric",
  }).format(date);
  const year = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
  }).format(date);
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(date).toUpperCase();

  const displayTz = tzName === "GMT+5:30" || tzName === "GMT+5:30" ? "IST" : tzName;
  timeNode.textContent = `${displayTz} ${weekday}, ${month} ${day}, ${year} AT ${time}`;
}

initMobileCardScroll();
mobileCardQuery.addEventListener("change", initMobileCardScroll);
updateLiveTime();
setInterval(updateLiveTime, 1000);
