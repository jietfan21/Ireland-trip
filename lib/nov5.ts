// November 5 final driving day: Kinsale fuel → Portlaoise toilet → Dundalk lunch/Rong → Clayton → Alamo.
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
    zh: "Portlaoise Plaza：仅厕所休息、免费停车",
    en: "Portlaoise Plaza: toilets only and free parking",
    lat: 53.0144, lng: -7.30734,
    q: "The Portlaoise Plaza, M7 Junction 17, Portlaoise, Co. Laois, R32 V97T, Ireland",
  },
  fairwaysdundalk: {
    zh: "Fairways Hotel · Dundalk 午餐",
    en: "Fairways Hotel Brasserie · Dundalk lunch",
    lat: 53.9813, lng: -6.3887,
    q: "The Brasserie at Fairways Hotel, Dublin Road, Haggardstown, Dundalk, A91 E6KC, Ireland",
  },
  circlekairport: {
    zh: "Circle K Dublin Airport（还车前补油）",
    en: "Circle K Dublin Airport (final refuel)",
    lat: 53.422, lng: -6.255,
    q: "Circle K Dublin Airport, Collinstown Road, Swords, K67 N4C8, Ireland",
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
    zh: "金塞尔加油 → Portlaoise 厕所 → 邓多克午餐／送容 → Clayton 机场酒店 → 还车",
    en: "Kinsale fuel → Portlaoise toilet → Dundalk lunch and Rong → Clayton Airport Hotel → Alamo return",
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
        zh: "Airbnb 吃早餐、打包行李。虽然 11:00 才是最晚退房，今天要在邓多克约 15:00 吃午餐并在 20:00 前还车，建议 09:30 出发。",
        en: "Breakfast at the Airbnb and pack. Although checkout is by 11:00, leave at 09:30 to reach Dundalk for a ~15:00 lunch and return the rental before 20:00.",
      },
    },
    {
      t: "09:30",
      text: {
        zh: "七人带行李退房。约 09:40 去金塞尔 Eastern Road 的 Top Oil 加油，周四 07:00–21:00 营业。核对正确油种。",
        en: "All seven check out with luggage. Refuel around 09:40 at Top Oil on Eastern Road (Thursday 07:00–21:00). Check the vehicle's fuel type.",
      },
      place: "topoilkinsale",
    },
    {
      t: "10:00",
      text: {
        zh: "离开金塞尔，沿 M8 → M7 开往 Portlaoise Plaza，约 2 小时；今天没有观光停站。",
        en: "Leave Kinsale via M8 → M7 for Portlaoise Plaza (~2 hours). No sightseeing stops today.",
      },
    },
    {
      t: "12:00",
      text: {
        zh: "Portlaoise Plaza（M7 17 号出口）只作厕所休息，免费停车，预留 15–20 分钟。不要在这里吃午餐。",
        en: "Portlaoise Plaza (M7 Junction 17): toilets only, with free parking. Allow 15–20 minutes; do NOT stop here for lunch.",
      },
      place: "portlaoiseplaza",
    },
    {
      t: "12:20",
      text: {
        zh: "继续沿 M7 → M50 → M1 直接开往邓多克。路程约 2 小时，但都柏林一带可能塞车。",
        en: "Drive directly to Dundalk via M7 → M50 → M1 (~2 hours, with possible Dublin/M50 traffic).",
      },
    },
    {
      t: "14:45",
      text: {
        zh: "目标约 15:00 到邓多克吃迟午餐，七人约 45–60 分钟。首选 Fairways Hotel 的 The Brasserie（午餐供应至 17:00，电话 +353 42 934 3910），下方可选其他邓多克餐厅。",
        en: "Aim to reach Dundalk around 15:00 for a 45–60-minute late lunch for seven. Recommended: The Brasserie at Fairways Hotel (lunch served until 17:00; +353 42 934 3910). Other Dundalk choices below.",
      },
      place: "fairwaysdundalk",
    },
    {
      t: "16:00",
      text: {
        zh: "在 37 Rockfield Court, Hoey's Lane, Dundalk, A91 Y7N6 送容、卸行李约 15–20 分钟；剩下六人继续。",
        en: "Drop Rong at 37 Rockfield Court, Hoey's Lane, Dundalk, A91 Y7N6 and unload (~15–20 minutes). The other six continue.",
      },
      place: "rong",
    },
    {
      t: "16:20",
      text: {
        zh: "从邓多克开往 Stockhole Lane 的 Clayton Hotel Dublin Airport，约 50–70 分钟。不是机场航站楼旁的其他 Clayton 酒店。",
        en: "Drive from Dundalk to Clayton Hotel Dublin Airport on Stockhole Lane (~50–70 minutes). Check the exact hotel name and address.",
      },
    },
    {
      t: "17:20",
      text: {
        zh: "六人入住（15:00 起可入住）并卸下全部行李。九座车留意酒店地下车库限高 2 米，不确定就询问露天停车。",
        en: "Check six guests into Clayton (check-in from 15:00) and unload all bags. The underground parking has a 2 m height limit; ask for surface parking if the 9-seater is too tall.",
      },
    },
    {
      t: "18:15",
      text: {
        zh: "司机（可带一人）出发还车。在 Circle K Dublin Airport、Collinstown Road 补油至租车合同规定的油位；保存油票和油表照片。",
        en: "Driver (optionally with one companion) heads to the car return. Top up at Circle K Dublin Airport, Collinstown Road, to the fuel level required by the rental contract; keep the receipt and fuel-gauge photo.",
      },
      place: "circlekairport",
    },
    {
      t: "18:45",
      text: {
        zh: "去 Alamo Dublin Airport Eastlands Car Hire Facility，K67 V5X0 交车；力争 19:00 前完成，合同最迟 20:00。拍车身、里程与油表，索取回执。",
        en: "Return the car at Alamo Dublin Airport Eastlands Car Hire Facility, K67 V5X0. Aim to finish before 19:00, safely ahead of the 20:00 deadline. Photograph the vehicle, mileage and gauge; request a return receipt.",
      },
      place: "alamoeastlands",
    },
    {
      t: "19:15",
      text: {
        zh: "听从 Alamo 工作人员指示坐接驳车到机场航站楼，再到 Zone 16 坐 Clayton 免费巴士回酒店（24 小时运行、约每 25 分钟一班）。",
        en: "Follow Alamo staff's directions to the terminal shuttle, then use Clayton's free hotel bus at airport Zone 16 (24/7, roughly every 25 minutes).",
      },
    },
    {
      t: "20:00",
      text: {
        zh: "六人晚餐（下方保留六个选择）。最方便是酒店内的 The Playwright Bar 或 The Italian Kitchen，其他餐厅建议搭的士。",
        en: "Dinner for six (six options below). Easiest: The Playwright Bar or The Italian Kitchen inside Clayton. Take a taxi for the other restaurants.",
      },
    },
    {
      t: "21:00",
      text: {
        zh: "休息并整理 11 月 6 日一早航班的行李，确认 T1/T2、机场巴士与集合时间。",
        en: "Rest and pack for early flights on Nov 6. Confirm T1/T2, the airport shuttle, and the morning departure time.",
      },
    },
  ],
  lunchOptions: [
    {
      name: "The Brasserie · Fairways Hotel (recommended)",
      food: { zh: "首选：从南面进入邓多克顺路，午餐 12:30–17:00；适合七人坐下来吃，请先致电 +353 42 934 3910", en: "RECOMMENDED: convenient on the southern approach to Dundalk; lunch 12:30–17:00. Book ahead for seven: +353 42 934 3910" },
      query: "The Brasserie, Fairways Hotel, Dublin Road, Haggardstown, Dundalk, A91 E6KC, Ireland",
    },
    {
      name: "The Lisdoo Bar & Restaurant",
      food: { zh: "传统爱尔兰餐厅，15:00 后有酒吧餐；位于邓多克北侧，前往之前请确认营业与七人座位", en: "Traditional Irish pub/restaurant with bar food from around 15:00; north of town, so check the table availability for seven" },
      query: "The Lisdoo Bar & Restaurant, Newry Road, Dundalk, Co. Louth, Ireland",
    },
    {
      name: "Rocksalt Café Dundalk",
      food: { zh: "市中心三明治、沙拉与咖啡；15:00 较迟，出发前请先确认厨房还在供应午餐", en: "Town-centre sandwiches, salads and coffee; 15:00 is late for a café, so check whether the kitchen is still serving" },
      query: "Rocksalt Café, 3 Earl Street, Dundalk, Co. Louth, Ireland",
    },
    {
      name: "Atami Japanese Restaurant",
      food: { zh: "日式寿司、拉面与热食；适合想吃亚洲菜的人，确认周四下午是否持续供餐", en: "Japanese sushi, ramen and hot dishes; Asian-food alternative. Confirm Thursday afternoon kitchen hours" },
      query: "Atami Japanese Restaurant, Dundalk, Co. Louth, Ireland",
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
      zh: "今日仅在 Portlaoise Plaza 上厕所，不在 Portlaoise 吃午餐；约 15:00 在邓多克吃。为保证 20:00 前还车，09:30 从金塞尔离开较稳妥。",
      en: "Portlaoise Plaza is a TOILET-ONLY break. Lunch is in Dundalk around 15:00. Leave Kinsale by 09:30 for a buffer before the 20:00 rental return deadline.",
    },
    {
      zh: "Google 地图全日路线默认经过 Fairways Hotel 午餐，再去容的住处。若选了其他午餐餐厅，请使用该餐厅独立地图按钮，并在自选站点路线中取消 Fairways。",
      en: "The full-day Google Maps route includes Fairways Hotel for lunch before Rong's home. If choosing another restaurant, use that restaurant's Map button and untick Fairways in the stop picker.",
    },
    {
      zh: "下午从 Portlaoise 走 M7 → M50 → M1 可能塞车；预计到达时间晚于 15:00 时通知餐厅。不要加观光停站。",
      en: "M7 → M50 → M1 traffic can delay your ~15:00 Dundalk arrival. Alert your chosen lunch venue if delayed, and skip extra sightseeing.",
    },
    {
      zh: "Alamo 还车地址 Dublin Airport EASTLANDS Car Hire Facility，K67 V5X0，不是 T1/T2。建议 19:00 前办妥，合同截止 20:00。",
      en: "Alamo return is at Dublin Airport EASTLANDS Car Hire Facility, K67 V5X0, not T1/T2. Aim to finish before 19:00; the contract's deadline is 20:00.",
    },
    {
      zh: "出发前在金塞尔 Top Oil 加一次油；还车前在机场旁 Circle K 再补至合同要求的油位，保留油票、里程、油表和车身照片。",
      en: "Fuel up first at Top Oil Kinsale, then top up to your contract's required level at Circle K near Dublin Airport before returning. Keep the receipt and vehicle photos.",
    },
    {
      zh: "九座车可能接近 2 米，Clayton 地下停车场限高 2 米。先卸六人的行李，若车高不确定请询问露天停车。酒店内吃饭最省事。",
      en: "The 9-seater may be close to 2 m; Clayton's underground parking has a 2 m limit. Unload all six guests' bags and ask for surface parking if needed. On-site dinner is easiest.",
    },
  ],
  // Car-driving legs only. Returning to the hotel after Alamo uses airport and hotel shuttles, not the rental car.
  stops: ["@kinsale", "topoilkinsale", "portlaoiseplaza", "fairwaysdundalk", "rong", "@clayton", "circlekairport", "alamoeastlands"],
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
