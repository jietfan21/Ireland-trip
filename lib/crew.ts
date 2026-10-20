// The stick-figure crew on the Today tab: who's around on each day, their lines, and heights.
// Type-only import from ./trip so `node --test lib/crew.test.ts` runs without a bundler.
import type { L } from "./trip";

export type CrewMember = {
  id: string; // matches people[].id
  height: number; // cm; the stick body scales by height / 180
  arrives: number; // first trip day they're with the group (everyone shows on day 0 and from day 13)
  lines: L[]; // what they say when tapped
};

export const crew: CrewMember[] = [
  {
    id: "dad",
    height: 180,
    arrives: 1,
    lines: [
      { zh: "靠左！靠左！", en: "Keep LEFT! Keep left!" },
      { zh: "信用卡在我这里，放心", en: "I've got the credit card, relax" },
      { zh: "前面有收费站，准备零钱", en: "Toll ahead — get some change ready" },
      { zh: "这个风景不拍可惜了", en: "This view deserves a photo" },
      { zh: "谁想开下一段？", en: "Who's driving the next bit?" },
    ],
  },
  {
    id: "mom",
    height: 160,
    arrives: 1,
    lines: [
      { zh: "外套带了吗？", en: "Did you bring your jacket?" },
      { zh: "吃饱了吗？要不要买点面包？", en: "Have you eaten? Shall we buy some bread?" },
      { zh: "围巾！爱尔兰的风很大", en: "Scarf! It's windy in Ireland" },
      { zh: "大家合照一张！", en: "Everyone, group photo!" },
      { zh: "慢慢开，不赶时间", en: "Drive slowly, we're not in a hurry" },
    ],
  },
  {
    id: "rong",
    height: 180,
    arrives: 1,
    lines: [
      { zh: "欢迎来我的爱尔兰！", en: "Welcome to my Ireland!" },
      { zh: "邓多克没什么好看的，但很温馨", en: "Not much to see in Dundalk, but it's cosy" },
      { zh: "这里的雨下五分钟就停", en: "Rain here stops after five minutes" },
      { zh: "我带你们去吃最好的炸鱼薯条", en: "I'll take you to the best fish and chips" },
      { zh: "你们走了我会想你们的", en: "I'll miss you all when you go" },
    ],
  },
  {
    id: "yao",
    height: 180,
    arrives: 1,
    lines: [
      { zh: "什么时候吃饭？", en: "When's lunch?" },
      { zh: "这个要打卡", en: "This one's going on the feed" },
      { zh: "我坐后排睡一下", en: "I'll nap in the back row" },
      { zh: "健力士啤酒走起", en: "Guinness time" },
      { zh: "万圣节服装我准备好了", en: "My Halloween costume is ready" },
    ],
  },
  {
    id: "jiet",
    height: 170,
    arrives: 1,
    lines: [
      { zh: "我做的 App，好用吗？", en: "I built this app — any good?" },
      { zh: "珀斯飞过来真远", en: "Perth is a long way away" },
      { zh: "转换头我带了三个", en: "I brought three plug adapters" },
      { zh: "地图已经离线下载好了", en: "Offline maps already downloaded" },
      { zh: "今晚住哪？我看看", en: "Where are we tonight? Let me check" },
    ],
  },
  {
    id: "ying",
    height: 160,
    arrives: 2,
    lines: [
      { zh: "我们从冰岛飞来的！", en: "We flew in from Iceland!" },
      { zh: "冰岛比这里冷多了", en: "Iceland was way colder than this" },
      { zh: "等等我，我拍个照", en: "Wait for me, one more photo" },
      { zh: "晚上有传统音乐吗？", en: "Any trad music tonight?" },
      { zh: "回台北要从 T2 走哦", en: "Home flight is from T2, remember" },
    ],
  },
  {
    id: "hui",
    height: 175,
    arrives: 2,
    lines: [
      { zh: "我可以开车，交给我", en: "I can drive, leave it to me" },
      { zh: "悬崖边别站太近！", en: "Don't stand too close to the cliff edge!" },
      { zh: "这个 B&B 早餐不错", en: "Nice breakfast at this place" },
      { zh: "我们晚上才到，别等太久", en: "We land in the evening, don't wait too long" },
      { zh: "走，去看巨人堤道", en: "Come on, Giant's Causeway" },
    ],
  },
];

