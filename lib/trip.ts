// All trip content lives here. Edit this file to change the itinerary.
// Privacy: no booking PINs, confirmation codes or e-ticket numbers on purpose.

export type L = { zh: string; en: string };
export type Currency = "EUR" | "GBP";

export type Person = {
  id: string;
  zh: string;
  en: string;
  color: string;
  driver: boolean;
  flightGroup: "kl4" | "jiet" | "iceland" | "local";
};

export const people: Person[] = [
  { id: "dad", zh: "爸爸", en: "Dad", color: "#1f7a5a", driver: true, flightGroup: "kl4" },
  { id: "mom", zh: "妈妈", en: "Mum", color: "#c2410c", driver: false, flightGroup: "kl4" },
  { id: "rong", zh: "容", en: "Rong", color: "#7c3aed", driver: true, flightGroup: "local" },
  { id: "yao", zh: "耀", en: "Yao", color: "#0369a1", driver: false, flightGroup: "kl4" },
  { id: "jiet", zh: "捷", en: "Jiet", color: "#b45309", driver: true, flightGroup: "jiet" },
  { id: "ying", zh: "颖", en: "Ying", color: "#be185d", driver: false, flightGroup: "iceland" },
  { id: "hui", zh: "辉", en: "Hui", color: "#15803d", driver: true, flightGroup: "iceland" },
];

export type Place = { zh: string; en: string; lat: number; lng: number };

export const places: Record<string, Place> = {
  airport: { zh: "都柏林机场", en: "Dublin Airport", lat: 53.4213, lng: -6.2701 },
  howth: { zh: "霍斯渔港", en: "Howth Harbour", lat: 53.3892, lng: -6.0653 },
  phoenix: { zh: "凤凰公园（看鹿）", en: "Phoenix Park (deer)", lat: 53.36, lng: -6.329 },
  trinity: { zh: "圣三一学院", en: "Trinity College", lat: 53.3438, lng: -6.2546 },
  hapenny: { zh: "半便士桥", en: "Ha'penny Bridge", lat: 53.3464, lng: -6.2631 },
  templebar: { zh: "圣殿酒吧区", en: "Temple Bar", lat: 53.3455, lng: -6.2643 },
  arcade: { zh: "乔治街拱廊市场", en: "George's Street Arcade", lat: 53.3426, lng: -6.2652 },
  stephens: { zh: "圣史蒂芬绿地", en: "St Stephen's Green", lat: 53.337, lng: -6.2591 },
  grafton: { zh: "格拉夫顿街", en: "Grafton Street", lat: 53.3416, lng: -6.26 },
  cityhall: { zh: "贝尔法斯特市政厅", en: "Belfast City Hall", lat: 54.5965, lng: -5.9301 },
  cathedral: { zh: "大教堂区", en: "Cathedral Quarter", lat: 54.603, lng: -5.9272 },
  titanic: { zh: "泰坦尼克号博物馆", en: "Titanic Belfast", lat: 54.6083, lng: -5.9096 },
  peace: { zh: "和平墙与壁画", en: "Peace Walls & murals", lat: 54.6019, lng: -5.9621 },
  dark: { zh: "黑暗树篱", en: "The Dark Hedges", lat: 55.1351, lng: -6.3795 },
  dunluce: { zh: "邓卢斯城堡", en: "Dunluce Castle", lat: 55.2104, lng: -6.5792 },
  giants: { zh: "巨人堤道", en: "Giant's Causeway", lat: 55.2408, lng: -6.5116 },
  walls: { zh: "德里古城墙", en: "Derry City Walls", lat: 54.996, lng: -7.321 },
  donegal: { zh: "多尼戈尔镇", en: "Donegal Town", lat: 54.6538, lng: -8.1096 },
  drumcliffe: { zh: "德拉姆克利夫（叶芝墓）", en: "Drumcliffe (Yeats' grave)", lat: 54.3255, lng: -8.4926 },
  benbulben: { zh: "本布尔本山", en: "Benbulben", lat: 54.366, lng: -8.471 },
  latin: { zh: "拉丁区", en: "Latin Quarter", lat: 53.2709, lng: -9.0535 },
  spanish: { zh: "西班牙拱门", en: "Spanish Arch", lat: 53.2695, lng: -9.0549 },
  salthill: { zh: "索尔特希尔海滨步道", en: "Salthill Promenade", lat: 53.2588, lng: -9.0842 },
  burren: { zh: "巴伦石灰岩地貌", en: "The Burren", lat: 53.0, lng: -9.05 },
  moher: { zh: "莫赫悬崖", en: "Cliffs of Moher", lat: 52.9715, lng: -9.4309 },
  killimer: { zh: "基利默渡轮码头", en: "Killimer ferry", lat: 52.6141, lng: -9.38 },
  tarbert: { zh: "塔伯特渡轮码头", en: "Tarbert ferry", lat: 52.575, lng: -9.366 },
  ventry: { zh: "文特里海湾", en: "Ventry", lat: 52.132, lng: -10.364 },
  slea: { zh: "斯莱角", en: "Slea Head", lat: 52.1008, lng: -10.458 },
  coumeenoole: { zh: "库米努尔海滩", en: "Coumeenoole Beach", lat: 52.1042, lng: -10.4681 },
  dunquin: { zh: "邓金码头", en: "Dunquin Pier", lat: 52.13, lng: -10.455 },
  muckross: { zh: "穆克罗斯庄园", en: "Muckross House", lat: 52.0184, lng: -9.504 },
  torc: { zh: "托克瀑布", en: "Torc Waterfall", lat: 52.0008, lng: -9.5075 },
  market: { zh: "科克英国市场", en: "English Market, Cork", lat: 51.8981, lng: -8.4756 },
  cobh: { zh: "科夫彩色小镇", en: "Cobh", lat: 51.851, lng: -8.2943 },
  malahide: { zh: "马拉海德", en: "Malahide", lat: 53.4509, lng: -6.1544 },
};

export type Stay = {
  id: string;
  name: string;
  town: L;
  address: string;
  lat: number;
  lng: number;
  approx: boolean; // pin is approximate: navigate by address instead
  from: string; // check-in date
  to: string; // check-out date
  checkIn: string;
  checkOut: string;
  phone?: string;
  contact?: L;
  notes: L[];
  warning?: L;
};

