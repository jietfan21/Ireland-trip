// November 5 final driving day: Kinsale → Portlaoise lunch → Rong in Dundalk → Clayton → Alamo.
import { days, places, stays, type Day, type Place } from "./trip";

// Coordinates help the in-app overview; named queries are the navigation source of truth.
const nov5Places: Record<string, Place> = {
  topoilkinsale: {
    zh: "Top Oil 金塞尔加油站（出发前）",
    en: "Top Oil Kinsale fuel (before the long drive)",
    lat: 51.708, lng: -8.517,
    q: "Top Oil Kinsale Service Station, Eastern Road, Kinsale, Co. Cork, P17 WN80, Ireland",
  },
  portlaoiseplaza: {
    zh: "Portlaoise Plaza 午餐、厕所、免费停车",
    en: "Portlaoise Plaza: lunch, toilets and free parking",
    lat: 53.0144, lng: -7.30734,
    q: "The Portlaoise Plaza, M7 Junction 17, Portlaoise, Co. Laois, R32 V97T, Ireland",
  },
  certafuelairport: {
    zh: "Certa 都柏林机场加油站（还车前）",
    en: "Certa Fuel Dublin Airport (before car return)",
    lat: 53.414, lng: -6.237,
    q: "Certa Fuel Dublin Airport, Swords Road, Dardistown, Swords, Co. Dublin, K67 P2H4, Ireland",
  },
  alamoeastlands: {
    zh: "Alamo 还车 · Dublin Airport Eastlands",
    en: "Alamo rental return · Dublin Airport Eastlands",
    lat: 53.424, lng: -6.252,
    q: "Alamo Rent A Car, Dublin Airport Eastlands Car Hire Facility, Dublin, K67 V5X0, Ireland",
  },
};

