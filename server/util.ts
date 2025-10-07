import { Symptom } from "./server-types";

// Small rule-based parser as a fallback if the model call fails
export const ruleParse = (message: string, symptomsList: Symptom[]) => {
  const text = message.toLowerCase();
  const matched: string[] = [];
  for (const s of symptomsList) {
    const name = s.name.toLowerCase();
    // match as whole word or substring
    const nameRegex = new RegExp(
      `\\b${name.replace(/[-\\/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`,
      "i"
    );
    if (nameRegex.test(text)) {
      matched.push(s.name);
      continue;
    }
    // try matching by a few words from description
    const descWords = s.description
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean)
      .slice(0, 6);
    let hits = 0;
    for (const w of descWords) {
      if (w.length > 3 && text.includes(w)) hits++;
    }
    if (hits >= 2) matched.push(s.name);
  }

  // severity
  let severity: string | null = null;
  if (/\b(mild|slight|low)\b/.test(text)) severity = "mild";
  if (/\b(moderate|medium|fairly)\b/.test(text)) severity = "moderate";
  if (/\b(severe|bad|worse|worst|intense|excruciating)\b/.test(text))
    severity = "severe";

  // duration
  let duration: string | null = null;
  const durMatch = text.match(
    /(for|since)\s+([0-9]+\s*(?:days?|weeks?|hours?|months?))|since\s+(yesterday|last night|this morning)/i
  );
  if (durMatch) {
    duration = durMatch[0];
  }

  return { symptoms: matched, severity, duration };
};
