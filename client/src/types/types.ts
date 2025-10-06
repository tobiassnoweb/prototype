// Types for the symptoms and interventions data structures

export type Severity = "mild" | "moderate" | "severe" | null;

export interface Symptom {
  id: number;
  name: string;
  description: string;
  interventions: number[]; // Array of intervention IDs
}

export interface Intervention {
  id: number;
  name: string;
  description: string;
  severity: Severity[];
  product_link: string;
  product_image: string;
  likes: number;
  dislikes: number;
  SOS?: boolean; // Optional field, only present for urgent interventions
}

// Type for intervention with related symptoms (if needed for joined data)
export interface InterventionWithSymptoms extends Intervention {
  symptoms?: Symptom[];
}

// Type for symptom with related interventions (if needed for joined data)
export interface SymptomWithInterventions extends Symptom {
  interventionDetails?: Intervention[];
}
