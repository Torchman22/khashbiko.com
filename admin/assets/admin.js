/* ==========================================================================
   منطق لوحة التحكم
   ==========================================================================
   يقرأ هذا الملف بيانات الموقع الحالية (PRODUCTS / PRODUCT_CATEGORIES /
   SITE_CONFIG) كنقطة بداية، ويسمح بتعديلها بواجهة رسومية، مع حفظ تلقائي
   للمسودة في متصفحك، وتصدير الملفات النهائية لرفعها على الاستضافة.
   ========================================================================== */

(function () {
  "use strict";

  var PRODUCT_ICON_OPTIONS = ["tray", "board", "chair", "frame", "box", "spoon", "shelf", "stand", "generic"];
  var CATEGORY_ICON_OPTIONS = ["kitchen", "furniture", "decor", "gifts", "office", "generic"];
  var BADGE_PRESETS = ["جديد", "الأكثر مبيعًا", "خصم", "عرض محدود", "كمية محدودة"];
  var ICON_LABELS = {
    tray: "صينية", board: "لوح تقطيع", chair: "كرسي", frame: "إطار", box: "صندوق",
    spoon: "ملعقة", shelf: "رف", stand: "حامل", generic: "عام (افتراضي)",
    kitchen: "المطبخ", furniture: "الأثاث", decor: "الديكور", gifts: "الهدايا", office: "المكتب"
  };
  var DRAFT_KEY = "khashbiko_admin_draft";
  var DRAFT_TIME_KEY = "khashbiko_admin_draft_time";
  var AUTH_KEY = "khashbiko_admin_authed";

  var state = { categories: [], products: [], config: {}, announceSettings: {}, announcements: [] };
  var editingProductId = null;
  var editingCategoryId = null;
  var editingAnnouncementId = null;
  var currentImageFile = null;
  var currentImagePreviewDataUrl = null;
  var currentAnImageFile = null;
  var currentAnImagePreviewDataUrl = null;
  var galleryRows = []; // { rowId, path, file, previewDataUrl }
  var specRows = []; // { rowId, label, value }
  var reviewRows = []; // { rowId, name, rating, comment, date }
  var rowIdCounter = 0;

  function $(id) { return document.getElementById(id); }

  function money(n) {
    var currency = (state.config && state.config.currency) || "ج.م";
    return n + " " + currency;
  }

  function safeIcon(name, size) {
    try { return getIcon(name, size); } catch (err) { return ""; }
  }

  function findCategory(id) {
    return state.categories.filter(function (c) { return c.id === id; })[0];
  }
  function findProduct(id) {
    return state.products.filter(function (p) { return p.id === id; })[0];
  }

  var toastEl, toastTimer;
  function showToast(message) {
    if (!toastEl) toastEl = $("toast");
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 2400);
  }

  // ------------------------------------------------------------------
  // أدوات توليد المعرّفات
  // ------------------------------------------------------------------
  function slugify(text) {
    return String(text || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function generateProductId(products) {
    var maxNum = 0;
    products.forEach(function (p) {
      var m = /^p(\d+)$/.exec(p.id);
      if (m) maxNum = Math.max(maxNum, parseInt(m[1], 10));
    });
    var n = maxNum + 1;
    var id = "p" + String(n).padStart(3, "0");
    while (products.some(function (p) { return p.id === id; })) {
      n++;
      id = "p" + String(n).padStart(3, "0");
    }
    return id;
  }

  function generateCategoryId(label, categories) {
    var base = slugify(label) || "cat";
    var id = base;
    var n = 2;
    while (categories.some(function (c) { return c.id === id; })) {
      id = base + "-" + n;
      n++;
    }
    return id;
  }

  // ------------------------------------------------------------------
  // تحميل البيانات وحفظ المسودة
  // ------------------------------------------------------------------
  function loadFromLive() {
    var liveCategories = typeof PRODUCT_CATEGORIES !== "undefined" ? PRODUCT_CATEGORIES : [];
    var liveProducts = typeof PRODUCTS !== "undefined" ? PRODUCTS : [];
    var liveConfig = typeof SITE_CONFIG !== "undefined" ? SITE_CONFIG : {};
    var liveAnnounceSettings = typeof ANNOUNCEMENT_BAR !== "undefined" ? ANNOUNCEMENT_BAR : {};
    var liveAnnouncements = typeof ANNOUNCEMENTS !== "undefined" ? ANNOUNCEMENTS : [];

    state.categories = JSON.parse(JSON.stringify(liveCategories));
    state.products = JSON.parse(JSON.stringify(liveProducts));
    state.announceSettings = JSON.parse(JSON.stringify(liveAnnounceSettings));
    state.announcements = JSON.parse(JSON.stringify(liveAnnouncements));
    state.config = {
      whatsappNumber: liveConfig.whatsappNumber || "",
      currency: liveConfig.currency || "ج.م",
      phone: liveConfig.phone || "",
      email: liveConfig.email || "",
      address: liveConfig.address || "",
      social: {
        facebook: (liveConfig.social && liveConfig.social.facebook) || "#",
        instagram: (liveConfig.social && liveConfig.social.instagram) || "#",
        tiktok: (liveConfig.social && liveConfig.social.tiktok) || "#"
      },
      contactFormAction: liveConfig.contactFormAction || "",
      reviewFormAction: liveConfig.reviewFormAction || ""
    };
  }

  function loadInitialState() {
    var draft = null;
    try {
      var raw = window.localStorage.getItem(DRAFT_KEY);
      draft = raw ? JSON.parse(raw) : null;
    } catch (err) {
      draft = null;
    }
    if (draft && Array.isArray(draft.products) && Array.isArray(draft.categories) && draft.config) {
      state.categories = draft.categories;
      state.products = draft.products;
      state.config = draft.config;
      // مسودات قديمة من قبل إضافة الشريط الإعلاني ممكن ميكونش فيها الحقول دي —
      // في الحالة دي بنجيبها من ملفات الموقع الحالية بدل ما نكسر المسودة.
      var liveAnnounceSettings = typeof ANNOUNCEMENT_BAR !== "undefined" ? ANNOUNCEMENT_BAR : {};
      var liveAnnouncements = typeof ANNOUNCEMENTS !== "undefined" ? ANNOUNCEMENTS : [];
      state.announceSettings = draft.announceSettings || JSON.parse(JSON.stringify(liveAnnounceSettings));
      state.announcements = Array.isArray(draft.announcements) ? draft.announcements : JSON.parse(JSON.stringify(liveAnnouncements));
    } else {
      loadFromLive();
    }
  }

  function saveDraft() {
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(state));
      window.localStorage.setItem(DRAFT_TIME_KEY, new Date().toISOString());
    } catch (err) {
      showToast("تعذّر الحفظ محليًا (مساحة التخزين ممتلئة أو غير متاحة)");
    }
    updateDraftStatus();
  }

  function updateDraftStatus() {
    var el = $("draftStatus");
    if (!el) return;
    var t = null;
    try { t = window.localStorage.getItem(DRAFT_TIME_KEY); } catch (err) { t = null; }
    if (t) {
      var d = new Date(t);
      el.textContent = "آخر حفظ محلي: " + d.toLocaleString("ar-EG");
    } else {
      el.textContent = "لا توجد تعديلات محفوظة محليًا بعد — أي تغيير هتعمله هيتحفظ هنا تلقائيًا.";
    }
  }

  function resetDraft() {
    if (!window.confirm("هيتم مسح كل التعديلات غير المُصدَّرة والرجوع لبيانات الموقع الحالية. متأكد؟")) return;
    try {
      window.localStorage.removeItem(DRAFT_KEY);
      window.localStorage.removeItem(DRAFT_TIME_KEY);
    } catch (err) { /* ignore */ }
    loadFromLive();
    renderAll();
    showToast("تم الاسترجاع من نسخة الموقع الحالية");
  }

  // ------------------------------------------------------------------
  // تسجيل الدخول
  // ------------------------------------------------------------------
  function checkAuth() {
    var authed = false;
    try { authed = window.localStorage.getItem(AUTH_KEY) === "1"; } catch (err) { authed = false; }
    if (authed) showDashboard(); else showLogin();
  }

  function showLogin() {
    $("loginScreen").hidden = false;
    $("adminShell").hidden = true;
  }

  function showDashboard() {
    $("loginScreen").hidden = true;
    $("adminShell").hidden = false;
    loadInitialState();
    renderAll();
  }

  function doLogin(e) {
    e.preventDefault();
    var input = $("loginPassword").value;
    var pass = typeof ADMIN_PASSWORD !== "undefined" ? ADMIN_PASSWORD : null;
    if (pass !== null && input === pass) {
      try { window.localStorage.setItem(AUTH_KEY, "1"); } catch (err) { /* ignore */ }
      $("loginError").textContent = "";
      $("loginForm").reset();
      showDashboard();
    } else {
      $("loginError").textContent = "كلمة المرور غير صحيحة، حاول تاني.";
    }
  }

  function doLogout() {
    try { window.localStorage.removeItem(AUTH_KEY); } catch (err) { /* ignore */ }
    showLogin();
  }

  // ------------------------------------------------------------------
  // التبويبات
  // ------------------------------------------------------------------
  function switchTab(name) {
    document.querySelectorAll(".admin-tab").forEach(function (btn) {
      btn.classList.toggle("active", btn.dataset.tab === name);
    });
    var panelId = "panel" + name.charAt(0).toUpperCase() + name.slice(1);
    document.querySelectorAll(".admin-panel").forEach(function (panel) {
      panel.classList.toggle("active", panel.id === panelId);
    });
  }

  // ------------------------------------------------------------------
  // نوافذ منبثقة (مودالز) — مشتركة بين المنتج والفئة
  // ------------------------------------------------------------------
  function openModal(modalId) {
    document.body.classList.add("admin-modal-open");
    $(modalId).classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closeModalEl(modalId) {
    $(modalId).classList.remove("open");
    var anyOpen = document.querySelectorAll(".admin-modal.open").length > 0;
    if (!anyOpen) {
      document.body.classList.remove("admin-modal-open");
      document.body.style.overflow = "";
    }
  }
  function closeAnyOpenModal() {
    if ($("productModal").classList.contains("open")) closeProductModalFn();
    if ($("categoryModal").classList.contains("open")) closeCategoryModalFn();
    if ($("announcementModal").classList.contains("open")) closeAnnouncementModalFn();
  }

  // ------------------------------------------------------------------
  // جدول المنتجات
  // ------------------------------------------------------------------
  function renderProductsTable() {
    var body = $("productsTableBody");
    var empty = $("productsEmptyState");
    if (!body) return;

    var query = (($("productAdminSearch") && $("productAdminSearch").value) || "").trim().toLowerCase();
    var list = state.products.filter(function (p) {
      return !query || p.name.toLowerCase().indexOf(query) !== -1;
    });

    if (state.products.length === 0) {
      body.innerHTML = "";
      if (empty) { empty.hidden = false; empty.textContent = 'لا توجد منتجات بعد. اضغط "إضافة منتج جديد" للبدء.'; }
      return;
    }
    if (list.length === 0) {
      body.innerHTML = "";
      if (empty) { empty.hidden = false; empty.textContent = "لا نتائج مطابقة لبحثك."; }
      return;
    }
    if (empty) empty.hidden = true;

    body.innerHTML = list.map(function (p) {
      var tagsHtml = (p.categories || []).map(function (id) {
        var c = findCategory(id);
        return c ? '<span class="tag">#' + c.label + "</span>" : "";
      }).join("") || "—";

      var statusHtml = p.inStock === false
        ? '<span class="status-pill out">غير متوفر</span>'
        : '<span class="status-pill">متوفر</span>';

      return (
        '<tr data-id="' + p.id + '">' +
          '<td><div class="table-product-cell">' +
            '<div class="table-thumb">' +
              (p.image ? '<img src="../' + p.image + '" alt="" class="table-img">' : "") +
              '<div class="table-icon">' + safeIcon(p.icon, 20) + "</div>" +
            "</div>" +
            '<span class="table-name">' + p.name + "</span>" +
          "</div></td>" +
          '<td><div class="table-tags-cell">' + tagsHtml + "</div></td>" +
          "<td>" + money(p.price) + "</td>" +
          "<td>" + statusHtml + "</td>" +
          '<td><div class="row-actions">' +
            '<button type="button" class="row-edit" data-id="' + p.id + '" aria-label="تعديل">' + safeIcon("edit", 16) + "</button>" +
            '<button type="button" class="row-delete" data-id="' + p.id + '" aria-label="حذف">' + safeIcon("trash", 16) + "</button>" +
          "</div></td>" +
        "</tr>"
      );
    }).join("");

    body.querySelectorAll(".table-img").forEach(function (img) {
      img.addEventListener("error", function () { this.style.display = "none"; });
    });
    body.querySelectorAll(".row-edit").forEach(function (btn) {
      btn.addEventListener("click", function () { openProductModal(btn.dataset.id); });
    });
    body.querySelectorAll(".row-delete").forEach(function (btn) {
      btn.addEventListener("click", function () { deleteProduct(btn.dataset.id); });
    });
  }

  // ------------------------------------------------------------------
  // نافذة إضافة/تعديل منتج
  // ------------------------------------------------------------------
  function renderCategoryCheckboxes(selectedIds) {
    var wrap = $("fldCategories");
    if (!wrap) return;
    if (state.categories.length === 0) {
      wrap.innerHTML = '<span class="field-hint">لا توجد فئات بعد — أضف فئة أولًا من تبويب "الفئات".</span>';
      return;
    }
    wrap.innerHTML = state.categories.map(function (c) {
      var checked = selectedIds.indexOf(c.id) !== -1;
      return (
        '<label class="chk-pill' + (checked ? " checked" : "") + '">' +
          '<input type="checkbox" value="' + c.id + '"' + (checked ? " checked" : "") + ">" +
          c.label +
        "</label>"
      );
    }).join("");
    wrap.querySelectorAll('input[type="checkbox"]').forEach(function (cb) {
      cb.addEventListener("change", function () {
        cb.closest(".chk-pill").classList.toggle("checked", cb.checked);
        renderLivePreview();
      });
    });
  }

  function renderIconSelect(selectId, options, selectedValue) {
    var select = $(selectId);
    if (!select) return;
    select.innerHTML = options.map(function (key) {
      var label = ICON_LABELS[key] || key;
      return '<option value="' + key + '"' + (key === selectedValue ? " selected" : "") + ">" + label + "</option>";
    }).join("");
  }

  function renderBadgePresets() {
    var wrap = $("badgePresets");
    if (!wrap) return;
    var html = BADGE_PRESETS.map(function (label) {
      return '<button type="button" class="badge-preset-btn" data-value="' + label + '">' + label + "</button>";
    }).join("");
    html += '<button type="button" class="badge-preset-btn" data-value="">بدون شارة</button>';
    wrap.innerHTML = html;
    wrap.querySelectorAll(".badge-preset-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        $("fldBadge").value = btn.dataset.value;
        renderLivePreview();
      });
    });
  }

  function updateVideoPreview(url) {
    var wrap = $("videoPreviewWrap");
    var box = $("videoPreview");
    if (!wrap || !box) return;
    if (!url) { wrap.hidden = true; box.innerHTML = ""; return; }

    var embed = typeof toEmbedUrl === "function" ? toEmbedUrl(url) : null;
    if (embed) {
      box.innerHTML = '<iframe src="' + embed + '" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
    } else {
      box.innerHTML = '<video src="' + url + '" controls playsinline></video>';
    }
    wrap.hidden = false;
  }

  function collectFormProduct() {
    var categories = [];
    document.querySelectorAll('#fldCategories input[type="checkbox"]:checked').forEach(function (cb) {
      categories.push(cb.value);
    });
    return {
      id: $("fldProductId").value || "preview",
      name: $("fldName").value,
      price: parseFloat($("fldPrice").value) || 0,
      oldPrice: $("fldOldPrice").value ? parseFloat($("fldOldPrice").value) : null,
      categories: categories,
      description: $("fldDescription").value,
      image: $("fldImagePath").value,
      video: $("fldVideo").value || null,
      icon: $("fldIcon").value || "generic",
      badge: $("fldBadge").value || null,
      inStock: $("fldInStock").checked
    };
  }

  function renderLivePreview() {
    var frame = $("livePreviewFrame");
    if (!frame) return;
    var p = collectFormProduct();

    var priceHtml = p.oldPrice
      ? '<span class="price">' + money(p.price) + '</span> <span class="price-old">' + money(p.oldPrice) + "</span>"
      : '<span class="price">' + money(p.price) + "</span>";

    var badgeHtml = "";
    if (!p.inStock) {
      badgeHtml = '<span class="badge badge-out">غير متوفر</span>';
    } else if (p.badge) {
      badgeHtml = '<span class="badge">' + p.badge + "</span>";
    }

    var tagsHtml = p.categories.map(function (id) {
      var c = findCategory(id);
      return c ? '<span class="tag">#' + c.label + "</span>" : "";
    }).join("");

    var previewImageSrc = currentImagePreviewDataUrl || (p.image ? "../" + p.image : "");

    frame.innerHTML =
      '<article class="product-card">' +
        '<div class="product-thumb">' +
          badgeHtml +
          (previewImageSrc ? '<img src="' + previewImageSrc + '" alt="" class="product-img">' : "") +
          '<div class="product-icon-fallback">' + safeIcon(p.icon, 56) + "</div>" +
          '<span class="quick-view-btn" style="opacity:1;pointer-events:none;">' + safeIcon("eye", 18) + "</span>" +
          (p.video ? '<span class="video-badge" style="pointer-events:none;">' + safeIcon("play", 14) + "</span>" : "") +
        "</div>" +
        '<div class="product-info">' +
          '<div class="product-tags">' + tagsHtml + "</div>" +
          "<h3>" + (p.name || "اسم المنتج") + "</h3>" +
          '<p class="product-desc">' + (p.description || "وصف المنتج هيظهر هنا") + "</p>" +
          '<div class="product-row">' +
            '<span class="price-wrap">' + priceHtml + "</span>" +
            '<button type="button" class="btn btn-small" tabindex="-1">' + (p.inStock ? "أضف للسلة" : "غير متوفر") + "</button>" +
          "</div>" +
        "</div>" +
      "</article>";

    var img = frame.querySelector(".product-img");
    if (img) img.addEventListener("error", function () { this.style.display = "none"; });
  }

  // ------------------------------------------------------------------
  // معرض الصور الإضافية
  // ------------------------------------------------------------------
  function renderGalleryRows() {
    var wrap = $("galleryList");
    if (!wrap) return;
    if (galleryRows.length === 0) {
      wrap.innerHTML = '<span class="field-hint">لا توجد صور إضافية بعد.</span>';
      return;
    }
    wrap.innerHTML = galleryRows.map(function (row) {
      var previewSrc = row.previewDataUrl || (row.path ? "../" + row.path : "");
      return (
        '<div class="gallery-row" data-row-id="' + row.rowId + '">' +
          (previewSrc
            ? '<img class="image-preview" src="' + previewSrc + '" alt="">'
            : '<span class="image-preview" style="display:flex;align-items:center;justify-content:center;color:var(--oak);">' + safeIcon("image", 22) + "</span>") +
          '<div class="gallery-row-fields">' +
            '<input type="file" accept="image/*" class="gallery-file-input" data-row-id="' + row.rowId + '">' +
            '<input type="text" class="gallery-path-input" data-row-id="' + row.rowId + '" placeholder="assets/images/products/p001-alt1.jpg" dir="ltr" value="' + (row.path || "") + '">' +
            (row.file ? '<button type="button" class="gallery-download-btn" data-row-id="' + row.rowId + '">⬇ تنزيل الصورة بالاسم الصحيح</button>' : "") +
          "</div>" +
          '<button type="button" class="gallery-remove-btn" data-row-id="' + row.rowId + '" aria-label="حذف الصورة">' + safeIcon("trash", 15) + "</button>" +
        "</div>"
      );
    }).join("");

    wrap.querySelectorAll(".gallery-file-input").forEach(function (input) {
      input.addEventListener("change", function (e) { handleGalleryFileChange(e, input.dataset.rowId); });
    });
    wrap.querySelectorAll(".gallery-path-input").forEach(function (input) {
      input.addEventListener("input", function () {
        var row = galleryRows.filter(function (r) { return String(r.rowId) === input.dataset.rowId; })[0];
        if (row) row.path = input.value;
      });
    });
    wrap.querySelectorAll(".gallery-download-btn").forEach(function (btn) {
      btn.addEventListener("click", function () { downloadGalleryImage(btn.dataset.rowId); });
    });
    wrap.querySelectorAll(".gallery-remove-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        galleryRows = galleryRows.filter(function (r) { return String(r.rowId) !== btn.dataset.rowId; });
        renderGalleryRows();
      });
    });
  }

  function downloadGalleryImage(rowId) {
    var row = galleryRows.filter(function (r) { return String(r.rowId) === String(rowId); })[0];
    if (!row || !row.file) return;
    var filename = (row.path || row.file.name).split("/").pop();
    var url = URL.createObjectURL(row.file);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
    showToast("تم تنزيل الصورة — ارفعها لمجلد assets/images/products");
  }

  function addGalleryRow() {
    galleryRows.push({ rowId: ++rowIdCounter, path: "", file: null, previewDataUrl: null });
    renderGalleryRows();
  }

  function handleGalleryFileChange(e, rowId) {
    var file = e.target.files && e.target.files[0];
    var row = galleryRows.filter(function (r) { return String(r.rowId) === String(rowId); })[0];
    if (!row || !file) return;
    row.file = file;

    var reader = new FileReader();
    reader.onload = function (ev) {
      row.previewDataUrl = ev.target.result;
      var id = $("fldProductId").value || editingProductId || generateProductId(state.products);
      var ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      row.path = "assets/images/products/" + id + "-alt" + row.rowId + "." + ext;
      renderGalleryRows();
    };
    reader.readAsDataURL(file);
  }

  // ------------------------------------------------------------------
  // المواصفات
  // ------------------------------------------------------------------
  function renderSpecRows() {
    var wrap = $("specsList");
    if (!wrap) return;
    if (specRows.length === 0) {
      wrap.innerHTML = '<span class="field-hint">لا توجد مواصفات بعد.</span>';
      return;
    }
    wrap.innerHTML = specRows.map(function (row) {
      return (
        '<div class="spec-row" data-row-id="' + row.rowId + '">' +
          '<input type="text" class="spec-label-input" data-row-id="' + row.rowId + '" placeholder="مثال: الخامة" value="' + (row.label || "") + '">' +
          '<input type="text" class="spec-value-input" data-row-id="' + row.rowId + '" placeholder="مثال: خشب الزان الطبيعي" value="' + (row.value || "") + '">' +
          '<button type="button" class="spec-remove-btn" data-row-id="' + row.rowId + '" aria-label="حذف المواصفة">' + safeIcon("trash", 15) + "</button>" +
        "</div>"
      );
    }).join("");

    wrap.querySelectorAll(".spec-label-input").forEach(function (input) {
      input.addEventListener("input", function () {
        var row = specRows.filter(function (r) { return String(r.rowId) === input.dataset.rowId; })[0];
        if (row) row.label = input.value;
      });
    });
    wrap.querySelectorAll(".spec-value-input").forEach(function (input) {
      input.addEventListener("input", function () {
        var row = specRows.filter(function (r) { return String(r.rowId) === input.dataset.rowId; })[0];
        if (row) row.value = input.value;
      });
    });
    wrap.querySelectorAll(".spec-remove-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        specRows = specRows.filter(function (r) { return String(r.rowId) !== btn.dataset.rowId; });
        renderSpecRows();
      });
    });
  }

  function addSpecRow() {
    specRows.push({ rowId: ++rowIdCounter, label: "", value: "" });
    renderSpecRows();
  }

  // ------------------------------------------------------------------
  // تقييمات العملاء المنشورة
  // ------------------------------------------------------------------
  var REVIEW_RATING_OPTIONS = [5, 4, 3, 2, 1];
  function ratingOptionsHtml(selected) {
    return REVIEW_RATING_OPTIONS.map(function (n) {
      var stars = "★".repeat(n) + "☆".repeat(5 - n);
      return '<option value="' + n + '"' + (n === selected ? " selected" : "") + ">" + stars + " (" + n + ")</option>";
    }).join("");
  }

  function renderReviewRows() {
    var wrap = $("reviewsList");
    if (!wrap) return;
    if (reviewRows.length === 0) {
      wrap.innerHTML = '<span class="field-hint">لا توجد تقييمات منشورة بعد.</span>';
      return;
    }
    wrap.innerHTML = reviewRows.map(function (row) {
      return (
        '<div class="review-row" data-row-id="' + row.rowId + '">' +
          '<div class="review-row-top">' +
            '<input type="text" class="review-name-input" data-row-id="' + row.rowId + '" placeholder="اسم العميل" value="' + (row.name || "") + '">' +
            '<select class="review-rating-input" data-row-id="' + row.rowId + '">' + ratingOptionsHtml(row.rating || 5) + "</select>" +
            '<input type="date" class="review-date-input" data-row-id="' + row.rowId + '" value="' + (row.date || "") + '">' +
            '<button type="button" class="spec-remove-btn review-remove-btn" data-row-id="' + row.rowId + '" aria-label="حذف التقييم">' + safeIcon("trash", 15) + "</button>" +
          "</div>" +
          '<textarea class="review-comment-input" data-row-id="' + row.rowId + '" rows="2" placeholder="تعليق العميل">' + (row.comment || "") + "</textarea>" +
        "</div>"
      );
    }).join("");

    wrap.querySelectorAll(".review-name-input").forEach(function (input) {
      input.addEventListener("input", function () {
        var row = reviewRows.filter(function (r) { return String(r.rowId) === input.dataset.rowId; })[0];
        if (row) row.name = input.value;
      });
    });
    wrap.querySelectorAll(".review-rating-input").forEach(function (select) {
      select.addEventListener("change", function () {
        var row = reviewRows.filter(function (r) { return String(r.rowId) === select.dataset.rowId; })[0];
        if (row) row.rating = parseInt(select.value, 10);
      });
    });
    wrap.querySelectorAll(".review-date-input").forEach(function (input) {
      input.addEventListener("input", function () {
        var row = reviewRows.filter(function (r) { return String(r.rowId) === input.dataset.rowId; })[0];
        if (row) row.date = input.value;
      });
    });
    wrap.querySelectorAll(".review-comment-input").forEach(function (textarea) {
      textarea.addEventListener("input", function () {
        var row = reviewRows.filter(function (r) { return String(r.rowId) === textarea.dataset.rowId; })[0];
        if (row) row.comment = textarea.value;
      });
    });
    wrap.querySelectorAll(".review-remove-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        reviewRows = reviewRows.filter(function (r) { return String(r.rowId) !== btn.dataset.rowId; });
        renderReviewRows();
      });
    });
  }

  function addReviewRow() {
    var today = new Date().toISOString().slice(0, 10);
    reviewRows.push({ rowId: ++rowIdCounter, name: "", rating: 5, comment: "", date: today });
    renderReviewRows();
  }

  function openProductModal(id) {
    editingProductId = id || null;
    var product = id ? findProduct(id) : null;
    currentImageFile = null;
    currentImagePreviewDataUrl = null;

    $("productModalTitle").textContent = product ? "تعديل منتج" : "إضافة منتج جديد";
    $("fldProductId").value = product ? product.id : "";
    $("fldName").value = product ? product.name : "";
    $("fldPrice").value = product ? product.price : "";
    $("fldOldPrice").value = product && product.oldPrice ? product.oldPrice : "";
    $("fldDescription").value = product ? (product.description || "") : "";
    $("fldBadge").value = product ? (product.badge || "") : "";
    $("fldInStock").checked = product ? product.inStock !== false : true;
    $("fldImagePath").value = product ? (product.image || "") : "";
    $("fldVideo").value = product ? (product.video || "") : "";
    $("fldImageFile").value = "";
    $("imageTools").hidden = true;

    renderCategoryCheckboxes(product ? (product.categories || []) : []);
    renderIconSelect("fldIcon", PRODUCT_ICON_OPTIONS, product ? product.icon : "generic");
    renderBadgePresets();
    updateVideoPreview($("fldVideo").value);

    galleryRows = (product && product.images ? product.images : []).map(function (path) {
      return { rowId: ++rowIdCounter, path: path, file: null, previewDataUrl: null };
    });
    renderGalleryRows();

    specRows = (product && product.specs ? product.specs : []).map(function (spec) {
      return { rowId: ++rowIdCounter, label: spec.label || "", value: spec.value || "" };
    });
    renderSpecRows();

    reviewRows = (product && product.reviews ? product.reviews : []).map(function (rev) {
      return { rowId: ++rowIdCounter, name: rev.name || "", rating: rev.rating || 5, comment: rev.comment || "", date: rev.date || "" };
    });
    renderReviewRows();

    var viewLink = $("viewFullPageLink");
    if (viewLink) {
      if (product) {
        viewLink.hidden = false;
        viewLink.setAttribute("href", "../product.html?id=" + encodeURIComponent(product.id));
      } else {
        viewLink.hidden = true;
      }
    }

    renderLivePreview();

    openModal("productModal");
  }

  function closeProductModalFn() {
    closeModalEl("productModal");
    editingProductId = null;
    currentImageFile = null;
    currentImagePreviewDataUrl = null;
    galleryRows = [];
    specRows = [];
    reviewRows = [];
  }

  function saveProductFromForm(e) {
    e.preventDefault();
    var name = $("fldName").value.trim();
    var price = parseFloat($("fldPrice").value);
    if (!name) { showToast("اكتب اسم المنتج أولاً"); return; }
    if (isNaN(price) || price < 0) { showToast("اكتب سعر صحيح"); return; }

    var categories = [];
    document.querySelectorAll('#fldCategories input[type="checkbox"]:checked').forEach(function (cb) {
      categories.push(cb.value);
    });

    var id = editingProductId || generateProductId(state.products);
    var oldPriceVal = $("fldOldPrice").value ? parseFloat($("fldOldPrice").value) : null;

    var images = galleryRows
      .map(function (row) { return (row.path || "").trim(); })
      .filter(function (path) { return path; });

    var specs = specRows
      .filter(function (row) { return (row.label || "").trim() && (row.value || "").trim(); })
      .map(function (row) { return { label: row.label.trim(), value: row.value.trim() }; });

    var reviews = reviewRows
      .filter(function (row) { return (row.name || "").trim() && (row.comment || "").trim(); })
      .map(function (row) {
        return {
          name: row.name.trim(),
          rating: row.rating || 5,
          comment: row.comment.trim(),
          date: row.date || ""
        };
      });

    var productData = {
      id: id,
      name: name,
      price: price,
      oldPrice: oldPriceVal && oldPriceVal > 0 ? oldPriceVal : null,
      categories: categories,
      description: $("fldDescription").value.trim(),
      image: $("fldImagePath").value.trim(),
      video: $("fldVideo").value.trim() || null,
      images: images,
      specs: specs,
      reviews: reviews,
      icon: $("fldIcon").value || "generic",
      badge: $("fldBadge").value.trim() || null,
      inStock: $("fldInStock").checked
    };

    if (editingProductId) {
      var idx = state.products.findIndex(function (p) { return p.id === editingProductId; });
      if (idx !== -1) state.products[idx] = productData; else state.products.push(productData);
    } else {
      state.products.push(productData);
    }

    saveDraft();
    renderProductsTable();
    closeProductModalFn();
    showToast(editingProductId ? "تم تحديث المنتج" : "تمت إضافة المنتج، متبقّي رفع الصورة (لو فيه) وتصدير الملف");
  }

  function deleteProduct(id) {
    var product = findProduct(id);
    if (!product) return;
    if (!window.confirm('هل تريد حذف "' + product.name + '"؟ لا يمكن التراجع عن هذا الإجراء.')) return;
    state.products = state.products.filter(function (p) { return p.id !== id; });
    saveDraft();
    renderProductsTable();
    showToast("تم حذف المنتج");
  }

  // ------------------------------------------------------------------
  // الصور: معاينة + تنزيل بالاسم الصحيح
  // ------------------------------------------------------------------
  function handleImageFileChange(e) {
    var file = e.target.files && e.target.files[0];
    if (!file) {
      currentImageFile = null;
      currentImagePreviewDataUrl = null;
      $("imageTools").hidden = true;
      renderLivePreview();
      return;
    }
    currentImageFile = file;

    var reader = new FileReader();
    reader.onload = function (ev) {
      currentImagePreviewDataUrl = ev.target.result;
      $("imagePreview").src = currentImagePreviewDataUrl;
      $("imageTools").hidden = false;
      renderLivePreview();
    };
    reader.readAsDataURL(file);

    var id = $("fldProductId").value || editingProductId || generateProductId(state.products);
    var ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    $("fldImagePath").value = "assets/images/products/" + id + "." + ext;
  }

  function downloadRenamedImage() {
    if (!currentImageFile) { showToast("اختر صورة أولاً"); return; }
    var path = $("fldImagePath").value || currentImageFile.name;
    var filename = path.split("/").pop();
    var url = URL.createObjectURL(currentImageFile);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
    showToast("تم تنزيل الصورة — ارفعها الآن لمجلد assets/images/products");
  }

  // ------------------------------------------------------------------
  // جدول الفئات + نافذة إضافة/تعديل فئة
  // ------------------------------------------------------------------
  function renderCategoriesTable() {
    var body = $("categoriesTableBody");
    if (!body) return;

    if (state.categories.length === 0) {
      body.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--ink-soft);padding:28px;">لا توجد فئات بعد.</td></tr>';
      return;
    }

    body.innerHTML = state.categories.map(function (c) {
      var count = state.products.filter(function (p) { return (p.categories || []).indexOf(c.id) !== -1; }).length;
      return (
        '<tr data-id="' + c.id + '">' +
          '<td><div class="table-product-cell">' +
            '<div class="table-thumb">' + safeIcon(c.icon, 20) + "</div>" +
            '<span class="table-name">' + c.label + "</span>" +
          "</div></td>" +
          '<td dir="ltr" style="text-align:left;color:var(--ink-soft);">' + c.id + "</td>" +
          "<td>" + count + "</td>" +
          '<td><div class="row-actions">' +
            '<button type="button" class="row-edit-cat" data-id="' + c.id + '" aria-label="تعديل">' + safeIcon("edit", 16) + "</button>" +
            '<button type="button" class="row-delete-cat" data-id="' + c.id + '" aria-label="حذف">' + safeIcon("trash", 16) + "</button>" +
          "</div></td>" +
        "</tr>"
      );
    }).join("");

    body.querySelectorAll(".row-edit-cat").forEach(function (btn) {
      btn.addEventListener("click", function () { openCategoryModal(btn.dataset.id); });
    });
    body.querySelectorAll(".row-delete-cat").forEach(function (btn) {
      btn.addEventListener("click", function () { deleteCategory(btn.dataset.id); });
    });
  }

  function openCategoryModal(id) {
    editingCategoryId = id || null;
    var cat = id ? findCategory(id) : null;
    $("categoryModalTitle").textContent = cat ? "تعديل فئة" : "إضافة فئة جديدة";
    $("catFldId").value = cat ? cat.id : "";
    $("catFldLabel").value = cat ? cat.label : "";
    $("catFldSlug").value = cat ? cat.id : "";
    $("catFldSlug").disabled = !!cat;
    renderIconSelect("catFldIcon", CATEGORY_ICON_OPTIONS, cat ? cat.icon : "generic");
    openModal("categoryModal");
  }

  function closeCategoryModalFn() {
    closeModalEl("categoryModal");
    editingCategoryId = null;
  }

  function saveCategoryFromForm(e) {
    e.preventDefault();
    var label = $("catFldLabel").value.trim();
    if (!label) { showToast("اكتب اسم الفئة"); return; }

    var id;
    if (editingCategoryId) {
      id = editingCategoryId;
    } else {
      var slugInput = $("catFldSlug").value.trim().toLowerCase();
      if (slugInput) {
        if (!/^[a-z0-9-]+$/.test(slugInput)) {
          showToast("المعرف لازم يكون حروف إنجليزية صغيرة وأرقام وشرطات فقط");
          return;
        }
        if (state.categories.some(function (c) { return c.id === slugInput; })) {
          showToast("المعرف ده مستخدم بالفعل، جرّب معرف مختلف");
          return;
        }
        id = slugInput;
      } else {
        id = generateCategoryId(label, state.categories);
      }
    }

    var catData = { id: id, label: label, icon: $("catFldIcon").value || "generic" };

    if (editingCategoryId) {
      var idx = state.categories.findIndex(function (c) { return c.id === editingCategoryId; });
      if (idx !== -1) state.categories[idx] = catData;
    } else {
      state.categories.push(catData);
    }

    saveDraft();
    renderCategoriesTable();
    renderProductsTable();
    closeCategoryModalFn();
    showToast(editingCategoryId ? "تم تحديث الفئة" : "تمت إضافة الفئة");
  }

  function deleteCategory(id) {
    var cat = findCategory(id);
    if (!cat) return;
    var count = state.products.filter(function (p) { return (p.categories || []).indexOf(id) !== -1; }).length;
    var msg = count > 0
      ? 'الفئة "' + cat.label + '" مستخدمة في ' + count + ' منتج، وهتتشال منهم تلقائيًا لو حذفتها. متأكد؟'
      : 'هل تريد حذف فئة "' + cat.label + '"؟';
    if (!window.confirm(msg)) return;

    state.categories = state.categories.filter(function (c) { return c.id !== id; });
    state.products.forEach(function (p) {
      p.categories = (p.categories || []).filter(function (cid) { return cid !== id; });
    });

    saveDraft();
    renderCategoriesTable();
    renderProductsTable();
    showToast("تم حذف الفئة");
  }

  // ------------------------------------------------------------------
  // الشريط الإعلاني — الإعدادات العامة والمعاينة المباشرة
  // ------------------------------------------------------------------
  function collectAnnounceSettingsFromForm() {
    return {
      enabled: $("anEnabled").checked,
      mode: $("anMode").value,
      direction: $("anDirection").value,
      staticAlign: $("anAlign").value,
      speed: $("anSpeed").value,
      customSpeed: parseInt($("anCustomSpeed").value, 10) || 60,
      bgColor: $("anBgColor").value,
      textColor: $("anTextColor").value,
      accentColor: $("anAccentColor").value,
      textSize: parseInt($("anTextSize").value, 10) || 14,
      textWeight: $("anTextWeight").value,
      emojiSize: parseInt($("anEmojiSize").value, 10) || 16,
      imageSize: parseInt($("anImageSize").value, 10) || 20,
      borderRadius: parseInt($("anRadius").value, 10) || 0
    };
  }

  function updateAnnounceConditionalFields() {
    var isAnimated = $("anMode").value === "animated";
    $("anDirectionWrap").hidden = !isAnimated;
    $("anSpeedWrap").hidden = !isAnimated;
    $("anAlignWrap").hidden = isAnimated;
    var isCustomSpeed = $("anSpeed").value === "custom";
    $("anCustomSpeedWrap").hidden = !(isAnimated && isCustomSpeed);
  }

  function renderAnnounceSettingsForm() {
    var s = state.announceSettings || {};
    $("anEnabled").checked = s.enabled !== false;
    $("anMode").value = s.mode || "animated";
    $("anDirection").value = s.direction || "rtl";
    $("anAlign").value = s.staticAlign || "center";
    $("anSpeed").value = s.speed || "medium";
    $("anCustomSpeed").value = s.customSpeed || 60;
    $("anBgColor").value = s.bgColor || "#3E2723";
    $("anTextColor").value = s.textColor || "#FFFDF9";
    $("anAccentColor").value = s.accentColor || "#C9A876";
    $("anTextSize").value = s.textSize || 14;
    $("anTextWeight").value = s.textWeight || "normal";
    $("anEmojiSize").value = s.emojiSize || 16;
    $("anImageSize").value = s.imageSize != null ? s.imageSize : 20;
    $("anRadius").value = s.borderRadius != null ? s.borderRadius : 999;
    updateAnnounceConditionalFields();
    renderAnnouncePreview();
  }

  function saveAnnounceSettingsForm(e) {
    e.preventDefault();
    state.announceSettings = collectAnnounceSettingsFromForm();
    saveDraft();
    showToast("تم حفظ إعدادات الشريط");
    renderAnnouncePreview();
  }

  function renderAnnouncePreview() {
    if (typeof AnnouncementBar === "undefined") return;
    var settings = collectAnnounceSettingsFromForm();
    AnnouncementBar.render("previewAnnounceBar", "previewAnnounceTrack", settings, state.announcements);
  }

  // ------------------------------------------------------------------
  // الشريط الإعلاني — قائمة الإعلانات (ترتيب، تعديل، حذف)
  // ------------------------------------------------------------------
  function generateAnnouncementId(items) {
    var maxNum = 0;
    items.forEach(function (a) {
      var m = /^a(\d+)$/.exec(a.id);
      if (m) maxNum = Math.max(maxNum, parseInt(m[1], 10));
    });
    var n = maxNum + 1;
    var id = "a" + n;
    while (items.some(function (a) { return a.id === id; })) { n++; id = "a" + n; }
    return id;
  }

  function renderAnnouncementsList() {
    var wrap = $("announcementsList");
    if (!wrap) return;
    var items = state.announcements || [];
    if (items.length === 0) {
      wrap.innerHTML = '<span class="field-hint">لا توجد إعلانات بعد.</span>';
      return;
    }
    wrap.innerHTML = items.map(function (a, i) {
      return (
        '<div class="announcement-row' + (a.enabled === false ? " is-disabled" : "") + '" data-id="' + a.id + '">' +
          '<div class="announcement-row-info">' +
            (a.emoji ? '<span class="announcement-row-emoji">' + a.emoji + "</span>" : "") +
            '<span class="announcement-row-text">' + a.text + "</span>" +
            (a.enabled === false ? '<span class="status-pill out">معطّل</span>' : "") +
          "</div>" +
          '<div class="announcement-row-actions">' +
            '<button type="button" class="an-move-up" data-id="' + a.id + '" aria-label="تحريك لأعلى"' + (i === 0 ? " disabled" : "") + ">↑</button>" +
            '<button type="button" class="an-move-down" data-id="' + a.id + '" aria-label="تحريك لأسفل"' + (i === items.length - 1 ? " disabled" : "") + ">↓</button>" +
            '<button type="button" class="an-edit" data-id="' + a.id + '" aria-label="تعديل">' + safeIcon("edit", 14) + "</button>" +
            '<button type="button" class="an-delete" data-id="' + a.id + '" aria-label="حذف">' + safeIcon("trash", 14) + "</button>" +
          "</div>" +
        "</div>"
      );
    }).join("");

    wrap.querySelectorAll(".an-move-up").forEach(function (btn) {
      btn.addEventListener("click", function () { moveAnnouncement(btn.dataset.id, -1); });
    });
    wrap.querySelectorAll(".an-move-down").forEach(function (btn) {
      btn.addEventListener("click", function () { moveAnnouncement(btn.dataset.id, 1); });
    });
    wrap.querySelectorAll(".an-edit").forEach(function (btn) {
      btn.addEventListener("click", function () { openAnnouncementModal(btn.dataset.id); });
    });
    wrap.querySelectorAll(".an-delete").forEach(function (btn) {
      btn.addEventListener("click", function () { deleteAnnouncement(btn.dataset.id); });
    });
  }

  function moveAnnouncement(id, delta) {
    var idx = state.announcements.findIndex(function (a) { return a.id === id; });
    var newIdx = idx + delta;
    if (idx === -1 || newIdx < 0 || newIdx >= state.announcements.length) return;
    var tmp = state.announcements[idx];
    state.announcements[idx] = state.announcements[newIdx];
    state.announcements[newIdx] = tmp;
    saveDraft();
    renderAnnouncementsList();
    renderAnnouncePreview();
  }

  function deleteAnnouncement(id) {
    var a = state.announcements.filter(function (x) { return x.id === id; })[0];
    if (!a) return;
    if (!window.confirm('هل تريد حذف الإعلان "' + a.text + '"؟')) return;
    state.announcements = state.announcements.filter(function (x) { return x.id !== id; });
    saveDraft();
    renderAnnouncementsList();
    renderAnnouncePreview();
    showToast("تم حذف الإعلان");
  }

  // ------------------------------------------------------------------
  // الشريط الإعلاني — نافذة إضافة/تعديل إعلان
  // ------------------------------------------------------------------
  function openAnnouncementModal(id) {
    editingAnnouncementId = id || null;
    var a = id ? state.announcements.filter(function (x) { return x.id === id; })[0] : null;
    currentAnImageFile = null;
    currentAnImagePreviewDataUrl = null;

    $("announcementModalTitle").textContent = a ? "تعديل إعلان" : "إضافة إعلان";
    $("anFldId").value = a ? a.id : "";
    $("anFldText").value = a ? a.text : "";
    $("anFldEmoji").value = a ? (a.emoji || "") : "";
    $("anFldLink").value = a ? (a.link || "") : "";
    $("anFldImagePath").value = a ? (a.image || "") : "";
    $("anFldEnabled").checked = a ? a.enabled !== false : true;
    $("anFldImageFile").value = "";
    $("anImageTools").hidden = true;

    openModal("announcementModal");
  }

  function closeAnnouncementModalFn() {
    closeModalEl("announcementModal");
    editingAnnouncementId = null;
    currentAnImageFile = null;
    currentAnImagePreviewDataUrl = null;
  }

  function handleAnImageFileChange(e) {
    var file = e.target.files && e.target.files[0];
    if (!file) {
      currentAnImageFile = null;
      currentAnImagePreviewDataUrl = null;
      $("anImageTools").hidden = true;
      return;
    }
    currentAnImageFile = file;

    var reader = new FileReader();
    reader.onload = function (ev) {
      currentAnImagePreviewDataUrl = ev.target.result;
      $("anImagePreview").src = currentAnImagePreviewDataUrl;
      $("anImageTools").hidden = false;
    };
    reader.readAsDataURL(file);

    var id = $("anFldId").value || editingAnnouncementId || generateAnnouncementId(state.announcements);
    var ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    $("anFldImagePath").value = "assets/images/announcements/" + id + "." + ext;
  }

  function downloadAnImage() {
    if (!currentAnImageFile) { showToast("اختر صورة أولاً"); return; }
    var path = $("anFldImagePath").value || currentAnImageFile.name;
    var filename = path.split("/").pop();
    var url = URL.createObjectURL(currentAnImageFile);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
    showToast("تم تنزيل الصورة — ارفعها لمجلد assets/images/announcements");
  }

  function saveAnnouncementFromForm(e) {
    e.preventDefault();
    var text = $("anFldText").value.trim();
    if (!text) { showToast("اكتب نص الإعلان أولاً"); return; }

    var id = editingAnnouncementId || generateAnnouncementId(state.announcements);
    var data = {
      id: id,
      text: text,
      emoji: $("anFldEmoji").value.trim(),
      image: $("anFldImagePath").value.trim(),
      link: $("anFldLink").value.trim(),
      enabled: $("anFldEnabled").checked
    };

    if (editingAnnouncementId) {
      var idx = state.announcements.findIndex(function (a) { return a.id === editingAnnouncementId; });
      if (idx !== -1) state.announcements[idx] = data; else state.announcements.push(data);
    } else {
      state.announcements.push(data);
    }

    saveDraft();
    renderAnnouncementsList();
    renderAnnouncePreview();
    closeAnnouncementModalFn();
    showToast(editingAnnouncementId ? "تم تحديث الإعلان" : "تمت إضافة الإعلان");
  }

  // ------------------------------------------------------------------
  // الإعدادات
  // ------------------------------------------------------------------
  function renderSettingsForm() {
    var c = state.config || {};
    $("cfgWhatsapp").value = c.whatsappNumber || "";
    $("cfgCurrency").value = c.currency || "";
    $("cfgPhone").value = c.phone || "";
    $("cfgEmail").value = c.email || "";
    $("cfgAddress").value = c.address || "";
    $("cfgFacebook").value = (c.social && c.social.facebook) || "";
    $("cfgInstagram").value = (c.social && c.social.instagram) || "";
    $("cfgTiktok").value = (c.social && c.social.tiktok) || "";
    $("cfgFormAction").value = c.contactFormAction || "";
    $("cfgReviewFormAction").value = c.reviewFormAction || "";
  }

  function saveSettingsForm(e) {
    e.preventDefault();
    state.config = {
      whatsappNumber: $("cfgWhatsapp").value.trim(),
      currency: $("cfgCurrency").value.trim() || "ج.م",
      phone: $("cfgPhone").value.trim(),
      email: $("cfgEmail").value.trim(),
      address: $("cfgAddress").value.trim(),
      social: {
        facebook: $("cfgFacebook").value.trim() || "#",
        instagram: $("cfgInstagram").value.trim() || "#",
        tiktok: $("cfgTiktok").value.trim() || "#"
      },
      contactFormAction: $("cfgFormAction").value.trim(),
      reviewFormAction: $("cfgReviewFormAction").value.trim()
    };
    saveDraft();
    showToast("تم حفظ الإعدادات");
  }

  // ------------------------------------------------------------------
  // التصدير: توليد ملفات جاهزة للرفع
  // ------------------------------------------------------------------
  function serializeProducts() {
    var lines = [];
    lines.push("/* ==========================================================================");
    lines.push("   ملف بيانات المنتجات والفئات");
    lines.push("   ==========================================================================");
    lines.push("   تم إنشاء/تحديث هذا الملف بواسطة لوحة تحكم خشبيكو (admin/index.html).");
    lines.push("   تقدر تعدله يدويًا برضه، أو ترجع للوحة التحكم لاحقًا لإدارة منتجاتك.");
    lines.push("   ========================================================================== */");
    lines.push("");
    lines.push("const PRODUCT_CATEGORIES = [");
    state.categories.forEach(function (c, i) {
      var comma = i < state.categories.length - 1 ? "," : "";
      lines.push("  { id: " + JSON.stringify(c.id) + ", label: " + JSON.stringify(c.label) + ", icon: " + JSON.stringify(c.icon) + " }" + comma);
    });
    lines.push("];");
    lines.push("");
    lines.push("const PRODUCTS = [");
    state.products.forEach(function (p, i) {
      var comma = i < state.products.length - 1 ? "," : "";
      lines.push("  {");
      lines.push("    id: " + JSON.stringify(p.id) + ",");
      lines.push("    name: " + JSON.stringify(p.name) + ",");
      lines.push("    price: " + Number(p.price) + ",");
      lines.push("    oldPrice: " + (p.oldPrice ? Number(p.oldPrice) : "null") + ",");
      lines.push("    categories: " + JSON.stringify(p.categories || []) + ",");
      lines.push("    description: " + JSON.stringify(p.description || "") + ",");
      lines.push("    image: " + JSON.stringify(p.image || "") + ",");
      lines.push("    video: " + (p.video ? JSON.stringify(p.video) : "null") + ",");
      lines.push("    images: " + JSON.stringify(p.images || []) + ",");
      lines.push("    specs: " + JSON.stringify(p.specs || []) + ",");
      lines.push("    reviews: " + JSON.stringify(p.reviews || []) + ",");
      lines.push("    icon: " + JSON.stringify(p.icon || "generic") + ",");
      lines.push("    badge: " + (p.badge ? JSON.stringify(p.badge) : "null") + ",");
      lines.push("    inStock: " + (p.inStock === false ? "false" : "true"));
      lines.push("  }" + comma);
    });
    lines.push("];");
    lines.push("");
    return lines.join("\n");
  }

  function serializeConfig() {
    var c = state.config || {};
    var lines = [];
    lines.push("/* ==========================================================================");
    lines.push("   إعدادات الموقع العامة");
    lines.push("   ==========================================================================");
    lines.push("   تم إنشاء/تحديث هذا الملف بواسطة لوحة تحكم خشبيكو (admin/index.html).");
    lines.push("   ========================================================================== */");
    lines.push("");
    lines.push("const SITE_CONFIG = {");
    lines.push("  whatsappNumber: " + JSON.stringify(c.whatsappNumber || "") + ",");
    lines.push("  currency: " + JSON.stringify(c.currency || "ج.م") + ",");
    lines.push("  phone: " + JSON.stringify(c.phone || "") + ",");
    lines.push("  email: " + JSON.stringify(c.email || "") + ",");
    lines.push("  address: " + JSON.stringify(c.address || "") + ",");
    lines.push("  social: {");
    lines.push("    facebook: " + JSON.stringify((c.social && c.social.facebook) || "#") + ",");
    lines.push("    instagram: " + JSON.stringify((c.social && c.social.instagram) || "#") + ",");
    lines.push("    tiktok: " + JSON.stringify((c.social && c.social.tiktok) || "#"));
    lines.push("  },");
    lines.push("  contactFormAction: " + JSON.stringify(c.contactFormAction || "") + ",");
    lines.push("  reviewFormAction: " + JSON.stringify(c.reviewFormAction || ""));
    lines.push("};");
    lines.push("");
    return lines.join("\n");
  }

  function downloadTextFile(filename, text) {
    var blob = new Blob([text], { type: "text/javascript;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }

  function exportProductsFile() {
    downloadTextFile("products-data.js", serializeProducts());
    showToast("تم تنزيل products-data.js — ارفعه في assets/js");
  }
  function exportConfigFile() {
    downloadTextFile("config.js", serializeConfig());
    showToast("تم تنزيل config.js — ارفعه في assets/js");
  }

  function serializeAnnouncements() {
    var s = state.announceSettings || {};
    var items = state.announcements || [];
    var lines = [];
    lines.push("/* ==========================================================================");
    lines.push("   بيانات الشريط الإعلاني");
    lines.push("   ==========================================================================");
    lines.push("   تم إنشاء/تحديث هذا الملف بواسطة لوحة تحكم خشبيكو (admin/index.html).");
    lines.push("   ========================================================================== */");
    lines.push("");
    lines.push("const ANNOUNCEMENT_BAR = {");
    lines.push("  enabled: " + (s.enabled === false ? "false" : "true") + ",");
    lines.push("  mode: " + JSON.stringify(s.mode || "animated") + ",");
    lines.push("  direction: " + JSON.stringify(s.direction || "rtl") + ",");
    lines.push("  staticAlign: " + JSON.stringify(s.staticAlign || "center") + ",");
    lines.push("  speed: " + JSON.stringify(s.speed || "medium") + ",");
    lines.push("  customSpeed: " + (Number(s.customSpeed) || 60) + ",");
    lines.push("  bgColor: " + JSON.stringify(s.bgColor || "#3E2723") + ",");
    lines.push("  textColor: " + JSON.stringify(s.textColor || "#FFFDF9") + ",");
    lines.push("  accentColor: " + JSON.stringify(s.accentColor || "#C9A876") + ",");
    lines.push("  textSize: " + (Number(s.textSize) || 14) + ",");
    lines.push("  textWeight: " + JSON.stringify(s.textWeight || "normal") + ",");
    lines.push("  emojiSize: " + (Number(s.emojiSize) || 16) + ",");
    lines.push("  imageSize: " + (Number(s.imageSize) || 20) + ",");
    lines.push("  borderRadius: " + (s.borderRadius != null ? Number(s.borderRadius) : 0));
    lines.push("};");
    lines.push("");
    lines.push("const ANNOUNCEMENTS = [");
    items.forEach(function (a, i) {
      var comma = i < items.length - 1 ? "," : "";
      lines.push(
        "  { id: " + JSON.stringify(a.id) +
        ", text: " + JSON.stringify(a.text) +
        ", emoji: " + JSON.stringify(a.emoji || "") +
        ", image: " + JSON.stringify(a.image || "") +
        ", link: " + JSON.stringify(a.link || "") +
        ", enabled: " + (a.enabled === false ? "false" : "true") + " }" + comma
      );
    });
    lines.push("];");
    lines.push("");
    return lines.join("\n");
  }

  function exportAnnouncementsFile() {
    downloadTextFile("announcements-data.js", serializeAnnouncements());
    showToast("تم تنزيل announcements-data.js — ارفعه في assets/js");
  }

  // ------------------------------------------------------------------
  // تهيئة عامة
  // ------------------------------------------------------------------
  function renderAll() {
    renderProductsTable();
    renderCategoriesTable();
    renderAnnounceSettingsForm();
    renderAnnouncementsList();
    renderSettingsForm();
    updateDraftStatus();
  }

  function bindEvents() {
    var loginForm = $("loginForm");
    if (loginForm) loginForm.addEventListener("submit", doLogin);

    var logoutBtn = $("logoutBtn");
    if (logoutBtn) logoutBtn.addEventListener("click", doLogout);

    document.querySelectorAll(".admin-tab").forEach(function (btn) {
      btn.addEventListener("click", function () { switchTab(btn.dataset.tab); });
    });

    var addProductBtn = $("addProductBtn");
    if (addProductBtn) addProductBtn.addEventListener("click", function () { openProductModal(null); });

    var closeProductModalBtn = $("closeProductModal");
    if (closeProductModalBtn) closeProductModalBtn.addEventListener("click", closeProductModalFn);
    var cancelProductBtn = $("cancelProductBtn");
    if (cancelProductBtn) cancelProductBtn.addEventListener("click", closeProductModalFn);

    var productForm = $("productForm");
    if (productForm) productForm.addEventListener("submit", saveProductFromForm);

    ["fldName", "fldPrice", "fldOldPrice", "fldDescription", "fldBadge", "fldImagePath"].forEach(function (id) {
      var el = $(id);
      if (el) el.addEventListener("input", renderLivePreview);
    });
    var fldIcon = $("fldIcon");
    if (fldIcon) fldIcon.addEventListener("change", renderLivePreview);
    var fldInStock = $("fldInStock");
    if (fldInStock) fldInStock.addEventListener("change", renderLivePreview);

    var fldImageFile = $("fldImageFile");
    if (fldImageFile) fldImageFile.addEventListener("change", handleImageFileChange);
    var downloadImageBtn = $("downloadImageBtn");
    if (downloadImageBtn) downloadImageBtn.addEventListener("click", downloadRenamedImage);

    var fldVideo = $("fldVideo");
    if (fldVideo) fldVideo.addEventListener("input", function () {
      updateVideoPreview(fldVideo.value);
      renderLivePreview();
    });

    var addCategoryBtn = $("addCategoryBtn");
    if (addCategoryBtn) addCategoryBtn.addEventListener("click", function () { openCategoryModal(null); });

    var addGalleryImageBtn = $("addGalleryImageBtn");
    if (addGalleryImageBtn) addGalleryImageBtn.addEventListener("click", addGalleryRow);
    var addSpecBtn = $("addSpecBtn");
    if (addSpecBtn) addSpecBtn.addEventListener("click", addSpecRow);
    var addReviewBtn = $("addReviewBtn");
    if (addReviewBtn) addReviewBtn.addEventListener("click", addReviewRow);
    var closeCategoryModalBtn = $("closeCategoryModal");
    if (closeCategoryModalBtn) closeCategoryModalBtn.addEventListener("click", closeCategoryModalFn);
    var cancelCategoryBtn = $("cancelCategoryBtn");
    if (cancelCategoryBtn) cancelCategoryBtn.addEventListener("click", closeCategoryModalFn);
    var categoryForm = $("categoryForm");
    if (categoryForm) categoryForm.addEventListener("submit", saveCategoryFromForm);

    var addAnnouncementBtn = $("addAnnouncementBtn");
    if (addAnnouncementBtn) addAnnouncementBtn.addEventListener("click", function () { openAnnouncementModal(null); });
    var closeAnnouncementModalBtn = $("closeAnnouncementModal");
    if (closeAnnouncementModalBtn) closeAnnouncementModalBtn.addEventListener("click", closeAnnouncementModalFn);
    var cancelAnnouncementBtn = $("cancelAnnouncementBtn");
    if (cancelAnnouncementBtn) cancelAnnouncementBtn.addEventListener("click", closeAnnouncementModalFn);
    var announcementForm = $("announcementForm");
    if (announcementForm) announcementForm.addEventListener("submit", saveAnnouncementFromForm);
    var anFldImageFile = $("anFldImageFile");
    if (anFldImageFile) anFldImageFile.addEventListener("change", handleAnImageFileChange);
    var anDownloadImageBtn = $("anDownloadImageBtn");
    if (anDownloadImageBtn) anDownloadImageBtn.addEventListener("click", downloadAnImage);

    var announceSettingsForm = $("announceSettingsForm");
    if (announceSettingsForm) announceSettingsForm.addEventListener("submit", saveAnnounceSettingsForm);
    var anMode = $("anMode");
    if (anMode) anMode.addEventListener("change", function () { updateAnnounceConditionalFields(); renderAnnouncePreview(); });
    var anSpeed = $("anSpeed");
    if (anSpeed) anSpeed.addEventListener("change", function () { updateAnnounceConditionalFields(); renderAnnouncePreview(); });
    ["anEnabled", "anDirection", "anAlign", "anTextWeight"].forEach(function (id) {
      var el = $(id);
      if (el) el.addEventListener("change", renderAnnouncePreview);
    });
    ["anCustomSpeed", "anBgColor", "anTextColor", "anAccentColor", "anRadius", "anTextSize", "anEmojiSize", "anImageSize"].forEach(function (id) {
      var el = $(id);
      if (el) el.addEventListener("input", renderAnnouncePreview);
    });

    var adminModalOverlay = $("adminModalOverlay");
    if (adminModalOverlay) adminModalOverlay.addEventListener("click", closeAnyOpenModal);

    var settingsForm = $("settingsForm");
    if (settingsForm) settingsForm.addEventListener("submit", saveSettingsForm);

    var exportProductsBtn = $("exportProductsBtn");
    if (exportProductsBtn) exportProductsBtn.addEventListener("click", exportProductsFile);
    var exportConfigBtn = $("exportConfigBtn");
    if (exportConfigBtn) exportConfigBtn.addEventListener("click", exportConfigFile);
    var exportAnnouncementsBtn = $("exportAnnouncementsBtn");
    if (exportAnnouncementsBtn) exportAnnouncementsBtn.addEventListener("click", exportAnnouncementsFile);
    var resetDraftBtn = $("resetDraftBtn");
    if (resetDraftBtn) resetDraftBtn.addEventListener("click", resetDraft);

    var productAdminSearch = $("productAdminSearch");
    if (productAdminSearch) productAdminSearch.addEventListener("input", renderProductsTable);

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeAnyOpenModal();
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    bindEvents();
    checkAuth();
  });
})();
