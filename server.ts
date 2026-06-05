import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini safely
let ai: GoogleGenAI | null = null;
try {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  } else {
    console.warn("GEMINI_API_KEY environment variable is not defined.");
  }
} catch (err) {
  console.error("Error initializing GoogleGenAI client:", err);
}

// O-RAN Gemini Policy Optimizer endpoint
app.post("/api/optimize", async (req, res) => {
  const { ues, cells, config, activeLogs } = req.body;

  if (!ai) {
    return res.status(503).json({
      error: "Gemini API client is not initialized. Please configure GEMINI_API_KEY in Settings > Secrets.",
    });
  }

  try {
    const prompt = `
      You are an expert O-RAN (Open Radio Access Network) Near-Real-Time RIC (RAN Intelligent Controller) optimization engine.
      Your task is to analyze the current state of a simulated urban cellular network to make intelligent UE trajectory predictions, pre-provisioning decisions, and output network-wide traffic steering / slice resource allocation policies.

      Current Slicing Types:
      - URLLC (Ultra-Reliable Low-Latency Communication): Needs zero packet loss during handovers. Requires early reservation and buffer allocation.
      - eMBB (Enhanced Mobile Broadband): Needs high bandwidth/throughput. Slices can be throttled slightly but require sustained high capacity.
      - mMTC (Massive Machine Type Communication): High connection density, latency-tolerant, low bandwidth.

      Here is the current state of the network:
      1. Cells (gNB Towers):
      ${JSON.stringify(cells, null, 2)}

      2. Active User Equipment (UEs) under prediction/tracking:
      ${JSON.stringify(ues, null, 2)}

      3. Current xApp Control Parameters:
      ${JSON.stringify(config, null, 2)}

      4. Recent xApp Event / Handover Logs:
      ${JSON.stringify(activeLogs.slice(-10), null, 2)}

      Please evaluate:
      - Handover risk and Cell congestion: Which gNB towers are heading towards congestion due to incoming UE trajectories?
      - Pre-provisioning Strategy: Which cells must allocate resources in advance to ensure the SLAs (especially URLLC UEs) are met without service degradation?
      - Policy Directive: Adjust lookahead window, RSSI triggering offsets, and specific slice resource allocations.

      Provide your policy output strictly in a structured JSON schema comprising:
      - a "reasoning" (string in clean Markdown with no markdown code fences, detailing risks, congestion analysis, and your strategies).
      - an "a1_policy" object which represents standard O-RAN A1 Policy directives to adjust Near-RT RIC xApp behavior:
        - "lookahead_window_seconds": integer (recommended lookahead window based on UE velocities, between 3 and 15 seconds)
        - "pre_provisioning_threshold_db": number (dB offset for pre-allocation, between -10 and -3 RSRP margin)
        - "slice_prioritization": a dictionary of slice types (URLLC, eMBB, mMTC) and their priority weights (range 0.0 to 1.0)
        - "congested_cell_strategies": array of objects containing cellId and traffic_steering_action (e.g. "Trigger Early handovers", "Throttle eMBB to protect URLLC", "Offload mMTC to neighboring cells")
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["reasoning", "a1_policy"],
          properties: {
            reasoning: {
              type: Type.STRING,
              description: "Expert analysis of current trajectories, handover risks, Cell QoS, and pre-provisioning decisions.",
            },
            a1_policy: {
              type: Type.OBJECT,
              required: [
                "lookahead_window_seconds",
                "pre_provisioning_threshold_db",
                "slice_prioritization",
                "congested_cell_strategies",
              ],
              properties: {
                lookahead_window_seconds: {
                  type: Type.INTEGER,
                  description: "Suggested lookup future time frame in seconds (3 - 15).",
                },
                pre_provisioning_threshold_db: {
                  type: Type.NUMBER,
                  description: "RSRP triggering offset (e.g., -6.5 dB).",
                },
                slice_prioritization: {
                  type: Type.OBJECT,
                  properties: {
                    URLLC: { type: Type.NUMBER, description: "Weight parameter from 0.0 to 1.0" },
                    eMBB: { type: Type.NUMBER, description: "Weight parameter from 0.0 to 1.0" },
                    mMTC: { type: Type.NUMBER, description: "Weight parameter from 0.0 to 1.0" },
                  },
                },
                congested_cell_strategies: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    required: ["cellId", "traffic_steering_action"],
                    properties: {
                      cellId: { type: Type.STRING },
                      traffic_steering_action: { type: Type.STRING },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const resultText = response.text || "{}";
    res.json(JSON.parse(resultText));
  } catch (error: any) {
    console.error("Gemini optimization error:", error);
    res.status(500).json({ error: error?.message || "Internal AI Optimization Error" });
  }
});

// For development, mount the Vite development server middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // For production, serve the compiled static files
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[xApp Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
