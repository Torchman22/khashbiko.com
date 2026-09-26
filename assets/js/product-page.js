/* ==========================================================================
   منطق صفحة تفاصيل المنتج
   ==========================================================================
   يقرأ معرّف المنتج من رابط الصفحة (?id=...)، يجيب بياناته من نفس ملف
   assets/js/products-data.js اللي بتستخدمه الصفحة الرئيسية، ويعرضها.
   السلة والهيدر مشتركين من assets/js/site-common.js (نفس نظام السلة
   المستخدم في كل الموقع، مفيش نظام سلة تاني هنا).
   ========================================================================== */

(function () {
  "use strict";

  var currentProduct = null;
  var currentQty = 1;
  var galleryImages = [];
  var galleryIndex = 0;

  // ------------------------------------------------------------------
  // أدوات مساعدة
  // ------------------------------------------------------------------
  function getUrlParam(name) {
    var params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  function computeRating(reviews) {
    if (!reviews || reviews.length === 0) return null;
    var sum = reviews.reduce(function (s, r) { return s + (Number(r.rating) || 0); }, 0);
    return { average: sum / reviews.length, count: reviews.length };
  }

  function starsHtml(average) {
    var full = Math.round(average || 0);
    var out = "";
    for (var i = 1; i <= 5; i++) out += i <= full ? "★" : "☆";
    return out;
  }

  // ------------------------------------------------------------------
  // معرض الصور
  // ------------------------------------------------------------------
   function renderGallery(product) {                                                                             /*start */
  galleryImages = [product.image]
    .concat(product.images || [])
    .filter(Boolean);

  // إضافة الفيديو في نهاية المعرض
  if (product.video) {
    galleryImages.push({
      type: "video",
      src: product.video
    });
  }

  setMainImage(0);
  renderThumbs();
}                                                                                                               

 function setMainImage(index) {
  galleryIndex = index;

  var img = document.getElementById("pdMainImg");
  var video = document.getElementById("pdMainVideo");
  var iconWrap = document.getElementById("pdMainIcon");

  var item = galleryImages[index];

  // إخفاء العناصر أولًا
  img.hidden = true;
  video.hidden = true;
  iconWrap.hidden = true;

  // إذا كان العنصر فيديو
  if (item && typeof item === "object" && item.type === "video") {
  var videoContainer = document.getElementById("pdVideoContainer");
  var playOverlay = document.getElementById("pdVideoPlayOverlay");

  video.src = item.src;
  video.hidden = false;
  videoContainer.hidden = false;
  video.load();

  // إظهار زر التشغيل عند اختيار الفيديو
  playOverlay.hidden = false;
  playOverlay.classList.remove("is-playing");
}
   else {
    // إذا كان العنصر صورة
    var src = item;

    if (src) {
      img.src = src;
      img.alt = currentProduct.name;
      img.hidden = false;

      img.onerror = function () {
        img.hidden = true;
        iconWrap.innerHTML = safeIcon(currentProduct.icon, 90);
        iconWrap.hidden = false;
      };
    } else {
      iconWrap.innerHTML = safeIcon(currentProduct.icon, 90);
      iconWrap.hidden = false;
    }
  }

  // تحديد العنصر النشط
  document.querySelectorAll(".pd-thumb").forEach(function (t, i) {
    t.classList.toggle("active", i === index);
  });
}                                                                                                               

function renderThumbs() {
  var wrap = document.getElementById("pdThumbs");

  if (galleryImages.length <= 1) {
    wrap.innerHTML = "";
    wrap.hidden = true;
    return;
  }

  wrap.hidden = false;

  wrap.innerHTML = galleryImages.map(function (item, i) {

    // صورة مصغرة للفيديو
    if (item && typeof item === "object" && item.type === "video") {
      return `
        <button type="button"
                class="pd-thumb pd-video-thumb${i === 0 ? " active" : ""}"
                data-index="${i}"
                aria-label="عرض الفيديو">

          <div class="pd-video-thumb-inner">
            <span class="pd-video-play">▶</span>
            <span class="pd-video-text">فيديو</span>
          </div>

        </button>
      `;
    }

    // صورة عادية
    return `
      <button type="button"
              class="pd-thumb${i === 0 ? " active" : ""}"
              data-index="${i}">

        <img src="${item}" alt="">

      </button>
    `;

  }).join("");

  wrap.querySelectorAll(".pd-thumb").forEach(function (btn) {

    btn.addEventListener("click", function () {
      setMainImage(parseInt(btn.dataset.index, 10));
    });

    var img = btn.querySelector("img");

    if (img) {
      img.addEventListener("error", function () {
        btn.style.display = "none";
      });
    }

  });
}                                                                                              

 function openLightbox() {
  var item = galleryImages[galleryIndex];

  // لا تفتح الـ Lightbox إذا كان العنصر فيديو
  if (!item || (typeof item === "object" && item.type === "video")) {
    return;
  }

  document.getElementById("pdLightboxImg").src = item;
  document.body.classList.add("modal-open");
  lockOrUnlockScroll();
}

function closeLightbox() {
  var lightboxOverlay = document.getElementById("lightboxOverlay");

  if (lightboxOverlay) {
    lightboxOverlay.classList.remove("active");
  }

  document.body.classList.remove("modal-open");

  lockOrUnlockScroll();
}

                                                                                                                    /*end */

  // ------------------------------------------------------------------
  // السعر والتوفر
  // ------------------------------------------------------------------
  function renderPriceRow(product) {
    var wrap = document.getElementById("pdPriceRow");
    var html = '<span class="pd-price">' + money(product.price) + "</span>";
    if (product.oldPrice) {
      var discount = Math.round((1 - product.price / product.oldPrice) * 100);
      html += '<span class="pd-price-old">' + money(product.oldPrice) + "</span>";
      if (discount > 0) html += '<span class="pd-discount">خصم ' + discount + "%</span>";
    }
    wrap.innerHTML = html;
  }

  function renderStock(product) {
    var el = document.getElementById("pdStock");
    el.innerHTML = product.inStock === false
      ? '<span class="badge badge-out">غير متوفر حاليًا</span>'
      : '<span class="pd-in-stock">' + safeIcon("check", 14) + " متوفر للطلب</span>";
  }

  // ------------------------------------------------------------------
  // المواصفات
  // ------------------------------------------------------------------
  function renderSpecs(product) {
    var section = document.getElementById("pdSpecsSection");
    var list = document.getElementById("pdSpecsList");
    if (!product.specs || product.specs.length === 0) {
      section.hidden = true;
      return;
    }
    section.hidden = false;
    list.innerHTML = product.specs.map(function (s) {
      return '<div class="pd-spec-row"><dt>' + s.label + "</dt><dd>" + s.value + "</dd></div>";
    }).join("");
  }

  // ------------------------------------------------------------------
  // التقييمات
  // ==========================================================================
  // التقييمات الرسمية بتيجي من product.reviews (اللي صاحب المتجر ضايفها
  // من لوحة التحكم بعد المراجعة). أي تقييم يبعته عميل من الفورم تحت
  // بيتحفظ محليًا في متصفحه هو بس (localStorage) وبيظهر له فورًا معلّم
  // بشارة "قيد المراجعة" — العميل التاني اللي بيفتح نفس المنتج من
  // جهاز/متصفح مختلف مش هيشوفه لحد ما صاحب المتجر يراجعه ويضيفه رسميًا.
  // ==========================================================================
  var LOCAL_REVIEWS_KEY = "khashbiko_local_reviews";

  function getLocalReviews(productId) {
    try {
      var raw = window.localStorage.getItem(LOCAL_REVIEWS_KEY);
      var all = raw ? JSON.parse(raw) : {};
      return Array.isArray(all[productId]) ? all[productId] : [];
    } catch (err) {
      return [];
    }
  }

  function saveLocalReview(productId, review) {
    try {
      var raw = window.localStorage.getItem(LOCAL_REVIEWS_KEY);
      var all = raw ? JSON.parse(raw) : {};
      if (!Array.isArray(all[productId])) all[productId] = [];
      all[productId].push(review);
      window.localStorage.setItem(LOCAL_REVIEWS_KEY, JSON.stringify(all));
    } catch (err) {
      /* لو التخزين المحلي مش متاح (تصفح خاص مثلًا)، التقييم لسه بيتبعت بالإيميل لصاحب المتجر */
    }
  }

  function removeLocalReview(productId, index) {
    try {
      var raw = window.localStorage.getItem(LOCAL_REVIEWS_KEY);
      var all = raw ? JSON.parse(raw) : {};
      if (Array.isArray(all[productId])) {
        all[productId].splice(index, 1);
        window.localStorage.setItem(LOCAL_REVIEWS_KEY, JSON.stringify(all));
      }
    } catch (err) { /* ignore */ }
  }

  // لو صاحب المتجر ضاف نفس التقييم رسميًا بعدين (نفس الاسم والتعليق)،
  // نتفادى إظهار نسخة "قيد المراجعة" مكررة بجانب النسخة الرسمية.
  function isDuplicateOfOfficial(localReview, officialReviews) {
    return officialReviews.some(function (r) {
      return r.name === localReview.name && r.comment === localReview.comment;
    });
  }

  function renderReviews(product) {
    var body = document.getElementById("pdReviewsBody");
    var ratingWrap = document.getElementById("pdRating");
    var officialReviews = product.reviews || [];
    var localReviews = getLocalReviews(product.id)
      .map(function (r, i) { return { review: r, localIndex: i }; })
      .filter(function (entry) { return !isDuplicateOfOfficial(entry.review, officialReviews); });

    if (officialReviews.length === 0 && localReviews.length === 0) {
      ratingWrap.hidden = true;
      body.innerHTML =
        '<div class="pd-reviews-empty">' +
          "<p>لسه معندناش تقييمات على هذا المنتج.</p>" +
          '<p class="pd-reviews-empty-sub">كن أول من يشارك رأيه قريبًا.</p>' +
        "</div>";
      return;
    }

    var officialHtml = officialReviews.map(function (r) {
      return (
        '<div class="pd-review-item">' +
          '<div class="pd-review-head">' +
            '<span class="pd-review-name">' + (r.name || "عميل") + "</span>" +
            (r.date ? '<span class="pd-review-date">' + r.date + "</span>" : "") +
          "</div>" +
          '<span class="pd-review-stars">' + starsHtml(r.rating || 0) + "</span>" +
          '<p class="pd-review-comment">' + (r.comment || "") + "</p>" +
        "</div>"
      );
    }).join("");

    var localHtml = localReviews.map(function (entry) {
      var r = entry.review;
      return (
        '<div class="pd-review-item is-pending">' +
          '<div class="pd-review-head">' +
            '<span class="pd-review-name">' + (r.name || "عميل") + '<span class="pd-review-pending-badge">قيد المراجعة</span></span>' +
            (r.date ? '<span class="pd-review-date">' + r.date + "</span>" : "") +
          "</div>" +
          '<span class="pd-review-stars">' + starsHtml(r.rating || 0) + "</span>" +
          '<p class="pd-review-comment">' + (r.comment || "") + "</p>" +
          '<button type="button" class="pd-review-delete" data-index="' + entry.localIndex + '">حذف تقييمي</button>' +
        "</div>"
      );
    }).join("");

    if (officialReviews.length > 0) {
      var rating = computeRating(officialReviews);
      ratingWrap.hidden = false;
      document.getElementById("pdStars").textContent = starsHtml(rating.average);
      document.getElementById("pdRatingCount").textContent = "(" + rating.count + " تقييم)";

      body.innerHTML =
        '<div class="pd-reviews-summary">' +
          '<span class="pd-stars-lg">' + starsHtml(rating.average) + "</span>" +
          '<span class="pd-rating-avg">' + rating.average.toFixed(1) + "</span>" +
          '<span class="pd-rating-count">من ' + rating.count + " تقييم</span>" +
        "</div>" +
        '<div class="pd-reviews-list">' + localHtml + officialHtml + "</div>";
    } else {
      // مفيش تقييمات رسمية لسه، بس فيه تقييم/تقييمات محلية قيد المراجعة
      ratingWrap.hidden = true;
      body.innerHTML =
        '<p class="pd-reviews-empty-sub" style="margin-bottom:16px;">تقييمك وصل لصاحب المتجر وهيظهر لباقي الزوار بعد المراجعة.</p>' +
        '<div class="pd-reviews-list">' + localHtml + "</div>";
    }

    body.querySelectorAll(".pd-review-delete").forEach(function (btn) {
      btn.addEventListener("click", function () {
        removeLocalReview(product.id, parseInt(btn.dataset.index, 10));
        renderReviews(product);
      });
    });
  }

  // ------------------------------------------------------------------
  // فورم إضافة تقييم جديد
  // ------------------------------------------------------------------
  function initReviewForm(product) {
    var form = document.getElementById("reviewForm");
    if (!form) return;
    var note = document.getElementById("reviewFormNote");
    var starWrap = document.getElementById("starPicker");
    var starBtns = starWrap ? starWrap.querySelectorAll(".star-btn") : [];
    var selectedRating = 0;

    function paintStars(n) {
      starBtns.forEach(function (btn) {
        btn.classList.toggle("active", parseInt(btn.dataset.value, 10) <= n);
      });
    }

    starBtns.forEach(function (btn) {
      var value = parseInt(btn.dataset.value, 10);
      btn.addEventListener("click", function () {
        selectedRating = value;
        paintStars(selectedRating);
      });
      btn.addEventListener("mouseenter", function () { paintStars(value); });
    });
    if (starWrap) {
      starWrap.addEventListener("mouseleave", function () { paintStars(selectedRating); });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("revName").value.trim();
      var comment = document.getElementById("revComment").value.trim();

      if (!name || !comment || selectedRating === 0) {
        note.textContent = "من فضلك اكتب اسمك، اختر تقييمك بالنجوم، واكتب تعليقك.";
        return;
      }

      var reviewEntry = {
        name: name,
        rating: selectedRating,
        comment: comment,
        date: new Date().toISOString().slice(0, 10)
      };

      // 1) يتحفظ محليًا في متصفح العميل عشان يشوفه فورًا كل ما يفتح الصفحة
      saveLocalReview(product.id, reviewEntry);

      // 2) يتبعت لصاحب المتجر بالإيميل لمراجعته وإضافته رسميًا من لوحة التحكم
      var action = (typeof SITE_CONFIG !== "undefined" && SITE_CONFIG.reviewFormAction) || "";
      if (action) {
        var formData = new FormData();
        formData.append("product_id", product.id);
        formData.append("product_name", product.name);
        formData.append("name", name);
        formData.append("rating", String(selectedRating));
        formData.append("comment", comment);
        fetch(action, { method: "POST", headers: { Accept: "application/json" }, body: formData }).catch(function () {
          /* حتى لو فشل الإرسال، التقييم اتحفظ محليًا بالفعل وهيفضل ظاهر للعميل */
        });
      }

      form.reset();
      selectedRating = 0;
      paintStars(0);
      note.textContent = action
        ? "شكرًا لتقييمك! تقييمك ظاهر لك الآن، وهيتراجع قبل ما يظهر لباقي الزوار."
        : "شكرًا لتقييمك! تقييمك ظاهر لك الآن (وضع تجريبي — لتفعيل استقبال إشعار بالإيميل راجع دليل-لوحة-التحكم.txt).";
      showToast("تم استلام تقييمك");
      renderReviews(product);
    });
  }

  // ------------------------------------------------------------------
  // منتجات مشابهة
  // ------------------------------------------------------------------
  function relatedCardTemplate(product) {
    var priceHtml = product.oldPrice
      ? '<span class="price">' + money(product.price) + '</span> <span class="price-old">' + money(product.oldPrice) + "</span>"
      : '<span class="price">' + money(product.price) + "</span>";
    var badgeHtml = product.inStock === false
      ? '<span class="badge badge-out">غير متوفر</span>'
      : (product.badge ? '<span class="badge">' + product.badge + "</span>" : "");
    var href = "product.html?id=" + encodeURIComponent(product.id);

    return (
      '<article class="product-card' + (product.inStock === false ? " is-out" : "") + '">' +
        '<a href="' + href + '" class="product-thumb-link">' +
          '<div class="product-thumb">' +
            badgeHtml +
            (product.image ? '<img src="' + product.image + '" alt="' + product.name + '" loading="lazy" class="product-img">' : "") +
            '<div class="product-icon-fallback">' + safeIcon(product.icon, 56) + "</div>" +
          "</div>" +
        "</a>" +
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

  function renderRelated(product) {
    var section = document.getElementById("pdRelatedSection");
    var grid = document.getElementById("pdRelatedGrid");
    var all = typeof PRODUCTS !== "undefined" ? PRODUCTS : [];
    var related = all.filter(function (p) {
      return p.id !== product.id && (p.categories || []).some(function (c) {
        return (product.categories || []).indexOf(c) !== -1;
      });
    }).slice(0, 4);

    if (related.length === 0) {
      section.hidden = true;
      return;
    }
    section.hidden = false;
    grid.innerHTML = related.map(relatedCardTemplate).join("");

    grid.querySelectorAll(".product-img").forEach(function (img) {
      img.addEventListener("error", function () { this.style.display = "none"; });
    });
    grid.querySelectorAll(".add-cart").forEach(function (btn) {
      btn.addEventListener("click", function () { addToCart(btn.dataset.id, 1); });
    });
  }

  // ------------------------------------------------------------------
  // أدوات الشراء (الكمية، أضف للسلة، اشترِ الآن)
  // ------------------------------------------------------------------
  function updateQtyDisplay() {
    document.getElementById("pdQty").textContent = currentQty;
  }

  function initPurchaseControls(product) {
    currentQty = 1;
    updateQtyDisplay();

    var minusBtn = document.getElementById("pdQtyMinus");
    var plusBtn = document.getElementById("pdQtyPlus");
    minusBtn.addEventListener("click", function () {
      currentQty = Math.max(1, currentQty - 1);
      updateQtyDisplay();
    });
    plusBtn.addEventListener("click", function () {
      currentQty += 1;
      updateQtyDisplay();
    });

    var addBtn = document.getElementById("pdAddCart");
    var buyBtn = document.getElementById("pdBuyNow");
    var stickyBtn = document.getElementById("pdStickyAddCart");

    if (product.inStock === false) {
      [addBtn, buyBtn, stickyBtn].forEach(function (b) { b.setAttribute("disabled", "disabled"); });
      addBtn.textContent = "غير متوفر حاليًا";
      buyBtn.textContent = "غير متوفر حاليًا";
      stickyBtn.textContent = "غير متوفر حاليًا";
      return;
    }

    addBtn.addEventListener("click", function () { addToCart(product.id, currentQty); });
    stickyBtn.addEventListener("click", function () { addToCart(product.id, currentQty); });
    // "اشترِ الآن" بيستخدم نفس نظام السلة والتحقق عبر واتساب —
    // بيضيف المنتج للسلة الحالية ثم يفتح واتساب فورًا بنفس رسالة السلة.
    buyBtn.addEventListener("click", function () {
      addToCart(product.id, currentQty);
      checkout();
    });
  }

  // ------------------------------------------------------------------
  // تحميل المنتج وعرضه
  // ------------------------------------------------------------------
  function loadProduct() {
    var id = getUrlParam("id");
    var product = id ? findProduct(id) : null;

    document.getElementById("pdLoading").hidden = true;

    if (!product) {
      document.getElementById("pdNotFound").hidden = false;
      return;
    }

    currentProduct = product;

    document.getElementById("breadcrumb").hidden = false;
    document.getElementById("breadcrumbCurrent").textContent = product.name;
    document.title = product.name + " | خشبيكو";
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", (product.description || product.name) + " - خشبيكو");

    document.getElementById("pdTags").innerHTML = productTagsHtml(product);
    document.getElementById("pdName").textContent = product.name;
    document.getElementById("pdShortDesc").textContent = product.description || "";
    document.getElementById("pdFullDesc").textContent = product.description || "لا يوجد وصف تفصيلي لهذا المنتج بعد.";

    renderGallery(product);
    renderPriceRow(product);
    renderStock(product);
    renderSpecs(product);
    renderReviews(product);
    initReviewForm(product);
    renderRelated(product);
    initPurchaseControls(product);

    var stickyPrice = document.getElementById("pdStickyPrice");
    if (stickyPrice) stickyPrice.textContent = money(product.price);
    document.getElementById("pdStickyBar").hidden = false;

    document.getElementById("pdContent").hidden = false;
  }

  // ------------------------------------------------------------------
  // أحداث خاصة بالصفحة
  // ------------------------------------------------------------------
  function initPageEvents() {
    var mainImageBtn = document.getElementById("pdMainImageBtn");
    if (mainImageBtn) mainImageBtn.addEventListener("click", openLightbox);

    var closeLightboxBtn = document.getElementById("closeLightbox");
    if (closeLightboxBtn) closeLightboxBtn.addEventListener("click", closeLightbox);
    var lightboxOverlay = document.getElementById("lightboxOverlay");
    if (lightboxOverlay) lightboxOverlay.addEventListener("click", closeLightbox);

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeLightbox();
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initPageEvents();
    loadProduct();
  });
})();
