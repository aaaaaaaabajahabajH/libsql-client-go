// ════════════════════════════════════════════
// 🗄️  SUPABASE MOCK DATA LAYER
// استبدل هذا الملف بـ src/services/supabase.js عند الربط الحقيقي
// ════════════════════════════════════════════
export const PRODUCTS = [
  { id:"P001", name:{ar:"إطار تويوتا كامري 225/55R17",en:"Toyota Camry Tire 225/55R17"},
    category:"tires", brand:"toyota", price:450, comparePrice:520, rating:4.8, reviews:124,
    stock:45, dealer_id:"D001", icon:"🛞", tags:["bestseller","original"],
    specs:{Size:"225/55R17","Load Index":"97H",Type:"All-Season"},
    description:{ar:"إطار أصلي معتمد عالي الجودة مناسب لجميع الطرق والمناخات في الإمارات",
                 en:"Certified original high-quality tire suitable for all roads and UAE climates"},
    sku:"TYT-TIR-001", warranty:{ar:"سنتان",en:"2 years"} },

  { id:"P002", name:{ar:"بطارية لكزس ES350 أصلية",en:"Lexus ES350 Original Battery"},
    category:"batteries", brand:"lexus", price:680, comparePrice:750, rating:4.9, reviews:89,
    stock:12, dealer_id:"D002", icon:"🔋", tags:["original","premium"],
    specs:{Capacity:"65Ah",Voltage:"12V",CCA:"640A"},
    description:{ar:"بطارية أصلية عالية الأداء تضمن أفضل أداء للمحرك",
                 en:"Original high-performance battery ensuring optimal engine performance"},
    sku:"LEX-BAT-001", warranty:{ar:"3 سنوات",en:"3 years"} },

  { id:"P003", name:{ar:"براكات نيسان باترول أصلية",en:"Nissan Patrol Original Brakes"},
    category:"brakes", brand:"nissan", price:320, comparePrice:380, rating:4.7, reviews:156,
    stock:30, dealer_id:"D001", icon:"🔴", tags:["bestseller","original"],
    specs:{Thickness:"12mm",Diameter:"330mm",Type:"Ventilated Disc"},
    description:{ar:"براكات أصلية معتمدة مع أعلى معايير السلامة والأداء",
                 en:"Certified original brakes with highest safety and performance standards"},
    sku:"NIS-BRK-001", warranty:{ar:"سنة واحدة",en:"1 year"} },

  { id:"P004", name:{ar:"إطار بي إم دبليو 5 سيريز 245/45R18",en:"BMW 5 Series Tire 245/45R18"},
    category:"tires", brand:"bmw", price:750, comparePrice:850, rating:4.9, reviews:67,
    stock:20, dealer_id:"D003", icon:"🛞", tags:["premium","original"],
    specs:{Size:"245/45R18","Load Index":"100Y",Type:"Performance"},
    description:{ar:"إطار بريميوم مصمم خصيصاً لسيارات بي إم دبليو الفاخرة",
                 en:"Premium tire specifically engineered for BMW luxury vehicles"},
    sku:"BMW-TIR-001", warranty:{ar:"سنتان",en:"2 years"} },

  { id:"P005", name:{ar:"بطارية تويوتا لاندكروزر",en:"Toyota Land Cruiser Battery"},
    category:"batteries", brand:"toyota", price:520, comparePrice:600, rating:4.6, reviews:201,
    stock:25, dealer_id:"D001", icon:"🔋", tags:["bestseller"],
    specs:{Capacity:"80Ah",Voltage:"12V",CCA:"750A"},
    description:{ar:"بطارية قوية مناسبة للبيئات الصعبة والطرق الوعرة في الإمارات",
                 en:"Powerful battery suitable for harsh UAE environments and rough terrain"},
    sku:"TYT-BAT-002", warranty:{ar:"سنتان",en:"2 years"} },

  { id:"P006", name:{ar:"براكات مرسيدس C300 فرونت",en:"Mercedes C300 Front Brakes"},
    category:"brakes", brand:"mercedes", price:580, comparePrice:650, rating:4.8, reviews:45,
    stock:8, dealer_id:"D003", icon:"🔴", tags:["premium","original"],
    specs:{Thickness:"14mm",Diameter:"350mm",Type:"Ceramic"},
    description:{ar:"براكات سيراميك أصلية للأداء الأمثل والهدوء التام",
                 en:"Original ceramic brakes for optimal performance and complete silence"},
    sku:"MRC-BRK-001", warranty:{ar:"سنتان",en:"2 years"} },
];

export const DEALERS = [
  { id:"D001", name:{ar:"مجموعة الإمارات لقطع الغيار",en:"Emirates Auto Parts Group"},
    location:{ar:"دبي - منطقة الراشدية",en:"Dubai - Al Rashidiya"}, rating:4.9,
    totalSales:1250, verified:true, tier:"platinum",
    certs:["ISO 9001","Toyota Certified","Nissan Authorized"], phone:"+971501234567" },
  { id:"D002", name:{ar:"الفخامة لقطع السيارات",en:"Luxury Auto Parts"},
    location:{ar:"أبو ظبي - المصفح",en:"Abu Dhabi - Mussafah"}, rating:4.8,
    totalSales:890, verified:true, tier:"gold",
    certs:["Lexus Certified","BMW Authorized"], phone:"+971507654321" },
  { id:"D003", name:{ar:"بريميوم أوتو بارتس",en:"Premium Auto Parts UAE"},
    location:{ar:"الشارقة - المنطقة الصناعية",en:"Sharjah - Industrial Area"}, rating:4.7,
    totalSales:650, verified:true, tier:"gold",
    certs:["BMW Certified","Mercedes Authorized"], phone:"+971509876543" },
];

export const STATS = {
  totalRevenue:284500, totalOrders:1247, activeProducts:856,
  activeDealers:47, monthlyGrowth:23.5, avgOrderValue:425,
  conversionRate:4.2, satisfaction:96,
};
