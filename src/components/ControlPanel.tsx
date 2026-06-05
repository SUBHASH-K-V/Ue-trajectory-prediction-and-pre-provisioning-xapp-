import React from "react";
import { xAppConfig } from "../types";
import { Sliders, RefreshCw, Play, Pause, Zap, ToggleLeft, ToggleRight, Radio } from "lucide-react";

interface ControlPanelProps {
  config: xAppConfig;
  onChangeConfig: (newConfig: xAppConfig) => void;
  isRunning: boolean;
  onToggleRunning: () => void;
  simSpeed: number;
  onChangeSpeed: (speed: number) => void;
  onResetSimulation: () => void;
}

export default function ControlPanel({
  config,
  onChangeConfig,
  isRunning,
  onToggleRunning,
  simSpeed,
  onChangeSpeed,
  onResetSimulation,
}: ControlPanelProps) {
  const updateConfig = (key: keyof xAppConfig, value: any) => {
    onChangeConfig({
      ...config,
      [key]: value,
    });
  };

  return (
    <div
      id="xApp_Control_Parameters"
      className="bg-zinc-900 border-2 border-zinc-800 rounded-none p-5 shadow-lg flex flex-col space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center space-x-2">
          <Sliders className="w-5 h-5 text-emerald-500" />
          <h2 className="text-xs font-black font-mono text-white uppercase tracking-widest italic">
            xApp Controller Parameters
          </h2>
        </div>
        <button
          onClick={onResetSimulation}
          title="Reset Simulation Grid"
          className="p-1 px-2 bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-500 transition-all text-zinc-300 font-mono text-[10px] flex items-center space-x-1 cursor-pointer rounded-none uppercase font-bold tracking-wider"
        >
          <RefreshCw className="w-3 h-3 text-emerald-500" />
          <span>Reset</span>
        </button>
      </div>

      {/* Play/Pause Speed Simulation */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onToggleRunning}
          className={`h-10 px-3 rounded-none font-sans font-black uppercase text-xs tracking-widest flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
            isRunning
              ? "bg-amber-500 text-black hover:bg-amber-400"
              : "bg-emerald-500 text-black hover:bg-emerald-400"
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-black" />
              <span>Pause Sim</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-black" />
              <span>Resume Sim</span>
            </>
          )}
        </button>

        <div className="flex bg-zinc-950 border border-zinc-805 rounded-none p-0.5">
          {[1, 2, 5].map((speed) => (
            <button
               key={speed}
               onClick={() => onChangeSpeed(speed)}
               className={`flex-1 py-1.5 text-[10px] font-mono font-black rounded-none transition-all cursor-pointer uppercase ${
                 simSpeed === speed
                   ? "bg-zinc-800 text-emerald-400 border border-zinc-700 shadow"
                   : "text-zinc-500 hover:text-zinc-300"
               }`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>

      {/* Toggle: Pre-prov engine */}
      <div className="flex items-center justify-between bg-zinc-950/60 border border-zinc-808 p-3 rounded-none">
        <div className="flex flex-col">
          <span className="text-xs font-black uppercase tracking-tight text-white font-sans">
            RESOURCE PRE-PROVISIONING
          </span>
          <span className="text-[9px] text-zinc-400 font-mono uppercase tracking-wider mt-0.5">
            PROACTIVE SLICE TUNNEL BOOKING
          </span>
        </div>
        <button
          id="toggle_pre_provisioning"
          className="cursor-pointer text-emerald-400"
          onClick={() =>
            updateConfig("preProvisioningEnabled", !config.preProvisioningEnabled)
          }
        >
          {config.preProvisioningEnabled ? (
            <ToggleRight className="w-9 h-9 text-emerald-500 fill-zinc-950" />
          ) : (
            <ToggleLeft className="w-9 h-9 text-zinc-700" />
          )}
        </button>
      </div>

      {/* Select: Prediction Model */}
      <div className="flex flex-col space-y-1.5">
        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 font-mono">
          TRAJECTORY PREDICTION MODEL
        </label>
        <select
          value={config.modelType}
          onChange={(e) => updateConfig("modelType", e.target.value)}
          className="bg-zinc-950 border border-zinc-800 rounded-none py-2 px-3 text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-500 w-full"
        >
          <option value="Linear Extrapolation">Linear Extrapolation (Velocity-X/Y)</option>
          <option value="Kalman Filter">Kalman Filter (Accelerated Noise-Filtered)</option>
          <option value="Polynomial Regression">Polynomial Regression (Curved Path Splines)</option>
        </select>
      </div>

      {/* Slider: Lookahead predictive window */}
      <div className="flex flex-col space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-black uppercase tracking-widest font-mono text-zinc-400 text-[10px]">Lookahead Window</span>
          <span className="font-mono text-emerald-400 font-black">
            {config.lookaheadWindowSec} SECONDS
          </span>
        </div>
        <input
          type="range"
          min={3}
          max={15}
          value={config.lookaheadWindowSec}
          onChange={(e) => updateConfig("lookaheadWindowSec", parseInt(e.target.value))}
          className="w-full accent-emerald-500 h-1 bg-zinc-950 appearance-none cursor-pointer"
        />
        <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-tight">
          xApp projects coordinates {config.lookaheadWindowSec}s into the future
        </span>
      </div>

      {/* Slider: Pre-Provision RSRP Threshold */}
      <div className="flex flex-col space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-black uppercase tracking-widest font-mono text-zinc-400 text-[10px]">Pre-Provision RSRP Limit</span>
          <span className="font-mono text-emerald-400 font-black">
            {config.rsrpPreProvThreshold} dBm
          </span>
        </div>
        <input
          type="range"
          min={-95}
          max={-70}
          value={config.rsrpPreProvThreshold}
          onChange={(e) => updateConfig("rsrpPreProvThreshold", parseInt(e.target.value))}
          className="w-full accent-emerald-500 h-1 bg-zinc-950 appearance-none cursor-pointer"
        />
        <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-tight">
          Starts target reservation when predicted signal is &ge; {config.rsrpPreProvThreshold} dBm
        </span>
      </div>

      {/* Slider: Handover Hysteresis */}
      <div className="flex flex-col space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-black uppercase tracking-widest font-mono text-zinc-400 text-[10px]">Handover Hysteresis</span>
          <span className="font-mono text-emerald-400 font-black">
            {config.handoverHysteresisDb} dB
          </span>
        </div>
        <input
          type="range"
          min={1}
          max={6}
          step={0.5}
          value={config.handoverHysteresisDb}
          onChange={(e) => updateConfig("handoverHysteresisDb", parseFloat(e.target.value))}
          className="w-full accent-emerald-500 h-1 bg-zinc-950 appearance-none cursor-pointer"
        />
        <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-tight">
          Requires target Signal to exceed current by {config.handoverHysteresisDb} dB
        </span>
      </div>

      {/* Slider: Time to Trigger (TTT) */}
      <div className="flex flex-col space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-black uppercase tracking-widest font-mono text-zinc-400 text-[10px]">Time-To-Trigger (TTT)</span>
          <span className="font-mono text-emerald-400 font-black">
            {config.timeToTriggerSec} SECONDS
          </span>
        </div>
        <input
          type="range"
          min={1}
          max={5}
          value={config.timeToTriggerSec}
          onChange={(e) => updateConfig("timeToTriggerSec", parseInt(e.target.value))}
          className="w-full accent-emerald-500 h-1 bg-zinc-950 appearance-none cursor-pointer"
        />
        <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-tight">
          Minimum lookahead duration before active handovers are finalized
        </span>
      </div>
    </div>
  );
}
