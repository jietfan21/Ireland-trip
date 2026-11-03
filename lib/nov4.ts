// November 4 itinerary overlay: Kinsale → Cobh → Cork, with driving parking stops.
// Keep named Google Maps queries for navigation and selectable lunch alternatives.
import { days, places, stays, type Day, type Place } from "./trip";

const nov4Places: Record<string, Place> = {
  kinsalecentre: {
    zh: "金塞尔彩色街道与港口（步行）",
    en: "Kinsale colourful streets & harbour (walk)",
    lat: 51.7050, lng: -8.5219,
    q: "Market Square, Kinsale, County Cork, Ireland",
  },
  cobhcathedralparking: {
    zh: "科夫大教堂停车场（收费）",
    en: "Cobh Cathedral Car Park (paid)",
    lat: 51.8516, lng: -8.2960,
    q: "Parking People Cobh Cathedral Car Park, Cathedral Place, Cobh, County Cork, Ireland",
  },
  deckofcards: {
    zh: "科夫彩虹房子 · Deck of Cards（免费）",
    en: "Cobh rainbow houses · Deck of Cards (free)",
    lat: 51.8507, lng: -8.2985,
    q: "West View Park, West View, Cobh, County Cork, Ireland",
  },
  colmans: {
    zh: "圣科尔曼大教堂",
    en: "St Colman's Cathedral",
    lat: 51.8512, lng: -8.2952,
    q: "St Colman's Cathedral, Cathedral Place, Cobh, County Cork, Ireland",
  },
  cobhpromenade: {
    zh: "科夫海滨长廊（可选）",
    en: "Cobh Promenade (optional)",
    lat: 51.8484, lng: -8.2981,
    q: "Kennedy Park, Cobh Promenade, Cobh, County Cork, Ireland",
  },
  corknorthmainparking: {
    zh: "科克 North Main Street 停车场",
    en: "North Main Street Car Park, Cork",
    lat: 51.8981, lng: -8.4806,
    q: "North Main Street Car Park, Cork City, Ireland",
  },
  elizabethfort: {
    zh: "伊丽莎白堡（免费）",
    en: "Elizabeth Fort (free)",
    lat: 51.8941, lng: -8.4798,
    q: "Elizabeth Fort, Barrack Street, Cork City, T12 C8A0, Ireland",
  },
};

