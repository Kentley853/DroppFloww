import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

// Startup Validation checks
const PRIMARY_MODEL = process.env.GEMINI_PRIMARY_MODEL || "gemini-3.5-flash";
const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || "gemini-3.1-flash-lite";

if (process.env.GEMINI_API_KEY) {
  console.log("Gemini API key configured: Yes");
} else {
  console.log("Gemini API key configured: No");
}

if (!process.env.GEMINI_PRIMARY_MODEL || !process.env.GEMINI_FALLBACK_MODEL) {
  console.warn("⚠️ [Gemini Startup Warning] Primary or fallback model config is missing in server environment variables. Please configure GEMINI_PRIMARY_MODEL and GEMINI_FALLBACK_MODEL. Defaulting to gemini-3.5-flash and gemini-3.1-flash-lite.");
}

// Initialize Gemini client lazily with modern SDK
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured on the server. Please add it in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

async function generateContentWithFallback(params: {
  contents: any;
  config?: any;
  fileName?: string;
  fileSize?: number;
}) {
  const primaryModel = process.env.GEMINI_PRIMARY_MODEL || "gemini-3.5-flash";
  const fallbackModel = process.env.GEMINI_FALLBACK_MODEL || "gemini-3.1-flash-lite";

  let lastStatus: number | string = "unknown";

  // Attempt primary model up to 3 times total (1 initial + 2 retries)
  for (let attempt = 1; attempt <= 3; attempt++) {
    const usingFallback = false;
    
    console.log("[Gemini Drawing Analysis]", {
      model: primaryModel,
      route: "/api/drawing/analyze",
      fileName: params.fileName || "text-only-test",
      fileSize: params.fileSize || 0,
      attempt,
      usingFallback,
    });

    try {
      const response = await getGeminiClient().models.generateContent({
        model: primaryModel,
        contents: params.contents,
        config: params.config,
      });
      return { response, modelUsed: primaryModel };
    } catch (err: any) {
      lastStatus = err.status || err.statusCode || (err.message?.includes("503") ? 503 : "unknown");
      console.error(`[Gemini Analysis] Primary model attempt ${attempt} failed (status: ${lastStatus}):`, err.message || err);

      const is503 = lastStatus === 503 || 
                    err.message?.toLowerCase().includes("503") || 
                    err.message?.toLowerCase().includes("high demand") || 
                    err.message?.toLowerCase().includes("overloaded") ||
                    err.message?.toLowerCase().includes("unavailable");
      
      if (!is503) {
        // Fatal non-503 error, don't retry or use fallback
        throw err;
      }
      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  }

  // Fallback attempt
  console.log("Switching to fallback model");
  const usingFallback = true;
  const attempt = 1;
  console.log("[Gemini Drawing Analysis]", {
    model: fallbackModel,
    route: "/api/drawing/analyze",
    fileName: params.fileName || "text-only-test",
    fileSize: params.fileSize || 0,
    attempt,
    usingFallback,
  });

  try {
    const response = await getGeminiClient().models.generateContent({
      model: fallbackModel,
      contents: params.contents,
      config: params.config,
    });
    return { response, modelUsed: fallbackModel };
  } catch (err: any) {
    lastStatus = err.status || err.statusCode || (err.message?.includes("503") ? 503 : "unknown");
    console.error(`[Gemini Analysis] Fallback model failed (status: ${lastStatus}):`, err.message || err);
    
    const is503 = lastStatus === 503 || 
                  err.message?.toLowerCase().includes("503") || 
                  err.message?.toLowerCase().includes("high demand") || 
                  err.message?.toLowerCase().includes("overloaded") ||
                  err.message?.toLowerCase().includes("unavailable");

    if (is503) {
      throw new Error(
        "AI drawing analysis is currently unavailable for the configured Gemini models.\n\n" +
        "Your drawing is saved safely.\n" +
        "The system could not obtain a response from either the primary or fallback model.\n\n" +
        "Please try again later or ask an administrator to configure another available vision-capable Gemini model."
      );
    } else {
      throw err;
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload limit to allow large drawings (PDF/images) to be uploaded as base64
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Real drawing analysis API route supporting both standard and legacy endpoints
  app.post(["/api/ded/analyze-page", "/api/analyze"], async (req, res) => {
    try {
      const { fileName, fileType, fileSize, fileHash, fileBytes } = req.body;

      if (!fileBytes) {
        return res.status(400).json({ error: "Missing uploaded file bytes." });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          error: "GEMINI_API_KEY is not configured on the server. Please add it in Settings > Secrets."
        });
      }

      // Map MIME type
      let mimeType = fileType || "image/png";
      if (fileName?.toLowerCase().endsWith(".pdf")) {
        mimeType = "application/pdf";
      } else if (fileName?.toLowerCase().endsWith(".jpg") || fileName?.toLowerCase().endsWith(".jpeg")) {
        mimeType = "image/jpeg";
      }

      const systemInstruction = `You are an expert hydraulic and water infrastructure design engineer.
Analyze the uploaded pipeline drawing, layout plan, scanned hand-drawn sketch, or CAD-exported PDF.
Extract ONLY true visible facts. Do not guess diameter, materials, route lengths, or status unless they are visible in labels, legend, or text.

CRITICAL EXTRACTION DIRECTIVES:
1. LEGEND: Always look first at the legend to see how different colors or line styles (solid vs dashed) correspond to Proposed/New vs Existing pipelines.
2. COORDINATES: For every pipe, valve, meter, or structure, calculate its location normalized to percentage boundaries (0 to 100) on the final rendering canvas. Provide: x, y, width, height. Keep them accurate so we can draw highlights over them!
3. PIPES: Detect lines and trace routes. Identify Route Order (Main Line -> branches -> services) and segments.
4. CONFIDENCE: For fields, assign confidence. If confidence is below 90% (0.90) or Handwriting is unclear, mark "requires_engineer_confirmation": true and "Unknown - Engineer Confirmation Required" for missing values.
5. NO SAMPLE DADA: NEVER repeat the Kelapa Gading sample S-01 mock data unless it is literally drawn in the uploaded image. Extract exactly what is visible!
6. PDF: If multi-page PDF is analyzed, state the correct Drawing Page for every segment/element.`;

      console.log(`Sending file "${fileName}" (${fileSize} bytes, type ${mimeType}) to Gemini...`);

      const imagePart = {
        inlineData: {
          mimeType: mimeType,
          data: fileBytes,
        },
      };

      const textPart = {
        text: `Analyze the water pipeline network diagram or sketch attached as filename "${fileName}". 
Extract:
1. Legend interpretations (symbols and line style meanings)
2. Pipe segments (material, diameter, length, status, route/road reference, coordinates, confidence)
3. Appurtenances (gate valves, air valves, meters, washouts, tees, etc.)
4. Structures (valve chambers, manholes, thrust blocks)
5. Unclear handwriting/labels that require manual engineering review.`,
      };

      const { response, modelUsed: modelName } = await generateContentWithFallback({
        contents: [imagePart, textPart],
        fileName,
        fileSize,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            required: [
              "analysis_run_id",
              "file_hash",
              "source_file_name",
              "drawing_pages_analyzed",
              "legend_interpretation",
              "pipe_segments",
              "appurtenances",
              "structures",
              "unclear_items",
              "analysis_notes"
            ],
            properties: {
              analysis_run_id: { type: Type.STRING },
              file_hash: { type: Type.STRING },
              source_file_name: { type: Type.STRING },
              drawing_pages_analyzed: {
                type: Type.ARRAY,
                items: { type: Type.INTEGER }
              },
              legend_interpretation: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  required: ["symbol_or_line_style", "interpreted_meaning", "confidence_score", "requires_engineer_confirmation"],
                  properties: {
                    symbol_or_line_style: { type: Type.STRING },
                    interpreted_meaning: { type: Type.STRING },
                    confidence_score: { type: Type.NUMBER },
                    requires_engineer_confirmation: { type: Type.BOOLEAN }
                  }
                }
              },
              pipe_segments: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  required: [
                    "segment_id", "drawing_page", "start_node", "end_node", "pipe_status",
                    "pipe_material", "diameter", "length_m", "length_source_text", "unit",
                    "installation_method", "surface_type", "ground_condition", "route_reference",
                    "line_style", "drawing_evidence", "source_coordinates", "field_confidence",
                    "overall_confidence_score", "requires_engineer_confirmation"
                  ],
                  properties: {
                    segment_id: { type: Type.STRING },
                    drawing_page: { type: Type.INTEGER },
                    start_node: { type: Type.STRING },
                    end_node: { type: Type.STRING },
                    pipe_status: { type: Type.STRING }, // Existing | Proposed | New | Replacement | Unknown
                    pipe_material: { type: Type.STRING },
                    diameter: { type: Type.STRING },
                    length_m: { type: Type.NUMBER },
                    length_source_text: { type: Type.STRING },
                    unit: { type: Type.STRING },
                    installation_method: { type: Type.STRING }, // Open Cut | Bore | HDD | Existing Duct | Unknown
                    surface_type: { type: Type.STRING }, // Asphalt | Concrete | Paving Block | Unpaved | Unknown
                    ground_condition: { type: Type.STRING }, // Normal Soil | Hard Soil | Rock | Groundwater | Unknown
                    route_reference: { type: Type.STRING },
                    line_style: { type: Type.STRING },
                    drawing_evidence: { type: Type.STRING },
                    source_coordinates: {
                      type: Type.OBJECT,
                      required: ["x", "y", "width", "height"],
                      properties: {
                        x: { type: Type.NUMBER },
                        y: { type: Type.NUMBER },
                        width: { type: Type.NUMBER },
                        height: { type: Type.NUMBER }
                      }
                    },
                    field_confidence: {
                      type: Type.OBJECT,
                      required: ["status", "material", "diameter", "length", "method"],
                      properties: {
                        status: { type: Type.NUMBER },
                        material: { type: Type.NUMBER },
                        diameter: { type: Type.NUMBER },
                        length: { type: Type.NUMBER },
                        method: { type: Type.NUMBER }
                      }
                    },
                    overall_confidence_score: { type: Type.NUMBER },
                    requires_engineer_confirmation: { type: Type.BOOLEAN }
                  }
                }
              },
              appurtenances: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  required: [
                    "type", "quantity", "diameter", "linked_segment_id", "drawing_page",
                    "source_coordinates", "confidence_score", "requires_engineer_confirmation", "drawing_evidence"
                  ],
                  properties: {
                    type: { type: Type.STRING },
                    quantity: { type: Type.INTEGER },
                    diameter: { type: Type.STRING },
                    linked_segment_id: { type: Type.STRING },
                    drawing_page: { type: Type.INTEGER },
                    source_coordinates: {
                      type: Type.OBJECT,
                      required: ["x", "y", "width", "height"],
                      properties: {
                        x: { type: Type.NUMBER },
                        y: { type: Type.NUMBER },
                        width: { type: Type.NUMBER },
                        height: { type: Type.NUMBER }
                      }
                    },
                    confidence_score: { type: Type.NUMBER },
                    requires_engineer_confirmation: { type: Type.BOOLEAN },
                    drawing_evidence: { type: Type.STRING }
                  }
                }
              },
              structures: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  required: [
                    "type", "quantity", "linked_segment_id", "drawing_page",
                    "source_coordinates", "confidence_score", "requires_engineer_confirmation", "drawing_evidence"
                  ],
                  properties: {
                    type: { type: Type.STRING },
                    quantity: { type: Type.INTEGER },
                    linked_segment_id: { type: Type.STRING },
                    drawing_page: { type: Type.INTEGER },
                    source_coordinates: {
                      type: Type.OBJECT,
                      required: ["x", "y", "width", "height"],
                      properties: {
                        x: { type: Type.NUMBER },
                        y: { type: Type.NUMBER },
                        width: { type: Type.NUMBER },
                        height: { type: Type.NUMBER }
                      }
                    },
                    confidence_score: { type: Type.NUMBER },
                    requires_engineer_confirmation: { type: Type.BOOLEAN },
                    drawing_evidence: { type: Type.STRING }
                  }
                }
              },
              unclear_items: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              analysis_notes: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            }
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("No response output returned from the Gemini vision model.");
      }

      const parsed = JSON.parse(responseText.trim());

      // Inject matching fields if missing
      parsed.analysis_run_id = parsed.analysis_run_id || `run-${Date.now()}`;
      parsed.file_hash = parsed.file_hash || fileHash;
      parsed.source_file_name = parsed.source_file_name || fileName;
      parsed.drawing_pages_analyzed = parsed.drawing_pages_analyzed || [1];

      res.json({
        success: true,
        data: parsed,
        metadata: {
          modelName,
          promptVersion: "1.0",
          timestamp: new Date().toISOString(),
          fileHash,
          fileName
        }
      });

    } catch (error: any) {
      console.error("Analysis route error:", error);
      res.status(500).json({ error: error.message || "Unknown error occurred on the server." });
    }
  });

  // Health-test endpoint before drawing analysis
  app.post("/api/ai/health-test", async (req, res) => {
    const { testModel } = req.body || {};
    const apiKeyConfigured = process.env.GEMINI_API_KEY ? "Configured" : "Missing";
    const primaryModel = process.env.GEMINI_PRIMARY_MODEL || "gemini-3.5-flash";
    const fallbackModel = process.env.GEMINI_FALLBACK_MODEL || "gemini-3.1-flash-lite";

    let primaryStatus = "Not Run";
    let fallbackStatus = "Not Run";
    let lastStatus: number | string = "unknown";

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        success: false,
        report: `Gemini API Key: Missing
Primary Model: ${primaryModel}
Primary Text Test: Failed
Fallback Model: ${fallbackModel}
Fallback Text Test: Failed
Last HTTP Status: 401`
      });
    }

    const runPrimaryTest = async () => {
      try {
        console.log(`[Health Test] Testing primary model ${primaryModel}...`);
        const response = await getGeminiClient().models.generateContent({
          model: primaryModel,
          contents: "Reply only with: AI connection successful."
        });
        if (response.text && response.text.toLowerCase().includes("successful")) {
          primaryStatus = "Passed";
          lastStatus = 200;
        } else {
          primaryStatus = "Failed";
          lastStatus = 200;
        }
      } catch (err: any) {
        lastStatus = err.status || err.statusCode || (err.message?.includes("503") ? 503 : "Failed");
        console.error(`[Health Test] Primary model failed:`, err.message || err);
        primaryStatus = "Failed";
      }
    };

    const runFallbackTest = async () => {
      try {
        console.log(`[Health Test] Testing fallback model ${fallbackModel}...`);
        const response = await getGeminiClient().models.generateContent({
          model: fallbackModel,
          contents: "Reply only with: AI connection successful."
        });
        if (response.text && response.text.toLowerCase().includes("successful")) {
          fallbackStatus = "Passed";
          lastStatus = 200;
        } else {
          fallbackStatus = "Failed";
          lastStatus = 200;
        }
      } catch (err: any) {
        lastStatus = err.status || err.statusCode || (err.message?.includes("503") ? 503 : "Failed");
        console.error(`[Health Test] Fallback model failed:`, err.message || err);
        fallbackStatus = "Failed";
      }
    };

    if (testModel === "primary") {
      await runPrimaryTest();
    } else if (testModel === "fallback") {
      await runFallbackTest();
    } else {
      // Default: run primary, then test fallback only if primary fails
      await runPrimaryTest();
      if (primaryStatus !== "Passed") {
        await runFallbackTest();
      }
    }

    const report = `Gemini API Key: ${apiKeyConfigured}
Primary Model: ${primaryModel}
Primary Text Test: ${primaryStatus}
Fallback Model: ${fallbackModel}
Fallback Text Test: ${fallbackStatus}
Last HTTP Status: ${lastStatus}`;

    res.json({
      success: true,
      primaryStatus,
      fallbackStatus,
      lastStatus,
      report
    });
  });

  // Vite Middleware or Static Assets serving based on Environment
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server launched successfully at http://0.0.0.0:${PORT}`);
    if (process.env.GEMINI_API_KEY) {
      console.log("Gemini API key configured: Yes");
    } else {
      console.log("Gemini API key configured: No");
    }
  });
}

startServer().catch((error) => {
  console.error("Failed to start fullstack server:", error);
});
