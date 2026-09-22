/* ==========================================================================
   منطق مشترك بين كل صفحات الموقع
   ==========================================================================
   هذا الملف يحتوي على كل حاجة مشتركة بين الصفحة الرئيسية وصفحة تفاصيل
   المنتج: سلة المشتريات، القائمة العلوية وقائمة الموبايل، ربط الإعدادات
   العامة (واتساب، تواصل، سوشيال ميديا)، والتنبيهات (Toast).

   لازم يتحمّل قبل app.js أو product-page.js في أي صفحة، وبعد ملفات
   البيانات (config.js, icons.js, media-utils.js, products-data.js).

   الدوال هنا بتتحط كمتغيرات عامة (global) عشان باقي ملفات الصفحة
   تقدر تستخدمها مباشرة (مثال: addToCart(...), findProduct(...))
   من غير ما تتكرر أو يتعمل لها نسخة تانية في كل صفحة.
   ========================================================================== */

var cart = [];
var toastEl, toastTimer;

// ------------------------------------------------------------------
// أدوات مساعدة عامة
// ------------------------------------------------------------------
function money(amount) {
  var currency = (typeof SITE_CONFIG !== "undefined" && SITE_CONFIG.currency) || "ج.م";
  return amount + " " + currency;
}

function findProduct(id) {
  return (typeof PRODUCTS !== "undefined" ? PRODUCTS : []).filter(function (p) {
    return p.id === id;
  })[0];
}

function findCategory(id) {
  return (typeof PRODUCT_CATEGORIES !== "undefined" ? PRODUCT_CATEGORIES : []).filter(function (c) {
    return c.id === id;
  })[0];
}

function safeIcon(name, size) {
  try {
    return getIcon(name, size);
  } catch (err) {
    return "";
  }
}

function showToast(message) {
  if (!toastEl) toastEl = document.getElementById("toast");
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () {
    toastEl.classList.remove("show");
  }, 2500);
}

function lockOrUnlockScroll() {
  var cartOpen = document.body.classList.contains("cart-open");
  var modalOpen = document.body.classList.contains("modal-open");
  var menuOpen = document.body.classList.contains("menu-open");
  document.body.style.overflow = (cartOpen || modalOpen || menuOpen) ? "hidden" : "";
}

function productTagsHtml(product) {
  return (product.categories || []).map(function (id) {
    var cat = findCategory(id);
    return cat ? '<span class="tag">#' + cat.label + "</span>" : "";
  }).join("");
}

// ------------------------------------------------------------------
// السلة (Cart) — نظام واحد مشترك تستخدمه كل الصفحات
// ------------------------------------------------------------------
function loadCart() {
  try {
    var raw = window.localStorage.getItem("khashbiko_cart");
    var parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
}

function saveCart() {
  try {
    window.localStorage.setItem("khashbiko_cart", JSON.stringify(cart));
  } catch (err) {
    /* لو التخزين المحلي غير متاح، السلة هتفضل شغالة لحد ما الصفحة تتقفل فقط */
  }
}

function addToCart(id, qty) {
  qty = qty || 1;
  var product = findProduct(id);
  if (!product || product.inStock === false) return;
  var line = cart.filter(function (c) { return c.id === id; })[0];
  if (line) {
    line.qty += qty;
  } else {
    cart.push({ id: id, qty: qty });
  }
  saveCart();
  renderCart();
  showToast('تمت إضافة "' + product.name + '" إلى السلة');
}

function updateCartQty(id, qty) {
  if (qty <= 0) {
    removeFromCart(id);
    return;
  }
  var line = cart.filter(function (c) { return c.id === id; })[0];
  if (line) {
    line.qty = qty;
    saveCart();
    renderCart();
  }
}

function removeFromCart(id) {
  cart = cart.filter(function (c) { return c.id !== id; });
  saveCart();
  renderCart();
}

function cartTotal() {
  return cart.reduce(function (sum, line) {
    var product = findProduct(line.id);
    return sum + (product ? product.price * line.qty : 0);
  }, 0);
}

function cartCount() {
  return cart.reduce(function (sum, line) { return sum + line.qty; }, 0);
}

function cartItemTemplate(line) {
  var product = findProduct(line.id);
  if (!product) return "";
  return (
    '<div class="cart-item" data-id="' + product.id + '">' +
      '<div class="cart-item-thumb">' +
        (product.image ? '<img src="' + product.image + '" alt="" class="cart-img">' : "") +
        '<div class="cart-item-icon">' + safeIcon(product.icon, 24) + "</div>" +
      "</div>" +
      '<div class="cart-item-info">' +
        "<h4>" + product.name + "</h4>" +
        '<span class="cart-item-price">' + money(product.price) + "</span>" +
        '<div class="qty-stepper" role="group" aria-label="الكمية">' +
          '<button class="qty-btn cart-qty-minus" data-id="' + product.id + '" aria-label="تقليل الكمية">' + safeIcon("minus", 14) + "</button>" +
          '<span class="qty-value">' + line.qty + "</span>" +
          '<button class="qty-btn cart-qty-plus" data-id="' + product.id + '" aria-label="زيادة الكمية">' + safeIcon("plus", 14) + "</button>" +
        "</div>" +
      "</div>" +
      '<button class="cart-item-remove" data-id="' + product.id + '" aria-label="حذف من السلة">' + safeIcon("trash", 16) + "</button>" +
    "</div>"
  );
}

function renderCart() {
  var itemsWrap = document.getElementById("cartItems");
  var totalEl = document.getElementById("cartTotal");
  var countEl = document.getElementById("cartCount");
  var checkoutBtn = document.getElementById("checkoutBtn");
  var emptyNote = document.getElementById("cartEmptyNote");
  if (!itemsWrap) return;

  if (cart.length === 0) {
    itemsWrap.innerHTML = '<p class="cart-empty">السلة فارغة حاليًا. تصفّح المنتجات وأضف اللي يعجبك!</p>';
    if (checkoutBtn) checkoutBtn.setAttribute("disabled", "disabled");
    if (emptyNote) emptyNote.textContent = "";
  } else {
    itemsWrap.innerHTML = cart.map(cartItemTemplate).join("");
    if (checkoutBtn) checkoutBtn.removeAttribute("disabled");
    if (emptyNote) emptyNote.textContent = "";
  }

  if (totalEl) totalEl.textContent = money(cartTotal());
  if (countEl) countEl.textContent = cartCount();

  itemsWrap.querySelectorAll(".cart-qty-minus").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var line = cart.filter(function (c) { return c.id === btn.dataset.id; })[0];
      if (line) updateCartQty(btn.dataset.id, line.qty - 1);
    });
  });
  itemsWrap.querySelectorAll(".cart-qty-plus").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var line = cart.filter(function (c) { return c.id === btn.dataset.id; })[0];
      if (line) updateCartQty(btn.dataset.id, line.qty + 1);
    });
  });
  itemsWrap.querySelectorAll(".cart-item-remove").forEach(function (btn) {
    btn.addEventListener("click", function () {
      removeFromCart(btn.dataset.id);
    });
  });
  itemsWrap.querySelectorAll(".cart-img").forEach(function (img) {
    img.addEventListener("error", function () {
      this.style.display = "none";
    });
  });
}

