import React from "react";
import { CellTower, UE } from "../types";
import { TowerControl, Radio, Car, Navigation, Shield, Heart } from "lucide-react";

interface NetworkMapProps {
  cells: CellTower[];
  ues: UE[];
  selectedCellId: string | null;
  selectedUeId: string | null;
  onSelectCell: (id: string | null) => void;
  onSelectUe: (id: string | null) => void;
  preProvisioningEnabled: boolean;
}

export default function NetworkMap({
  cells,
  ues,
  selectedCellId,
  selectedUeId,
  onSelectCell,
  onSelectUe,
  preProvisioningEnabled,
}: NetworkMapProps) {
  // Dimension definitions matching coordinate system
  const width = 800;
  const height = 450;

  // Render stylized SVG routes
  const drawRoutes = () => {
    return (
      <g strokeWidth={3} strokeLinecap="round" fill="none">
        {/* Route 1: Automotive Highway (Cyan) */}
        <path
          d="M 20 220 Q 200 130 400 240 T 780 200"
          stroke="rgba(14, 116, 144, 0.4)"
          strokeDasharray="4,6"
        />
        {/* Route 2: Drone Quad path (Amber) */}
        <path
          d="M 120 120 L 520 80 L 320 340 Z"
          stroke="rgba(217, 119, 6, 0.3)"
          strokeDasharray="2,4"
        />
        {/* Route 3: High-Speed Rail (Indigo) */}
        <path
          d="M 40 410 L 760 60"
          stroke="rgba(79, 70, 229, 0.4)"
          strokeWidth={4}
          strokeDasharray="8,8"
        />
        {/* Route 4: Pedestrian Zone (Emerald) */}
        <path
          d="M 580 180 C 640 180, 680 120, 640 90 C 600 60, 540 120, 580 180 Z"
          stroke="rgba(5, 150, 105, 0.3)"
          strokeDasharray="3,3"
        />
      </g>
    );
  };

  const getUeColor = (category: string) => {
    switch (category) {
      case "URLLC":
        return "#ef4444"; // Vivid Red
      case "eMBB":
        return "#06b6d4"; // Vivid Cyan
      case "mMTC":
        return "#10b981"; // Vivid Emerald
      default:
        return "#94a3b8";
    }
  };

  return (
    <div className="relative w-full bg-zinc-950 border-2 border-zinc-800 rounded-none overflow-hidden shadow-lg p-5">
      {/* Topology Header */}
      <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-xs font-black font-mono text-white tracking-widest uppercase italic">
            O-RAN Radio Access Network // RIC SIMULATOR GRID
          </span>
        </div>
        <div className="flex space-x-4 text-[10px] font-mono text-zinc-400 tracking-wider uppercase">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded bg-red-500 inline-block animate-pulse" />
            <span>URLLC (Critical SLA)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded bg-cyan-400 inline-block" />
            <span>eMBB (Broadband)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded bg-emerald-400 inline-block" />
            <span>mMTC (Massive IoT)</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto max-h-[500px] select-none"
        id="RAN_grid_topography"
      >
        <defs>
          <radialGradient id="cell-gradient-3" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1e293b" stopOpacity="0.4" />
            <stop offset="85%" stopColor="#38bdf8" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.25" />
          </radialGradient>
          <radialGradient id="cell-gradient-active" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0f172a" stopOpacity="0.3" />
            <stop offset="85%" stopColor="#0284c7" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.5" />
          </radialGradient>
        </defs>

        {/* Map Background Grid Lines */}
        <g stroke="#1e293b" strokeWidth={0.5}>
          {Array.from({ length: 44 }).map((_, i) => (
            <line key={`lh-${i}`} x1={i * 20} y1={0} x2={i * 20} y2={height} />
          ))}
          {Array.from({ length: 25 }).map((_, i) => (
            <line key={`lv-${i}`} x1={0} y1={i * 20} x2={width} y2={i * 20} />
          ))}
        </g>

        {/* 1. Routes Draw */}
        {drawRoutes()}

        {/* 2. Cell Coverage Circles */}
        {cells.map((cell) => {
          const isSelected = selectedCellId === cell.id;
          const isCongested = cell.loadPercentage > 80;
          return (
            <g key={cell.id} className="cursor-pointer" onClick={() => onSelectCell(cell.id)}>
              {/* Coverage circle */}
              <circle
                cx={cell.x}
                cy={cell.y}
                r={cell.radius}
                fill={isSelected ? "url(#cell-gradient-active)" : "url(#cell-gradient-3)"}
                stroke={
                  isCongested
                    ? "rgba(239, 68, 68, 0.85)"
                    : isSelected
                    ? "rgba(6, 182, 212, 0.85)"
                    : "rgba(56, 189, 248, 0.4)"
                }
                strokeWidth={isSelected ? 3 : isCongested ? 2.5 : 1}
                strokeDasharray={isCongested ? "4,4" : "none"}
                className="transition-all duration-300"
              />
              {/* Radial signal coverage indicator */}
              <circle
                cx={cell.x}
                cy={cell.y}
                r={cell.radius * 0.4}
                fill="none"
                stroke="rgba(56, 189, 248, 0.05)"
                strokeWidth={1}
              />
            </g>
          );
        })}

        {/* 3. Pre-provisioning Active Linkages */}
        {preProvisioningEnabled &&
          ues.map((ue) => {
            return ue.preProvisionedAt.map((targetCellId) => {
              const targetCell = cells.find((c) => c.id === targetCellId);
              if (!targetCell) return null;
              
              // Draw glowing resource provision link to indicate the reserved path / cache tunnel
              const strokeColor = getUeColor(ue.sliceRequirement);
              return (
                <g key={`link-${ue.id}-${targetCellId}`}>
                  <line
                    x1={ue.x}
                    y1={ue.y}
                    x2={targetCell.x}
                    y2={targetCell.y}
                    stroke={strokeColor}
                    strokeWidth={2.5}
                    strokeDasharray="4,4"
                    opacity={0.7}
                    className="animate-[dash_2s_linear_infinite]"
                  />
                  {/* Glowing data packet travel animation */}
                  <circle r={4} fill={strokeColor} opacity={1}>
                    <animateMotion
                      dur="1.5s"
                      repeatCount="indefinite"
                      path={`M ${ue.x} ${ue.y} L ${targetCell.x} ${targetCell.y}`}
                    />
                  </circle>
                </g>
              );
            });
          })}

        {/* 4. Active Handover Lines (gNB to connected UE) */}
        {ues.map((ue) => {
          if (!ue.currentCellId) return null;
          const cell = cells.find((c) => c.id === ue.currentCellId);
          if (!cell) return null;
          return (
            <line
              key={`con-${ue.id}`}
              x1={cell.x}
              y1={cell.y}
              x2={ue.x}
              y2={ue.y}
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth={1}
              strokeDasharray="1,3"
            />
          );
        })}

        {/* 5. UE Trajectory Predictions (Dotted future lines & destination predictions) */}
        {ues.map((ue) => {
          const uSelected = selectedUeId === ue.id;
          if (ue.predictedPath && ue.predictedPath.length > 0) {
            const pointsStr = ue.predictedPath.map((p) => `${p.x},${p.y}`).join(" ");
            const strokeColor = getUeColor(ue.sliceRequirement);
            return (
              <g key={`traj-${ue.id}`}>
                {/* Predicted trajectory path vector */}
                <polyline
                  points={pointsStr}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={uSelected ? 2.5 : 1.5}
                  strokeDasharray="3,3"
                  opacity={uSelected ? 0.9 : 0.5}
                />
                {/* Marker at predicted future coordinate lookahead endpoint */}
                {ue.predictedPath.length > 0 && (
                  <circle
                    cx={ue.predictedPath[ue.predictedPath.length - 1].x}
                    cy={ue.predictedPath[ue.predictedPath.length - 1].y}
                    r={uSelected ? 5 : 3.5}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={1.5}
                  />
                )}
              </g>
            );
          }
          return null;
        })}

        {/* 6. Cell Tower Icons & Node Centers */}
        {cells.map((cell) => {
          const isSelected = selectedCellId === cell.id;
          const isCongested = cell.loadPercentage > 80;
          return (
            <g
              key={`tower-${cell.id}`}
              transform={`translate(${cell.x}, ${cell.y})`}
              className="cursor-pointer"
              onClick={() => onSelectCell(cell.id)}
            >
              {/* Outer halo */}
              <circle
                r={16}
                fill="#0f172a"
                stroke={
                  isCongested
                    ? "#ef4444"
                    : isSelected
                    ? "#06b6d4"
                    : "rgba(56, 189, 248, 0.6)"
                }
                strokeWidth={2}
              />
              {/* Load indicator ring */}
              <circle
                r={19}
                fill="none"
                stroke={isCongested ? "rgba(239, 68, 68, 0.3)" : "rgba(30, 41, 59, 0.8)"}
                strokeWidth={3}
              />
              <circle
                r={19}
                fill="none"
                stroke={isCongested ? "#ef4444" : "#10b981"}
                strokeWidth={3}
                strokeDasharray={`${2 * Math.PI * 19 * (cell.loadPercentage / 100)} 200`}
                transform="rotate(-90)"
              />
              {/* Tower Icon inside vector background */}
              <g transform="translate(-8, -8) scale(0.65)">
                <path
                  d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 15.14V21h-2v-3.86a3 3 0 1 1 2 0zm-1-5.14a1 1 0 1 0-1-1 1 1 0 0 0 1 1z"
                  fill={isCongested ? "#ef4444" : "#f8fafc"}
                />
              </g>
              {/* Label text */}
              <rect
                x={-37}
                y={22}
                width={74}
                height={14}
                rx={0}
                fill="rgba(9, 9, 11, 0.95)"
                stroke="#27272a"
                strokeWidth={1}
              />
              <text
                x={0}
                y={32}
                textAnchor="middle"
                fill="#f8fafc"
                fontSize={9}
                fontFamily="JetBrains Mono, monospace"
                className="font-semibold"
              >
                {cell.id} ({Math.round(cell.loadPercentage)}%)
              </text>
            </g>
          );
        })}

        {/* 7. moving UE markers */}
        {ues.map((ue) => {
          const color = getUeColor(ue.sliceRequirement);
          const isSelected = selectedUeId === ue.id;
          const size = isSelected ? 15 : 12;

          return (
            <g
              key={ue.id}
              className="cursor-pointer"
              onClick={() => onSelectUe(ue.id)}
            >
              {/* Selection pulse halo */}
              {isSelected && (
                <circle
                  cx={ue.x}
                  cy={ue.y}
                  r={size + 8}
                  fill="none"
                  stroke={color}
                  strokeWidth={1.5}
                  opacity={0.7}
                  className="animate-ping"
                />
              )}

              {/* Base vehicle pointer dot */}
              <circle
                cx={ue.x}
                cy={ue.y}
                r={size + 2}
                fill="#0f172a"
                stroke={color}
                strokeWidth={2}
              />

              {/* Inside node symbol */}
              <g transform={`translate(${ue.x - size / 2}, ${ue.y - size / 2}) scale(${size / 24})`}>
                {ue.type === "Car" && (
                  <path
                    d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 1 13v3c0 .6.4 1 1 1h2a3 3 0 0 0 6 0h4a3 3 0 0 0 6 0zM7 17a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm10 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"
                    fill={color}
                  />
                )}
                {ue.type === "Drone" && (
                  <path
                    d="M21 16V8l-9 4-9-4v8l9 4 9-4z M12 2l9 4-9 4-9-4 9-4z"
                    fill={color}
                  />
                )}
                {ue.type === "Train" && (
                  <path
                    d="M4 2v20h16V2H4zm8 16a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm4-8H8V6h8v4z"
                    fill={color}
                  />
                )}
                {ue.type === "Pedestrian" && (
                  <path
                    d="M12 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm1 19h-2v-6H9V9c0-1.1.9-2 2-2h2c1.1 0 2 .9 2 2v4h-2v6z"
                    fill={color}
                  />
                )}
              </g>

              {/* Little slice icon indicator on the shoulder */}
              {ue.sliceRequirement === "URLLC" && (
                <circle cx={ue.x + size} cy={ue.y - size} r={4.5} fill="#ef4444" stroke="#0f172a" strokeWidth={1} />
              )}
              {ue.sliceRequirement === "eMBB" && (
                <circle cx={ue.x + size} cy={ue.y - size} r={4.5} fill="#06b6d4" stroke="#0f172a" strokeWidth={1} />
              )}

              {/* Dynamic UE ID overhead label */}
              <text
                x={ue.x}
                y={ue.y - size - 4}
                textAnchor="middle"
                fill="#f8fafc"
                fontSize={9}
                fontFamily="JetBrains Mono, monospace"
                className="font-bold drop-shadow-md bg-slate-900 px-1"
              >
                {ue.id}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Grid footer controls legend */}
      <div className="mt-4 bg-zinc-900 border-2 border-zinc-800 rounded-none p-3.5 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
        <div className="flex space-x-4">
          <span className="flex items-center space-x-1.5">
            <span className="font-mono text-white font-black tracking-tight uppercase">Highway //</span>
            <span>Snake Line</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="font-mono text-white font-black tracking-tight uppercase">Rail corridor //</span>
            <span>Linear Axis</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="font-mono text-white font-black tracking-tight uppercase">Airspace //</span>
            <span>Spline Loop</span>
          </span>
        </div>
        <div className="text-[10px] text-zinc-500 font-black tracking-widest uppercase italic">
          RIC_TOPOLOGY_LEGEND
        </div>
      </div>
    </div>
  );
}