export const stays: Stay[] = [
  {
    id: "dublin",
    name: "Stylish Guest Home",
    town: { zh: "都柏林（Finglas）", en: "Dublin (Finglas)" },
    address: "64 Melville Cove, Dublin 11, D11 XP78",
    lat: 53.40258,
    lng: -6.2985,
    approx: false,
    from: "2026-10-25",
    to: "2026-10-27",
    checkIn: "17:00",
    checkOut: "11:00",
    phone: "+353863400238",
    notes: [
      { zh: "三房公寓：厨房、洗衣机、免费停车", en: "3-bedroom flat: kitchen, washing machine, free parking" },
      { zh: "离机场约 15 分钟，离市中心约 25 分钟", en: "~15 min to the airport, ~25 min to the city centre" },
    ],
  },
  {
    id: "belfast",
    name: "Airbnb · Whole 5-bed house (host Ben)",
    town: { zh: "贝尔法斯特", en: "Belfast" },
    address: "75 Malone Avenue, Belfast BT9 6EP, UK",
    lat: 54.5839,
    lng: -5.9383,
    approx: true,
    from: "2026-10-27",
    to: "2026-10-29",
    checkIn: "14:00",
    checkOut: "11:00",
    contact: { zh: "通过 Airbnb App 联系房东 Ben", en: "Message host Ben in the Airbnb app" },
    notes: [
      { zh: "密码锁自助入住：入住前 48 小时在 Airbnb App 查看门锁密码和 Wi-Fi", en: "Keypad self check-in: door code & Wi-Fi appear in the Airbnb app 48 h before" },
      { zh: "北爱尔兰用英镑 £", en: "Northern Ireland uses pounds £" },
    ],
  },
  {
    id: "derry",
    name: "Everglades Hotel",
    town: { zh: "德里", en: "Derry" },
    address: "Prehen Road, Derry BT47 2NH, UK",
    lat: 54.98187,
    lng: -7.33706,
    approx: false,
    from: "2026-10-29",
    to: "2026-10-30",
    checkIn: "15:00",
    checkOut: "11:00",
    phone: "+442871321066",
    notes: [{ zh: "酒店餐厅 The Grill 可订晚餐", en: "In-house restaurant The Grill takes dinner bookings" }],
    warning: {
      zh: "目前只看到 1 间双人房（2 人）的订单，其余 5 人的房间待确认",
      en: "Only 1 double room (2 adults) found so far — rooms for the other 5 still to confirm",
    },
  },
  {
    id: "galway",
    name: "Wild Atlantic Way Coastal Retreat",
    town: { zh: "戈尔韦（Furbo 海边）", en: "Galway (Furbo coast)" },
    address: "9 Barr Na gCurragh, Ballynahown, H91 FKX4",
    lat: 53.24795,
    lng: -9.2153,
    approx: false,
    from: "2026-10-30",
    to: "2026-11-01",
    checkIn: "16:00",
    checkOut: "11:00",
    phone: "+35319010446",
    notes: [
      { zh: "海景独栋三房：洗碗机、烘干机、免费停车", en: "Sea-view 3-bed house: dishwasher, dryer, free parking" },
      { zh: "在戈尔韦市区以西约 11 公里，开车约 20 分钟", en: "~11 km west of Galway city, ~20 min drive" },
    ],
  },
  {
    id: "dingle",
    name: "Central Haven Dingle",
    town: { zh: "丁格尔", en: "Dingle" },
    address: "29C Cnoc an Cairn, Chapel Lane, Dingle V92 NP0N",
    lat: 52.1434,
    lng: -10.26852,
    approx: false,
    from: "2026-11-01",
    to: "2026-11-03",
    checkIn: "17:00",
    checkOut: "10:00",
    phone: "+353879620675",
    notes: [
      { zh: "注意：退房时间是早上 10:00（比其他地方早）", en: "Note: check-out is 10:00 (earlier than other stays)" },
      { zh: "步行到镇中心和港口", en: "Walk to the town centre and harbour" },
    ],
  },
  {
    id: "kinsale",
    name: "Airbnb · Meadowlands (host Liam, co-host Mary)",
    town: { zh: "金塞尔", en: "Kinsale" },
    address: "Meadowlands 9, Kinsale, Co. Cork",
    lat: 51.7105,
    lng: -8.5265,
    approx: true,
    from: "2026-11-03",
    to: "2026-11-05",
    checkIn: "15:00",
    checkOut: "11:00",
    contact: { zh: "通过 Airbnb App 联系房东 Liam", en: "Message host Liam in the Airbnb app" },
    notes: [
      {
        zh: "房东指路：从 Kinsale road 环岛往金塞尔方向开约 15 英里，快进镇时过了 Texaco 加油站第一个路口右转，往上约 300 米，右边倒数第三间",
        en: "Host directions: from the Kinsale road roundabout drive ~15 miles towards Kinsale; just before town take the first right after the Texaco station, go ~300 m up, third-last house on the right",
      },
      { zh: "入住方法和 Wi-Fi 入住前 48 小时在 Airbnb App 显示", en: "Entry instructions & Wi-Fi appear in the Airbnb app 48 h before" },
      { zh: "步行 3 分钟到镇中心", en: "3 min walk to town" },
    ],
  },
  {
    id: "clayton",
    name: "Clayton Hotel Dublin Airport",
    town: { zh: "都柏林机场", en: "Dublin Airport" },
    address: "Stockhole Lane, Swords, Co. Dublin",
    lat: 53.41167,
    lng: -6.21809,
    approx: false,
    from: "2026-11-05",
    to: "2026-11-06",
    checkIn: "15:00",
    checkOut: "—",
    notes: [
      { zh: "有机场接驳巴士：入住时问清楚最早一班几点", en: "Airport shuttle: ask at check-in what time the first bus leaves" },
      { zh: "注意：不是 Clayton Airport Central，是 Stockhole Lane 这间", en: "Not the Airport Central one — it's the Stockhole Lane hotel" },
    ],
  },
];

export type Step = { t?: string; text: L; place?: string; cost?: L };