function openCart() {
  document.body.classList.add("cart-open");
  lockOrUnlockScroll();
}
function closeCart() {
  document.body.classList.remove("cart-open");
  lockOrUnlockScroll();
}

function buildWhatsappMessage() {
  var lines = ["مرحبًا، أريد إتمام طلب من موقع خشبيكو:", ""];
  cart.forEach(function (line) {
    var product = findProduct(line.id);
    if (!product) return;
    lines.push("- " + product.name + " × " + line.qty + " = " + money(product.price * line.qty));
  });
  lines.push("");
  lines.push("الإجمالي: " + money(cartTotal()));
  return lines.join("\n");
}

function checkout() {
  if (cart.length === 0) return;
  var number = (typeof SITE_CONFIG !== "undefined" && SITE_CONFIG.whatsappNumber) || "";
  var message = buildWhatsappMessage();
  var url = "https://wa.me/" + number + "?text=" + encodeURIComponent(message);
  window.open(url, "_blank", "noopener");
}

// ------------------------------------------------------------------
// القائمة على الموبايل
// ------------------------------------------------------------------
function toggleMobileMenu(force) {
  var isOpen = typeof force === "boolean" ? force : !document.body.classList.contains("menu-open");
  document.body.classList.toggle("menu-open", isOpen);
  var toggle = document.getElementById("menuToggle");
  if (toggle) toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  lockOrUnlockScroll();
}

// ------------------------------------------------------------------
// ربط الإعدادات العامة بالعناصر (واتساب، السنة في الفوتر، التواصل)
// ------------------------------------------------------------------
function applyConfig() {
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  var waNumber = (typeof SITE_CONFIG !== "undefined" && SITE_CONFIG.whatsappNumber) || "";
  document.querySelectorAll("[data-whatsapp-link]").forEach(function (el) {
    el.setAttribute("href", "https://wa.me/" + waNumber);
  });

  if (typeof SITE_CONFIG !== "undefined") {
    var phoneEl = document.getElementById("infoPhone");
    var emailEl = document.getElementById("infoEmail");
    var addressEl = document.getElementById("infoAddress");
    if (phoneEl) phoneEl.textContent = SITE_CONFIG.phone;
    if (emailEl) emailEl.textContent = SITE_CONFIG.email;
    if (addressEl) addressEl.textContent = SITE_CONFIG.address;

    if (SITE_CONFIG.social) {
      Object.keys(SITE_CONFIG.social).forEach(function (key) {
        document.querySelectorAll('[data-social="' + key + '"]').forEach(function (el) {
          el.setAttribute("href", SITE_CONFIG.social[key] || "#");
        });
      });
    }
  }
}

// ------------------------------------------------------------------
// ربط أحداث الهيدر والسلة المشتركة بين كل الصفحات
// ------------------------------------------------------------------
function initCommonEvents() {
  var menuToggle = document.getElementById("menuToggle");
  if (menuToggle) {
    menuToggle.addEventListener("click", function () { toggleMobileMenu(); });
  }
  var closeMenuBtn = document.getElementById("closeMenu");
  if (closeMenuBtn) {
    closeMenuBtn.addEventListener("click", function () { toggleMobileMenu(false); });
  }
  document.querySelectorAll("#mainNav a").forEach(function (link) {
    link.addEventListener("click", function () { toggleMobileMenu(false); });
  });

  var cartBtn = document.getElementById("cartBtn");
  if (cartBtn) cartBtn.addEventListener("click", openCart);
  var closeCartBtn = document.getElementById("closeCart");
  if (closeCartBtn) closeCartBtn.addEventListener("click", closeCart);
  var cartOverlay = document.getElementById("cartOverlay");
  if (cartOverlay) cartOverlay.addEventListener("click", closeCart);
  var checkoutBtn = document.getElementById("checkoutBtn");
  if (checkoutBtn) checkoutBtn.addEventListener("click", checkout);

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeCart();
      toggleMobileMenu(false);
    }
  });
}

document.addEventListener("DOMContentLoaded", function () {
  cart = loadCart();
  applyConfig();
  renderCart();
  initCommonEvents();
  if (typeof AnnouncementBar !== "undefined") {
    AnnouncementBar.render("announceBar", "announceTrack");
  }
});
