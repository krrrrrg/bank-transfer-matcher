import { SMSRecord, POSRecord } from "./types";

export function parseSMS(raw: string): SMSRecord[] {
  const results: SMSRecord[] = [];
  const lines = raw.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || /^[\[I]?[Ww]eb발신[\])]?$/i.test(trimmed)) continue;

    const match = trimmed.match(
      /부산\s*(\d{2}\/\d{2})\s+(\d{2}:\d{2})\s+\S+\s+(.+?)\s+입금\s*([\d,]+)/
    );
    if (match) {
      results.push({
        date: match[1],
        time: match[2],
        name: match[3].trim(),
        amount: parseInt(match[4].replace(/,/g, ""), 10),
      });
    }
  }

  return results;
}

export function parseExcelPaste(raw: string, storeName: string): POSRecord[] {
  const results: POSRecord[] = [];
  const lines = raw.split("\n");

  for (const line of lines) {
    const parts = line.split("\t");
    if (parts.length >= 2) {
      const name = parts[0].trim();
      const amount = parseInt(parts[1].replace(/,/g, ""), 10);
      if (name && !isNaN(amount)) {
        results.push({ id: crypto.randomUUID(), storeName, name, amount });
      }
    }
  }

  return results;
}
