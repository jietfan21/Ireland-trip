import type { L } from "./trip";

export type Lang = "zh" | "en";

export const ui = {
  today: { zh: "今天", en: "Today" },
  trip: { zh: "行程", en: "Trip" },
  map: { zh: "地图", en: "Map" },
  info: { zh: "资料", en: "Info" },
  tools: { zh: "工具", en: "Tools" },
  day: { zh: "第 {n} 天", en: "Day {n}" },
  dayZero: { zh: "出发日", en: "Travel day" },
  dayHome: { zh: "回家", en: "Home" },
  countdown: { zh: "还有 {n} 天出发！", en: "{n} days to go!" },
  tomorrow: { zh: "明天出发！", en: "We leave tomorrow!" },
  tripOver: { zh: "旅程结束，谢谢一起走过的每一天 ❤️", en: "Trip complete — thank you for every day together ❤️" },
  previewing: { zh: "预览", en: "Preview" },
  backToday: { zh: "回到今天", en: "Back to today" },
  tonight: { zh: "今晚住", en: "Tonight" },
  navigate: { zh: "导航", en: "Navigate" },
  call: { zh: "打电话", en: "Call" },
  checkIn: { zh: "入住", en: "Check-in" },
  checkOut: { zh: "退房", en: "Check-out" },
  drive: { zh: "车程", en: "Drive" },
  money: { zh: "今天用", en: "Money" },
  sunset: { zh: "日落", en: "Sunset" },
  sunrise: { zh: "日出", en: "Sunrise" },
  weather: { zh: "天气", en: "Weather" },
  plan: { zh: "今天的安排", en: "Today's plan" },
  tips: { zh: "小提醒", en: "Tips" },
  eve: { zh: "晚上", en: "Eve" },
  approxPin: { zh: "地图位置是大约的，导航会用地址", en: "Pin is approximate — navigation uses the address" },
  whoAreYou: { zh: "你是谁？", en: "Who are you?" },
  whoHint: { zh: "点一下你的名字（只需一次）", en: "Tap your name (just once)" },
  hi: { zh: "你好，{name}", en: "Hi, {name}" },
  change: { zh: "换人", en: "Switch" },
  stays: { zh: "住宿", en: "Stays" },
  flights: { zh: "航班", en: "Flights" },
  car: { zh: "租车", en: "Car" },
  sos: { zh: "紧急", en: "Emergency" },
  nights: { zh: "{n} 晚", en: "{n} night(s)" },
  currency: { zh: "汇率换算", en: "Currency" },
  checklist: { zh: "清单", en: "Checklist" },
  rateLive: { zh: "今日汇率", en: "Today's rate" },
  rateOffline: { zh: "离线估算汇率", en: "Offline estimate" },
  everyone: { zh: "全家进度", en: "Family progress" },
  mine: { zh: "我的", en: "Mine" },
  synced: { zh: "已同步给全家", en: "Shared with family" },
  localOnly: { zh: "只存在这部手机", en: "Saved on this phone only" },
  allDays: { zh: "全部行程", en: "All days" },
  open: { zh: "打开", en: "Open" },
  pickDay: { zh: "选一天", en: "Pick a day" },
  whole: { zh: "全程", en: "Whole trip" },
  satellite: { zh: "卫星", en: "Satellite" },
  flyThrough: { zh: "飞览", en: "Fly through" },
  straightLines: { zh: "联网后显示真实道路", en: "Real roads load when online" },
  locate: { zh: "我在哪", en: "Where am I" },
  driverOnly: { zh: "司机", en: "Drivers" },
  pending: { zh: "待确认", en: "To confirm" },
  firstTime: { zh: "加到主屏幕：Safari 点分享 → 添加到主屏幕", en: "Add to Home Screen: Safari Share → Add to Home Screen" },
} satisfies Record<string, L>;

export type UiKey = keyof typeof ui;

export function tr(lang: Lang, key: UiKey, vars?: Record<string, string | number>) {
  let s: string = ui[key][lang];
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
  return s;
}

export function pick(lang: Lang, l: L) {
  return l[lang];
}
