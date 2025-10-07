import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import { URL } from "url";
import { result, service } from "polyservice";
import { web, requestType, requestMethod } from "polyexpress";
import { Intervention, Symptom } from "./server-types";
import { ruleParse } from "./util";

const CONFIG_PATH = path.join(__dirname, "config.json");
let config: any = {
  database: {
    symptoms_path: "db/symptoms.json",
    interventions_path: "db/interventions.json",
  },
};
try {
  config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
} catch (e) {
  // ignore, fallback to defaults above
}

const DB_PATH = {
  symptoms: path.join(__dirname, config.database.symptoms_path),
  interventions: path.join(__dirname, config.database.interventions_path),
};

const readJsonFile = (filePath: string): any[] => {
  try {
    const data = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (error) {
    return [];
  }
};

const callGemini = async (
  prompt: string,
  apiKey: string,
  conversationHistory?: string[]
): Promise<string | null> => {
  if (!apiKey) return null;
  // Prepend conversation history to prompt if provided
  let finalPrompt = prompt;
  if (conversationHistory && conversationHistory.length > 0) {
    const ctx = conversationHistory
      .filter((value) => value.startsWith("user"))!
      .join("\n");
    finalPrompt = `Conversation history:\n${ctx}\n\n${prompt}`;
  }

  // Try v1beta2 generateText endpoint with API key param
  const endpoint = new URL(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${encodeURIComponent(
      apiKey
    )}`
  );
  const body = JSON.stringify({
    contents: [
      {
        parts: [
          {
            text: finalPrompt,
          },
        ],
      },
    ],
    generationConfig: {
      maxOutputTokens: 2048,
      temperature: 0.7,
    },
  });
  console.log(`Gemeni Request ${body}`);
  return new Promise((resolve) => {
    const req = https.request(
      endpoint,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            console.log(`Gemeni Response ${data}`);
            const parsed = JSON.parse(data);
            // Attempt to extract text from common response shapes
            // v1beta may return { "candidates": [ {"content": {"parts": [{"text": "..."}]}} ] }
            if (parsed && typeof parsed === "object") {
              if (
                parsed.candidates &&
                Array.isArray(parsed.candidates) &&
                parsed.candidates[0] &&
                parsed.candidates[0].content &&
                parsed.candidates[0].content.parts &&
                Array.isArray(parsed.candidates[0].content.parts) &&
                parsed.candidates[0].content.parts[0] &&
                parsed.candidates[0].content.parts[0].text
              ) {
                return resolve(parsed.candidates[0].content.parts[0].text);
              }

              // v1beta2 may return { "candidates": [ {"output": "..."} ] } or other shapes
              if (
                parsed.candidates &&
                parsed.candidates[0] &&
                parsed.candidates[0].output
              ) {
                return resolve(parsed.candidates[0].output);
              }
              if (parsed.output && typeof parsed.output === "string") {
                return resolve(parsed.output);
              }
              // newer shapes
              if (
                parsed.results &&
                parsed.results[0] &&
                parsed.results[0].content
              ) {
                // content might be array
                const c = parsed.results[0].content;
                if (Array.isArray(c)) {
                  const t = c.map((it: any) => it.text || it).join("");
                  return resolve(t);
                }
                return resolve(String(c));
              }
            }
            return resolve(null);
          } catch (e) {
            return resolve(null);
          }
        });
      }
    );
    req.on("error", () => resolve(null));
    req.write(body);
    req.end();
  });
};

const aichatMethod = {
  name: "chat",
  request: requestType.POST,
  arguments: {
    // Expect a JSON body: { message: string, conversationHistory?: string[] }
    message: { type: "string", requestMethod: requestMethod.JSON }, // JSON body
    conversationHistory: {
      type: "object",
      requestMethod: requestMethod.JSON,
      optional: true,
    },
  },
  callback: async function (
    message: string,
    conversationHistory: any
  ): Promise<result> {
    try {
      const symptomsList: Symptom[] = readJsonFile(
        DB_PATH.symptoms
      ) as Symptom[];
      const interventionsList: Intervention[] = readJsonFile(
        DB_PATH.interventions
      ) as Intervention[];

      const envKey = process.env.GEMINI_API_KEY;

      // Robustly accept several incoming body shapes:
      // - { message: string, conversationHistory?: string[] }
      // - plain string (legacy) -> treated as message
      // - stringified JSON (possibly concatenated JSON objects) -> extract first JSON object
      // - wrapper objects (e.g. { body: '...json...' })
      //const rawInput = body;
      //   let parsedBody: {
      //     message?: string;
      //     conversationHistory?: string[];
      //   } | null = null;

      const tryParseJson = (s: string) => {
        // extract first {...} block (non-greedy)
        const m = s.match(/\{[\s\S]*?\}/);
        if (m) {
          try {
            return JSON.parse(m[0]);
          } catch (e) {
            return null;
          }
        }
        return null;
      };
      let userText = String(message);

      const availableSymptoms = symptomsList
        .map((s) => `  - "${s.name}"`)
        .join("\n");
      console.log("availableSymptoms", availableSymptoms);
      // Compose prompt for model
      const prompt = `
You are a medical assistant AI. 
Your task is to extract structured medical information **based solely on the user's messages** below. 
Do not make assumptions. Only analyze what the user actually said.

---

### 🧍‍♀️ User Message
"${userText.replace(/"/g, '\\"')}"

You must base all output strictly on this message.
### ✅ Available Symptoms
Match with the symptoms that match one of the following **or similar words / synonyms**:
- "coughing"
- "fever"
- "sore throat"
- "sores"
- "rash"
- "constipation"
- "weakness"
If you don't find the symptom or severity in the user message, then look in the Conversation history 
---

### 🚨 Output Format: STRICT ADHERENCE REQUIRED
You MUST return ONLY a **single JSON object**.
The JSON object MUST start with \{ and end with \}.
It MUST exactly match the following structure, including all keys:

json
\{
  "symptoms": ["list of symptom names (from 'Allowed Symptoms') that best match the user message", "another symptom if present"],
  "severity": "mild" | "moderate" | "severe" | null,
  "duration": "a concise phrase like 'for three days'" | null
\}


### 🧠 Rules
- Match based on **semantic meaning**, not just exact words.
  - e.g., "tired" → "weakness"
  - "spots" or "blisters" → "rash" or "sores"
  - "stomach ache" → not in list → ignore
- Extract **severity** if explicit or implied (e.g., “bad cough” → "moderate").
- Normalize duration (e.g., “couple of days” → “2 days”).
- Always include \"symptoms\" as an array — even if empty.
- Never wrap output in \`\`\`json or add extra text.

---

### 💬 Example
User: "I feel really tired and have had a bad cough for a couple of days."

✅ Correct Output:
{
  "symptoms": ["weakness", "coughing"],
  "severity": "moderate",
  "duration": "2 days"
}

❌ Invalid Outputs:
- Anything with text like "Here is your JSON:"
- Anything wrapped in markdown (\`\`\`)
- Missing or renamed fields

---


`;

      let parsed: {
        symptoms: string[];
        severity: string | null;
        duration: string | null;
      } | null = null;

      if (envKey) {
        const modelResp = await callGemini(
          prompt,
          envKey as string,
          conversationHistory as unknown as string[] | undefined
        );
        if (modelResp) {
          // try to extract JSON object inside response
          const jsonMatch = modelResp.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              parsed = JSON.parse(jsonMatch[0]);
            } catch (e) {
              // ignore, will fallback
            }
          } else {
            try {
              parsed = JSON.parse(modelResp);
            } catch (e) {
              // ignore
            }
          }
        }
      }

      if (!parsed) {
        // fallback to rule-based parser
        parsed = ruleParse(userText, symptomsList);
        parsed = {
          symptoms: parsed.symptoms,
          severity: parsed.severity,
          duration: parsed.duration,
        };
      }

      // match parsed.symptoms to known symptom records
      const matched: Array<{
        symptom: string;
        record?: Symptom;
        interventions: Intervention[];
      }> = [];

      for (const sText of parsed.symptoms || []) {
        const sLower = sText.toLowerCase().trim();
        const found = symptomsList.find(
          (s) =>
            s.name.toLowerCase() === sLower ||
            s.description.toLowerCase().includes(sLower) ||
            s.name.toLowerCase().includes(sLower)
        );
        if (found) {
          const ivs = (found.interventions || [])
            .map((id) => interventionsList.find((i) => i.id === id))
            .filter(Boolean) as Intervention[];
          matched.push({ symptom: sText, record: found, interventions: ivs });
        } else {
          // try fuzzy substring match by name tokens
          const found2 = symptomsList.find((s) =>
            s.name
              .toLowerCase()
              .split(/[^a-z]+/)
              .some((w) => w && sLower.includes(w))
          );
          if (found2) {
            const ivs = (found2.interventions || [])
              .map((id) => interventionsList.find((i) => i.id === id))
              .filter(Boolean) as Intervention[];
            matched.push({
              symptom: sText,
              record: found2,
              interventions: ivs,
            });
          } else {
            matched.push({
              symptom: sText,
              record: undefined,
              interventions: [],
            });
          }
        }
      }

      // Build follow-up questions as objects with description and optional options
      const followUps: Array<{ description: string; options?: string[] }> = [];
      if (!parsed.symptoms || parsed.symptoms.length === 0)
        followUps.push({
          description: "Can you describe your symptoms in a sentence or two?",
        });
      if (!parsed.severity)
        followUps.push({
          description: "How would you rate the severity of your symptoms",
          options: ["mild", "moderate", "severe"],
        });
      if (!parsed.duration)
        followUps.push({
          description:
            "How long have you had these symptoms (for example: 'for two days', 'since yesterday')?",
        });

      // If duration missing, include an intervention suggestion based on available data (we'll provide matched interventions regardless)

      const response = {
        input: message,
        extracted: parsed,
        matched,
        followUps,
      };

      return { code: 200, message: response };
    } catch (error: any) {
      return {
        code: 500,
        message: String(error && error.message ? error.message : error),
      };
    }
  },
};

const aichatService: service = {
  name: "ai",
  method: [aichatMethod],
  controller: web,
};

export default aichatService;
