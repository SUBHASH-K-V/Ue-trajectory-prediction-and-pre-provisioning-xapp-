import React from "react";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  id: string;
  title: string;
  value: string | number;
  subValue?: string;
  icon: LucideIcon;
  colorClass: string; // styles
  borderHoverClass: string; // styles
}

export default function MetricCard({
  id,
  title,
  value,
  subValue,
  icon: Icon,
  colorClass,
  borderHoverClass,
}: MetricCardProps) {
  const isConfidenceStyle = id === "kpi-avg-latency";

  if (isConfidenceStyle) {
    return (
      <div
        id={id}
        className="relative bg-emerald-500 text-zinc-950 border-2 border-emerald-400 p-5 rounded-none flex items-center justify-between shadow-lg"
      >
        <div className="flex flex-col space-y-1">
          <span className="text-[10px] uppercase font-black tracking-widest text-zinc-950 opacity-90 font-mono">
            {title}
          </span>
          <div className="flex items-baseline space-x-1">
            <span className="text-4xl font-black font-sans leading-none tracking-tighter">
              {value}
            </span>
            {subValue && (
              <span className="text-[10px] font-black uppercase tracking-tight text-zinc-900 ml-1">
                {subValue}
              </span>
            )}
          </div>
        </div>
        <div className="p-2 bg-zinc-950 bg-opacity-10 rounded-none shrink-0 text-zinc-950">
          <Icon className="w-6 h-6 stroke-3" />
        </div>
      </div>
    );
  }

  return (
    <div
      id={id}
      className="relative bg-zinc-900 border-2 border-zinc-800 rounded-none p-5 hover:bg-zinc-800/80 hover:border-zinc-600 transition-all duration-300 shadow-md flex items-center justify-between"
    >
      <div className="flex flex-col space-y-1">
        <span className="text-[10px] uppercase text-zinc-500 font-mono tracking-widest font-bold">
          {title}
        </span>
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-black font-sans tracking-tight text-white uppercase italic">
            {value}
          </span>
          {subValue && (
            <span className="text-[9px] font-mono tracking-wider font-semibold text-zinc-400 uppercase">
              {subValue}
            </span>
          )}
        </div>
      </div>
      <div className="p-2.5 rounded-none border border-zinc-800 bg-zinc-950/40 text-zinc-300 shrink-0">
        <Icon className="w-5 h-5 stroke-2" />
      </div>
    </div>
  );
}

