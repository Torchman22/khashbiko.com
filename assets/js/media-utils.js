/* ==========================================================================
   أدوات مساعدة للوسائط (فيديو) — يستخدمها كل من الموقع ولوحة التحكم
   ==========================================================================
   ملف صغير مشترك، لا داعي لتعديله في الاستخدام العادي.
   ========================================================================== */

/**
 * يحوّل رابط يوتيوب أو Vimeo عادي إلى رابط embed قابل للعرض داخل iframe.
 * لو الرابط مش من المنصتين دول، يرجع null (يُعتبر وقتها ملف فيديو مباشر).
 */
function toEmbedUrl(url) {
  if (!url) return null;
  var trimmed = String(url).trim();

  var yt = trimmed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)([\w-]{11})/);
  if (yt) return "https://www.youtube.com/embed/" + yt[1];

  var vimeo = trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return "https://player.vimeo.com/video/" + vimeo[1];

  return null;
}

/** يتأكد هل الرابط ملف فيديو مباشر (mp4/webm/ogg) يصلح لعنصر <video> */
function isDirectVideoFile(url) {
  return /\.(mp4|webm|ogg)(\?.*)?$/i.test(url || "");
}
