/* ==========================================================================
   مكتبة الأيقونات
   ==========================================================================
   قاموس يحتوي على كل أيقونات الموقع كرسومات SVG بسيطة.
   لإضافة أيقونة جديدة (مثلاً لفئة منتجات جديدة): أضف سطر جديد بنفس الشكل،
   بمفتاح (اسم) مميز، ثم استخدم نفس الاسم في ملف products-data.js.
   لو استخدمت اسم أيقونة غير موجود هنا بالغلط، هيظهر شكل بديل عام تلقائيًا
   بدل ما يحصل خطأ في الموقع.
   ========================================================================== */

const ICONS = {
  // أيقونات المنتجات
  tray:   '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2.2"><ellipse cx="50" cy="55" rx="38" ry="16"/><ellipse cx="50" cy="47" rx="38" ry="16"/></svg>',
  board:  '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="18" y="15" width="64" height="70" rx="6"/><circle cx="50" cy="24" r="4" fill="currentColor" stroke="none"/></svg>',
  chair:  '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M28 20v55M72 20v55M28 45h44M22 82l6-7M78 82l-6-7"/></svg>',
  frame:  '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="20" y="20" width="60" height="60" rx="3"/><rect x="32" y="32" width="36" height="36" rx="2"/></svg>',
  box:    '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="18" y="35" width="64" height="45" rx="4"/><path d="M18 35l14-15h36l14 15"/></svg>',
  spoon:  '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2.2"><ellipse cx="38" cy="28" rx="10" ry="14"/><path d="M38 42v40"/><ellipse cx="66" cy="30" rx="8" ry="12"/><path d="M66 42v38"/></svg>',
  shelf:  '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M15 30h70M15 55h70M25 30v-8h50v8M25 55v15M75 55v15"/></svg>',
  stand:  '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M20 70h60M30 70l6-30h28l6 30M40 40h20"/></svg>',
  generic:'<svg viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="34" stroke="currentColor" stroke-width="2.2"/><circle cx="50" cy="50" r="20" stroke="currentColor" stroke-width="2.2"/><circle cx="50" cy="50" r="6" fill="currentColor"/></svg>',

  // أيقونات الفئات (الأقسام)
  kitchen:   '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M14 6v14a6 6 0 0012 0V6M20 20v22M28 20v22M34 30c4 0 6-4 6-9s-2-9-6-9v18z"/></svg>',
  furniture: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="6" y="20" width="36" height="4" rx="1"/><path d="M10 24l3 16h22l3-16"/><path d="M20 24v-6a4 4 0 018 0v6"/></svg>',
  decor:     '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="8" y="8" width="32" height="32" rx="3"/><path d="M8 18h32M18 40V18"/></svg>',
  gifts:     '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="9" y="16" width="30" height="24" rx="2"/><path d="M9 24h30M24 16v-4a4 4 0 018 0M16 12a4 4 0 018 0"/></svg>',
  office:    '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="6" y="10" width="36" height="24" rx="2"/><path d="M6 28h36M16 34v6h16v-6"/></svg>',

  // أيقونات واجهة الاستخدام
  cart:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 4h2l2.4 12.4a2 2 0 002 1.6h8.4a2 2 0 002-1.7L21 8H6"/><circle cx="9" cy="21" r="1"/><circle cx="18" cy="21" r="1"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
  close:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  plus:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>',
  minus:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/></svg>',
  trash:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14"/></svg>',
  eye:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>',
  bag:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 7h12l1 14H5L6 7z"/><path d="M9 7a3 3 0 016 0"/></svg>',
  play:   '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
  image:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="10" r="1.5"/><path d="M21 16l-5.5-5.5L5 21"/></svg>',
  edit:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
  check:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M20 6L9 17l-5-5"/></svg>'
};

/**
 * يرجع كود SVG لأيقونة معينة، وبحجم معين.
 * لو الاسم مش موجود في القاموس، يرجع الأيقونة العامة "generic" بدل ما يحصل خطأ.
 */
function getIcon(name, size) {
  size = size || 32;
  var svg = ICONS[name] || ICONS.generic;
  return svg.replace('<svg ', '<svg width="' + size + '" height="' + size + '" ');
}
