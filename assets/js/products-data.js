/* ==========================================================================
   ملف بيانات المنتجات والفئات
   ==========================================================================
   تم إنشاء/تحديث هذا الملف بواسطة لوحة تحكم خشبيكو (admin/index.html).
   تقدر تعدله يدويًا برضه، أو ترجع للوحة التحكم لاحقًا لإدارة منتجاتك.
   ========================================================================== */

const PRODUCT_CATEGORIES = [
  { id: "kitchen", label: "المطبخ", icon: "kitchen" },
  { id: "decor", label: "الديكور", icon: "decor" },
  { id: "gifts", label: "الهدايا", icon: "gifts" },
  { id: "office", label: "المكتب", icon: "office" }
];

const PRODUCTS = [
  {
    id: "p001",
    name: "حامل كتب من الخشب",
    price: 199,
    oldPrice: 250,
    categories: ["decor","gifts","office"],
    description: "حامل كتب من الخشب اقرء بمتعة ✨\nلو نفسك تطور من طرق مزاكرتك فحامل الكتب هو الاختيار الانسب\nبمجرد حصولك عليه ستستمتع بوقت قراءتك.\nمميزاته:\n    • يزيد التركيز \n    • يجعل المزاكرة صحية لانه يفرد الرقبة والظهر\n    • يزيد من وقت المزاكرة والقراءة ويقلل الصداع \nاحسن هدية لابنك عشان يحب المزاكرة ويزاكر بشكل افضل وصحي اكتر \nمساحة سطح الحامل : 38سم & 38سم (مساحة مناسبة لاي كتاب او كراسة)\nمن دلوقتي وقت مذاكرتك هيزيد أضعاف 💪\nكمان تقدر تحدد الزاوية اللي تناسبك عشان تقعد على راحتك\nوبعد ما تخلص، تقدر تطبقه وتحطه في درج المكتب ⏱️\nمع حامل الكتب اقرأ بمتعة وتركيز، وكمان ينفع للابتوب 👍",
    image: "assets/images/products/book_stand/1.webp",
    video: "https://youtube.com/shorts/TB3l3VyXR6Y?si=IciJLUCOxEBEoRcr",
    images: ["assets/images/products/book_stand/2.webp","assets/images/products/book_stand/3.png","assets/images/products/book_stand/4.png"],
    specs: [{"label":"اللون","value":"بني غامق"},{"label":"الخامة","value":"خشب ابيض"}],
    reviews: [],
    icon: "generic",
    badge: "عرض محدود",
    inStock: true
  },
  {
    id: "p002",
    name: "حامل تليفون خشب",
    price: 120,
    oldPrice: 180,
    categories: ["decor","gifts","office"],
    description: "📱 حامل الهاتف الذكي – تصميم عملي وأداء موثوق\nنظرة عامة:\n\nحامل الهاتف الذكي مصمم ليمنحك تجربة استخدام أكثر راحة وانسيابية، سواء في المكتب، المنزل، أو أثناء السفر. يجمع بين التصميم الأنيق والمواد المتينة ليكون رفيقك اليومي في العمل والترفيه.\n\nالمميزات الرئيسية:\n\n👐 استخدام بدون يدين – حرية كاملة أثناء العمل، الطبخ، أو المشاهدة\n\n📐 زاوية مشاهدة قابلة للتعديل – وضعية مثالية تقلل إجهاد الرقبة والعين\n\n🪑 تصميم مريح وعملي – يساعد على الحفاظ على وضعية جلوس صحيحة\n\n🔒 قاعدة ثابتة ومستقرة – لا تنزلق على الأسطح المختلفة\n\n📱 متوافق مع جميع الهواتف – يناسب مختلف الأحجام والموديلات\n\n💎 خامات عالية الجودة – متانة تدوم طويلاً\n\n🎨 تصميم أنيق وعصري – يضيف لمسة جمالية لمكتبك أو غرفتك",
    image: "assets/images/products/phone_stand/1.png",
    video: "https://youtube.com/shorts/x4u9jIDeWh4?si=zWxRWZQkr-uTpJIT",
    images: ["assets/images/products/phone_stand/2.jpg","assets/images/products/phone_stand/3.jpg","assets/images/products/phone_stand/4.jpg","assets/images/products/phone_stand/5.jpg","assets/images/products/phone_stand/6.jpg","assets/images/products/phone_stand/8.png"],
    specs: [{"label":"الخامة","value":"الخشب الابيض الطبيعي"},{"label":"اللون","value":"لون الخشب الطبيعي مع اجزاء بنية"},{"label":"التوافق","value":"متوافق مع جميع الاجهزة"},{"label":"الاستخدم","value":"المكتب، المنزل، السفر، المطبخ"}],
    reviews: [],
    icon: "generic",
    badge: "الأكثر مبيعًا",
    inStock: true
  },
  {
    id: "p003",
    name: "حصالة خشب على شكل بيت 🏡",
    price: 150,
    oldPrice: 180,
    categories: ["decor","gifts"],
    description: "حصالة خشبية كبيرة الحجم , على شكل بيت, بابعاد 20 سم من القاع الى اعلى السقف و العرض من الجانب15 سم والعرض من الامام 21 سم .\n\nتفتح بطريقة سرية عن طريق دبوس في ثقب صغير مخفي بشكل بسيط واحترافي , تستخدم لتخزين النقود وكذلك كديكور مفيد .",
    image: "assets/images/products/piggy_bank/01.png",
    video: "https://youtube.com/shorts/ttbidGCresw",
    images: ["assets/images/products/piggy_bank/1.jpeg","assets/images/products/piggy_bank/2.jpeg","assets/images/products/piggy_bank/3.jpeg","assets/images/products/piggy_bank/4.jpeg","assets/images/products/piggy_bank/5.png"],
    specs: [{"label":"الخامة","value":"الابلاكاش"},{"label":"اللون","value":"سيلفر"},{"label":"الحجم","value":"كبير"}],
    reviews: [],
    icon: "generic",
    badge: "جديد",
    inStock: true
  }
];
