import * as fs from "fs";
import * as path from "path";
import cors from "cors";
import { polyservice, result, service, HttpListener } from "polyservice";
import express, {
  web,
  requestMethod,
  webMethod,
  requestType,
  app,
} from "polyexpress";
import aichatService from "./aichat";

// Load configuration
const configPath = path.join(__dirname, "config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

import { Intervention, Symptom } from "./server-types";

const DB_PATH = {
  interventions: path.join(__dirname, config.database.interventions_path),
  symptoms: path.join(__dirname, config.database.symptoms_path),
};

// Utility functions for file operations
const readJsonFile = (filePath: string): any[] => {
  try {
    const data = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (error) {
    return [];
  }
};

const writeJsonFile = (filePath: string, data: any[]): void => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

const generateId = (items: any[]): number => {
  return items.length > 0 ? Math.max(...items.map((item) => item.id)) + 1 : 1;
};

const getAllInterventions: webMethod = {
  name: "getAll",
  request: requestType.GET,
  arguments: {},
  callback: function (): result {
    const data = readJsonFile(DB_PATH.interventions);
    return {
      code: 200,
      message: data,
    };
  },
};

const getInterventionById: webMethod = {
  name: "getById",
  request: requestType.GET,
  arguments: {
    id: { type: "number|string", requestMethod: requestMethod.PARAM },
  },
  callback: function (id: number): result {
    id = typeof id === "string" ? Number(id) : id;
    const interventions = readJsonFile(DB_PATH.interventions);
    const intervention = interventions.find((item) => item.id === id);
    if (!intervention) {
      return {
        code: 404,
        message: "Intervention not found",
      };
    }
    return {
      code: 200,
      message: intervention,
    };
  },
};

const createIntervention: webMethod = {
  name: "create",
  request: requestType.POST,
  arguments: {
    name: { type: "string", requestMethod: requestMethod.JSON },
    description: { type: "string", requestMethod: requestMethod.JSON },
    severity: { type: "object", requestMethod: requestMethod.JSON },
    product_link: { type: "string", requestMethod: requestMethod.JSON },
    product_image: { type: "string", requestMethod: requestMethod.JSON },
    likes: { type: "number", requestMethod: requestMethod.JSON },
    dislikes: { type: "number", requestMethod: requestMethod.JSON },
    SOS: { type: "boolean|undefined", requestMethod: requestMethod.JSON },
  },
  callback: function (
    name: string,
    description: string,
    severity: string[],
    product_link: string,
    product_image: string,
    likes: number,
    dislikes: number,
    SOS: boolean
  ): result {
    const interventions = readJsonFile(DB_PATH.interventions);
    const newIntervention = {
      id: generateId(interventions),
      name,
      description,
      severity,
      product_link,
      product_image,
      likes,
      dislikes,
      ...(SOS !== undefined && { SOS }),
    };
    interventions.push(newIntervention);
    writeJsonFile(DB_PATH.interventions, interventions);
    return {
      code: 201,
      message: newIntervention,
    };
  },
};

const updateIntervention: webMethod = {
  name: "update",
  request: requestType.PUT,
  arguments: {
    id: { type: "number|string", requestMethod: requestMethod.PARAM },
    name: { type: "string", requestMethod: requestMethod.JSON },
    description: { type: "string", requestMethod: requestMethod.JSON },
    severity: { type: "object", requestMethod: requestMethod.JSON },
    product_link: { type: "string", requestMethod: requestMethod.JSON },
    product_image: { type: "string", requestMethod: requestMethod.JSON },
    likes: { type: "number", requestMethod: requestMethod.JSON },
    dislikes: { type: "number", requestMethod: requestMethod.JSON },
    SOS: { type: "boolean|undefined", requestMethod: requestMethod.JSON },
  },
  callback: function (
    id: number,
    name: string,
    description: string,
    severity: string[],
    product_link: string,
    product_image: string,
    likes: number,
    dislikes: number,
    SOS: boolean
  ): result {
    id = typeof id === "string" ? Number(id) : id;
    const interventions = readJsonFile(DB_PATH.interventions);
    const index = interventions.findIndex((item) => item.id === id);
    if (index === -1) {
      return {
        code: 404,
        message: "Intervention not found",
      };
    }
    const updatedIntervention = {
      id,
      name,
      description,
      severity,
      product_link,
      product_image,
      likes,
      dislikes,
      ...(SOS !== undefined && { SOS }),
    };
    interventions[index] = updatedIntervention;
    writeJsonFile(DB_PATH.interventions, interventions);
    return {
      code: 200,
      message: updatedIntervention,
    };
  },
};

const deleteIntervention: webMethod = {
  name: "delete",
  request: requestType.DELETE,
  arguments: {
    id: { type: "number|string", requestMethod: requestMethod.PARAM },
  },
  callback: function (id: number): result {
    id = typeof id === "string" ? Number(id) : id;
    const interventions = readJsonFile(DB_PATH.interventions);
    const index = interventions.findIndex((item) => item.id === id);
    if (index === -1) {
      return {
        code: 404,
        message: "Intervention not found",
      };
    }
    const deleted = interventions.splice(index, 1)[0];
    writeJsonFile(DB_PATH.interventions, interventions);
    return {
      code: 200,
      message: deleted,
    };
  },
};

const interventionsService: service = {
  name: "interventions",
  method: [
    getAllInterventions,
    getInterventionById,
    createIntervention,
    updateIntervention,
    deleteIntervention,
  ],
  controller: web,
};

const getAllSymptoms: webMethod = {
  name: "getAll",
  request: requestType.GET,
  callback: function (): result {
    const data = readJsonFile(DB_PATH.symptoms);
    return {
      code: 200,
      message: data,
    };
  },
};

const getSymptomById: webMethod = {
  name: "getById",
  request: requestType.GET,
  arguments: {
    id: { type: "number|string", requestMethod: requestMethod.PARAM },
  },
  callback: function (id: number): result {
    id = typeof id === "string" ? Number(id) : id;
    const symptoms = readJsonFile(DB_PATH.symptoms);
    const symptom = symptoms.find((item) => item.id === id);
    if (!symptom) {
      return {
        code: 404,
        message: "Symptom not found",
      };
    }
    return {
      code: 200,
      message: symptom,
    };
  },
};

const createSymptom: webMethod = {
  name: "create",
  request: requestType.POST,
  arguments: {
    name: { type: "string", requestMethod: requestMethod.JSON },
    description: { type: "string", requestMethod: requestMethod.JSON },
    interventions: { type: "object", requestMethod: requestMethod.JSON },
  },
  callback: function (
    name: string,
    description: string,
    interventions: number[]
  ): result {
    const symptoms = readJsonFile(DB_PATH.symptoms);
    const newSymptom = {
      id: generateId(symptoms),
      name,
      description,
      interventions,
    };
    symptoms.push(newSymptom);
    writeJsonFile(DB_PATH.symptoms, symptoms);
    return {
      code: 201,
      message: newSymptom,
    };
  },
};

const updateSymptom: webMethod = {
  name: "update",
  request: requestType.PUT,
  arguments: {
    id: { type: "number|string", requestMethod: requestMethod.JSON },
    name: { type: "string", requestMethod: requestMethod.JSON },
    description: { type: "string", requestMethod: requestMethod.JSON },
    interventions: { type: "object", requestMethod: requestMethod.JSON },
  },
  callback: function (
    id: number,
    name: string,
    description: string,
    interventions: number[]
  ): result {
    const symptoms = readJsonFile(DB_PATH.symptoms);
    const index = symptoms.findIndex((item) => item.id === id);
    if (index === -1) {
      return {
        code: 404,
        message: "Symptom not found",
      };
    }
    const updatedSymptom = { id, name, description, interventions };
    symptoms[index] = updatedSymptom;
    writeJsonFile(DB_PATH.symptoms, symptoms);
    return {
      code: 200,
      message: updatedSymptom,
    };
  },
};

const deleteSymptom: webMethod = {
  name: "delete",
  request: requestType.DELETE,
  arguments: {
    id: { type: "number|string", requestMethod: requestMethod.PARAM },
  },
  callback: function (id: number): result {
    id = typeof id === "string" ? Number(id) : id;
    const symptoms = readJsonFile(DB_PATH.symptoms);
    const index = symptoms.findIndex((item) => item.id === id);
    if (index === -1) {
      return {
        code: 404,
        message: "Symptom not found",
      };
    }
    const deleted = symptoms.splice(index, 1)[0];
    writeJsonFile(DB_PATH.symptoms, symptoms);
    return {
      code: 200,
      message: deleted,
    };
  },
};

const symptomsService: service = {
  name: "symptoms",
  method: [
    getAllSymptoms,
    getSymptomById,
    createSymptom,
    updateSymptom,
    deleteSymptom,
  ],
  controller: web,
};

polyservice.use(cors());
polyservice.use(express.json());
polyservice.use(express.urlencoded({ extended: true }));
// Register services
polyservice.register(interventionsService);
polyservice.register(symptomsService);
polyservice.register(aichatService);

// Start the server
const PORT = process.env.PORT || config.server.port;
console.log(`Server starting on ${config.server.host}:${PORT}`);

polyservice.init({ httplistener: HttpListener });
// Expose a short /aichat route for the client (client expects POST /aichat)
try {
  // require polyexpress again to get the actual app instance after initialization
  const polyexpressRuntime = require("polyexpress");
  const expressApp =
    (polyexpressRuntime && polyexpressRuntime.app) ||
    (polyexpressRuntime &&
      polyexpressRuntime.default &&
      polyexpressRuntime.default.app) ||
    (app as any);
  console.log("Attaching explicit /aichat route to runtime express app", {
    hasApp: !!expressApp,
  });
  expressApp.post("/aichat", async (req: any, res: any) => {
    try {
      console.log("/aichat POST received", {
        body: req.body && Object.keys(req.body).length ? req.body : null,
      });
      const body = req.body || {};
      const svc: any = require("./aichat").default || null;
      if (!svc || !svc.method || !svc.method[0] || !svc.method[0].callback) {
        return res
          .status(500)
          .json({ code: 500, message: "AI service unavailable" });
      }
      const cb = svc.method[0].callback;
      const result = await cb(body.message, body.conversationHistory);
      console.log("/aichat result code", result && result.code);
      return res.status(result.code || 200).json(result);
    } catch (err: any) {
      console.error("/aichat handler error", err);
      return res.status(500).json({
        code: 500,
        message: String(err && err.message ? err.message : err),
      });
    }
  });
  // simple health check for diagnostics
  expressApp.get("/aichat/health", (req: any, res: any) => {
    res.json({ ok: true });
  });
} catch (e) {
  console.error("Failed to attach /aichat route", e);
}

HttpListener.Instance.Listen(PORT);
