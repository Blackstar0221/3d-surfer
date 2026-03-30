const coinDisplay = document.getElementById("coinDisplay");
const themeList = document.getElementById("themeList");

const saveKeyCoins = "runnerCoins";
const saveKeyTheme = "runnerTheme";
const saveKeyOwnedThemes = "runnerOwnedThemes";

const themes = [
  {
    id: "desert",
    name: "Sunset Desert",
    price: 0,
    preview: "linear-gradient(to bottom, #ff9966, #ffd699)"
  },
  {
    id: "snow",
    name: "Snow",
    price: 10,
    preview: "linear-gradient(to bottom, #bfe9ff, #eefaff)"
  },
  {
    id: "city",
    name: "City",
    price: 15,
    preview: "linear-gradient(to bottom, #6a85b6, #bac8e0)"
  },
  {
    id: "lego",
    name: "Lego",
    price: 20,
    preview: "linear-gradient(to bottom, #7ad7ff, #ffd54f)"
  },
  {
    id: "lunar",
    name: "Lunar",
    price: 25,
    preview: "linear-gradient(to bottom, #0f1021, #2b2d42)"
  }
];

function getCoins() {
  return Number(localStorage.getItem(saveKeyCoins) || "0");
}

function setCoins(value) {
  localStorage.setItem(saveKeyCoins, String(value));
}

function getOwnedThemes() {
  const raw = localStorage.getItem(saveKeyOwnedThemes);
  if (raw) return JSON.parse(raw);

  const defaults = ["desert"];
  localStorage.setItem(saveKeyOwnedThemes, JSON.stringify(defaults));
  return defaults;
}

function setOwnedThemes(arr) {
  localStorage.setItem(saveKeyOwnedThemes, JSON.stringify(arr));
}

function getCurrentTheme() {
  return localStorage.getItem(saveKeyTheme) || "desert";
}

function setCurrentTheme(themeId) {
  localStorage.setItem(saveKeyTheme, themeId);
}

function renderThemes() {
  const coins = getCoins();
  const owned = getOwnedThemes();
  const equipped = getCurrentTheme();

  coinDisplay.textContent = coins;
  themeList.innerHTML = "";

  themes.forEach((theme) => {
    const card = document.createElement("div");
    card.className = "theme-card";

    const isOwned = owned.includes(theme.id);
    const isEquipped = equipped === theme.id;

    let buttonHtml = "";

    if (!isOwned) {
      buttonHtml = `<button class="buy-btn" data-buy="${theme.id}">Buy for ${theme.price}</button>`;
    } else if (!isEquipped) {
      buttonHtml = `<button class="equip-btn" data-equip="${theme.id}">Equip</button>`;
    } else {
      buttonHtml = `<p class="owned-text">Equipped</p>`;
    }

    card.innerHTML = `
      <div class="preview" style="background: ${theme.preview};"></div>
      <h2>${theme.name}</h2>
      <p>Price: ${theme.price} coins</p>
      ${buttonHtml}
    `;

    themeList.appendChild(card);
  });

  document.querySelectorAll("[data-buy]").forEach((btn) => {
    btn.addEventListener("click", function () {
      const id = btn.getAttribute("data-buy");
      buyTheme(id);
    });
  });

  document.querySelectorAll("[data-equip]").forEach((btn) => {
    btn.addEventListener("click", function () {
      const id = btn.getAttribute("data-equip");
      equipTheme(id);
    });
  });
}

function buyTheme(id) {
  const theme = themes.find((t) => t.id === id);
  if (!theme) return;

  const coins = getCoins();
  const owned = getOwnedThemes();

  if (owned.includes(id)) return;

  if (coins < theme.price) {
    alert("Not enough coins!");
    return;
  }

  setCoins(coins - theme.price);
  owned.push(id);
  setOwnedThemes(owned);
  renderThemes();
}

function equipTheme(id) {
  const owned = getOwnedThemes();
  if (!owned.includes(id)) return;

  setCurrentTheme(id);
  renderThemes();
}

renderThemes();