const nov5: Day = {
  n: 12,
  date: "2026-11-05",
  color: "#7c3aed",
  title: { zh: "送容回邓多克 · 都柏林机场还车", en: "Drop Rong in Dundalk · return Alamo car" },
  route: {
    zh: "金塞尔 → Portlaoise 午餐 → 邓多克（容）→ Clayton 机场酒店 → Alamo 还车",
    en: "Kinsale → Portlaoise lunch → Dundalk (Rong) → Clayton Airport Hotel → Alamo return",
  },
  drive: {
    zh: "约 400–430 公里，实际驾车约 4 小时 40 分至 5 小时 20 分，另加午餐、加油与交通",
    en: "~400–430 km; allow ~4 h 40 m–5 h 20 m of driving, plus lunch, fuel and traffic",
  },
  currency: "EUR",
  stay: "clayton",
  sunAt: [53.42, -6.24],
  steps: [
    {
      t: "07:45",
      text: {
        zh: "Airbnb 吃早餐、收拾行李。金塞尔 11:00 才是最晚退房，今天为了邓多克送容与 20:00 还车，请尽量 09:00 提早离开。",
        en: "Breakfast at Airbnb and pack. Checkout is by 11:00, but leave around 09:00 to fit Dundalk, hotel check-in and the 20:00 car-return deadline.",
      },
    },
    {
      t: "09:00",
      text: {
        zh: "七人带齐行李出发，路经金塞尔 Eastern Road 加油。确认油种，Top Oil 周四 07:00–21:00 营业。",
        en: "All seven leave with luggage. Refuel at Top Oil on Eastern Road, Kinsale (Thursday 07:00–21:00); check the correct fuel grade.",
      },
      place: "topoilkinsale",
    },
    {
      t: "09:25",
      text: {
        zh: "开往 Portlaoise：M8 → M7，高速有收费段。今天不去 Cashel、Rock of Cashel 或其他景点，把时间留给邓多克和还车。",
        en: "Drive M8 → M7 towards Portlaoise; expect motorway tolls. Skip Cashel and extra sightseeing today to protect the Dundalk and rental-return timings.",
      },
    },
    {
      t: "11:45",
      text: {
        zh: "Portlaoise 午餐（下方五选一，七人），建议 45–60 分钟。默认 Portlaoise Plaza：免费大停车场、厕所、三明治、披萨等；想吃爱尔兰酒馆可选择 Treacy's。",
        en: "Lunch near Portlaoise (choose one of five below) for seven; allow 45–60 min. Default Plaza has free spacious parking, toilets and quick food; Treacy's is a sit-down Irish alternative.",
      },
      place: "portlaoiseplaza",
    },
    {
      t: "12:30",
      text: {
        zh: "继续沿 M7 → M50 → M1 向北开往邓多克，留意都柏林车流。午餐若较慢，酒店入住时间相应推后。",
        en: "Continue M7 → M50 → M1 north to Dundalk. Allow for Dublin-area traffic; if lunch runs late, hotel arrival will move later.",
      },
    },
    {
      t: "14:30",
      text: {
        zh: "在 37 Rockfield Court, Hoey's Lane, Dundalk, A91 Y7N6 送容回家，卸他的行李，约 15–30 分钟；剩余六人继续南下。",
        en: "Drop Rong at 37 Rockfield Court, Hoey's Lane, Dundalk, A91 Y7N6. Unload his luggage (~15–30 min); six people continue to the airport hotel.",
      },
      place: "rong",
    },
    {
      t: "15:00",
      text: {
        zh: "驶回都柏林机场附近的 Clayton Hotel（邓多克约 45–60 分钟）。酒店在 Stockhole Lane，不是机场航站楼旁边的 Clayton Airport Central。",
        en: "Drive south to Clayton Hotel Dublin Airport (~45–60 min from Dundalk). It is on Stockhole Lane, NOT Clayton Airport Central at the terminals.",
      },
    },
    {
      t: "16:00",
      text: {
        zh: "六人入住 Clayton（15:00 起可入住）、卸下全部行李。九座车要注意酒店地下车库限高 2 米；若不适合，询问露天停车。",
        en: "Check six guests into Clayton (available from 15:00) and unload all bags. The underground parking has a 2 m height limit; ask for surface parking if the 9-seater is too tall.",
      },
    },
    {
      t: "17:15",
      text: {
        zh: "只有司机（可多一人陪同）出发还车。先去 Certa Fuel Dublin Airport 补油：Alamo 通常要求油位与取车时记录相同，并非一律加满。保存油票与油表照片。",
        en: "Driver (optionally with one companion) heads to the return. Refuel at Certa Fuel Dublin Airport to the pickup fuel level on your Alamo agreement, not automatically full. Keep the receipt and a dashboard photo.",
      },
      place: "certafuelairport",
    },
    {
      t: "18:00",
      text: {
        zh: "前往 Alamo Dublin Airport Eastlands Car Hire Facility，K67 V5X0，还车目标 18:00–18:30，最迟 20:00。拍车身、里程、油表，向人员交钥匙并索取回执；不要导航去 T1/T2 航站楼。",
        en: "Return to Alamo at Dublin Airport Eastlands Car Hire Facility, K67 V5X0. Aim for 18:00–18:30, well before the 20:00 deadline. Photograph body, mileage and fuel, hand keys to staff and get a receipt; don't navigate to T1/T2 for the car.",
      },
      place: "alamoeastlands",
    },
    {
      t: "18:45",
      text: {
        zh: "依 Alamo 人员指示前往机场航站楼接驳地点，再到机场 Zone 16 坐 Clayton 免费巴士回酒店。酒店巴士 24 小时运行，约每 20–25 分钟一班，车程约 10 分钟。",
        en: "Follow Alamo staff's transfer instructions to the airport terminals, then go to airport Zone 16 for Clayton's free shuttle to the hotel (24/7, about every 20–25 min; ~10 min ride).",
      },
    },
    {
      t: "19:30",
      text: {
        zh: "六人晚餐（下方六选一）。最省事是酒店内 The Playwright Bar 或 The Italian Kitchen，可直接步行；Kealy's、Musashi、Indie Spice、Old Schoolhouse 需要打车。",
        en: "Dinner for six (choose one of six below). Easiest: The Playwright Bar or Italian Kitchen INSIDE the hotel. Kealy's, Musashi, Indie Spice and Old Schoolhouse require a taxi.",
      },
    },
    {
      t: "21:00",
      text: {
        zh: "回房休息并整理明早航班行李；11 月 6 日部分团员一早 06:15 从 T2 起飞，其他从 T1 出发，睡前确认班次和酒店接驳。",
        en: "Rest and prepare luggage for early flights on Nov 6. Some fly at 06:15 from T2 and others from T1; confirm terminal and shuttle timing before bed.",
      },
    },
  ],
  lunchOptions: [
    {
      name: "Portlaoise Plaza",
      food: { zh: "最快：M7 J17 免费大停车场和厕所；披萨、汉堡、三明治，建议 30–45 分钟", en: "FASTEST: M7 J17, free large parking and toilets; pizza, burgers and sandwiches (~30–45 min)" },
      query: "The Portlaoise Plaza, Junction 17 M7, Portlaoise, Co. Laois, R32 V97T, Ireland",
    },
    {
      name: "Midway Food Court",
      food: { zh: "M7 J17 附近休闲美食广场，有停车，适合快速吃饭休息", en: "Casual food court near M7 J17 with parking; easy quick break" },
      query: "Applegreen Midway Food Court, M7 Junction 17, Portlaoise, Co. Laois, Ireland",
    },
    {
      name: "Treacy's Bar & Restaurant",
      food: { zh: "传统爱尔兰茅草屋酒馆、牛排和家常菜；12:00 起供应午餐，有免费停车；建议订七人", en: "Traditional thatched Irish pub, steaks and hearty meals; Thursday lunch from 12:00, free parking; reserve for seven" },
      query: "Treacy's Bar & Restaurant, The Heath, Portlaoise, Co. Laois, R32 X803, Ireland",
    },
    {
      name: "O'Gorman's Bar & Restaurant",
      food: { zh: "选择最多：爱尔兰餐、泰国菜、柴火披萨；免费大停车场，适合七人", en: "BEST VARIETY: Irish food, Thai dishes and wood-fired pizza; large free parking, suitable for seven" },
      query: "O'Gorman's Bar & Restaurant, Kilminchy Court, Portlaoise, Co. Laois, Ireland",
    },
    {
      name: "Cedar Bar · Killeshin Hotel",
      food: { zh: "酒店酒吧午餐、可坐下慢慢吃；约 12:30 起供应，请预留更多时间", en: "Relaxed sit-down hotel bar lunch, food from ~12:30; allow extra time" },
      query: "Cedar Bar, The Killeshin Hotel, Dublin Road, Portlaoise, Co. Laois, R32 TYW7, Ireland",
    },
  ],
  dinnerOptions: [
    {
      name: "The Playwright Bar · at Clayton",
      food: { zh: "酒店内！不用走出酒店或打车；休闲爱尔兰酒馆餐，供应至约 22:30", en: "INSIDE HOTEL, no taxi; casual Irish pub food, served until ~22:30" },
      query: "The Playwright Bar, Clayton Hotel Dublin Airport, Stockhole Lane, Swords, Co. Dublin, Ireland",
    },
    {
      name: "The Italian Kitchen · at Clayton",
      food: { zh: "酒店内！柴火披萨、意大利面，适合六人坐下吃晚餐；17:00–22:00，建议预订", en: "INSIDE HOTEL; wood-fired pizza and pasta, 17:00–22:00; reserve for six" },
      query: "The Italian Kitchen, Clayton Hotel Dublin Airport, Stockhole Lane, Swords, Co. Dublin, Ireland",
    },
    {
      name: "Kealy's of Cloghran · taxi",
      food: { zh: "短程打车，传统爱尔兰酒馆和晚餐；酒店周边道路不适宜夜间步行", en: "SHORT TAXI: traditional Irish pub and dinner; don't walk hotel access roads at night" },
      query: "Kealy's of Cloghran, Swords Road, Cloghran, Co. Dublin, K67 P957, Ireland",
    },
    {
      name: "Musashi Swords · taxi",
      food: { zh: "打车去 Swords 镇中心，日本寿司、拉面和饭碗，喜欢亚洲餐可选", en: "TAXI to Swords: Japanese sushi, ramen, rice bowls and hot dishes; Asian-food pick" },
      query: "Musashi Swords, Main Street, Swords, Co. Dublin, Ireland",
    },
    {
      name: "Indie Spice Grill · taxi",
      food: { zh: "打车去 Swords，印度咖喱、Tandoori 和素食；六人建议预订", en: "TAXI to Swords: Indian curries, tandoori and vegetarian dishes; reserve for six" },
      query: "Indie Spice Grill, Burgundy House, Forster Way, Swords, Co. Dublin, K67 E4A8, Ireland",
    },
    {
      name: "The Old Schoolhouse · taxi",
      food: { zh: "打车去 Swords，爱尔兰酒馆、牛排、海鲜；周四晚上可能有现场音乐", en: "TAXI to Swords: Irish pub, steak, seafood; Thursday live music may be on" },
      query: "The Old Schoolhouse Bar & Restaurant, Church Road, Swords, Co. Dublin, Ireland",
    },
  ],
  tips: [
    {
      zh: "明天不是直接去机场：必须先从 Portlaoise 开往邓多克 37 Rockfield Court 送容，再南下 Stockhole Lane 酒店。提早离开，今天不安排观光。",
      en: "Do NOT drive straight to the airport: after Portlaoise, go to 37 Rockfield Court in Dundalk to drop Rong, then south to Clayton on Stockhole Lane. Leave early and skip sightseeing.",
    },
    {
      zh: "只要午餐换了餐厅，请点该餐厅的「地图」导航；全日开车路线以 Portlaoise Plaza 为默认午餐站。不要一口气导航至所有五家午餐选择。",
      en: "If you choose a different lunch restaurant, use its individual Map button. The full-day driving route defaults to Portlaoise Plaza; don't navigate to all five lunch options.",
    },
    {
      zh: "Alamo 还车地址是 Dublin Airport EASTLANDS Car Hire Facility，邮编 K67 V5X0，不是 T1/T2。目标 18:00–18:30，还车合同截止 20:00；官方迟还车说明有差异，不要赌最后一刻。",
      en: "Alamo return is DUBLIN AIRPORT EASTLANDS Car Hire Facility, K67 V5X0, not T1/T2. Target 18:00–18:30, before the contractual 20:00 deadline; don't rely on late key-drop arrangements.",
    },
    {
      zh: "Alamo 加油通常以取车时油量为准（查看合同），不一定要满油；还车前保留油票、里程、油表与车身照片。",
      en: "For Alamo fuel, check the agreement's pickup level (not necessarily full). Keep fuel receipt and photos of gauge, mileage and vehicle before handing over.",
    },
    {
      zh: "酒店周边紧邻大路，不建议夜间走路去外面吃饭。The Playwright Bar 与 The Italian Kitchen 在 Clayton 内，可直接步行；其他需打车。",
      en: "The hotel is by major roads, so avoid walking off-site at night. The Playwright Bar and Italian Kitchen are INSIDE Clayton; other dinner options require a taxi.",
    },
    {
      zh: "九座车可能接近 2 米，Clayton 地下停车场限高 2 米。先卸六人的行李，不确定车高就问露天停车。还车后去机场 Zone 16 坐免费的 Clayton 巴士回酒店。",
      en: "The 9-seater may be close to 2 m; Clayton underground parking is limited to 2 m. Unload six guests' bags and ask for surface parking if needed. After car return, take Clayton's free shuttle from airport Zone 16.",
    },
  ],
  // Car-driving legs only. Returning to the hotel after Alamo uses airport and hotel shuttles, not the rental car.
  stops: ["@kinsale", "topoilkinsale", "portlaoiseplaza", "rong", "@clayton", "certafuelairport", "alamoeastlands"],
};

