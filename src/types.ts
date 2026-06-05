export type SliceType = "URLLC" | "eMBB" | "mMTC";

export interface CellTower {
  id: string;
  name: string;
  x: number;
  y: number;
  radius: number;
  frequency: string; // e.g., "3.5 GHz (n78)", "28 GHz (n257)"
  bandwidthMhz: number; // e.g., 100 MHz
  capacityGbps: number; // e.g. 5 Gbps
  loadPercentage: number; // calculated dynamically based on active UEs
  activeUECount: number;
  sliceCapabilities: SliceType[];
}

export type Coordinate = {
  x: number;
  y: number;
};

export interface UE {
  id: string;
  name: string;
  type: "Car" | "Drone" | "Train" | "Pedestrian";
  x: number;
  y: number;
  vx: number; // velocity-x
  vy: number; // velocity-y
  routeKey: string; // which pre-defined route it's following
  routeProgress: number; // progress percentage along its closed route spline
  speedKmph: number;
  sliceRequirement: SliceType;
  dataRateReqMbps: number; // Required bandwidth
  rsrpCurrent: number; // Current signal strength (dBm)
  currentCellId: string | null;
  predictedCellId: string | null;
  predictedTimeSec: number; // estimated time to reach next cell
  predictedPath: Coordinate[]; // projected coordinates
  rsrpHistory: { cellId: string; rsrp: number }[]; // signal logs for graphs
  preProvisionedAt: string[]; // cell IDs where resources are pre-provisioned
  latencyMs: number; // simulated latency based on connection & pre-provisioning status
  packetLossRate: number; // simulated packet loss %
}

export interface xAppConfig {
  modelType: "Linear Extrapolation" | "Kalman Filter" | "Polynomial Regression";
  preProvisioningEnabled: boolean;
  lookaheadWindowSec: number;
  rsrpPreProvThreshold: number; // threshold in dBm to start provisioning (e.g. -85 dBm)
  handoverHysteresisDb: number; // hysteresis to prevent ping-pong handover effects (e.g., 3 dB)
  timeToTriggerSec: number; // duration RSRP must stay high before actual handover trigger
}

export interface LogEntry {
  id: string;
  timestamp: string;
  type: "info" | "warning" | "success" | "handover";
  message: string;
}

export interface A1Policy {
  lookahead_window_seconds: number;
  pre_provisioning_threshold_db: number;
  slice_prioritization: {
    URLLC: number;
    eMBB: number;
    mMTC: number;
  };
  congested_cell_strategies: {
    cellId: string;
    traffic_steering_action: string;
  }[];
}

export interface OptimizationResponse {
  reasoning: string;
  a1_policy: A1Policy;
}
