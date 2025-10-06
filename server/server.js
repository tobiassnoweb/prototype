"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const cors_1 = __importDefault(require("cors"));
const polyservice_1 = require("polyservice");
const polyexpress_1 = __importStar(require("polyexpress"));
// Load configuration
const configPath = path.join(__dirname, 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const DB_PATH = {
    interventions: path.join(__dirname, config.database.interventions_path),
    symptoms: path.join(__dirname, config.database.symptoms_path)
};
// Utility functions for file operations
const readJsonFile = (filePath) => {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [parsed];
    }
    catch (error) {
        return [];
    }
};
const writeJsonFile = (filePath, data) => {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};
const generateId = (items) => {
    return items.length > 0 ? Math.max(...items.map(item => item.id)) + 1 : 1;
};
const getAllInterventions = {
    name: "getAll",
    request: polyexpress_1.requestType.GET,
    arguments: {},
    callback: function () {
        const data = readJsonFile(DB_PATH.interventions);
        return {
            code: 200,
            message: data
        };
    }
};
const getInterventionById = {
    name: "getById",
    request: polyexpress_1.requestType.GET,
    arguments: {
        id: { type: "number|string", requestMethod: polyexpress_1.requestMethod.PARAM }
    },
    callback: function (id) {
        id = typeof id === 'string' ? Number(id) : id;
        const interventions = readJsonFile(DB_PATH.interventions);
        const intervention = interventions.find(item => item.id === id);
        if (!intervention) {
            return {
                code: 404,
                message: "Intervention not found"
            };
        }
        return {
            code: 200,
            message: intervention
        };
    }
};
const createIntervention = {
    name: "create",
    request: polyexpress_1.requestType.POST,
    arguments: {
        name: { type: "string", requestMethod: polyexpress_1.requestMethod.JSON },
        description: { type: "string", requestMethod: polyexpress_1.requestMethod.JSON },
        severity: { type: "object", requestMethod: polyexpress_1.requestMethod.JSON },
        product_link: { type: "string", requestMethod: polyexpress_1.requestMethod.JSON },
        product_image: { type: "string", requestMethod: polyexpress_1.requestMethod.JSON },
        likes: { type: "number", requestMethod: polyexpress_1.requestMethod.JSON },
        dislikes: { type: "number", requestMethod: polyexpress_1.requestMethod.JSON },
        SOS: { type: "boolean|undefined", requestMethod: polyexpress_1.requestMethod.JSON }
    },
    callback: function (name, description, severity, product_link, product_image, likes, dislikes, SOS) {
        const interventions = readJsonFile(DB_PATH.interventions);
        const newIntervention = Object.assign({ id: generateId(interventions), name,
            description,
            severity,
            product_link,
            product_image,
            likes,
            dislikes }, (SOS !== undefined && { SOS }));
        interventions.push(newIntervention);
        writeJsonFile(DB_PATH.interventions, interventions);
        return {
            code: 201,
            message: newIntervention
        };
    }
};
const updateIntervention = {
    name: "update",
    request: polyexpress_1.requestType.PUT,
    arguments: {
        id: { type: "number|string", requestMethod: polyexpress_1.requestMethod.PARAM },
        name: { type: "string", requestMethod: polyexpress_1.requestMethod.JSON },
        description: { type: "string", requestMethod: polyexpress_1.requestMethod.JSON },
        severity: { type: "object", requestMethod: polyexpress_1.requestMethod.JSON },
        product_link: { type: "string", requestMethod: polyexpress_1.requestMethod.JSON },
        product_image: { type: "string", requestMethod: polyexpress_1.requestMethod.JSON },
        likes: { type: "number", requestMethod: polyexpress_1.requestMethod.JSON },
        dislikes: { type: "number", requestMethod: polyexpress_1.requestMethod.JSON },
        SOS: { type: "boolean|undefined", requestMethod: polyexpress_1.requestMethod.JSON }
    },
    callback: function (id, name, description, severity, product_link, product_image, likes, dislikes, SOS) {
        id = typeof id === 'string' ? Number(id) : id;
        const interventions = readJsonFile(DB_PATH.interventions);
        const index = interventions.findIndex(item => item.id === id);
        if (index === -1) {
            return {
                code: 404,
                message: "Intervention not found"
            };
        }
        const updatedIntervention = Object.assign({ id, name, description, severity, product_link, product_image, likes, dislikes }, (SOS !== undefined && { SOS }));
        interventions[index] = updatedIntervention;
        writeJsonFile(DB_PATH.interventions, interventions);
        return {
            code: 200,
            message: updatedIntervention
        };
    }
};
const deleteIntervention = {
    name: "delete",
    request: polyexpress_1.requestType.DELETE,
    arguments: {
        id: { type: "number|string", requestMethod: polyexpress_1.requestMethod.PARAM }
    },
    callback: function (id) {
        id = typeof id === 'string' ? Number(id) : id;
        const interventions = readJsonFile(DB_PATH.interventions);
        const index = interventions.findIndex(item => item.id === id);
        if (index === -1) {
            return {
                code: 404,
                message: "Intervention not found"
            };
        }
        const deleted = interventions.splice(index, 1)[0];
        writeJsonFile(DB_PATH.interventions, interventions);
        return {
            code: 200,
            message: deleted
        };
    }
};
const interventionsService = {
    name: 'interventions',
    method: [getAllInterventions, getInterventionById, createIntervention, updateIntervention, deleteIntervention],
    controller: polyexpress_1.web
};
const getAllSymptoms = {
    name: "getAll",
    request: polyexpress_1.requestType.GET,
    callback: function () {
        const data = readJsonFile(DB_PATH.symptoms);
        return {
            code: 200,
            message: data
        };
    }
};
const getSymptomById = {
    name: "getById",
    request: polyexpress_1.requestType.GET,
    arguments: {
        id: { type: "number|string", requestMethod: polyexpress_1.requestMethod.PARAM }
    },
    callback: function (id) {
        id = typeof id === 'string' ? Number(id) : id;
        const symptoms = readJsonFile(DB_PATH.symptoms);
        const symptom = symptoms.find(item => item.id === id);
        if (!symptom) {
            return {
                code: 404,
                message: "Symptom not found"
            };
        }
        return {
            code: 200,
            message: symptom
        };
    }
};
const createSymptom = {
    name: "create",
    request: polyexpress_1.requestType.POST,
    arguments: {
        name: { type: "string", requestMethod: polyexpress_1.requestMethod.JSON },
        description: { type: "string", requestMethod: polyexpress_1.requestMethod.JSON },
        interventions: { type: "object", requestMethod: polyexpress_1.requestMethod.JSON }
    },
    callback: function (name, description, interventions) {
        const symptoms = readJsonFile(DB_PATH.symptoms);
        const newSymptom = {
            id: generateId(symptoms),
            name,
            description,
            interventions
        };
        symptoms.push(newSymptom);
        writeJsonFile(DB_PATH.symptoms, symptoms);
        return {
            code: 201,
            message: newSymptom
        };
    }
};
const updateSymptom = {
    name: "update",
    request: polyexpress_1.requestType.PUT,
    arguments: {
        id: { type: "number|string", requestMethod: polyexpress_1.requestMethod.JSON },
        name: { type: "string", requestMethod: polyexpress_1.requestMethod.JSON },
        description: { type: "string", requestMethod: polyexpress_1.requestMethod.JSON },
        interventions: { type: "object", requestMethod: polyexpress_1.requestMethod.JSON }
    },
    callback: function (id, name, description, interventions) {
        const symptoms = readJsonFile(DB_PATH.symptoms);
        const index = symptoms.findIndex(item => item.id === id);
        if (index === -1) {
            return {
                code: 404,
                message: "Symptom not found"
            };
        }
        const updatedSymptom = { id, name, description, interventions };
        symptoms[index] = updatedSymptom;
        writeJsonFile(DB_PATH.symptoms, symptoms);
        return {
            code: 200,
            message: updatedSymptom
        };
    }
};
const deleteSymptom = {
    name: "delete",
    request: polyexpress_1.requestType.DELETE,
    arguments: {
        id: { type: "number|string", requestMethod: polyexpress_1.requestMethod.PARAM }
    },
    callback: function (id) {
        id = typeof id === 'string' ? Number(id) : id;
        const symptoms = readJsonFile(DB_PATH.symptoms);
        const index = symptoms.findIndex(item => item.id === id);
        if (index === -1) {
            return {
                code: 404,
                message: "Symptom not found"
            };
        }
        const deleted = symptoms.splice(index, 1)[0];
        writeJsonFile(DB_PATH.symptoms, symptoms);
        return {
            code: 200,
            message: deleted
        };
    }
};
const symptomsService = {
    name: 'symptoms',
    method: [getAllSymptoms, getSymptomById, createSymptom, updateSymptom, deleteSymptom],
    controller: polyexpress_1.web
};
polyservice_1.polyservice.use((0, cors_1.default)());
polyservice_1.polyservice.use(polyexpress_1.default.json());
polyservice_1.polyservice.use(polyexpress_1.default.urlencoded({ extended: true }));
// Register services
polyservice_1.polyservice.register(interventionsService);
polyservice_1.polyservice.register(symptomsService);
// Start the server
const PORT = process.env.PORT || config.server.port;
console.log(`Server starting on ${config.server.host}:${PORT}`);
polyservice_1.polyservice.init({ httplistener: polyservice_1.HttpListener });
polyservice_1.HttpListener.Instance.Listen(PORT);