Object.assign(places, nov5Places);
places.rong.q = "37 Rockfield Court, Hoey's Lane, Dundalk, Co. Louth, A91 Y7N6, Ireland";

const claytonStay = stays.find((stay) => stay.id === "clayton");
if (claytonStay) {
  claytonStay.address = "Stockhole Lane, Swords, Co. Dublin, K67 X3H5, Ireland";
  claytonStay.phone = "+35318711000";
  claytonStay.notes = [
    { zh: "11 月 5 日六人入住（15:00 起）；容已在邓多克下车。", en: "Six guests check in on Nov 5 (from 15:00); Rong has been dropped in Dundalk." },
    { zh: "酒店内有 The Playwright Bar 与 The Italian Kitchen 两家晚餐选择，外面的餐厅建议打车。", en: "Dinner on-site at The Playwright Bar or Italian Kitchen; take a taxi for off-site restaurants." },
    { zh: "地下车库限高 2 米；九座车不确定能否进入时询问露天停车。", en: "Underground parking has a 2 m limit; ask for surface parking if the 9-seater is too tall." },
    { zh: "机场 Zone 16 免费接驳车约每 20–25 分钟一班，24 小时运营。", en: "Free airport shuttle from Zone 16 runs 24/7, approximately every 20–25 minutes." },
  ];
}

const index = days.findIndex((day) => day.date === nov5.date);
if (index >= 0) days[index] = nov5;
