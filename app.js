const ASSOCIATE_TAG = "4dat-20";
const AMAZON_BASE_URL = "https://www.amazon.com";
const LOG_KEY = "g4rAffiliateClickAudit";

const categories = {
  windshieldWipers: {
    title: "Windshield wipers",
    symbol: "WW",
    template: ({ vehicle }) => `${vehicle} windshield wiper blades`,
    caution: "Confirm driver and passenger blade sizes before ordering."
  },
  cabinAirFilter: {
    title: "Cabin air filter",
    symbol: "CA",
    template: ({ vehicle }) => `${vehicle} cabin air filter`,
    caution: "Confirm vehicle fitment on Amazon or in the owner manual."
  },
  engineAirFilter: {
    title: "Engine air filter",
    symbol: "EA",
    template: ({ vehicle, engine }) => `${vehicle}${engine ? ` ${engine}` : ""} engine air filter`,
    caution: "Engine size may affect fitment. Add engine details when available."
  },
  keyFobBattery: {
    title: "Key FOB battery",
    symbol: "KF",
    template: ({ vehicle }) => `${vehicle} key fob battery`,
    caution: "Confirm the battery type inside the key FOB before ordering."
  }
};

const form = document.querySelector("#linkForm");
const queryOutput = document.querySelector("#query");
const urlOutput = document.querySelector("#urlOutput");
const openLink = document.querySelector("#openLink");
const copyLink = document.querySelector("#copyLink");
const clearLog = document.querySelector("#clearLog");
const auditLog = document.querySelector("#auditLog");
const categoryCards = document.querySelector("#categoryCards");

function normalizeText(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function vehicleText() {
  return [
    form.year.value,
    form.make.value,
    form.model.value,
    form.trim.value
  ].map(normalizeText).filter(Boolean).join(" ");
}

function buildAmazonSearchUrl(query) {
  const params = new URLSearchParams();
  params.set("k", normalizeText(query));
  params.set("tag", ASSOCIATE_TAG);
  return `${AMAZON_BASE_URL}/s?${params.toString()}`;
}

function currentPayload() {
  const categoryKey = form.category.value;
  const category = categories[categoryKey];
  const vehicle = vehicleText();
  const engine = normalizeText(form.engine.value);
  const query = category.template({ vehicle, engine });
  return {
    categoryKey,
    categoryTitle: category.title,
    vehicle,
    engine,
    query: normalizeText(query),
    url: buildAmazonSearchUrl(query),
    tag: ASSOCIATE_TAG
  };
}

function updateOutputs() {
  const payload = currentPayload();
  queryOutput.value = payload.query;
  urlOutput.value = payload.url;
}

function loadLog() {
  try {
    return JSON.parse(localStorage.getItem(LOG_KEY)) || [];
  } catch {
    return [];
  }
}

function saveLog(entries) {
  localStorage.setItem(LOG_KEY, JSON.stringify(entries.slice(0, 20)));
}

function renderLog() {
  const entries = loadLog();
  auditLog.innerHTML = "";

  if (entries.length === 0) {
    const empty = document.createElement("li");
    empty.textContent = "No local test clicks recorded.";
    auditLog.append(empty);
    return;
  }

  for (const entry of entries) {
    const item = document.createElement("li");
    item.innerHTML = `<strong>${entry.categoryTitle}</strong><br>${entry.timestamp}<code></code>`;
    item.querySelector("code").textContent = entry.url;
    auditLog.append(item);
  }
}

function logClick(payload) {
  const entries = loadLog();
  entries.unshift({
    timestamp: new Date().toISOString(),
    categoryTitle: payload.categoryTitle,
    vehicle: payload.vehicle,
    query: payload.query,
    url: payload.url,
    tag: payload.tag
  });
  saveLog(entries);
  renderLog();
}

function renderCategoryCards() {
  categoryCards.innerHTML = "";
  for (const category of Object.values(categories)) {
    const card = document.createElement("article");
    card.className = "category-card";
    card.innerHTML = `<span class="symbol"></span><strong></strong><p></p>`;
    card.querySelector(".symbol").textContent = category.symbol;
    card.querySelector("strong").textContent = category.title;
    card.querySelector("p").textContent = category.caution;
    categoryCards.append(card);
  }
}

form.addEventListener("input", updateOutputs);
form.addEventListener("change", updateOutputs);

openLink.addEventListener("click", () => {
  const payload = currentPayload();
  logClick(payload);
  window.open(payload.url, "_blank", "noopener,noreferrer");
});

copyLink.addEventListener("click", async () => {
  const payload = currentPayload();
  await navigator.clipboard.writeText(payload.url);
  copyLink.textContent = "Copied";
  setTimeout(() => {
    copyLink.textContent = "Copy URL";
  }, 1200);
});

clearLog.addEventListener("click", () => {
  localStorage.removeItem(LOG_KEY);
  renderLog();
});

renderCategoryCards();
updateOutputs();
renderLog();
