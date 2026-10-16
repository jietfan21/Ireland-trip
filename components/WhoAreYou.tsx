"use client";

import { people, type Person } from "@/lib/trip";
import { Avatar, useApp } from "./common";

export default function WhoAreYou({ onPick, onLang }: { onPick: (p: Person) => void; onLang: () => void }) {
  const { t, lang } = useApp();
  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-cream px-5 pt-safe">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <div className="flex justify-end pt-4">
          <button onClick={onLang} className="rounded-full border border-line bg-card px-4 py-2 text-[15px] font-bold">
            {lang === "zh" ? "EN" : "中文"}
          </button>
        </div>
        <div className="mt-6 text-center">
          <div className="text-6xl">☘️</div>
          <h1 className="mt-3 text-[30px] font-bold">{lang === "zh" ? "爱尔兰之旅" : "Ireland Trip"}</h1>
          <p className="mt-1 text-[16px] text-sub">10/25 – 11/6 · 2026</p>
          <h2 className="mt-8 text-[22px] font-bold">{t("whoAreYou")}</h2>
          <p className="text-[16px] text-sub">{t("whoHint")}</p>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 pb-8">
          {people.map((p) => (
            <button
              key={p.id}
              onClick={() => onPick(p)}
              className="flex items-center gap-3 rounded-3xl border border-line bg-card p-3 text-left active:scale-[.97]"
            >
              <Avatar person={p} size={52} />
              <span>
                <span className="block text-[20px] font-bold leading-tight">{p.zh}</span>
                <span className="block text-[14px] text-sub">{p.en}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
