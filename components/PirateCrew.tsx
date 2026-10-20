"use client";

import { people } from "@/lib/trip";
import { eventText, type Event } from "@/lib/pirate";
import { Avatar, useApp } from "./common";

export default function PirateCrew({ board, events, me, showTitle = false }: {
  board: { id: string; gold: number; leader: boolean }[]; events: Event[]; me: string | null; showTitle?: boolean;
}) {
  const { t, p, lang } = useApp();
  const name = (id: string) => { const person = people.find((x) => x.id === id); return person ? p(person) : id; };
  const contested = board.some((x) => x.gold !== board[0]?.gold);
  return <div className="pirate-crew-content">
    {showTitle && <h3 className="pirate-ranking-title">🏆 {t("leaderboard")}</h3>}
    <div className="pirate-ranking">{board.map((x, i) => {
      const person = people.find((p) => p.id === x.id);
      return <div key={x.id} className={x.id === me ? "is-me" : ""}><span>{i === 0 && contested ? "👑" : i + 1}</span>{person && <Avatar person={person} size={37} />}<strong>{name(x.id)}{x.id === me && <small>{lang === "zh" ? "你" : "YOU"}</small>}</strong><b>{x.gold.toLocaleString()} <small>🪙</small></b></div>;
    })}</div>
    <h3 className="pirate-feed-title">📣 {lang === "zh" ? "最新动态" : "Latest news"}</h3>
    <ul className="pirate-feed">{events.length ? events.map((e) => <li key={e.id}><time>{e.day.slice(5).replace("-", "/")}</time><span>{p(eventText(e, name))}</span></li>) : <li>{lang === "zh" ? "暂无动态，家人的最新消息会显示在这里。" : "No news yet. Your family's latest updates will appear here."}</li>}</ul>
  </div>;
}
