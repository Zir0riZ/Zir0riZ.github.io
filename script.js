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
const discountInputEl = document.getElementById("discountInput");
const discountValueEl = document.getElementById("discountValue");
const totalValueEl = document.getElementById("totalValue");
const resetInvoiceBtn = document.getElementById("resetInvoice");

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
    resetInvoiceBtn.addEventListener("click", resetInvoice);
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
    priceEl.textContent = item.price.toLocaleString();

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

// Calculate totals
function calculateTotals() {
  const itemsArray = Object.values(state.selectedItems);
  const total = itemsArray.reduce(
    (acc, { item, quantity }) => acc + item.price * quantity,
    0
  );
  const discountAmount = total * (state.discount / 100);

  discountValueEl.textContent = discountAmount.toLocaleString();
  totalValueEl.textContent = (total - discountAmount).toLocaleString();
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
    quantitySpan.textContent = quantity.toLocaleString();

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
    priceCell.textContent = item.price.toLocaleString();

    // Total cell
    const totalCell = document.createElement("td");
    totalCell.className = "total-cell";
    totalCell.textContent = (item.price * quantity).toLocaleString();

    // Add cells to row
    row.appendChild(nameCell);
    row.appendChild(quantityCell);
    row.appendChild(priceCell);
    row.appendChild(totalCell);

    // Add row to table
    invoiceItemsEl.appendChild(row);
  });

  // Calculate and display totals
  calculateTotals();

  // Add discount and final total to the invoice
  const discountRow = document.createElement("tr");
  const discountCell = document.createElement("td");
  discountCell.colSpan = 3; // Merge cells for discount
  discountCell.textContent = "تخفیف:";
  const discountValueCell = document.createElement("td");
  discountValueCell.textContent = `${state.discount}`;

  discountRow.appendChild(discountCell);
  discountRow.appendChild(discountValueCell);
  invoiceItemsEl.appendChild(discountRow);

  const finalTotalRow = document.createElement("tr");
  const finalTotalCell = document.createElement("td");
  finalTotalCell.colSpan = 3; // Merge cells for final total
  finalTotalCell.textContent = "جمع نهایی:";
  const finalTotalValueCell = document.createElement("td");
  finalTotalValueCell.textContent = calculateFinalTotal().toLocaleString();

  finalTotalRow.appendChild(finalTotalCell);
  finalTotalRow.appendChild(finalTotalValueCell);
  invoiceItemsEl.appendChild(finalTotalRow);
}

// Calculate final total after discount
function calculateFinalTotal() {
  const itemsArray = Object.values(state.selectedItems);
  const total = itemsArray.reduce(
    (acc, { item, quantity }) => acc + item.price * quantity,
    0
  );
  const discountAmount = total * (state.discount / 100);
  return total - discountAmount;
}

// Reset invoice function
function resetInvoice() {
  state.selectedItems = {};
  state.discount = 0;
  discountInputEl.value = 0;
  renderInvoice();
}

// اضافه کردن event listener برای دکمه پرینت
const printInvoiceBtn = document.getElementById("printInvoice");
printInvoiceBtn.addEventListener("click", printInvoice);

// تابع پرینت فاکتور
function printInvoice() {
  const invoiceContent = document
    .getElementById("invoiceTable")
    .cloneNode(true);
  const printWindow = window.open("", "", "width=600,height=600");

  printWindow.document.write(`
        <html dir="rtl">
            <head>
                <link href="https://cdn.jsdelivr.net/gh/rastikerdar/byekan@v2.0.0/font/BYekan.css" rel="stylesheet">
                <title>پرینت فاکتور</title>
                <style>
                    .totals { margin-top: 20px; }
                    .totals div { display: flex; justify-content: space-between; }
                    body {font-family: 'BYekan', sans-serif; text-align: right;  margin: 20px; font-size:1.5rem;}                    
                    table { width: 100%;  border-collapse: collapse;  margin-bottom: 20px;/  }
                    th, td {  padding: 10px;  border: 1px solid #000;  text-align: right; font-size:1.5rem;}
                    th {  background-color: #f2f2f2; }
                    .final-total {  font-weight: bold;  font-size:1.5rem;}
                    input,button {  display: none;  }
                    h1 {color: #ffffff; background-color: #000000;}
                </style>
            </head>
            <body>
                <h1>هاویر</h1>
                <span>شماره فاکتور</span><span style="margin-right: 50%;">شماره روزانه</span><br>
                <span>مشتری </span><span style="margin-right: 50%;">${new Date().toLocaleTimeString(
                  "fa-IR",
                  { hour: "2-digit", minute: "2-digit" }
                )} - ${new Date().toLocaleDateString("fa-IR")}</span><br>
                <span>موبایل مشتری</span><br>
                <span>آدرس </span>
                
                ${invoiceContent.innerHTML}
                <h1>هاویر به یاد می ماند</h1>
                <p>با مدیریت مجتبی رضاپور<br>
                خیابان ساحلی ، جنب گمرک<br>
                09103933306</p>
                </p>

            </body>
        </html>
    `);

  printWindow.document.close();
  printWindow.print();
  printWindow.close();

  const summaryWindow = window.open("", "", "width=600,height=600");
  let summaryContent = `
        <html dir="rtl">
            <head>
                <link href="https://cdn.jsdelivr.net/gh/rastikerdar/byekan@v2.0.0/font/BYekan.css" rel="stylesheet">
                <title>فیش خلاصه</title>
                <style>
                    body {font-family: 'BYekan', sans-serif; text-align: right; margin: 20px; font-size:1.5rem;}
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    th, td { padding: 10px; border: 1px solid #000; text-align: right; font-size:1.5rem;}
                    th { background-color: #f2f2f2; }
                </style>
            </head>
            <body>
                <h1>فیش خلاصه</h1>
                <span>شماره فاکتور</span><br>
                <span>مشتری</span><span style="margin-right: 50%;">سالن</span><br>
                <table>
                    <thead>
                        <tr>
                            <th>کالا و خدمات</th>
                            <th>تعداد</th>
                        </tr>
                    </thead>
                    <tbody>
  `;

  Object.values(state.selectedItems).forEach(({ item, quantity }) => {
    summaryContent += `
                        <tr>
                            <td>${item.name}</td>
                            <td>${quantity}</td>
                        </tr>
    `;
  });

  summaryContent += `
                    </tbody>
                </table>
            </body>
        </html>
    `;

  summaryWindow.document.write(summaryContent);
  summaryWindow.document.close();

  // اضافه کردن تاخیر قبل از پرینت فیش دوم
  summaryWindow.onload = function () {
    summaryWindow.print();
    summaryWindow.close(); // بستن پنجره بعد از پرینت
  };
}

// Initialize the app when the DOM is loaded
document.addEventListener("DOMContentLoaded", init);