export type Day = {
  n: number; // 0 = travel day, 14 = home
  date: string;
  color: string;
  title: L;
  route: L;
  drive?: L;
  currency: Currency;
  stay?: string;
  sunAt: [number, number];
  steps: Step[];
  tips: L[];
  stops: string[]; // map order
};

export const days: Day[] = [
  {
    n: 0,
    date: "2026-10-24",
    color: "#64748b",
    title: { zh: "出发！在吉隆坡会合", en: "Departure — meet in KL" },
    route: { zh: "珀斯 → 吉隆坡 → 多哈", en: "Perth → KL → Doha" },
    currency: "EUR",
    sunAt: [3.1, 101.7],
    steps: [
      { t: "04:45", text: { zh: "捷：AirAsia AK605 珀斯 T1 起飞", en: "Jiet: AirAsia AK605 departs Perth T1" } },
      { t: "10:20", text: { zh: "捷抵达 KLIA 第 2 航站楼，坐 KLIA Transit 列车去第 1 航站楼（约 3 分钟）", en: "Jiet lands KLIA T2 — take the KLIA Transit train to T1 (~3 min)" } },
      { t: "16:00", text: { zh: "爸爸、妈妈、耀、捷在 KLIA 第 1 航站楼会合，办理登机（起飞前 3 小时）", en: "Dad, Mum, Yao & Jiet meet at KLIA T1, check in (3 h before)" } },
      { t: "19:20", text: { zh: "卡塔尔航空 QR853 吉隆坡 → 多哈（7 小时 20 分）", en: "Qatar Airways QR853 KL → Doha (7 h 20 m)" } },
      { t: "21:40", text: { zh: "抵达多哈（当地时间），转机约 3 小时 50 分", en: "Arrive Doha (local time), ~3 h 50 m connection" } },
    ],
    tips: [
      { zh: "托运行李每人 25 公斤（卡塔尔航空）", en: "Checked bag: 25 kg each (Qatar Airways)" },
      { zh: "护照、驾照、国际驾照、信用卡放随身包", en: "Passports, licences, IDPs and credit card in hand luggage" },
    ],
    stops: [],
  },
  {
    n: 1,
    date: "2026-10-25",
    color: "#15803d",
    title: { zh: "抵达都柏林", en: "Arrive Dublin" },
    route: { zh: "机场 → 霍斯 → 凤凰公园 → 住处", en: "Airport → Howth → Phoenix Park → home" },
    drive: { zh: "全天短程，约 1 小时", en: "Short hops, ~1 h total" },
    currency: "EUR",
    stay: "dublin",
    sunAt: [53.35, -6.26],
    steps: [
      { t: "01:30", text: { zh: "QR019 多哈 → 都柏林（6 小时 30 分）", en: "QR019 Doha → Dublin (6 h 30 m)" } },
      { t: "06:00", text: { zh: "抵达都柏林 T1。今天凌晨爱尔兰时间调慢 1 小时，手机会自动更新", en: "Land Dublin T1. Irish clocks went back 1 hour overnight — phones update automatically" }, place: "airport" },
      { t: "07:30", text: { zh: "Alamo 取车：出口 → 4 号区坐租车接驳巴士到 Eastlands。告诉柜台要开去北爱尔兰（跨境费）、登记其他司机", en: "Alamo pick-up: Zone 4 car-rental shuttle to Eastlands. Tell the counter you'll drive to Northern Ireland (cross-border fee) and add the extra drivers" }, place: "airport" },
      { t: "09:00", text: { zh: "建议：去霍斯渔港吃早餐、看海豹、海边散步；午餐海鲜浓汤、炸鱼薯条", en: "Suggested: Howth harbour — breakfast, seals, seaside stroll; chowder or fish & chips for lunch" }, place: "howth" },
      { t: "13:30", text: { zh: "去容住的地方看看（按原计划）", en: "Visit Rong's place (as planned)" } },
      { t: "15:00", text: { zh: "凤凰公园看野鹿，离住处 10 分钟", en: "Phoenix Park — wild deer, 10 min from the flat" }, place: "phoenix" },
      { t: "16:15", text: { zh: "超市买早餐和零食（附近 Tesco / Lidl）", en: "Supermarket for breakfast & snacks (Tesco / Lidl nearby)" } },
      { t: "17:00", text: { zh: "入住，喝热汤，早点休息", en: "Check in, warm soup, early night" } },
    ],
    tips: [
      { zh: "住处 17:00 才能入住，所以白天安排轻松的行程", en: "Check-in isn't until 17:00, so keep the day light" },
      { zh: "长途飞行后很累：让睡得最好的人开车，靠左行驶", en: "Long flight: the best-rested person drives. Keep LEFT" },
      { zh: "圣史蒂芬绿地和 Grafton 街移到明天，市区停车不方便", en: "St Stephen's Green & Grafton St moved to Day 2 — city parking is hard" },
    ],
    stops: ["airport", "howth", "phoenix", "@dublin"],
  },
  {
    n: 2,
    date: "2026-10-26",
    color: "#1d4ed8",
    title: { zh: "都柏林市区 · 晚上接颖和辉", en: "Dublin city · pick up Ying & Hui" },
    route: { zh: "市区步行 · 晚上往返机场", en: "City on foot · evening airport run" },
    drive: { zh: "市区：建议坐巴士或打车", en: "City: bus or taxi recommended" },
    currency: "EUR",
    stay: "dublin",
    sunAt: [53.35, -6.26],
    steps: [
      { t: "10:00", text: { zh: "圣三一学院校园（凯尔经书展可选）", en: "Trinity College campus (Book of Kells optional)" }, place: "trinity", cost: { zh: "凯尔经约 €18.50/人", en: "Book of Kells ~€18.50 pp" } },
      { t: "11:30", text: { zh: "利菲河、半便士桥、圣殿酒吧区", en: "River Liffey, Ha'penny Bridge, Temple Bar" }, place: "hapenny" },
      { t: "12:30", text: { zh: "乔治街拱廊市场：红砖室内市集，午餐、咖啡", en: "George's Street Arcade: red-brick market, lunch & coffee" }, place: "arcade" },
      { t: "14:30", text: { zh: "圣史蒂芬绿地、Grafton 购物街", en: "St Stephen's Green & Grafton Street" }, place: "stephens" },
      { t: "eve", text: { zh: "开车去机场接颖和辉，7 个人到齐！（航班待补）", en: "Drive to the airport for Ying & Hui — all 7 together! (flight TBC)" }, place: "airport" },
    ],
    tips: [
      { zh: "今天是爱尔兰公众假期（十月银行假日），市区人多", en: "Today is an Irish public holiday (October Bank Holiday) — busy city" },
      { zh: "9 人座车约 2 米高，很多市区停车场限高，建议坐巴士或打车（FreeNow App）", en: "The 9-seater is ~2 m tall; many city car parks have height limits — use bus or taxi (FreeNow app)" },
    ],
    stops: ["@dublin", "trinity", "hapenny", "templebar", "arcade", "stephens", "grafton", "airport", "@dublin"],
  },
  {
    n: 3,
    date: "2026-10-27",
    color: "#ea580c",
    title: { zh: "出发！进入北爱尔兰", en: "Road trip! Into Northern Ireland" },
    route: { zh: "都柏林 → 贝尔法斯特", en: "Dublin → Belfast" },
    drive: { zh: "约 165 公里 · M1 高速约 2 小时", en: "~165 km · ~2 h on the M1" },
    currency: "GBP",
    stay: "belfast",
    sunAt: [54.6, -5.93],
    steps: [
      { t: "10:00", text: { zh: "退房出发（11:00 前退房）", en: "Check out & go (by 11:00)" } },
      { t: "12:00", text: { zh: "过境进入北爱尔兰：没有关卡，但限速改成英里/小时，货币改成英镑 £", en: "Cross into Northern Ireland: no checkpoint, but speed limits switch to MPH and money to £" } },
      { t: "14:00", text: { zh: "入住 Airbnb（密码锁）", en: "Check in to the Airbnb (keypad)" } },
      { t: "15:00", text: { zh: "贝尔法斯特市政厅：古典建筑和花园，免费", en: "Belfast City Hall: grand building & gardens, free" }, place: "cityhall" },
      { t: "16:30", text: { zh: "大教堂区：鹅卵石老街、壁画", en: "Cathedral Quarter: cobbled lanes & street art" }, place: "cathedral" },
      { t: "eve", text: { zh: "The Duke of York 酒吧拍照，The Points 听传统音乐", en: "Photos at The Duke of York, live trad music at The Points" } },
    ],
    tips: [
      { zh: "M1 德罗赫达附近有收费站，约 €2–3，可刷卡", en: "M1 toll plaza near Drogheda, ~€2–3, card OK" },
      { zh: "北爱尔兰限速单位是英里：60 mph ≈ 97 km/h", en: "NI speed signs are in mph: 60 mph ≈ 97 km/h" },
    ],
    stops: ["@dublin", "cityhall", "cathedral", "@belfast"],
  },
  {
    n: 4,
    date: "2026-10-28",
    color: "#db2777",
    title: { zh: "贝尔法斯特市区", en: "Belfast city" },
    route: { zh: "泰坦尼克号博物馆 · 和平墙", en: "Titanic Belfast · Peace Walls" },
    drive: { zh: "市区短程", en: "Short city hops" },
    currency: "GBP",
    stay: "belfast",
    sunAt: [54.6, -5.93],
    steps: [
      { t: "09:30", text: { zh: "泰坦尼克号博物馆（全球最大的泰坦尼克号展馆）", en: "Titanic Belfast — the world's biggest Titanic museum" }, place: "titanic", cost: { zh: "约 £24.95/人，要提前网上订时段", en: "~£24.95 pp — book a time slot online" } },
      { t: "12:30", text: { zh: "船坞附近咖啡馆午餐", en: "Lunch at a café in the Titanic Quarter" } },
      { t: "14:00", text: { zh: "和平墙和政治壁画（可选黑色出租车导览，或自己开车拍照）", en: "Peace Walls & murals (optional black-cab tour, or drive yourselves)" }, place: "peace", cost: { zh: "黑色出租车每辆约 £50–70", en: "Black cab ~£50–70 per cab" } },
      { t: "19:00", text: { zh: "晚餐：Mourne Seafood Bar 海鲜和黑啤", en: "Dinner: Mourne Seafood Bar — seafood & stout" } },
    ],
    tips: [
      { zh: "黑色出租车一般坐 6 人，7 个人可能要 2 辆", en: "A black cab usually seats 6 — 7 of you may need 2 cabs" },
      { zh: "Mourne Seafood Bar 7 人要先订位", en: "Book Mourne Seafood Bar for 7" },
    ],
    stops: ["@belfast", "titanic", "peace", "@belfast"],
  },
  {
    n: 5,
    date: "2026-10-29",
    color: "#7c3aed",
    title: { zh: "海岸奇景 + 德里万圣节", en: "Causeway Coast + Halloween in Derry" },
    route: { zh: "贝尔法斯特 → 黑暗树篱 → 巨人堤道 → 德里", en: "Belfast → Dark Hedges → Giant's Causeway → Derry" },
    drive: { zh: "约 165 公里 · 分段共约 3 小时", en: "~165 km · ~3 h in stages" },
    currency: "GBP",
    stay: "derry",
    sunAt: [55.0, -7.32],
    steps: [
      { t: "08:30", text: { zh: "退房出发", en: "Check out & go" } },
      { t: "09:45", text: { zh: "① 黑暗树篱：山毛榉树隧道，免费拍照", en: "① The Dark Hedges: beech-tree tunnel, free" }, place: "dark" },
      { t: "11:00", text: { zh: "② 邓卢斯城堡：悬崖上的古堡废墟", en: "② Dunluce Castle: clifftop ruins" }, place: "dunluce", cost: { zh: "约 £6/人", en: "~£6 pp" } },
      { t: "12:30", text: { zh: "③ 巨人堤道：世界自然遗产，六角形石柱，坐接驳车到海边", en: "③ Giant's Causeway: World Heritage hexagon columns — shuttle bus down to the shore" }, place: "giants", cost: { zh: "户外免费；游客中心（含停车）约 £15/人", en: "Outdoor free; visitor centre (incl. parking) ~£15 pp" } },
      { t: "16:00", text: { zh: "抵达德里，入住 Everglades 酒店", en: "Arrive Derry, check in at the Everglades" } },
      { t: "eve", text: { zh: "德里万圣节：古城墙灯光、市集，老酒吧晚餐", en: "Halloween in Derry: lit-up city walls, market, dinner in an old pub" }, place: "walls" },
    ],
    tips: [
      { zh: "德里万圣节是欧洲最大的万圣节活动，记得带服装！", en: "Derry Halloween is Europe's biggest — bring costumes!" },
      { zh: "海边风大，穿防风外套", en: "Windy coast — wear a windproof jacket" },
    ],
    stops: ["@belfast", "dark", "dunluce", "giants", "walls", "@derry"],
  },
  {
    n: 6,
    date: "2026-10-30",
    color: "#0f766e",
    title: { zh: "西北海岸 → 戈尔韦", en: "Wild northwest → Galway" },
    route: { zh: "德里 → 多尼戈尔 → 斯莱戈 → 戈尔韦", en: "Derry → Donegal → Sligo → Galway" },
    drive: { zh: "约 240 公里 · 分段共约 3.5–4 小时", en: "~240 km · ~3.5–4 h in stages" },
    currency: "EUR",
    stay: "galway",
    sunAt: [53.27, -9.06],
    steps: [
      { t: "09:30", text: { zh: "退房出发，回到爱尔兰共和国：改回公里/小时和欧元 €", en: "Check out; back in the Republic — km/h and € again" } },
      { t: "10:30", text: { zh: "多尼戈尔大西洋海岸荒原", en: "Donegal's wild Atlantic coast" }, place: "donegal" },
      { t: "12:30", text: { zh: "德拉姆克利夫教堂：诗人叶芝墓，花园散步、午餐", en: "Drumcliffe church: poet Yeats' grave, stroll & lunch" }, place: "drumcliffe" },
      { t: "13:30", text: { zh: "远眺本布尔本平顶山", en: "View the flat-topped Benbulben" }, place: "benbulben" },
      { t: "16:30", text: { zh: "抵达戈尔韦海边住处（16:00 后入住）", en: "Arrive at the Galway coast house (check-in from 16:00)" } },
      { t: "19:00", text: { zh: "晚餐：Ard Bia at Nimmos 河边老屋餐厅", en: "Dinner: Ard Bia at Nimmos, riverside old house" } },
    ],
    tips: [{ zh: "今天开车最久：每 1.5 小时休息、换司机", en: "Longest drive of the trip: break & swap drivers every 1.5 h" }],
    stops: ["@derry", "donegal", "drumcliffe", "benbulben", "@galway"],
  },
  {
    n: 7,
    date: "2026-10-31",
    color: "#9333ea",
    title: { zh: "戈尔韦悠闲日 · 万圣夜 🎃", en: "Easy Galway day · Halloween night 🎃" },
    route: { zh: "拉丁区 · 西班牙拱门 · 海滨", en: "Latin Quarter · Spanish Arch · Salthill" },
    drive: { zh: "住处到市区约 20 分钟", en: "~20 min from the house to the city" },
    currency: "EUR",
    stay: "galway",
    sunAt: [53.27, -9.06],
    steps: [
      { t: "10:30", text: { zh: "拉丁区鹅卵石街、店铺、街头艺人", en: "Latin Quarter: cobbled streets, shops, buskers" }, place: "latin" },
      { t: "12:00", text: { zh: "西班牙拱门、河口看天鹅", en: "Spanish Arch & swans at the river mouth" }, place: "spanish" },
      { t: "14:30", text: { zh: "索尔特希尔海滨长廊吹大西洋海风", en: "Salthill Promenade — Atlantic sea breeze" }, place: "salthill" },
      { t: "18:00", text: { zh: "晚餐：The King's Head 历史老酒吧", en: "Dinner: The King's Head historic pub" } },
      { t: "eve", text: { zh: "万圣夜！街上满是装扮的人；Tig Cóilí 或 The Crane Bar 听现场民谣", en: "Halloween night! Costumes everywhere; live trad music at Tig Cóilí or The Crane Bar" } },
    ],
    tips: [
      { zh: "周六 + 万圣节，晚餐一定要先订 7 人位", en: "Saturday + Halloween: book dinner for 7" },
      { zh: "Salthill 海边有露天停车场，没有限高问题", en: "Salthill has open-air parking — no height limits" },
    ],
    stops: ["@galway", "latin", "spanish", "salthill", "@galway"],
  },
  {
    n: 8,
    date: "2026-11-01",
    color: "#ca8a04",
    title: { zh: "莫赫悬崖 + 渡轮 → 丁格尔", en: "Cliffs of Moher + ferry → Dingle" },
    route: { zh: "戈尔韦 → 巴伦 → 莫赫悬崖 → 香农渡轮 → 丁格尔", en: "Galway → Burren → Cliffs of Moher → Shannon ferry → Dingle" },
    drive: { zh: "约 4 小时（含渡轮）", en: "~4 h incl. ferry" },
    currency: "EUR",
    stay: "dingle",
    sunAt: [52.14, -10.27],
    steps: [
      { t: "09:00", text: { zh: "退房出发", en: "Check out & go" } },
      { t: "10:00", text: { zh: "① 穿越巴伦：月球一样的石灰岩地貌", en: "① Through the Burren: moon-like limestone" }, place: "burren" },
      { t: "11:00", text: { zh: "② 莫赫悬崖：214 米高的大西洋绝壁", en: "② Cliffs of Moher: 214 m sea cliffs" }, place: "moher", cost: { zh: "网上订票约 €7–10/人", en: "~€7–10 pp booked online" } },
      { t: "14:30", text: { zh: "③ 香农汽车渡轮 Killimer → Tarbert，20 分钟，车开上船，甲板上可能看到海豚", en: "③ Shannon car ferry Killimer → Tarbert, 20 min — drive on, maybe dolphins" }, place: "killimer", cost: { zh: "整车约 €21.50–24", en: "~€21.50–24 per car" } },
      { t: "17:00", text: { zh: "抵达丁格尔入住（17:00 后）", en: "Arrive Dingle, check in (from 17:00)" } },
      { t: "eve", text: { zh: "Dick Mack's 或 O'Flaherty's 传奇老酒吧", en: "Dick Mack's or O'Flaherty's legendary pubs" } },
    ],
    tips: [
      { zh: "11 月太阳 5 点左右下山，尽量天黑前到丁格尔", en: "Sunset is around 5 pm in November — try to reach Dingle before dark" },
      { zh: "渡轮冬季班次较少，出发前看 shannonferries.com", en: "Fewer winter sailings — check shannonferries.com before leaving" },
    ],
    stops: ["@galway", "burren", "moher", "killimer", "tarbert", "@dingle"],
  },
  {
    n: 9,
    date: "2026-11-02",
    color: "#dc2626",
    title: { zh: "斯莱角环半岛自驾", en: "Slea Head Drive" },
    route: { zh: "丁格尔半岛环线（顺时针）", en: "Dingle Peninsula loop (clockwise)" },
    drive: { zh: "环线约 50 公里 · 慢开约 3 小时", en: "~50 km loop · ~3 h with stops" },
    currency: "EUR",
    stay: "dingle",
    sunAt: [52.14, -10.27],
    steps: [
      { t: "10:00", text: { zh: "顺时针开 Slea Head Drive", en: "Slea Head Drive, clockwise" }, place: "ventry" },
      { t: "10:45", text: { zh: "古代石头蜂巢屋", en: "Ancient stone beehive huts" }, place: "slea", cost: { zh: "约 €3–5/人，现金", en: "~€3–5 pp, cash" } },
      { t: "11:30", text: { zh: "库米努尔金色海滩、布拉斯基特群岛景观", en: "Coumeenoole golden beach & Blasket Islands view" }, place: "coumeenoole" },
      { t: "12:30", text: { zh: "海边茶室：热汤、司康饼配果酱", en: "Seaside tearoom: soup, scones & jam" }, place: "dunquin" },
      { t: "19:00", text: { zh: "晚餐：Out of the Blue 野生海鲜；An Droichead Beag 酒吧听小提琴", en: "Dinner: Out of the Blue seafood; fiddle music at An Droichead Beag" } },
    ],
    tips: [
      { zh: "路很窄，车很大：慢慢开，让对面车先过", en: "Narrow roads, big van: go slow and let others pass" },
      { zh: "11 月有些餐厅冬季休息，出发前查营业时间", en: "Some restaurants close for winter in November — check opening times" },
    ],
    stops: ["@dingle", "ventry", "slea", "coumeenoole", "dunquin", "@dingle"],
  },
  {
    n: 10,
    date: "2026-11-03",
    color: "#16a34a",
    title: { zh: "基拉尼国家公园 → 金塞尔", en: "Killarney National Park → Kinsale" },
    route: { zh: "丁格尔 → 基拉尼 → 金塞尔", en: "Dingle → Killarney → Kinsale" },
    drive: { zh: "约 175 公里 · 分段共约 2.5 小时", en: "~175 km · ~2.5 h in stages" },
    currency: "EUR",
    stay: "kinsale",
    sunAt: [51.71, -8.52],
    steps: [
      { t: "09:30", text: { zh: "退房出发（10:00 前退房）", en: "Check out & go (by 10:00)" } },
      { t: "10:45", text: { zh: "穆克罗斯庄园：湖边花园", en: "Muckross House: lakeside gardens" }, place: "muckross", cost: { zh: "进屋参观约 €9.50/人（可选）", en: "House tour ~€9.50 pp (optional)" } },
      { t: "12:00", text: { zh: "托克瀑布：步行 5 分钟，青苔森林", en: "Torc Waterfall: 5-min walk through mossy forest" }, place: "torc" },
      { t: "15:30", text: { zh: "直接入住金塞尔（避开科克市区塞车），傍晚逛彩色街道", en: "Straight to Kinsale (skip Cork traffic), stroll the colourful streets" } },
      { t: "19:00", text: { zh: "晚餐：Fishy Fishy 海鲜 或 The Black Pig", en: "Dinner: Fishy Fishy seafood or The Black Pig" } },
    ],
    tips: [{ zh: "金塞尔是爱尔兰美食之都，晚餐先订位", en: "Kinsale is Ireland's food capital — book dinner" }],
    stops: ["@dingle", "muckross", "torc", "@kinsale"],
  },
  {
    n: 11,
    date: "2026-11-04",
    color: "#2563eb",
    title: { zh: "科克市场 + 科夫小镇", en: "Cork market + Cobh" },
    route: { zh: "金塞尔 → 科克 → 科夫 → 金塞尔", en: "Kinsale → Cork → Cobh → Kinsale" },
    drive: { zh: "25 + 25 + 35 分钟", en: "25 + 25 + 35 min" },
    currency: "EUR",
    stay: "kinsale",
    sunAt: [51.71, -8.52],
    steps: [
      { t: "10:00", text: { zh: "① 科克英国市场：百年室内美食市场，二楼 Farmgate Café 喝咖啡、吃生蚝，买奶酪特产", en: "① English Market, Cork: century-old food hall — coffee & oysters at Farmgate Café upstairs, buy cheese" }, place: "market" },
      { t: "13:30", text: { zh: "② 科夫：泰坦尼克号最后停靠港，海湾大教堂、彩色房子", en: "② Cobh: Titanic's last port — cathedral & colourful houses" }, place: "cobh", cost: { zh: "泰坦尼克体验馆约 €11/人（可选）", en: "Titanic Experience ~€11 pp (optional)" } },
      { t: "17:00", text: { zh: "③ 回金塞尔看港口日落，小酒吧听音乐", en: "③ Back to Kinsale: harbour sunset, music in a local pub" } },
    ],
    tips: [{ zh: "今晚开始收拾行李，明天要还车", en: "Start packing tonight — the car goes back tomorrow" }],
    stops: ["@kinsale", "market", "cobh", "@kinsale"],
  },
  {
    n: 12,
    date: "2026-11-05",
    color: "#7c3aed",
    title: { zh: "回都柏林机场 · 还车", en: "Back to Dublin Airport · return the car" },
    route: { zh: "金塞尔 → 都柏林机场", en: "Kinsale → Dublin Airport" },
    drive: { zh: "约 275 公里 · 约 2 小时 50 分", en: "~275 km · ~2 h 50 m" },
    currency: "EUR",
    stay: "clayton",
    sunAt: [53.42, -6.24],
    steps: [
      { t: "10:30", text: { zh: "海景早餐后出发（11:00 前退房），走 M8 → M7 → M50", en: "Leisurely breakfast, leave by 11:00, via M8 → M7 → M50" } },
      { t: "14:30", text: { zh: "入住 Clayton 机场酒店，放下行李", en: "Check in at the Clayton airport hotel, drop bags" } },
      { t: "16:00", text: { zh: "加满油，还车到 Eastlands（20:00 前），坐接驳巴士回机场", en: "Refuel, return the car at Eastlands (before 20:00), shuttle back" }, place: "airport" },
      { t: "17:30", text: { zh: "坐巴士或打车去马拉海德：城堡、海边小镇，海鲜晚餐", en: "Bus or taxi to Malahide: castle, seaside village, seafood dinner" }, place: "malahide" },
      { t: "21:00", text: { zh: "回酒店整理行李，早睡", en: "Back to pack, early night" } },
    ],
    tips: [
      { zh: "M50 收费没有收费亭：当天或第二天晚上 8 点前上 eflow.ie 付费（约 €3–4），否则租车公司加收手续费", en: "M50 toll has no booths: pay at eflow.ie by 8 pm the next day (~€3–4) or Alamo adds a fee" },
      { zh: "还车前拍照：油表、里程、车身四周", en: "Before returning: photos of fuel gauge, mileage and all sides" },
    ],
    stops: ["@kinsale", "@clayton", "airport", "malahide"],
  },
  {
    n: 13,
    date: "2026-11-06",
    color: "#475569",
    title: { zh: "回家 · 再见爱尔兰", en: "Fly home · Slán, Ireland" },
    route: { zh: "都柏林 → 多哈 → 吉隆坡", en: "Dublin → Doha → KL" },
    drive: { zh: "酒店接驳车 5–10 分钟", en: "Hotel shuttle 5–10 min" },
    currency: "EUR",
    sunAt: [53.42, -6.24],
    steps: [
      { t: "04:30", text: { zh: "坐酒店接驳车（或预订的出租车）去 T1", en: "Hotel shuttle (or pre-booked taxi) to T1" }, place: "airport" },
      { t: "04:45", text: { zh: "到达 T1 办理登机（起飞前 3 小时）、退税、安检", en: "At T1: check in (3 h before), tax refund, security" } },
      { t: "07:45", text: { zh: "QR020 都柏林 → 多哈（7 小时 5 分）", en: "QR020 Dublin → Doha (7 h 5 m)" } },
      { t: "19:55", text: { zh: "QR844 多哈 → 吉隆坡，11 月 7 日 08:15 抵达 KLIA T1", en: "QR844 Doha → KL, lands KLIA T1 08:15 on 7 Nov" } },
    ],
    tips: [
      { zh: "前一晚问清楚酒店最早的接驳车；太晚就预订出租车", en: "Ask the night before about the first shuttle; book a taxi if it's too late" },
      { zh: "容留在爱尔兰继续读书，好好道别 ❤️", en: "Rong stays on for his studies — say a proper goodbye ❤️" },
    ],
    stops: ["@clayton", "airport"],
  },
  {
    n: 14,
    date: "2026-11-07",
    color: "#64748b",
    title: { zh: "回到吉隆坡 · 捷飞回珀斯", en: "Back in KL · Jiet flies to Perth" },
    route: { zh: "吉隆坡 → 珀斯", en: "KL → Perth" },
    currency: "EUR",
    sunAt: [3.1, 101.7],
    steps: [
      { t: "08:15", text: { zh: "抵达 KLIA 第 1 航站楼", en: "Land KLIA T1" } },
      { t: "21:55", text: { zh: "捷：AirAsia AK604 KLIA T2 → 珀斯（已改时间：原本 22:55）", en: "Jiet: AirAsia AK604 KLIA T2 → Perth (rescheduled from 22:55)" } },
      { t: "03:40", text: { zh: "11 月 8 日抵达珀斯", en: "Land Perth on 8 Nov" } },
    ],
    tips: [{ zh: "AirAsia 在第 2 航站楼：坐 KLIA Transit 过去", en: "AirAsia is at T2: take the KLIA Transit train" }],
    stops: [],
  },
];