const nov4: Day = {
  n: 11,
  date: "2026-11-04",
  color: "#2563eb",
  title: { zh: "金塞尔 + 科夫彩虹屋 + 科克", en: "Kinsale + Cobh rainbow houses + Cork" },
  route: { zh: "金塞尔 → 科夫 → 科克市中心 → 金塞尔", en: "Kinsale → Cobh → Cork City → Kinsale" },
  drive: { zh: "约 2–2.5 小时车程（不包括停车、步行和午餐）", en: "~2–2.5 h driving, excluding parking, walks and lunch" },
  currency: "EUR",
  stay: "kinsale",
  sunAt: [51.71, -8.52],
  steps: [
    {
      t: "09:00",
      text: {
        zh: "在 Meadowlands Airbnb 吃早餐；今天午餐在外吃、晚餐回 Airbnb 自煮，无须再采购。",
        en: "Breakfast at Meadowlands Airbnb. Lunch out in Cork, dinner cooked back at home; no grocery stop needed.",
      },
    },
    {
      t: "09:45",
      text: {
        zh: "从 Airbnb 步行逛金塞尔彩色主街、Market Square 和港口，约 45 分钟；若不方便步行，可看 Church Square 免费停车位与现场告示。",
        en: "Walk from Airbnb around colourful Kinsale town, Market Square and harbour (~45 min). If walking is unsuitable, try Church Square free parking and check the posted signs.",
      },
      place: "kinsalecentre",
    },
    {
      t: "10:30",
      text: {
        zh: "回 Airbnb 取车，约 10:45 出发往科夫（预计 50–60 分钟）。",
        en: "Return to Airbnb for the car, then leave around 10:45 for Cobh (~50–60 min).",
      },
    },
    {
      t: "11:40",
      text: {
        zh: "停科夫 Cathedral Car Park（收费、靠近景点）；想省钱可选 Five Foot Way 免费停车，但走路较远而且上坡。",
        en: "Park at Cobh Cathedral Car Park (paid, closest to sights). Five Foot Way is a free alternative with a longer uphill walk.",
      },
      place: "cobhcathedralparking",
    },
    {
      t: "11:50",
      text: {
        zh: "必看：West View 彩虹房子 Deck of Cards！在 West View Park 从安全位置拍照，约 20–25 分钟；请勿停在狭窄民宅路旁。",
        en: "Must-see Deck of Cards rainbow houses! Photograph from West View Park (~20–25 min); avoid parking on the narrow residential street.",
      },
      place: "deckofcards",
    },
    {
      t: "12:15",
      text: {
        zh: "圣科尔曼大教堂：欣赏哥德式建筑与海港景观，约 20 分钟。",
        en: "St Colman's Cathedral: admire the Gothic architecture and harbour views (~20 min).",
      },
      place: "colmans",
    },
    {
      t: "12:35",
      text: {
        zh: "如果时间充裕，可短逛 Kennedy Park 海滨长廊；最迟约 12:45 开往科克（30–40 分钟）。",
        en: "If on schedule, take a quick look at Kennedy Park's promenade; leave for Cork by about 12:45 (~30–40 min).",
      },
      place: "cobhpromenade",
    },
    {
      t: "13:20",
      text: {
        zh: "科克市中心 North Main Street 停车场：2 小时 €5.50、3 小时 €8；限高 2 米！九座车请先确认实际车高，太高切勿驶入。",
        en: "Park at Cork's North Main Street Car Park: €5.50 up to 2 h or €8 up to 3 h. HEIGHT LIMIT 2 m — check your 9-seater's actual height before entry.",
      },
      place: "corknorthmainparking",
    },
    {
      t: "13:30",
      text: {
        zh: "科克吃午餐（下方可选四家）并逛英国市场；建议先帮七人订位。英国市场免费入场。",
        en: "Lunch in Cork (choose one of four places below) and browse the English Market. Book ahead for seven; market entry is free.",
      },
      place: "market",
    },
    {
      t: "14:30",
      text: {
        zh: "步行逛 Oliver Plunkett Street 与市区商店；有时间再走去免费伊丽莎白堡。",
        en: "Walk along Oliver Plunkett Street and the city-centre shops; visit free Elizabeth Fort if time allows.",
      },
    },
    {
      t: "15:00",
      text: {
        zh: "伊丽莎白堡免费参观（周三开放至 17:00），约 20–30 分钟。如果午餐较晚，就跳过这里。",
        en: "Elizabeth Fort: free visit (~20–30 min; open Wednesday until 17:00). Skip if lunch ran late.",
      },
      place: "elizabethfort",
    },
    {
      t: "15:45",
      text: {
        zh: "取车回金塞尔，预计 40–60 分钟，避开天黑及交通尖峰。",
        en: "Collect the car and drive back to Kinsale (~40–60 min), ideally ahead of dark and peak traffic.",
      },
    },
    {
      t: "17:00",
      text: {
        zh: "回 Meadowlands Airbnb 休息并准备七人自煮晚餐；到家时间视车流而定。",
        en: "Back at Meadowlands Airbnb to rest and cook dinner for seven; arrival depends on traffic.",
      },
    },
  ],
  lunchOptions: [
    {
      name: "Koto Cork",
      food: { zh: "亚洲街头美食、饭面与咖喱；适合七人，建议先订位", en: "Asian street food, noodles, rice and curries; good for seven, reserve ahead" },
      query: "Koto, 6-7 Carey's Lane, Cork, T12 FH27, Ireland",
    },
    {
      name: "Market Lane",
      food: { zh: "爱尔兰和欧式菜、鱼与海鲜；可坐下吃正餐，建议先订位", en: "Modern Irish/European, fish and seafood; proper sit-down lunch, book ahead" },
      query: "Market Lane, 5-6 Oliver Plunkett Street, Cork, T12 T959, Ireland",
    },
    {
      name: "Farmgate Café",
      food: { zh: "英国市场楼上的传统爱尔兰午餐；周三 12:30 起供应午餐", en: "Traditional Irish lunch upstairs at the English Market; Wednesday lunch from 12:30" },
      query: "Farmgate Café, English Market, Princes Street, Cork, Ireland",
    },
    {
      name: "English Market food stalls",
      food: { zh: "快买三明治和熟食，各自选喜爱的食物；七人可能不容易一起坐", en: "Quick sandwiches and market food; flexible but group seating can be limited" },
      query: "English Market, Princes Street, Cork City, Ireland",
    },
  ],
  tips: [
    {
      zh: "停车路线只包含需开车到的停车场：Airbnb → Cobh Cathedral Car Park → Cork North Main Street Car Park → Airbnb；彩虹屋和科克景点请停车后步行。",
      en: "The driving route uses car parks only: Airbnb → Cobh Cathedral Car Park → Cork North Main Street Car Park → Airbnb. Walk to the rainbow houses and Cork sights after parking.",
    },
    {
      zh: "九座 Ford Tourneo 或类似车型可能接近 2 米，科克停车场有限高；进场前核对车高及车顶设备。若不合适，请寻找合法露天停车位，不要硬闯。",
      en: "Your 9-seat Tourneo or similar may be close to 2 m high. Check the exact height and roof equipment before using Cork's multi-storey; use legal open-air parking if it does not fit.",
    },
    {
      zh: "11 月 4 日日落约 17:00。科夫街道较陡，穿防滑鞋；景点基本免费，停车和午餐另计。",
      en: "Sunset is around 17:00 on Nov 4. Cobh streets are steep: wear grippy shoes. Main sightseeing is free; parking and food are extra.",
    },
    {
      zh: "如果七人午餐超时，优先保留科夫彩虹屋、大教堂及科克英国市场，先跳过海滨长廊与伊丽莎白堡。",
      en: "If lunch takes longer, prioritise the Cobh rainbow houses, cathedral and Cork English Market; skip the promenade or Elizabeth Fort first.",
    },
  ],
  // The route is for driving: park once in each town, then navigate to pedestrian sights using their Map links.
  stops: ["@kinsale", "cobhcathedralparking", "corknorthmainparking", "@kinsale"],
};

Object.assign(places, nov4Places);
const stay = stays.find((s) => s.id === "kinsale");
if (stay) {
  stay.address = "9 Meadowlands, Troopers Close, Kinsale, Co. Cork, Ireland";
  stay.notes = stay.notes.map((note) =>
    note.en === "3 min walk to town"
      ? { zh: "步行到镇中心约 10–15 分钟；以手机地图实际路线为准。", en: "Approx. 10–15 min walk to town; check the door-to-door route on your phone." }
      : note
  );
}
const index = days.findIndex((day) => day.date === nov4.date);
if (index >= 0) days[index] = nov4;
