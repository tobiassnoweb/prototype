// Consolidated chat-specific types
import { Intervention } from "../types";

export type Severity = "mild" | "moderate" | "severe" | null;

export interface ExtractedInfo {
  symptoms: string[];
  severity: Severity | null;
  duration: string | null;
}

export interface MatchedEntry {
  symptom: string;
  record?: {
    id: number;
    name: string;
    description: string;
    interventions: number[];
  };
  interventions: Intervention[];
}

export type ServerFollowUp =
  | string
  | { description?: string; options?: string[] };

export interface ChatResponse {
  input: string;
  extracted: ExtractedInfo;
  matched: MatchedEntry[];
  followUps?: ServerFollowUp[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  metadata?: {
    interventions?: Intervention[];
    // Optional structured results returned from server
    matched?: MatchedEntry[];
    // followUps are normalized to objects with description/options for UI rendering
    followUps?: Array<{
      description: string;
      options?: string[];
    }>;
    // per-message flag indicating whether the AI extracted severity information
    // is missing; this is used so UI rendering for interventions can rely on
    // the message-level value rather than shared component state.
    severity?: Severity;
  };
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AIAnalysisResult {
  needsMoreInfo: boolean;
  missingFields: string[];
  followUpQuestion?: string;
  suggestedInterventions: {
    intervention: Intervention;
    confidence: number;
    reasoning: string;
  }[];
  metadata: {
    category: string;
    urgency: "low" | "medium" | "high";
    confidence: number;
  };
}
