// November 3 itinerary overlay. Kept separate so the large trip data file is untouched.
import { days, places, type Day, type Place } from "./trip";

const nov3Places: Record<string, Place> = {
  inchbeach: { zh: "英奇海滩（免费）", en: "Inch Beach (free)", lat: 52.1422, lng: -9.9819, q: "Inch Beach, Inch, County Kerry, Ireland" },
  rosscastle: { zh: "罗斯城堡（外观免费）", en: "Ross Castle (free exterior)", lat: 52.04125, lng: -9.53144, q: "Ross Castle, Ross Island, Killarney, County Kerry, Ireland" },
  muckrossabbey: { zh: "穆克罗斯修道院（免费）", en: "Muckross Abbey (free)", lat: 52.0261, lng: -9.4956, q: "Muckross Abbey, Killarney National Park, County Kerry, Ireland" },
  killarneyhouse: { zh: "基拉尼庄园花园（免费）", en: "Killarney House & Gardens (free)", lat: 52.0569, lng: -9.5046, q: "Killarney House and Gardens, Killarney, County Kerry, Ireland" },
  killarneyparking: { zh: "Beech Road 基拉尼停车场", en: "Beech Road Car Park (Killarney lunch)", lat: 52.0604, lng: -9.508, q: "Beech Road Car Park, Killarney, County Kerry, Ireland" },
  lidlkinsale: { zh: "Lidl 金塞尔超市", en: "Lidl Kinsale groceries", lat: 51.7093, lng: -8.5253, q: "Lidl, Barrack's Lane, Kinsale, County Cork, P17 DD35, Ireland" },
};

const nov3: Day = {
  n: 10, date: "2026-11-03", color: "#16a34a",
  title: { zh: "免费景点 · 基拉尼 → 金塞尔", en: "Free sights · Killarney → Kinsale" },
  route: { zh: "丁格尔 → 英奇海滩 → 罗斯城堡 → 穆克罗斯修道院 → 托克瀑布 → 基拉尼 → 金塞尔", en: "Dingle → Inch Beach → Ross Castle → Muckross Abbey → Torc Waterfall → Killarney → Kinsale" },
  drive: { zh: "约 3–3.5 小时车程（另加观光、午餐、采购）", en: "~3–3.5 h driving plus sightseeing, lunch and groceries" },
  currency: "EUR", stay: "kinsale", sunAt: [51.71, -8.52],
  steps: [
    { t: "09:00", text: { zh: "Airbnb 吃早餐和收拾行李；午餐在外吃，晚餐在新住处自煮", en: "Breakfast and pack at Airbnb; lunch out, cook dinner at the next Airbnb" } },
    { t: "10:00", text: { zh: "丁格尔 Airbnb 最晚 10:00 退房，不绕去利默里克", en: "Check out of Dingle Airbnb by 10:00; no Limerick detour" } },
    { t: "10:40", text: { zh: "英奇海滩：免费停车拍照，10–15 分钟", en: "Inch Beach: free parking and a 10–15 min photo stop" }, place: "inchbeach" },
    { t: "11:35", text: { zh: "罗斯城堡和湖畔：外观免费，约 20 分钟（不参加收费的室内导览）", en: "Ross Castle: free exterior and lakeside, ~20 min; skip the paid indoor tour" }, place: "rosscastle" },
    { t: "12:10", text: { zh: "穆克罗斯修道院：免费古老石造遗址和回廊，短步行约 25 分钟", en: "Muckross Abbey: free medieval ruins and cloisters, short walk, ~25 min" }, place: "muckrossabbey" },
    { t: "12:45", text: { zh: "托克瀑布：免费森林短步道及拍照，约 25 分钟，小心湿滑", en: "Torc Waterfall: free short woodland walk, ~25 min; watch for slippery paths" }, place: "torc" },
    { t: "13:25", text: { zh: "基拉尼庄园花园：免费散步 10–15 分钟；若晚点可跳过", en: "Killarney House & Gardens: free 10–15 min stroll; skip if behind schedule" }, place: "killarneyhouse" },
    { t: "13:45", text: { zh: "Beech Road 停车，基拉尼市中心午餐；七人从下方选一家，建议先订位", en: "Park at Beech Road for Killarney lunch. Pick a restaurant below for seven; call ahead" }, place: "killarneyparking" },
    { t: "14:35", text: { zh: "开往金塞尔（约 1 小时 40 分至 2 小时），避开科克市中心", en: "Drive to Kinsale (~1 h 40 min–2 h); avoid Cork city centre" } },
    { t: "16:20", text: { zh: "Lidl 金塞尔买晚餐和早餐食材，预留约 30 分钟", en: "Lidl Kinsale: buy dinner and breakfast groceries, allow ~30 min" }, place: "lidlkinsale" },
    { t: "17:00", text: { zh: "入住 Meadowlands 9（15:00 起可入住），卸下行李休息", en: "Check in at Meadowlands 9 (available from 15:00); unload and rest" } },
    { t: "18:30", text: { zh: "在 Airbnb 自煮七人晚餐", en: "Cook dinner for seven at Airbnb" } },
  ],
  lunchOptions: [
    { name: "The Laurels Pub & Restaurant", food: { zh: "爱尔兰酒馆餐点、炖菜和炸鱼薯条，周二 12:30 起", en: "Irish pub food and fish & chips; Tuesday from 12:30" }, query: "The Laurels Pub & Restaurant, Main Street, Killarney, County Kerry, Ireland" },
    { name: "Quinlan's Seafood Bar", food: { zh: "新鲜鱼、炸鱼薯条和海鲜，周二 12:30 起", en: "Fresh fish, seafood and fish & chips; Tuesday from 12:30" }, query: "Quinlan's Seafood Bar, 77 High Street, Killarney, County Kerry, Ireland" },
    { name: "Milano Killarney", food: { zh: "披萨和意大利餐点，周二 12:00 起", en: "Pizza and Italian dishes; Tuesday from 12:00" }, query: "Milano, 16 Main Street, Killarney, County Kerry, Ireland" },
    { name: "The Shire Café & Bar", food: { zh: "休闲咖啡馆午餐及披萨，请确认营业", en: "Casual café lunch and pizza; confirm opening" }, query: "The Shire Bar & Cafe, Michael Collins Place, Killarney, County Kerry, Ireland" },
    { name: "Murphy's Bar & Restaurant", food: { zh: "爱尔兰酒馆午餐，建议七人先订位", en: "Irish pub lunch; reserve for seven" }, query: "Murphy's Bar, 18 College Street, Killarney, County Kerry, Ireland" },
  ],
  tips: [
    { zh: "景点免费（罗斯城堡仅看外观）。市中心停车可能收费，请看标志。", en: "Sightseeing is free (Ross Castle exterior only). Town parking may cost extra." },
    { zh: "全日很充实，17:00 左右到 Airbnb 仅为估算；延误时取消花园或英奇海滩，保留 Lidl 和晚餐时间。", en: "A full day: ~17:00 arrival is an estimate. If delayed, untick the gardens or Inch Beach; protect Lidl and dinner time." },
    { zh: "用勾选框选择 Google 地图站点；若手机无法显示全部站点，可点分段导航。", en: "Use checkboxes to select Google Maps stops. If your phone omits stops, open the route in parts." },
  ],
  stops: ["@dingle", "inchbeach", "rosscastle", "muckrossabbey", "torc", "killarneyhouse", "killarneyparking", "lidlkinsale", "@kinsale"],
};

Object.assign(places, nov3Places);
const index = days.findIndex((day) => day.date === nov3.date);
if (index >= 0) days[index] = nov3;
