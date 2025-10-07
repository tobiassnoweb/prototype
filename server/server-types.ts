export interface Intervention {
  id: number;
  name: string;
  description: string;
  symptoms: string[];
  severity: string[];
  product_link: string;
  product_image: string;
  likes: number;
  dislikes: number;
  SOS?: boolean;
}

export interface Symptom {
  id: number;
  name: string;
  description: string;
  interventions: number[];
}
