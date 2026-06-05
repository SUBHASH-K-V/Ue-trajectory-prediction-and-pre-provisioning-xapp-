import React, { useState } from "react";
import { CellTower, UE, xAppConfig, LogEntry, A1Policy } from "../types";
import { BrainCircuit, Loader2, Send, Cpu, Sliders, Check, Network, Shield } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface AiOptimizerProps {
  cells: CellTower[];
  ues: UE[];
  config: xAppConfig;
  logs: LogEntry[];
  onApplyPolicy: (policy: A1Policy) => void;
}

export default function AiOptimizer({
  cells,
  ues,
  config,
  logs,
  onApplyPolicy,
}: AiOptimizerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<{
    reasoning: string;
    a1_policy: A1Policy;
  } | null>(null);
  const [justApplied, setJustApplied] = useState(false);

  const handleOptimize = async () => {
    setLoading(true);
    setError(null);
    setJustApplied(false);

    try {
      const response = await fetch("/api/optimize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ues,
          cells,
          config,
          activeLogs: logs,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to trigger AI Optimization.");
      }

      const result = await response.json();
      setAiResponse(result);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Could not connect to O-RAN server.");
    } finally {
      setLoading(false);
    }
  };

  const applyA1Directive = () => {
    if (!aiResponse) return;
    onApplyPolicy(aiResponse.a1_policy);
    setJustApplied(true);
    setTimeout(() => {
      setJustApplied(false);
    }, 3000);
  };

  return (
    <div
      id="ORAN_AI_Steering"
      className="bg-zinc-900 border-2 border-zinc-800 rounded-none p-5 shadow-lg flex flex-col space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center space-x-2">
          <BrainCircuit className="w-5 h-5 text-emerald-500" />
          <h2 className="text-xs font-black font-mono text-white uppercase tracking-widest italic">
            Gemini AI O-RAN policy Optimization // A1-INTERFACE
          </h2>
        </div>
        <span className="text-[10px] font-mono text-emerald-500 px-2.5 py-1 bg-zinc-950 border border-zinc-800 rounded-none font-bold tracking-widest uppercase bg-emerald-500/10">
          STA_ACTIVE
        </span>
      </div>

      <p className="text-xs text-zinc-400 leading-relaxed uppercase font-sans tracking-wide">
        Execute a server-side Gemini AI pass over cell loads, trajectories, and SLA parameters to adapt dynamic radio block policies and steer UEs proactively.
      </p>

      {/* Action CTA */}
      <button
        id="trigger_optimize_button"
        onClick={handleOptimize}
        disabled={loading}
        className={`w-full h-11 px-4 rounded-none font-sans font-black uppercase text-xs tracking-widest flex items-center justify-center space-x-2 transition-all duration-300 shadow cursor-pointer ${
          loading
            ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
            : "bg-emerald-500 hover:bg-emerald-400 text-zinc-950"
        }`}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />
            <span className="font-mono font-black tracking-widest uppercase italic">Gemini_API EXEC_PASS_LOAD_IN_PROGRESS...</span>
          </>
        ) : (
          <>
            <BrainCircuit className="w-4 h-4 text-zinc-950" />
            <span>Generate Dynamic O-RAN Policy directives</span>
          </>
        )}
      </button>

      {/* Error state */}
      {error && (
        <div id="ai_error_panel" className="bg-red-950/40 border-2 border-red-900 rounded-none p-3.5 text-[11px] text-red-300 leading-relaxed font-mono uppercase tracking-wide">
          <Shield className="w-4 h-4 text-red-400 inline mr-2 align-middle" />
          {error}
        </div>
      )}

      {/* Response Panel */}
      {aiResponse && (
        <div className="space-y-4 pt-2 animate-fade-in border-t border-zinc-800">
          {/* Policy Registry Stats */}
          <div className="bg-zinc-950 border-2 border-zinc-800 rounded-none p-4 font-mono text-xs text-zinc-300">
            <div className="flex items-center space-x-1.5 mb-2.5 text-emerald-400 font-black border-b border-zinc-800 pb-1.5 text-[10px] tracking-widest uppercase italic">
              <Cpu className="w-4 h-4" />
              <span>O-RAN A1 POLICY DIRECTIVE RECEIVED</span>
            </div>
            
            <div className="grid grid-cols-2 gap-y-3 gap-x-4 mb-4">
              <div>
                <span className="text-zinc-500 block text-[9px] uppercase tracking-wider">A1.LOOKAHEAD_WINDOW</span>
                <span className="text-white font-black font-sans text-sm italic">
                  {aiResponse.a1_policy.lookahead_window_seconds} SECONDS
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[9px] uppercase tracking-wider">A1.PRE_PROV_MARGIN</span>
                <span className="text-white font-black font-sans text-sm italic">
                  {aiResponse.a1_policy.pre_provisioning_threshold_db} dB RSRP
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-zinc-500 block text-[9px] uppercase tracking-wider mb-1">A1.SLICE_PRIORITIZATION_WEIGHTS</span>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                    <span className="text-[10px] font-bold">URLLC:</span>
                    <span className="text-white font-black font-sans">
                      {aiResponse.a1_policy.slice_prioritization.URLLC}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block" />
                    <span className="text-[10px] font-bold">eMBB:</span>
                    <span className="text-white font-black font-sans">
                      {aiResponse.a1_policy.slice_prioritization.eMBB}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                    <span className="text-[10px] font-bold">mMTC:</span>
                    <span className="text-white font-black font-sans">
                      {aiResponse.a1_policy.slice_prioritization.mMTC}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {aiResponse.a1_policy.congested_cell_strategies.length > 0 && (
              <div className="border-t border-zinc-900 pt-3">
                <span className="text-zinc-500 block text-[9px] uppercase tracking-wider mb-2">A1.CELL_TRAFFIC_STEERING_SCHEME</span>
                <div className="space-y-1.5">
                  {aiResponse.a1_policy.congested_cell_strategies.map((strat, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[10px] bg-zinc-900 px-2 py-1.5 rounded-none border border-zinc-800 font-mono">
                      <span className="text-emerald-400 font-black italic">{strat.cellId} //</span>
                      <span className="text-zinc-400 uppercase font-black">{strat.traffic_steering_action}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Markdown Expert Analysis */}
          <div className="bg-zinc-950 border-2 border-zinc-800 rounded-none p-4">
            <h3 className="text-[10px] font-black text-zinc-300 uppercase mb-2.5 font-mono flex items-center space-x-1.5 tracking-wider italic">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              <span>RIC Service Optimizer Analysis</span>
            </h3>
            <div className="text-xs text-zinc-300 leading-relaxed font-sans max-h-[180px] overflow-y-auto pr-1 select-text scrollbar-thin scrollbar-thumb-zinc-800">
              <ReactMarkdown>{aiResponse.reasoning}</ReactMarkdown>
            </div>
          </div>

          {/* CTA Apply Policy to RIC */}
          <button
            id="apply_a1_policy_button"
            onClick={applyA1Directive}
            className={`w-full h-11 px-4 rounded-none font-sans font-black uppercase text-xs tracking-widest flex items-center justify-center space-x-2 transition-all duration-300 cursor-pointer ${
              justApplied
                ? "bg-zinc-800 text-emerald-400 border border-emerald-900/40"
                : "bg-white text-zinc-950 hover:bg-zinc-200"
            }`}
          >
            {justApplied ? (
              <>
                <Check className="w-4 h-4 stroke-3 text-emerald-400" />
                <span>Policy synchronized with real-time RIC</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 text-zinc-950" />
                <span>Synchronize A1 Policy with RT Scheduler</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