export type Flight = { code: string; from: string; to: string; dep: string; arr: string; note?: L };

export const flights: Record<Person["flightGroup"], { title: L; legs: Flight[]; note?: L }> = {
  kl4: {
    title: { zh: "爸爸 · 妈妈 · 耀 · 捷（卡塔尔航空）", en: "Dad · Mum · Yao · Jiet (Qatar Airways)" },
    legs: [
      { code: "QR853", from: "KUL T1", to: "DOH", dep: "24 Oct 19:20", arr: "24 Oct 21:40" },
      { code: "QR019", from: "DOH", to: "DUB T1", dep: "25 Oct 01:30", arr: "25 Oct 06:00" },
      { code: "QR020", from: "DUB T1", to: "DOH", dep: "6 Nov 07:45", arr: "6 Nov 17:50" },
      { code: "QR844", from: "DOH", to: "KUL T1", dep: "6 Nov 19:55", arr: "7 Nov 08:15" },
    ],
    note: { zh: "经济舱，托运行李 25 公斤/人", en: "Economy, 25 kg checked bag each" },
  },
  jiet: {
    title: { zh: "捷 · 珀斯往返吉隆坡（AirAsia）", en: "Jiet · Perth ↔ KL (AirAsia)" },
    legs: [
      { code: "AK605", from: "PER T1", to: "KUL T2", dep: "24 Oct 04:45", arr: "24 Oct 10:20" },
      { code: "AK604", from: "KUL T2", to: "PER", dep: "7 Nov 21:55", arr: "8 Nov 03:40", note: { zh: "已改时间（原本 22:55）", en: "Rescheduled (was 22:55)" } },
    ],
  },
  iceland: {
    title: { zh: "颖 · 辉（从冰岛飞来）", en: "Ying · Hui (from Iceland)" },
    legs: [],
    note: { zh: "10 月 26 日晚上抵达都柏林 — 航班资料待补", en: "Arrive Dublin evening of 26 Oct — flight details to add" },
  },
  local: {
    title: { zh: "容 · 在爱尔兰读书", en: "Rong · studying in Ireland" },
    legs: [],
    note: { zh: "全程 13 天一起", en: "With us all 13 days" },
  },
};

