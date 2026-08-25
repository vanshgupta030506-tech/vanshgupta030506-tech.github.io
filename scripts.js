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

initMobileCardScroll();
mobileCardQuery.addEventListener("change", initMobileCardScroll);
