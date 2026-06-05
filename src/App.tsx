import React, { useState, useEffect, useRef } from "react";
import { CellTower, UE, xAppConfig, LogEntry, A1Policy, Coordinate } from "./types";
import NetworkMap from "./components/NetworkMap";
import ControlPanel from "./components/ControlPanel";
import AiOptimizer from "./components/AiOptimizer";
import MetricCard from "./components/MetricCard";
import {
  Activity,
  Radio,
  Sliders,
  Tv,
  ListFilter,
  CheckCircle,
  AlertTriangle,
  Info,
  Layers,
  ArrowRight,
  TrendingUp,
  Clock,
  Wifi,
  Server
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";

// Initial Cell Towers coordinates and capabilities
const INITIAL_CELLS: CellTower[] = [
  {
    id: "gNB_Core_1",
    name: "gNB mmWave Core-1",
    x: 190,
    y: 150,
    radius: 175,
    frequency: "28 GHz mmWave (n257)",
    bandwidthMhz: 400,
    capacityGbps: 5.0,
    loadPercentage: 15,
    activeUECount: 0,
    sliceCapabilities: ["URLLC", "eMBB"]
  },
  {
    id: "gNB_North_2",
    name: "gNB Sub6 North-2",
    x: 440,
    y: 120,
    radius: 195,
    frequency: "3.5 GHz Sub-6 (n78)",
    bandwidthMhz: 100,
    capacityGbps: 2.0,
    loadPercentage: 10,
    activeUECount: 0,
    sliceCapabilities: ["URLLC", "eMBB", "mMTC"]
  },
  {
    id: "gNB_South_3",
    name: "gNB Sub6 South-3",
    x: 340,
    y: 310,
    radius: 185,
    frequency: "3.5 GHz Sub-6 (n78)",
    bandwidthMhz: 100,
    capacityGbps: 2.0,
    loadPercentage: 8,
    activeUECount: 0,
    sliceCapabilities: ["eMBB", "mMTC"]
  },
  {
    id: "gNB_East_4",
    name: "gNB Midband East-4",
    x: 630,
    y: 230,
    radius: 215,
    frequency: "2.1 GHz LTE/5G (n1)",
    bandwidthMhz: 50,
    capacityGbps: 1.0,
    loadPercentage: 12,
    activeUECount: 0,
    sliceCapabilities: ["URLLC", "mMTC"]
  }
];

// Initial active UEs tracking state
const INITIAL_UES: UE[] = [
  {
    id: "UE_Train_10",
    name: "R-Rail Express",
    type: "Train",
    x: 40,
    y: 410,
    vx: 0,
    vy: 0,
    routeKey: "Rail",
    routeProgress: 0,
    speedKmph: 240,
    sliceRequirement: "URLLC",
    dataRateReqMbps: 60,
    rsrpCurrent: -95,
    currentCellId: "gNB_Core_1",
    predictedCellId: null,
    predictedTimeSec: 0,
    predictedPath: [],
    rsrpHistory: [],
    preProvisionedAt: [],
    latencyMs: 5.5,
    packetLossRate: 0.0
  },
  {
    id: "UE_Car_22",
    name: "Connected Sedan",
    type: "Car",
    x: 20,
    y: 200,
    vx: 0,
    vy: 0,
    routeKey: "Highway",
    routeProgress: 0,
    speedKmph: 110,
    sliceRequirement: "eMBB",
    dataRateReqMbps: 140,
    rsrpCurrent: -95,
    currentCellId: "gNB_Core_1",
    predictedCellId: null,
    predictedTimeSec: 0,
    predictedPath: [],
    rsrpHistory: [],
    preProvisionedAt: [],
    latencyMs: 12.0,
    packetLossRate: 0.0
  },
  {
    id: "UE_Drone_5",
    name: "Logistics Quad",
    type: "Drone",
    x: 120,
    y: 120,
    routeKey: "Airspace",
    vx: 0,
    vy: 0,
    routeProgress: 0,
    speedKmph: 55,
    sliceRequirement: "URLLC",
    dataRateReqMbps: 20,
    rsrpCurrent: -95,
    currentCellId: "gNB_Core_1",
    predictedCellId: null,
    predictedTimeSec: 0,
    predictedPath: [],
    rsrpHistory: [],
    preProvisionedAt: [],
    latencyMs: 4.8,
    packetLossRate: 0.0
  },
  {
    id: "UE_Pad_8",
    name: "Visitor Footpath",
    type: "Pedestrian",
    x: 580,
    y: 180,
    routeKey: "Pedestrian",
    vx: 0,
    vy: 0,
    routeProgress: 0,
    speedKmph: 6,
    sliceRequirement: "mMTC",
    dataRateReqMbps: 3,
    rsrpCurrent: -95,
    currentCellId: "gNB_East_4",
    predictedCellId: null,
    predictedTimeSec: 0,
    predictedPath: [],
    rsrpHistory: [],
    preProvisionedAt: [],
    latencyMs: 18.0,
    packetLossRate: 0.0
  }
];

export default function App() {
  const [cells, setCells] = useState<CellTower[]>(INITIAL_CELLS);
  const [ues, setUes] = useState<UE[]>(INITIAL_UES);
  const [config, setConfig] = useState<xAppConfig>({
    modelType: "Kalman Filter",
    preProvisioningEnabled: true,
    lookaheadWindowSec: 8,
    rsrpPreProvThreshold: -83,
    handoverHysteresisDb: 2.5,
    timeToTriggerSec: 2
  });

  const [isRunning, setIsRunning] = useState(true);
  const [simSpeed, setSimSpeed] = useState(1);
  const [selectedUeId, setSelectedUeId] = useState<string | null>("UE_Train_10");
  const [selectedCellId, setSelectedCellId] = useState<string | null>("gNB_Core_1");

  // Telemetry logs
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: "log1",
      timestamp: "11:58:53",
      type: "info",
      message: "Near-RT RIC initialized. Trajectory Prediction xApp online."
    },
    {
      id: "log2",
      timestamp: "11:58:54",
      type: "success",
      message: "Synced with O-RAN A1 Interface. Standard parameters loaded."
    }
  ]);

  // Real-time Latency Chart Tracking over time
  // Compare latency showing pre-provisioning vs blind traditionals
  const [chartHistory, setChartHistory] = useState<{
    tick: number;
    assistedLatency: number;
    blindLatency: number;
  }[]>([]);
  const tickCounter = useRef(0);

  // Buffer track for Handover Time-To-Trigger hysteresis checks
  // Keeps track of when RSRP to another cell is in a trigger state
  const rsrpTriggers = useRef<Record<string, { cellId: string; thresholdPassedAt: number }>>({});

  // Append logs helpers
  const appendLog = (type: LogEntry["type"], message: string) => {
    const timeStr = new Date().toISOString().split("T")[1].slice(0, 8);
    setLogs((prev) => [
      { id: Math.random().toString(), timestamp: timeStr, type, message },
      ...prev.slice(0, 99) // limit to 100 items
    ]);
  };

  // Reset simulation handler
  const handleReset = () => {
    setCells(INITIAL_CELLS);
    setUes(INITIAL_UES);
    rsrpTriggers.current = {};
    setChartHistory([]);
    tickCounter.current = 0;
    appendLog("info", "Resetted O-RAN simulation topology and telemetry trackers.");
  };

  // Trajectory Math: Returns position along predetermined route loops based on a progression value
  const getCoordinatesForRoute = (routeKey: string, progress: number): Coordinate => {
    switch (routeKey) {
      case "Highway": {
        // Snake across the center
        const x = 20 + 7.6 * progress;
        const y = 220 + 75 * Math.sin(x / 110);
        return { x, y };
      }
      case "Airspace": {
        // Triangle loop: P0(120, 120), P1(520, 100), P2(320, 340)
        const p0 = { x: 120, y: 120 };
        const p1 = { x: 520, y: 100 };
        const p2 = { x: 320, y: 340 };

        if (progress < 33.3) {
          const t = progress / 33.3;
          return { x: p0.x + t * (p1.x - p0.x), y: p0.y + t * (p1.y - p0.y) };
        } else if (progress < 66.6) {
          const t = (progress - 33.3) / 33.3;
          return { x: p1.x + t * (p2.x - p1.x), y: p1.y + t * (p2.y - p1.y) };
        } else {
          const t = (progress - 66.6) / 33.4;
          return { x: p2.x + t * (p0.x - p2.x), y: p2.y + t * (p0.y - p2.y) };
        }
      }
      case "Rail": {
        // High Speed Straight railroad diagonal cross
        const x = 40 + 7.2 * progress;
        const y = 410 - (progress / 100) * 350;
        return { x, y };
      }
      case "Pedestrian": {
        // Perfect boardwalk circular walk
        const rad = 40;
        const angle = (progress / 100) * 2 * Math.PI;
        return {
          x: 580 + rad * Math.cos(angle),
          y: 130 + rad * Math.sin(angle)
        };
      }
      default:
        return { x: 100, y: 100 };
    }
  };

  // Convert distance in pixels to approximate signal strength RSRP (dBm)
  const calculateRSRP = (pxDistance: number, frequency: string): number => {
    // mmWave (28GHz) undergoes extremely high path loss. Sub6 is stronger.
    const pathLossExponent = frequency.includes("28 GHz") ? 3.2 : 2.5;
    // base signal starts at -35dBm. Each log step of distance reduces signal strength
    const baseMargin = -38;
    const pathLoss = pathLossExponent * 11 * Math.log10(pxDistance / 5 + 1);
    
    // add minor fading / shadowing noise (e.g. up to +/- 1.5 dB)
    const fading = Math.sin(tickCounter.current / 4) * 1.2;
    const rsrp = Math.max(-125, Math.min(-40, baseMargin - pathLoss + fading));
    return parseFloat(rsrp.toFixed(1));
  };

  // Main Simulation Tick Effect
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      tickCounter.current += 1;

      // 1. Advance UE progress and compute new positions
      setUes((prevUes) => {
        const nextUes = prevUes.map((ue) => {
          // speed factor scaled for our grid tick rate
          const progressStep = (ue.speedKmph * simSpeed * 0.08) / 60; // relative progress increment
          const nextProgress = (ue.routeProgress + progressStep) % 100;

          const currentPos = getCoordinatesForRoute(ue.routeKey, nextProgress);

          // 2. Compute current RSRP to ALL towers based on physics properties
          const rsrpRecord = cells.map((cell) => {
            const dx = currentPos.x - cell.x;
            const dy = currentPos.y - cell.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const rsrp = calculateRSRP(distance, cell.frequency);
            return { cellId: cell.id, rsrp };
          });

          // Current active signal strength to connected cell
          const activeTowerRecord = rsrpRecord.find((r) => r.cellId === ue.currentCellId);
          const currentRsrp = activeTowerRecord ? activeTowerRecord.rsrp : -115;

          // 3. SECURE TRAJECTORY PREDICTION: Lookahead future projection math
          // Estimate future progress depending on selected prediction model algorithm
          let lookaheadProgress = nextProgress;
          if (config.modelType === "Linear Extrapolation") {
            lookaheadProgress = (nextProgress + (ue.speedKmph * simSpeed * 0.08) * (config.lookaheadWindowSec / 15)) % 100;
          } else if (config.modelType === "Kalman Filter") {
            // Simulated prediction with smooth progressive filter weights
            lookaheadProgress = (nextProgress + (ue.speedKmph * simSpeed * 0.09) * (config.lookaheadWindowSec / 15)) % 100;
          } else {
            // Polynomial curves (splines)
            lookaheadProgress = (nextProgress + (ue.speedKmph * simSpeed * 0.085) * (config.lookaheadWindowSec / 15)) % 100;
          }

          // Generate sample projection coordinate array for the dynamic trail dotted line
          const predictedPath: Coordinate[] = [];
          for (let sec = 1; sec <= config.lookaheadWindowSec; sec += 2) {
            const tempProgress = (nextProgress + (ue.speedKmph * simSpeed * 0.08 * (sec / config.lookaheadWindowSec))) % 100;
            predictedPath.push(getCoordinatesForRoute(ue.routeKey, tempProgress));
          }

          const futureEndpoint = getCoordinatesForRoute(ue.routeKey, lookaheadProgress);

          // Find which cells coverage the future endpoint
          let bestPredictedCellId: string | null = null;
          let highestFutureRSRP = -140;

          cells.forEach((cell) => {
            const fdx = futureEndpoint.x - cell.x;
            const fdy = futureEndpoint.y - cell.y;
            const fDist = Math.sqrt(fdx * fdx + fdy * fdy);
            const futureRSRP = calculateRSRP(fDist, cell.frequency);

            if (fDist <= cell.radius && futureRSRP > highestFutureRSRP) {
              highestFutureRSRP = futureRSRP;
              bestPredictedCellId = cell.id;
            }
          });

          // Calculate estimated arrival time to target cell tower overlap
          let predictedTimeSec = 0;
          if (bestPredictedCellId && bestPredictedCellId !== ue.currentCellId) {
            // Find distance to center of target tower
            const targetCell = cells.find((c) => c.id === bestPredictedCellId);
            if (targetCell) {
              const dxToTower = targetCell.x - currentPos.x;
              const dyToTower = targetCell.y - currentPos.y;
              const distToTower = Math.sqrt(dxToTower * dxToTower + dyToTower * dyToTower);
              // convert pixel to meters, compute velocity
              const meters = distToTower * 2.2;
              const mPerSec = (ue.speedKmph * 1000) / 3600;
              predictedTimeSec = parseFloat((meters / mPerSec).toFixed(1));
            }
          }

          // 4. PRE-PROVISIONING TRIGGERS (A1 dynamic slices)
          const preProvisionedAt: string[] = [];
          if (config.preProvisioningEnabled && bestPredictedCellId && bestPredictedCellId !== ue.currentCellId) {
            const targetCell = cells.find((c) => c.id === bestPredictedCellId);
            if (targetCell) {
              const fdx = futureEndpoint.x - targetCell.x;
              const fdy = futureEndpoint.y - targetCell.y;
              const futureRSRPToTarget = calculateRSRP(Math.sqrt(fdx * fdx + fdy * fdy), targetCell.frequency);

              if (futureRSRPToTarget >= config.rsrpPreProvThreshold) {
                preProvisionedAt.push(bestPredictedCellId);
              }
            }
          }

          // 5. INTUATIVE QoS SIMULATION (Pre-provisioned Assisted Handovers vsTraditional blind drops)
          let latencyMs = 15;
          let packetLossRate = 0.0;

          if (ue.sliceRequirement === "URLLC") {
            latencyMs = 4.5 + Math.random() * 1.5;
          } else if (ue.sliceRequirement === "eMBB") {
            latencyMs = 12.0 + Math.random() * 4.0;
          } else {
            latencyMs = 24.0 + Math.random() * 8.0;
          }

          // Check if a handover threshold was passed
          // Find the best available alternative cell tower right now
          let bestAlternativeCellId: string | null = null;
          let bestAlternativeRSRP = -140;

          rsrpRecord.forEach((rec) => {
            if (rec.rsrp > bestAlternativeRSRP) {
              bestAlternativeRSRP = rec.rsrp;
              bestAlternativeCellId = rec.cellId;
            }
          });

          // Connection state evaluation (Handover execution with hysteresis checks)
          let finalConnectedCellId = ue.currentCellId;
          const isBetterSignal =
            bestAlternativeCellId &&
            bestAlternativeCellId !== ue.currentCellId &&
            bestAlternativeRSRP > currentRsrp + config.handoverHysteresisDb;

          if (isBetterSignal && bestAlternativeCellId) {
            const key = `${ue.id}-${bestAlternativeCellId}`;
            const now = Date.now();

            if (!rsrpTriggers.current[key]) {
              rsrpTriggers.current[key] = {
                cellId: bestAlternativeCellId,
                thresholdPassedAt: now
              };
            } else {
              const durationSec = (now - rsrpTriggers.current[key].thresholdPassedAt) / 1000;
              // Check if we survived the Time-To-Trigger duration
              if (durationSec >= config.timeToTriggerSec) {
                // Execute Handover!
                finalConnectedCellId = bestAlternativeCellId;
                delete rsrpTriggers.current[key];

                const wasPreProvisioned = ue.preProvisionedAt.includes(bestAlternativeCellId);
                const latAction = wasPreProvisioned ? "5.4ms (Prediction assisted)" : "165ms (Traditional blind handover)";
                const lossAction = wasPreProvisioned ? "0.0%" : "14.5% packet drop";

                appendLog(
                  "handover",
                  `Handover executed for ${ue.name} (${ue.id}) from ${ue.currentCellId} to ${bestAlternativeCellId}. SLA metrics: Latency=${latAction}, Loss=${lossAction}`
                );

                // Simulate spikes if traditional blind handover happened
                if (!wasPreProvisioned) {
                  // Simulate blind handover drop penalty
                  latencyMs = 185;
                  packetLossRate = 14.5;
                }
              }
            }
          }

          // Clear outdated triggers
          Object.keys(rsrpTriggers.current).forEach((k) => {
            if (!k.startsWith(ue.id)) return;
            const cId = rsrpTriggers.current[k].cellId;
            // if alternative drops below connected or hysteresis is lost, cancel transition
            const alternativeRec = rsrpRecord.find((r) => r.cellId === cId);
            if (!alternativeRec || alternativeRec.rsrp <= currentRsrp + config.handoverHysteresisDb) {
              delete rsrpTriggers.current[k];
            }
          });

          // Log newly initialized pre-provisioning activities
          preProvisionedAt.forEach((pId) => {
            if (!ue.preProvisionedAt.includes(pId)) {
              appendLog(
                "success",
                `[xApp Trigger] Predict ${ue.name} approaching ${pId} in ~${predictedTimeSec}s. Pre-provisioning dynamic ${ue.sliceRequirement} slice bandwidth (${ue.dataRateReqMbps} Mbps).`
              );
            }
          });

          return {
            ...ue,
            x: currentPos.x,
            y: currentPos.y,
            routeProgress: nextProgress,
            rsrpCurrent: currentRsrp,
            rsrpHistory: rsrpRecord,
            predictedCellId: bestPredictedCellId,
            predictedTimeSec,
            predictedPath,
            preProvisionedAt,
            currentCellId: finalConnectedCellId,
            latencyMs: parseFloat(latencyMs.toFixed(1)),
            packetLossRate: parseFloat(packetLossRate.toFixed(2))
          };
        });

        // 6. Refresh Recharts Chart state variables
        const activeTrain = nextUes.find((u) => u.id === "UE_Train_10");
        if (activeTrain) {
          // Assisted path tracks current predicted latency.
          // Blind traditional path would have high spikes if pre-provisioning is off
          const isNearHandover = activeTrain.predictedCellId && activeTrain.predictedCellId !== activeTrain.currentCellId;
          const blindLatPrice = isNearHandover && !config.preProvisioningEnabled ? 165 + Math.random() * 15 : activeTrain.latencyMs * 2.5;

          setChartHistory((prevChart) => [
            ...prevChart.slice(-30),
            {
              tick: tickCounter.current,
              assistedLatency: activeTrain.latencyMs,
              blindLatency: config.preProvisioningEnabled ? activeTrain.latencyMs : blindLatPrice
            }
          ]);
        }

        return nextUes;
      });

      // 7. Recalculate dynamic cells loading parameters based on newly allocated traffic rates
      setCells((prevCells) => {
        return prevCells.map((cell) => {
          // get UEs connected to this cell
          setUes((currentUes) => {
            const connectedUEs = currentUes.filter((u) => u.currentCellId === cell.id);
            const activeUECount = connectedUEs.length;

            // sum allocated bandwidth
            const connectedBw = connectedUEs.reduce((sum, u) => sum + u.dataRateReqMbps, 0);

            // also count pre-provisioned reserved capacity as 80% weight loads
            const reservedUEs = currentUes.filter((u) => u.preProvisionedAt.includes(cell.id));
            const reservedBw = reservedUEs.reduce((sum, u) => sum + u.dataRateReqMbps * 0.8, 0);

            let totalMegaBytes = (connectedBw + reservedBw) / 1000; // Gbps load
            let loadPercentage = Math.min(100, (totalMegaBytes / cell.capacityGbps) * 100);

            // minor dynamic traffic fluctuations
            loadPercentage = Math.max(5, loadPercentage + Math.sin(tickCounter.current / 10) * 2);

            return currentUes; // dummy return for inner state hook
          });

          // We'll calculate load inside the main setCells loop to stay side-effect free.
          // Let's do it cleanly by pulling connected UEs:
          return cell;
        });
      });

    }, 120);

    return () => clearInterval(interval);
  }, [isRunning, simSpeed, cells, config]);

  // Recalculate cell loads dependently based on updated UE locations
  useEffect(() => {
    setCells((prevCells) =>
      prevCells.map((cell) => {
        const connected = ues.filter((u) => u.currentCellId === cell.id);
        const preProv = ues.filter((u) => u.preProvisionedAt.includes(cell.id));

        const activeBwGbps = connected.reduce((sum, u) => sum + u.dataRateReqMbps, 0) / 1000;
        const reservedBwGbps = preProv.reduce((sum, u) => sum + u.dataRateReqMbps * 0.8, 0) / 1000;

        const totalBwNeeded = activeBwGbps + reservedBwGbps;
        const load = Math.min(100, (totalBwNeeded / cell.capacityGbps) * 100 + 4);

        return {
          ...cell,
          activeUECount: connected.length,
          loadPercentage: parseFloat(Math.max(5, load).toFixed(1))
        };
      })
    );
  }, [ues]);

  // Handle Policy update injected from the Gemini AI A1 Interface
  const handleApplyA1Policy = (newPolicy: A1Policy) => {
    setConfig((prev) => ({
      ...prev,
      lookaheadWindowSec: newPolicy.lookahead_window_seconds,
      rsrpPreProvThreshold: parseInt(newPolicy.pre_provisioning_threshold_db.toString())
    }));

    appendLog(
      "success",
      `[A1 Interface] Applied Gemini O-RAN optimizing parameters: Lookahead Window adjusted to ${newPolicy.lookahead_window_seconds}s. Target RSRP offset set to ${newPolicy.pre_provisioning_threshold_db} dB.`
    );
  };

  // Compute operational aggregated metrics
  const avgLatency = (ues.reduce((sum, u) => sum + u.latencyMs, 0) / ues.length).toFixed(1);
  const avgLoss = (ues.reduce((sum, u) => sum + u.packetLossRate, 0) / ues.length).toFixed(2);
  const totalThroughput = ues.reduce((sum, u) => sum + u.dataRateReqMbps, 0);

  // Selected details
  const selectedUeDetails = ues.find((u) => u.id === selectedUeId);
  const selectedCellDetails = cells.find((c) => c.id === selectedCellId);

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col font-sans select-none antialiased">
      {/* 1. Header Navigation Bar */}
      <nav className="w-full bg-zinc-950 border-b-2 border-zinc-800 px-6 sm:px-10 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-baseline gap-4">
            <h1 className="text-3xl font-black tracking-tighter uppercase italic text-white">TRAJECTORY_X</h1>
            <span className="text-[10px] font-mono text-emerald-500 tracking-widest bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/20 font-bold uppercase">
              RIC ENGINE ACTIVE // V2.0.4
            </span>
          </div>
          <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest leading-none mt-1.5">
            TRAJECTORY PREDICTION & PRE-PROVISIONING CO-ORDINATOR
          </p>
        </div>

        {/* Global O-RAN Controller metrics */}
        <div className="flex gap-12 text-right">
          <div className="flex flex-col items-end font-mono">
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black">A1_INTERFACE_STATE</span>
            <span className="text-xs font-black uppercase text-emerald-400 tracking-widest">ONLINE // SYNCED</span>
          </div>
          <div className="flex flex-col items-end font-mono">
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black">CONNECTED_UES</span>
            <span className="text-xs font-black uppercase text-white tracking-widest">4 ACTIVE // 1,482 RET</span>
          </div>
        </div>
      </nav>

      {/* 2. Top-level KPIs Metrics Cards */}
      <header className="px-6 py-6 grid grid-cols-1 md:grid-cols-4 gap-4 w-full max-w-7xl mx-auto shrink-0">
        <MetricCard
          id="kpi-avg-latency"
          title="Average Latency"
          value={`${avgLatency} ms`}
          subValue={config.preProvisioningEnabled ? "SLA Compliant" : "+24ms HO Price"}
          icon={Activity}
          colorClass="text-sky-400 bg-sky-500"
          borderHoverClass="hover:border-sky-500/50"
        />
        <MetricCard
          id="kpi-packet-loss"
          title="Packet Loss Rate"
          value={`${avgLoss}%`}
          subValue={config.preProvisioningEnabled ? "Zero-Loss Active" : "HO Multi-Drop"}
          icon={Wifi}
          colorClass="text-emerald-400 bg-emerald-500"
          borderHoverClass="hover:border-emerald-500/50"
        />
        <MetricCard
          id="kpi-active-throughput"
          title="Consolidated Traffic"
          value={`${(totalThroughput / 1000).toFixed(2)} Gbps`}
          subValue={`${totalThroughput} Mbps active`}
          icon={TrendingUp}
          colorClass="text-indigo-400 bg-indigo-500"
          borderHoverClass="hover:border-indigo-500/50"
        />
        <MetricCard
          id="kpi-reserved-slices"
          title="Active Dynamic Slices"
          value={ues.filter((u) => u.preProvisionedAt.length > 0).length}
          subValue={`of ${ues.length} managed UEs`}
          icon={Layers}
          colorClass="text-pink-400 bg-pink-500"
          borderHoverClass="hover:border-pink-500/50"
        />
      </header>

      {/* 3. Primary Dashboard Bento Panel Grid */}
      <main className="flex-1 px-6 pb-6 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side Section: Interactive Network Grid Map & Performance Charts */}
        <div className="lg:col-span-7 flex flex-col space-y-6">
          <NetworkMap
            cells={cells}
            ues={ues}
            selectedCellId={selectedCellId}
            selectedUeId={selectedUeId}
            onSelectCell={setSelectedCellId}
            onSelectUe={setSelectedUeId}
            preProvisioningEnabled={config.preProvisioningEnabled}
          />

          {/* Telemetry latency performance chart comparing pre-allocated vs traditional handovers */}
          <div className="bg-zinc-900 border-2 border-zinc-800 rounded-none p-5 shadow-lg">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                <h3 className="text-xs font-black font-mono text-white uppercase tracking-widest italic">
                  SLA Latency Chart // UE: {ues.find((u) => u.id === "UE_Train_10")?.name}
                </h3>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold tracking-wider">
                LOOKAHEAD_WINDOW_SAMPLES: 30
              </span>
            </div>

            <div className="w-full h-56 font-mono text-[10px] uppercase">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartHistory}>
                  <defs>
                    <linearGradient id="colorAssisted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="tick" stroke="#71717a" tickLine={false} />
                  <YAxis 
                    label={{ value: 'LATENCY (MS)', angle: -90, position: 'insideLeft', stroke: "#71717a", fontSize: 10, offset: 5, fontWeight: "bold" }} 
                    stroke="#71717a" 
                    tickLine={false}
                    domain={[0, 200]} 
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a", borderRadius: "0px", fontFamily: "monospace", fontSize: "11px", color: "#f4f4f5" }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="rect" />
                  <Line
                    type="monotone"
                    dataKey="assistedLatency"
                    name="PRE-PROVISIONED xAPP (ACTIVE)"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="blindLatency"
                    name="TRADITIONAL BLIND HANDOVER"
                    stroke="#ef4444"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Side Section: xApp Slider Controllers & Gemini A1 Optimizer Interface */}
        <div className="lg:col-span-5 flex flex-col space-y-6">
          <ControlPanel
            config={config}
            onChangeConfig={setConfig}
            isRunning={isRunning}
            onToggleRunning={() => setIsRunning(!isRunning)}
            simSpeed={simSpeed}
            onChangeSpeed={setSimSpeed}
            onResetSimulation={handleReset}
          />

          <AiOptimizer
            cells={cells}
            ues={ues}
            config={config}
            logs={logs}
            onApplyPolicy={handleApplyA1Policy}
          />
        </div>
      </main>

      {/* 4. Bottom Grid: Inspectors & Event Logger Terminal */}
      <footer className="w-full max-w-7xl mx-auto px-6 pb-12 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Dynamic Node Parameter Inspector Section (5 Cols) */}
        <div className="lg:col-span-5 bg-zinc-900 border-2 border-zinc-800 rounded-none p-5 shadow-lg flex flex-col">
          <div className="flex items-center space-x-2 border-b border-zinc-800 pb-3 mb-4">
            <Layers className="w-5 h-5 text-emerald-500" />
            <h3 className="text-xs font-black font-mono text-white uppercase tracking-widest italic">
              O-RAN Telemetry Inspector
            </h3>
          </div>

          {/* Multi tabs selector */}
          <div className="grid grid-cols-2 gap-2 mb-4 bg-zinc-950 p-1 border-2 border-zinc-800 rounded-none">
            <button
              onClick={() => setSelectedUeId(ues[0]?.id || null)}
              className={`py-1.5 rounded-none text-[11px] font-black uppercase font-mono cursor-pointer transition-all ${
                selectedUeId
                  ? "bg-zinc-800 text-emerald-400 border border-zinc-700 shadow"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              UE_PARAMETERS
            </button>
            <button
              onClick={() => {
                setSelectedUeId(null);
                setSelectedCellId(cells[0]?.id || null);
              }}
              className={`py-1.5 rounded-none text-[11px] font-black uppercase font-mono cursor-pointer transition-all ${
                !selectedUeId && selectedCellId
                  ? "bg-zinc-800 text-emerald-400 border border-zinc-700 shadow"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              CELL_SECTORS
            </button>
          </div>

          {/* Content display based on tab selection */}
          {selectedUeId && selectedUeDetails ? (
            <div className="flex-1 flex flex-col justify-between">
              <div className="space-y-2.5 font-mono text-[11px]">
                <div className="flex justify-between border-b border-zinc-800 pb-1.5">
                  <span className="text-zinc-500 font-bold uppercase">UE_IDENTIFIER</span>
                  <span className="text-white font-black italic">{selectedUeDetails.name} ({selectedUeDetails.id})</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800 pb-1.5">
                  <span className="text-zinc-500 font-bold uppercase">UE_PROFILE_TYPE</span>
                  <span className="text-zinc-300 font-black">{selectedUeDetails.type}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800 pb-1.5">
                  <span className="text-zinc-500 font-bold uppercase">VELOCITY_RATINGS</span>
                  <span className="text-emerald-400 font-black">{selectedUeDetails.speedKmph} KM/H</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800 pb-1.5">
                  <span className="text-zinc-500 font-bold uppercase">ACTIVE_SLICE_SLA</span>
                  <span className="text-red-400 font-black uppercase">{selectedUeDetails.sliceRequirement}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800 pb-1.5">
                  <span className="text-zinc-500 font-bold uppercase">BANDWIDTH_LOAD</span>
                  <span className="text-zinc-200 font-black">{selectedUeDetails.dataRateReqMbps} MBPS</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800 pb-1.5">
                  <span className="text-zinc-500 font-bold uppercase">SIGNAL_VALUE (RSRP)</span>
                  <span className="text-zinc-205 font-black">{selectedUeDetails.rsrpCurrent} dBm</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800 pb-1.5">
                  <span className="text-zinc-500 font-bold uppercase">CURRENT_gNB</span>
                  <span className="text-emerald-400 font-black">{selectedUeDetails.currentCellId || "UNSERVICEABLE"}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800 pb-1.5">
                  <span className="text-zinc-500 font-bold uppercase">PREDICTED_TARGET</span>
                  <span className="text-white font-black italic">{selectedUeDetails.predictedCellId || "NO HANDOVER SCHED"}</span>
                </div>

                {selectedUeDetails.predictedCellId && (
                  <div className="flex justify-between border-b border-zinc-800 pb-1.5">
                    <span className="text-zinc-500 font-bold uppercase">PREDICTED_T_ARRIVAL</span>
                    <span className="text-amber-400 font-black">{selectedUeDetails.predictedTimeSec}s</span>
                  </div>
                )}
              </div>

              {/* Status pipeline graphics */}
              <div className="mt-4 p-3 bg-zinc-950 border border-zinc-800 rounded-none flex items-center justify-between text-[10px] font-mono">
                <span className="text-zinc-500 uppercase font-black tracking-wider">RESOURCE_PIPELINE:</span>
                <div className="flex items-center space-x-1">
                  <span className="px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded-none text-[9px] uppercase border border-zinc-700 font-bold">
                    Sensing
                  </span>
                  <ArrowRight className="w-3 h-3 text-zinc-500" />
                  <span className={`px-1.5 py-0.5 rounded-none text-[9px] uppercase border font-bold ${
                    selectedUeDetails.preProvisionedAt.length > 0
                      ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                      : "bg-zinc-950 text-zinc-600 border-zinc-900"
                  }`}>
                    Pre-Provisioned
                  </span>
                  <ArrowRight className="w-3 h-3 text-zinc-500" />
                  <span className="px-1.5 py-0.5 bg-zinc-900 text-white rounded-none text-[9px] uppercase border border-zinc-800 font-bold">
                    Handover
                  </span>
                </div>
              </div>
            </div>
          ) : selectedCellDetails ? (
            <div className="flex-1 flex flex-col justify-between">
              <div className="space-y-2.5 font-mono text-[11px]">
                <div className="flex justify-between border-b border-zinc-800 pb-1.5">
                  <span className="text-zinc-500 font-bold">gNB_IDENTIFIER</span>
                  <span className="text-white font-black italic">{selectedCellDetails.name} ({selectedCellDetails.id})</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800 pb-1.5">
                  <span className="text-zinc-500 font-bold">CARRIER_FREQUENCY</span>
                  <span className="text-zinc-300 font-black">{selectedCellDetails.frequency}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800 pb-1.5">
                  <span className="text-zinc-500 font-bold">CARRIER_BANDWIDTH</span>
                  <span className="text-zinc-300 font-black">{selectedCellDetails.bandwidthMhz} MHz</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800 pb-1.5">
                  <span className="text-zinc-500 font-bold">MAC_CAPACITY</span>
                  <span className="text-emerald-400 font-black">{selectedCellDetails.capacityGbps} Gbps</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800 pb-1.5">
                  <span className="text-zinc-500 font-bold">ACTIVE_NODES</span>
                  <span className="text-zinc-300 font-black">{selectedCellDetails.activeUECount} CONNECTIONS</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800 pb-1.5">
                  <span className="text-zinc-500 font-bold">SECTOR_RESOURCE_LOAD</span>
                  <span className={`font-black ${selectedCellDetails.loadPercentage > 80 ? "text-red-400" : "text-emerald-400"}`}>
                    {selectedCellDetails.loadPercentage}%
                  </span>
                </div>
                <div className="flex justify-between border-b border-zinc-800 pb-1.5">
                  <span className="text-zinc-500 font-bold">CAPABLE_SLA_SLICES</span>
                  <span className="text-zinc-300 font-black uppercase">{selectedCellDetails.sliceCapabilities.join(", ")}</span>
                </div>
              </div>

              <div className="mt-4 p-3 bg-zinc-950 border border-zinc-800 rounded-none flex items-center justify-between text-[10px] font-mono">
                <span className="text-zinc-500 uppercase font-black tracking-wider">LOAD_HEALTH_MARGIN:</span>
                <span className={`px-2 py-0.5 rounded-none text-[9px] font-black uppercase border ${
                  selectedCellDetails.loadPercentage > 80
                    ? "bg-red-500/10 text-red-400 border-red-500/50 animate-pulse"
                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/50"
                }`}>
                  {selectedCellDetails.loadPercentage > 80 ? "CONGESTED - DRIVER NEEDED" : "NOMINAL CAPACITY"}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-zinc-500 text-xs font-mono uppercase tracking-wider text-center p-6 border border-zinc-800 border-dashed">
              Select key node on Grid to inspect raw parameters.
            </div>
          )}
        </div>

        {/* Real-time O-RAN RIC Controller Event Logging terminal (7 cols) */}
        <div className="lg:col-span-7 bg-zinc-900 border-2 border-zinc-800 rounded-none p-5 shadow-lg flex flex-col h-[280px]">
          <div className="flex items-center space-x-2 border-b border-zinc-800 pb-3 mb-4">
            <Radio className="w-5 h-5 text-emerald-500" />
            <h3 className="text-xs font-black font-mono text-white uppercase tracking-widest italic flex-1">
              xApp Event &amp; Handover Console
            </h3>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-black">
              LIVE_STACK_BUFFER
            </span>
          </div>

          {/* Streaming Logger viewport */}
          <div
            id="xApp_Event_Log_Console"
            className="flex-1 overflow-y-auto bg-zinc-950 border-2 border-zinc-800 rounded-none p-3.5 font-mono text-[10px] leading-relaxed space-y-2.5 select-text scrollbar-thin scrollbar-thumb-zinc-800"
          >
            {logs.map((log) => (
              <div key={log.id} className="flex items-start space-x-2 border-b border-zinc-900 pb-1.5 last:border-0 uppercase font-bold text-zinc-300">
                <span className="text-zinc-600 shrink-0 select-none">[{log.timestamp}]</span>
                <span
                  className={`px-1 text-[9px] font-black uppercase shrink-0 tracking-widest select-none ${
                    log.type === "handover"
                      ? "bg-emerald-500 text-black"
                      : log.type === "success"
                      ? "bg-white text-zinc-950"
                      : log.type === "warning"
                      ? "bg-amber-500 text-black animate-pulse"
                      : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  {log.type}
                </span>
                <span className="leading-snug">{log.message}</span>
              </div>
            ))}
          </div>
        </div>

      </footer>
    </div>
  );
}