export const car = {
  model: "Ford Tourneo (9 seats, automatic) or similar",
  company: "Alamo (booked via Trip.com)",
  pickup: { when: "25 Oct 07:30", where: "Dublin Airport — Eastlands Car Hire Facility" },
  dropoff: { when: "5 Nov 20:00", where: "Dublin Airport — Eastlands Car Hire Facility" },
  phone: "+35318445848",
  hours: "05:00–23:00",
};

export type CheckItem = { id: string; text: L; who: "all" | "drivers" | "team" };

// "team" items are shared to-dos (one tick for everyone); others are per person.
export const checklist: { title: L; items: CheckItem[] }[] = [
  {
    title: { zh: "出发前要办（全家）", en: "Before we go (team)" },
    items: [
      { id: "eta", who: "team", text: { zh: "英国 ETA 电子旅行许可：去北爱尔兰（贝尔法斯特、德里）需要，每人用 UK ETA App 申请（容住在爱尔兰可能免）", en: "UK ETA: needed for Northern Ireland (Belfast, Derry) — apply in the UK ETA app for each person (Rong may be exempt as an Irish resident)" } },
      { id: "derry", who: "team", text: { zh: "确认德里其余 5 人的房间", en: "Confirm Derry rooms for the other 5" } },
      { id: "drivers", who: "team", text: { zh: "确认司机资格：30–80 岁、驾照满 13 年、驾照 + 国际驾照 + 护照同一国家签发", en: "Check drivers qualify: age 30–80, licence held 13+ yrs, licence + IDP + passport from the same country" } },
      { id: "titanic", who: "team", text: { zh: "订泰坦尼克号博物馆门票（10/28 上午）", en: "Book Titanic Belfast (28 Oct, morning)" } },
      { id: "moher", who: "team", text: { zh: "订莫赫悬崖门票（11/1 上午）", en: "Book Cliffs of Moher (1 Nov, morning)" } },
      { id: "dinners", who: "team", text: { zh: "订 7 人晚餐：Mourne Seafood（10/28）、King's Head（10/31 万圣节）、Fishy Fishy（11/3）", en: "Book dinners for 7: Mourne Seafood (28 Oct), King's Head (31 Oct, Halloween), Fishy Fishy (3 Nov)" } },
      { id: "yinghui", who: "team", text: { zh: "拿到颖和辉的航班时间", en: "Get Ying & Hui's flight times" } },
      { id: "shuttle", who: "team", text: { zh: "问 Clayton 酒店 11/6 最早的接驳车时间", en: "Ask Clayton about the earliest shuttle on 6 Nov" } },
    ],
  },
  {
    title: { zh: "证件", en: "Documents" },
    items: [
      { id: "passport", who: "all", text: { zh: "护照（有效期 6 个月以上）", en: "Passport (6+ months valid)" } },
      { id: "eta-me", who: "all", text: { zh: "英国 ETA 已批准", en: "UK ETA approved" } },
      { id: "insurance", who: "all", text: { zh: "旅游保险", en: "Travel insurance" } },
      { id: "licence", who: "drivers", text: { zh: "驾照正本 + 国际驾照（IDP）", en: "Original licence + IDP" } },
      { id: "card", who: "all", text: { zh: "信用卡（爸爸：实体芯片卡、主司机名字，用来付租车押金）", en: "Credit card (Dad: physical chip card in his name for the car deposit)" } },
      { id: "cash", who: "all", text: { zh: "少量现金 € 和 £", en: "A little cash in € and £" } },
    ],
  },
  {
    title: { zh: "行李", en: "Packing" },
    items: [
      { id: "jacket", who: "all", text: { zh: "防水防风外套（8–13°C，常下雨）", en: "Waterproof, windproof jacket (8–13°C, rain)" } },
      { id: "layers", who: "all", text: { zh: "毛衣、保暖内衣、帽子、手套", en: "Jumper, thermals, beanie, gloves" } },
      { id: "shoes", who: "all", text: { zh: "防水好走的鞋", en: "Comfy waterproof shoes" } },
      { id: "costume", who: "all", text: { zh: "万圣节服装 🎃", en: "Halloween costume 🎃" } },
      { id: "meds", who: "all", text: { zh: "常用药", en: "Personal medicine" } },
      { id: "sim", who: "all", text: { zh: "电话卡 / eSIM（要同时包括爱尔兰和英国）", en: "SIM / eSIM covering Ireland AND the UK" } },
      { id: "power", who: "all", text: { zh: "充电宝、充电线（插座和马来西亚一样，捷要转换头）", en: "Power bank & cables (same plug as Malaysia — Jiet needs an adapter)" } },
      { id: "offline", who: "drivers", text: { zh: "Google 地图下载离线地图、手机支架", en: "Download offline Google Maps, phone mount" } },
    ],
  },
];

export const emergency = [
  { label: { zh: "紧急电话（警察、救护车、消防）", en: "Emergency (police, ambulance, fire)" }, phone: "112" },
  { label: { zh: "Alamo 都柏林机场", en: "Alamo Dublin Airport" }, phone: car.phone },
];

export function stayById(id?: string) {
  return stays.find((s) => s.id === id);
}

export function navUrl(lat: number, lng: number, query?: string) {
  const dest = query ? encodeURIComponent(query) : `${lat},${lng}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`;
}

export function stayNavUrl(s: Stay) {
  return s.approx ? navUrl(s.lat, s.lng, s.address) : navUrl(s.lat, s.lng);
}

export const TRIP_START = "2026-10-24";
export const TRIP_END = "2026-11-07";
