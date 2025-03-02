// State management
const state = {
  selectedItems: {},
  activeCategory: null,
  discount: 0,
};

// DOM elements
const categoryTabsEl = document.getElementById("categoryTabs");
const menuItemsEl = document.getElementById("menuItems");
const invoiceItemsEl = document.getElementById("invoiceItems");
const emptyInvoiceEl = document.getElementById("emptyInvoice");
const invoiceTableEl = document.getElementById("invoiceTable");
const subtotalValueEl = document.getElementById("subtotalValue");
const discountInputEl = document.getElementById("discountInput");
const discountValueEl = document.getElementById("discountValue");
const totalValueEl = document.getElementById("totalValue");

// Initialize the application
async function init() {
  try {
    const response = await fetch("menu-data.json");
    const menuData = await response.json();
    window.menuData = menuData; // Store menuData globally
    renderCategoryTabs();
    setActiveCategory(Object.keys(menuData)[0]);

    // Set up event listeners
    discountInputEl.addEventListener("change", handleDiscountChange);
  } catch (error) {
    console.error("Error loading menu data:", error);
  }
}

// Render category tabs
function renderCategoryTabs() {
  categoryTabsEl.innerHTML = "";

  Object.keys(menuData).forEach((category) => {
    const tabEl = document.createElement("button");
    tabEl.className = "category-tab";
    tabEl.textContent = category;
    tabEl.addEventListener("click", () => setActiveCategory(category));
    categoryTabsEl.appendChild(tabEl);
  });
}

// Set active category and render menu items
function setActiveCategory(category) {
  state.activeCategory = category;

  // Update active tab styling
  document.querySelectorAll(".category-tab").forEach((tab) => {
    if (tab.textContent === category) {
      tab.classList.add("active");
    } else {
      tab.classList.remove("active");
    }
  });

  renderMenuItems();
}

// Render menu items for the active category
function renderMenuItems() {
  menuItemsEl.innerHTML = "";

  if (!state.activeCategory) return;

  const categoryHeading = document.createElement("h3");
  categoryHeading.className = "menu-category";
  categoryHeading.textContent = state.activeCategory;
  menuItemsEl.appendChild(categoryHeading);

  const items = menuData[state.activeCategory];
  items.forEach((item) => {
    const itemEl = document.createElement("div");
    itemEl.className = "menu-item";

    const detailsEl = document.createElement("div");
    detailsEl.className = "item-details";

    const nameEl = document.createElement("h3");
    nameEl.textContent = item.name;
    detailsEl.appendChild(nameEl);

    const priceControlsEl = document.createElement("div");
    priceControlsEl.className = "price-controls";

    const priceEl = document.createElement("div");
    priceEl.className = "item-price";
    priceEl.textContent = formatPrice(item.price);

    const addBtnEl = document.createElement("button");
    addBtnEl.className = "add-item-btn";
    addBtnEl.innerHTML = "&#43;";
    addBtnEl.setAttribute("aria-label", `افزودن ${item.name} به سفارش`);
    addBtnEl.addEventListener("click", () => addToInvoice(item));

    priceControlsEl.appendChild(priceEl);
    priceControlsEl.appendChild(addBtnEl);

    itemEl.appendChild(detailsEl);
    itemEl.appendChild(priceControlsEl);

    menuItemsEl.appendChild(itemEl);
  });
}

// Add item to invoice
function addToInvoice(item) {
  if (state.selectedItems[item.id]) {
    state.selectedItems[item.id].quantity += 1;
  } else {
    state.selectedItems[item.id] = { item, quantity: 1 };
  }

  renderInvoice();
}

// Update item quantity
function updateQuantity(itemId, quantity) {
  if (quantity <= 0) {
    delete state.selectedItems[itemId];
  } else {
    state.selectedItems[itemId].quantity = quantity;
  }

  renderInvoice();
}

// Handle discount change
function handleDiscountChange(e) {
  const value = parseFloat(e.target.value) || 0;
  state.discount = Math.min(100, Math.max(0, value));
  e.target.value = state.discount;

  calculateTotals();
}

// تبدیل اعداد انگلیسی به فارسی
function toFarsiNumber(n) {
  const farsiDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return n.toString().replace(/\d/g, (x) => farsiDigits[x]);
}

// تبدیل قیمت به فرمت فارسی
function formatPrice(price) {
  return toFarsiNumber(price.toLocaleString()) + " تومان";
}

// Calculate totals
function calculateTotals() {
  const itemsArray = Object.values(state.selectedItems);

  const subtotal = itemsArray.reduce(
    (sum, { item, quantity }) => sum + item.price * quantity,
    0
  );

  const discountAmount = subtotal * (state.discount / 100);
  const total = subtotal - discountAmount;

  subtotalValueEl.textContent = formatPrice(subtotal);
  discountValueEl.textContent = "-" + formatPrice(discountAmount);
  totalValueEl.textContent = formatPrice(total);
}

// Render invoice
function renderInvoice() {
  const itemsArray = Object.values(state.selectedItems);

  if (itemsArray.length === 0) {
    emptyInvoiceEl.classList.remove("hidden");
    invoiceTableEl.classList.add("hidden");
    return;
  }

  emptyInvoiceEl.classList.add("hidden");
  invoiceTableEl.classList.remove("hidden");

  invoiceItemsEl.innerHTML = "";

  itemsArray.forEach(({ item, quantity }) => {
    const row = document.createElement("tr");

    // Item name cell
    const nameCell = document.createElement("td");
    const nameDiv = document.createElement("div");
    nameDiv.className = "item-name";
    nameDiv.textContent = item.name;

    const categoryDiv = document.createElement("div");
    categoryDiv.className = "item-category";
    categoryDiv.textContent = item.category;

    nameCell.appendChild(nameDiv);
    nameCell.appendChild(categoryDiv);

    // Quantity cell
    const quantityCell = document.createElement("td");
    const quantityControl = document.createElement("div");
    quantityControl.className = "quantity-control";

    const minusBtn = document.createElement("button");
    minusBtn.className = "quantity-btn";
    minusBtn.innerHTML = "&minus;";
    minusBtn.setAttribute("aria-label", "کاهش تعداد");
    minusBtn.addEventListener("click", () =>
      updateQuantity(item.id, quantity - 1)
    );

    const quantitySpan = document.createElement("span");
    quantitySpan.className = "quantity-value";
    quantitySpan.textContent = toFarsiNumber(quantity);

    const plusBtn = document.createElement("button");
    plusBtn.className = "quantity-btn";
    plusBtn.innerHTML = "&#43;";
    plusBtn.setAttribute("aria-label", "افزایش تعداد");
    plusBtn.addEventListener("click", () =>
      updateQuantity(item.id, quantity + 1)
    );

    quantityControl.appendChild(minusBtn);
    quantityControl.appendChild(quantitySpan);
    quantityControl.appendChild(plusBtn);
    quantityCell.appendChild(quantityControl);

    // Price cell
    const priceCell = document.createElement("td");
    priceCell.className = "price-cell";
    priceCell.textContent = formatPrice(item.price);

    // Total cell
    const totalCell = document.createElement("td");
    totalCell.className = "total-cell";
    totalCell.textContent = formatPrice(item.price * quantity);

    // Add cells to row
    row.appendChild(nameCell);
    row.appendChild(quantityCell);
    row.appendChild(priceCell);
    row.appendChild(totalCell);

    // Add row to table
    invoiceItemsEl.appendChild(row);
  });

  calculateTotals();
}

// Initialize the app when the DOM is loaded
document.addEventListener("DOMContentLoaded", init);
