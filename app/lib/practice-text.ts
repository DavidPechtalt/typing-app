// Pasted text often contains characters that are hard or impossible to type:
// line breaks (Enter is disabled while practising), tabs, curly quotes and long
// dashes from word processors. Replace them with what a keyboard can type.
const replacements: [RegExp, string][] = [
  [/[‘’‚′]/g, "'"],
  [/[“”„″]/g, '"'],
  [/[–—−]/g, "-"],
  [/…/g, "..."],
  [/\s+/g, " "], // any run of spaces, tabs or line breaks becomes one space
];

export function normalizePracticeText(text: string): string {
  let result = text;

  for (const [pattern, replacement] of replacements) {
    result = result.replace(pattern, replacement);
  }

  return result.trim();
}