export type Cast = { id: string; waving: boolean };

// Who's in the strip on trip day n (0 = travel day, 14 = home), per the design doc's table.
export function castForDay(n: number): Cast[] {
  if (n === 0 || n >= 13) return crew.map((m) => ({ id: m.id, waving: n >= 14 }));
  return crew.filter((m) => m.arrives <= n).map((m) => ({ id: m.id, waving: false }));
}

// Random index in [0, count) that isn't `last` (so a tap never repeats the previous line).
export function pickLine(count: number, last: number, rnd: () => number = Math.random): number {
  if (count <= 1) return 0;
  const k = Math.floor(rnd() * (count - 1));
  return k >= last ? k + 1 : k;
}

// One frame of walking. The target is clamped to the strip, so a figure whose target moved
// off-screen (rotate / resize) arrives at the edge instead of walking in place forever.
export function stepWalk(f: { x: number; target: number; speed: number; dir: 1 | -1 }, dt: number, maxX: number) {
  const target = Math.min(maxX, Math.max(0, f.target));
  const d = target - f.x;
  const step = f.speed * dt;
  if (Math.abs(d) <= step) return { x: target, dir: f.dir, arrived: true };
  return { x: f.x + Math.sign(d) * step, dir: (d < 0 ? -1 : 1) as 1 | -1, arrived: false };
}

// Centre x for a speech bubble (max 160px wide) so it never pokes past the strip's edges.
export function bubbleLeft(x: number, width: number, half = 80) {
  if (width <= half * 2) return width / 2;
  return Math.min(width - half, Math.max(half, x));
}

export type Toss = { x: number; y: number; vx: number; vy: number; angle: number; spin: number };
export type DragSample = { x: number; y: number; at: number };

// Only the last part of the gesture counts. Holding still before releasing is a drop.
export function releaseVelocity(samples: DragSample[], now: number) {
  const recent = samples.filter((s) => now - s.at <= 100);
  const first = recent[0], last = recent.at(-1);
  if (!first || !last || now - last.at > 80 || last.at - first.at < 8) return { vx: 0, vy: 0 };
  const seconds = (last.at - first.at) / 1000;
  const limit = (n: number) => Math.max(-850, Math.min(850, n));
  return { vx: limit((last.x - first.x) / seconds), vy: limit((last.y - first.y) / seconds) };
}

// Small, bounded steps keep bounces stable after a slow frame or a hidden tab.
// y is the height above the ground, so positive vy travels upwards.
export function stepToss(f: Toss, dt: number, maxX: number, maxY: number) {
  const t = Math.max(0, Math.min(dt, 0.032));
  let { vx, vy, spin } = f;
  let x = f.x + vx * t;
  let y = f.y + vy * t - 600 * t * t;
  vy -= 1200 * t;
  if (x < 0) { x = 0; vx = Math.abs(vx) * 0.62; spin *= -0.65; }
  if (x > maxX) { x = Math.max(0, maxX); vx = -Math.abs(vx) * 0.62; spin *= -0.65; }
  if (y > maxY) { y = Math.max(0, maxY); vy = -Math.abs(vy) * 0.4; }
  let landed = false;
  let bounced = false;
  if (y <= 0 && vy < 0) {
    y = 0;
    bounced = true;
    landed = Math.abs(vy) < 135;
    vy = landed ? 0 : Math.abs(vy) * 0.36;
    vx *= 0.6;
    spin *= 0.5;
  }
  return { x, y, vx, vy, spin, angle: f.angle + spin * t, landed, bounced };
}

