export type CleanedName = {
  fullName: string;
  note: string | null;
  tokens: string[];
};

const NOTE_MARKERS = /\b(R\.?\s*I\.?\s*P\.?|LEGEND)\b/gi;
const QUOTED = /[“"']([^"”']+)[”"']/g;

export function cleanArcherName(raw: string): CleanedName {
  const notes: string[] = [];
  let text = raw.trim();

  text = text.replace(QUOTED, (_match, nick: string) => {
    const cleaned = nick.trim();
    if (cleaned) {
      notes.push(cleaned);
    }
    return " ";
  });

  text = text.replace(NOTE_MARKERS, (match) => {
    const note = /legend/i.test(match) ? "LEGEND" : "RIP";
    if (!notes.includes(note)) {
      notes.push(note);
    }
    return " ";
  });

  const fullName = text.replace(/\s+/g, " ").replace(/^[\s.,;:]+|[\s.,;:]+$/g, "").trim();
  return {
    fullName,
    note: notes.length > 0 ? notes.join(", ") : null,
    tokens: nameTokens(fullName),
  };
}

export function nameTokens(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/['’]/g, "")
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .sort();
}

export function namesMatch(left: string, right: string): boolean {
  const a = cleanArcherName(left).tokens;
  const b = cleanArcherName(right).tokens;
  if (a.length === 0 || a.length !== b.length) {
    return false;
  }
  return a.every((token, index) => token === b[index]);
}

export function unmatchedMembershipNumber(fullName: string): string {
  const tokens = nameTokens(cleanArcherName(fullName).fullName);
  const slug = (tokens.length > 0 ? tokens : ["unknown"]).join("_").slice(0, 80);
  return `EXT_${slug}`;
}
