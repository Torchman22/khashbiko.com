/* ==========================================================================
   محرك عرض الشريط الإعلاني
   ==========================================================================
   ملف واحد مشترك يستخدمه الموقع الحقيقي ولوحة التحكم (في المعاينة
   المباشرة) بنفس الدالة بالظبط — عشان شكل الشريط في المعاينة يطابق
   شكله الحقيقي في الموقع 100%، ومفيش كود اتكرر في مكانين.
   ========================================================================== */

var AnnouncementBar = (function () {
  "use strict";

  var resizeHandlers = {}; // { barId: debounceTimer } — كل شريط (الموقع أو المعاينة) له مؤقّت مستقل

  function speedPxPerSecond(settings) {
    if (settings.speed === "custom" && settings.customSpeed) return Math.max(Number(settings.customSpeed), 5);
    if (settings.speed === "slow") return 28;
    if (settings.speed === "fast") return 110;
    return 60; // medium (default)
  }

  function escapeHtml(text) {
    var div = document.createElement("div");
    div.textContent = text == null ? "" : String(text);
    return div.innerHTML;
  }

  function itemTemplate(a) {
    var inner =
      (a.emoji ? '<span class="announce-emoji">' + escapeHtml(a.emoji) + "</span>" : "") +
      (a.image ? '<img class="announce-image" src="' + a.image + '" alt="" onerror="this.style.display=\'none\'">' : "") +
      '<span class="announce-text">' + escapeHtml(a.text) + "</span>";
    if (a.link) {
      return '<a href="' + a.link + '" class="announce-item announce-item-link">' + inner + "</a>";
    }
    return '<span class="announce-item">' + inner + "</span>";
  }

  function applyStyleVars(barEl, settings) {
    barEl.style.setProperty("--announce-bg", settings.bgColor || "#3E2723");
    barEl.style.setProperty("--announce-text", settings.textColor || "#FFFDF9");
    barEl.style.setProperty("--announce-accent", settings.accentColor || "#C9A876");
    barEl.style.setProperty("--announce-text-size", (settings.textSize || 14) + "px");
    barEl.style.setProperty("--announce-text-weight", settings.textWeight === "bold" ? "700" : "400");
    barEl.style.setProperty("--announce-emoji-size", (settings.emojiSize || 16) + "px");
    barEl.style.setProperty("--announce-image-size", (settings.imageSize || 20) + "px");
    barEl.style.setProperty("--announce-radius", (settings.borderRadius || 0) + "px");
  }

  function setupAnimated(barEl, trackEl, settings, items) {
    barEl.classList.add("is-animated");
    barEl.classList.remove("is-static");
    var html = items.map(itemTemplate).join("");
    trackEl.className = "announce-track";
    trackEl.style.justifyContent = "";
    // اتجاه فيزيائي ثابت للعناصر جوا مسار الحركة نفسه، بغض النظر عن
    // اتجاه الصفحة (RTL)، عشان حساب حركة اللفة يفضل متوقع دايمًا.
    trackEl.style.direction = "ltr";
    trackEl.style.animation = "none";
    trackEl.innerHTML = html + html;

    requestAnimationFrame(function () {
      // قراءة offsetWidth بتجبر المتصفح يطبّق إيقاف الحركة فعليًا الأول،
      // قبل ما نشغّلها من جديد — من غيرها بعض المتصفحات ممكن تتجاهل
      // إعادة التشغيل وتسيب النص واقف بدون حركة.
      void trackEl.offsetWidth;

      var oneSetWidth = trackEl.scrollWidth / 2;
      var pxPerSecond = speedPxPerSecond(settings);
      var duration = Math.max(oneSetWidth / pxPerSecond, 4);
      var animName = settings.direction === "ltr" ? "announce-scroll-ltr" : "announce-scroll-rtl";
      trackEl.style.animation = animName + " " + duration + "s linear infinite";
    });
  }

  function setupStatic(barEl, trackEl, items, barId, settings) {
    barEl.classList.add("is-static");
    barEl.classList.remove("is-animated");
    trackEl.style.animation = "none";
    trackEl.style.direction = ""; // يرجع للاتجاه الطبيعي للصفحة (RTL) عشان المحاذاة تبقى صحيحة
    trackEl.className = "announce-track announce-track-static";

    var alignMap = { start: "flex-start", center: "center", end: "flex-end" };
    trackEl.style.justifyContent = alignMap[settings.staticAlign] || "center";

    var index = 0;
    function paint() {
      trackEl.innerHTML = itemTemplate(items[index]);
    }
    paint();

    if (resizeHandlers[barId] && resizeHandlers[barId].rotationTimer) {
      clearInterval(resizeHandlers[barId].rotationTimer);
    }
    if (items.length > 1) {
      var timer = setInterval(function () {
        trackEl.classList.add("is-fading");
        setTimeout(function () {
          index = (index + 1) % items.length;
          paint();
          trackEl.classList.remove("is-fading");
        }, 260);
      }, 4200);
      resizeHandlers[barId] = resizeHandlers[barId] || {};
      resizeHandlers[barId].rotationTimer = timer;
    }
  }

  /**
   * يعرض الشريط الإعلاني داخل عنصرين: حاوية الشريط (barId) ومسار
   * العناصر جواها (trackId). settings/items اختياريين — لو معملتش
   * تمريرهم، بيستخدم البيانات الحقيقية من ANNOUNCEMENT_BAR/ANNOUNCEMENTS
   * (ده اللي بيحصل في الموقع نفسه). لوحة التحكم بتمرر بيانات المسودة
   * الحالية عشان المعاينة تتحدث فورًا مع أي تعديل.
   */
  function render(barId, trackId, settings, items) {
    var barEl = document.getElementById(barId);
    var trackEl = document.getElementById(trackId);
    if (!barEl || !trackEl) return;

    var effectiveSettings = settings || (typeof ANNOUNCEMENT_BAR !== "undefined" ? ANNOUNCEMENT_BAR : null);
    var allItems = items || (typeof ANNOUNCEMENTS !== "undefined" ? ANNOUNCEMENTS : []);
    var enabledItems = (allItems || []).filter(function (a) {
      return a.enabled !== false && (a.text || "").trim();
    });

    if (!effectiveSettings || !effectiveSettings.enabled || enabledItems.length === 0) {
      barEl.hidden = true;
      return;
    }
    barEl.hidden = false;
    applyStyleVars(barEl, effectiveSettings);

    if (effectiveSettings.mode === "animated") {
      setupAnimated(barEl, trackEl, effectiveSettings, enabledItems);
    } else {
      setupStatic(barEl, trackEl, enabledItems, barId, effectiveSettings);
    }

    trackEl.querySelectorAll(".announce-image").forEach(function (img) {
      img.addEventListener("error", function () { this.style.display = "none"; });
    });

    // إعادة حساب مدة اللفة عند تغيير حجم الشاشة (اتجاه الجهاز، تكبير النافذة...)
    if (resizeHandlers[barId] && resizeHandlers[barId].listener) {
      window.removeEventListener("resize", resizeHandlers[barId].listener);
    }
    var debounceTimer;
    var listener = function () {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () {
        if (effectiveSettings.mode === "animated") {
          setupAnimated(barEl, trackEl, effectiveSettings, enabledItems);
        }
      }, 200);
    };
    window.addEventListener("resize", listener);
    resizeHandlers[barId] = resizeHandlers[barId] || {};
    resizeHandlers[barId].listener = listener;
  }

  return { render: render };
})();
