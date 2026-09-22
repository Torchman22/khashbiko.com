/* ==========================================================================
   بيانات الشريط الإعلاني
   ==========================================================================
   تم إنشاء/تحديث هذا الملف بواسطة لوحة تحكم خشبيكو (admin/index.html).
   ========================================================================== */

const ANNOUNCEMENT_BAR = {
  enabled: true,
  mode: "static",
  direction: "rtl",
  staticAlign: "center",
  speed: "medium",
  customSpeed: 60,
  bgColor: "#e6ca3d",
  textColor: "#000000",
  accentColor: "#c9a876",
  textSize: 17,
  textWeight: "bold",
  emojiSize: 19,
  imageSize: 20,
  borderRadius: 9
};

const ANNOUNCEMENTS = [
  { id: "a1", text: "عروض خاصة لفترة محدودة", emoji: "🎉", image: "", link: "", enabled: true },
  { id: "a2", text: "شحن سريع لجميع الطلبات", emoji: "🚚", image: "", link: "", enabled: true },
  { id: "a3", text: "اكتشف منتجاتنا الجديدة", emoji: "✨", image: "", link: "index.html#products", enabled: true },
  { id: "a4", text: "اطلب الآن واستفد من العرض", emoji: "🛒", image: "", link: "", enabled: true }
];
