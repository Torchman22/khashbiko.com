/* ==========================================================================
   منطق الصفحة الرئيسية فقط
   ==========================================================================
   هذا الملف خاص بالصفحة الرئيسية فقط: عرض الفئات والمنتجات، الفلترة
   بالفئة والبحث، ونافذة العرض السريع، وفورم التواصل.

   السلة والهيدر وقائمة الموبايل وإعدادات الموقع كلها في ملف
   assets/js/site-common.js المشترك بين كل الصفحات — لو حابب تعدل
   في حاجة من دول، عدّل هناك مش هنا.

   مفيش داعي تعدل في الملف ده لإدارة المنتجات اليومية — استخدم بدل منه
   ملف assets/js/products-data.js لإضافة/تعديل المنتجات.
   ========================================================================== */

(function () {
  "use strict";

  // ------------------------------------------------------------------
  // حالة الصفحة (state)
  // ------------------------------------------------------------------
  var state = {
    filter: "all",
    query: ""
  };

  // ------------------------------------------------------------------
  // الفئات (الهاشتاجات)
  // ------------------------------------------------------------------
  function renderCategoryFilters() {
    var wrap = document.getElementById("categoryFilters");
    if (!wrap) return;
    var cats = typeof PRODUCT_CATEGORIES !== "undefined" ? PRODUCT_CATEGORIES : [];
    var html = '<button type="button" class="filter-pill active" data-filter="all">الكل</button>';
    cats.forEach(function (cat) {
      html += '<button type="button" class="filter-pill" data-filter="' + cat.id + '">#' + cat.label + "</button>";
    });
    wrap.innerHTML = html;

    wrap.querySelectorAll(".filter-pill").forEach(function (btn) {
      btn.addEventListener("click", function () {
        wrap.querySelectorAll(".filter-pill").forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        state.filter = btn.dataset.filter;
        renderProducts();
      });
    });
  }

  function renderCategoryGrid() {
    var wrap = document.getElementById("categoryGrid");
    if (!wrap) return;
    var cats = typeof PRODUCT_CATEGORIES !== "undefined" ? PRODUCT_CATEGORIES : [];
    wrap.innerHTML = cats.map(function (cat) {
      return (
        '<button type="button" class="cat-card" data-filter="' + cat.id + '">' +
          safeIcon(cat.icon, 34) +
          "<span>" + cat.label + "</span>" +
        "</button>"
      );
    }).join("");

    wrap.querySelectorAll(".cat-card").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setActiveFilter(btn.dataset.filter);
        var target = document.getElementById("products");
        if (target) target.scrollIntoView({ behavior: "smooth" });
      });
    });
  }

  function setActiveFilter(filterId) {
    state.filter = filterId;
    var wrap = document.getElementById("categoryFilters");
    if (wrap) {
      wrap.querySelectorAll(".filter-pill").forEach(function (b) {
        b.classList.toggle("active", b.dataset.filter === filterId);
      });
    }
    renderProducts();
  }

  // ------------------------------------------------------------------
  // المنتجات
  // ------------------------------------------------------------------
  function getFilteredProducts() {
    var all = typeof PRODUCTS !== "undefined" ? PRODUCTS : [];
    var query = state.query.trim().toLowerCase();
    return all.filter(function (p) {
      var matchesCategory = state.filter === "all" || (p.categories || []).indexOf(state.filter) !== -1;
      var haystack = (p.name + " " + (p.description || "")).toLowerCase();
      var matchesQuery = !query || haystack.indexOf(query) !== -1;
      return matchesCategory && matchesQuery;
    });
  }

  function productCardTemplate(product) {
    var priceHtml = product.oldPrice
      ? '<span class="price">' + money(product.price) + '</span> <span class="price-old">' + money(product.oldPrice) + "</span>"
      : '<span class="price">' + money(product.price) + "</span>";

    var badgeHtml = "";
    if (product.inStock === false) {
      badgeHtml = '<span class="badge badge-out">غير متوفر</span>';
    } else if (product.badge) {
      badgeHtml = '<span class="badge">' + product.badge + "</span>";
    }

    var videoBadgeHtml = product.video
      ? '<button type="button" class="video-badge" data-id="' + product.id + '" aria-label="مشاهدة فيديو منتج ' + product.name + '">' + safeIcon("play", 14) + "</button>"
      : "";

    var href = "product.html?id=" + encodeURIComponent(product.id);

    return (
      '<article class="product-card' + (product.inStock === false ? " is-out" : "") + '" data-id="' + product.id + '">' +
        '<div class="product-thumb-wrap">' +
          '<a href="' + href + '" class="product-thumb-link" aria-label="عرض تفاصيل ' + product.name + '">' +
            '<div class="product-thumb">' +
              badgeHtml +
              (product.image ? '<img src="' + product.image + '" alt="' + product.name + '" loading="lazy" class="product-img">' : "") +
              '<div class="product-icon-fallback">' + safeIcon(product.icon, 56) + "</div>" +
            "</div>" +
          "</a>" +
          '<button type="button" class="quick-view-btn" data-id="' + product.id + '" aria-label="عرض سريع لمنتج ' + product.name + '">' + safeIcon("eye", 18) + "</button>" +
          videoBadgeHtml +
        "</div>" +
        '<div class="product-info">' +
          '<div class="product-tags">' + productTagsHtml(product) + "</div>" +
          '<h3><a href="' + href + '" class="product-title-link">' + product.name + "</a></h3>" +
          '<p class="product-desc">' + (product.description || "") + "</p>" +
          '<div class="product-row">' +
            '<span class="price-wrap">' + priceHtml + "</span>" +
            '<button type="button" class="btn btn-small add-cart" data-id="' + product.id + '"' + (product.inStock === false ? " disabled" : "") + ">" +
              (product.inStock === false ? "غير متوفر" : "أضف للسلة") +
            "</button>" +
          "</div>" +
        "</div>" +
      "</article>"
    );
  }

  function renderProducts() {
    var grid = document.getElementById("productGrid");
    if (!grid) return;
    var list = getFilteredProducts();

    if (list.length === 0) {
      grid.innerHTML = '<p class="empty-state">لا توجد منتجات مطابقة حاليًا. جرّب كلمة بحث مختلفة أو اختر فئة أخرى.</p>';
      return;
    }

    grid.innerHTML = list.map(productCardTemplate).join("");

    grid.querySelectorAll(".product-img").forEach(function (img) {
      img.addEventListener("error", function () {
        this.style.display = "none";
      });
    });
    grid.querySelectorAll(".add-cart").forEach(function (btn) {
      btn.addEventListener("click", function () {
        addToCart(btn.dataset.id, 1);
      });
    });
    grid.querySelectorAll(".quick-view-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        openQuickView(btn.dataset.id);
      });
    });
    grid.querySelectorAll(".video-badge").forEach(function (btn) {
      btn.addEventListener("click", function () {
        openQuickView(btn.dataset.id, "video");
      });
    });
  }

  // ------------------------------------------------------------------
  // نافذة العرض السريع (Quick View)
  // ------------------------------------------------------------------
  var qvQty = 1;
  var qvProductId = null;
  var qvMode = "image";

  function renderQvMedia(product, mode) {
    var media = document.getElementById("qvMedia");
    if (!media) return;

    if (mode === "video" && product.video) {
      var embedUrl = typeof toEmbedUrl === "function" ? toEmbedUrl(product.video) : null;
      if (embedUrl) {
        media.innerHTML = '<iframe class="qv-video" src="' + embedUrl + '" title="فيديو ' + product.name + '" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
      } else {
        media.innerHTML = '<video class="qv-video" src="' + product.video + '" controls playsinline></video>';
      }
      return;
    }

    media.innerHTML =
      (product.image ? '<img src="' + product.image + '" alt="' + product.name + '" class="qv-img">' : "") +
      '<div class="qv-icon-fallback">' + safeIcon(product.icon, 90) + "</div>";
    var img = media.querySelector(".qv-img");
    if (img) {
      img.addEventListener("error", function () { this.style.display = "none"; });
    }
  }

  function openQuickView(id, initialMode) {
    var product = findProduct(id);
    if (!product) return;
    qvProductId = id;
    qvQty = 1;
    qvMode = (initialMode === "video" && product.video) ? "video" : "image";

    document.getElementById("qvTags").innerHTML = productTagsHtml(product);
    document.getElementById("qvTitle").textContent = product.name;
    document.getElementById("qvDesc").textContent = product.description || "";
    document.getElementById("qvPrice").innerHTML = product.oldPrice
      ? '<span class="price">' + money(product.price) + '</span> <span class="price-old">' + money(product.oldPrice) + "</span>"
      : '<span class="price">' + money(product.price) + "</span>";
    document.getElementById("qvQty").textContent = qvQty;

    var qvFullLink = document.getElementById("qvFullLink");
    if (qvFullLink) qvFullLink.setAttribute("href", "product.html?id=" + encodeURIComponent(product.id));

    var toggleWrap = document.getElementById("qvMediaToggle");
    if (toggleWrap) {
      if (product.video) {
        toggleWrap.hidden = false;
        toggleWrap.querySelectorAll(".media-toggle-btn").forEach(function (btn) {
          btn.classList.toggle("active", btn.dataset.mode === qvMode);
        });
      } else {
        toggleWrap.hidden = true;
      }
    }
    renderQvMedia(product, qvMode);

    var addBtn = document.getElementById("qvAddCart");
    if (product.inStock === false) {
      addBtn.setAttribute("disabled", "disabled");
      addBtn.textContent = "غير متوفر حاليًا";
    } else {
      addBtn.removeAttribute("disabled");
      addBtn.textContent = "أضف للسلة";
    }

    document.body.classList.add("modal-open");
    lockOrUnlockScroll();
    document.getElementById("closeQuickView").focus();
  }

  function closeQuickView() {
    document.body.classList.remove("modal-open");
    lockOrUnlockScroll();
    var media = document.getElementById("qvMedia");
    if (media) media.innerHTML = ""; // stop any playing video/iframe
    qvProductId = null;
  }

  // ------------------------------------------------------------------
  // فورم التواصل
  // ------------------------------------------------------------------
  function initContactForm() {
    var form = document.getElementById("contactForm");
    var note = document.getElementById("formNote");
    if (!form) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var action = (typeof SITE_CONFIG !== "undefined" && SITE_CONFIG.contactFormAction) || "";

      if (!action) {
        form.reset();
        if (note) note.textContent = "تم استلام رسالتك (وضع تجريبي). لتفعيل استقبال حقيقي راجع ملف اقرأني.";
        showToast("تم إرسال الرسالة (وضع تجريبي)");
        return;
      }

      var submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.setAttribute("disabled", "disabled");

      fetch(action, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form)
      })
        .then(function (res) {
          if (res.ok) {
            form.reset();
            if (note) note.textContent = "تم استلام رسالتك، هنتواصل معاك قريبًا!";
            showToast("تم إرسال الرسالة بنجاح");
          } else {
            if (note) note.textContent = "حصل خطأ أثناء الإرسال. حاول تاني أو تواصل معنا عبر واتساب.";
          }
        })
        .catch(function () {
          if (note) note.textContent = "تعذّر الاتصال بالخادم. تأكد من الإنترنت وحاول تاني.";
        })
        .finally(function () {
          if (submitBtn) submitBtn.removeAttribute("disabled");
        });
    });
  }

  // ------------------------------------------------------------------
  // ربط أحداث خاصة بالصفحة الرئيسية فقط
  // ------------------------------------------------------------------
  function initHomeEvents() {
    var closeQvBtn = document.getElementById("closeQuickView");
    if (closeQvBtn) closeQvBtn.addEventListener("click", closeQuickView);
    var modalOverlay = document.getElementById("modalOverlay");
    if (modalOverlay) modalOverlay.addEventListener("click", closeQuickView);

    var qvMinus = document.getElementById("qvMinus");
    var qvPlus = document.getElementById("qvPlus");
    if (qvMinus) qvMinus.addEventListener("click", function () {
      qvQty = Math.max(1, qvQty - 1);
      document.getElementById("qvQty").textContent = qvQty;
    });
    if (qvPlus) qvPlus.addEventListener("click", function () {
      qvQty += 1;
      document.getElementById("qvQty").textContent = qvQty;
    });
    var qvAddCart = document.getElementById("qvAddCart");
    if (qvAddCart) qvAddCart.addEventListener("click", function () {
      if (!qvProductId) return;
      addToCart(qvProductId, qvQty);
      closeQuickView();
    });

    var qvMediaToggle = document.getElementById("qvMediaToggle");
    if (qvMediaToggle) {
      qvMediaToggle.querySelectorAll(".media-toggle-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var product = qvProductId ? findProduct(qvProductId) : null;
          if (!product) return;
          qvMode = btn.dataset.mode;
          qvMediaToggle.querySelectorAll(".media-toggle-btn").forEach(function (b) {
            b.classList.toggle("active", b === btn);
          });
          renderQvMedia(product, qvMode);
        });
      });
    }

    var searchInput = document.getElementById("productSearch");
    if (searchInput) {
      searchInput.addEventListener("input", function () {
        state.query = searchInput.value;
        renderProducts();
      });
    }

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeQuickView();
    });
  }

  // ------------------------------------------------------------------
  // نقطة البداية
  // ------------------------------------------------------------------
  document.addEventListener("DOMContentLoaded", function () {
    renderCategoryFilters();
    renderCategoryGrid();
    renderProducts();
    initContactForm();
    initHomeEvents();
  });
})();
