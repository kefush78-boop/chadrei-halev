import ExcelJS from "exceljs";

const DAY_NAMES: Record<string, number> = {
  "ראשון": 0,
  "שני": 1,
  "שלישי": 2,
  "רביעי": 3,
  "חמישי": 4,
  "שישי": 5,
  "שבת": 6,
};

export interface ParsedSlot {
  day_of_week: number;
  period: number;
  subject: string;
}

function cellText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && "richText" in (value as object)) {
    return (value as { richText: { text: string }[] }).richText.map((r) => r.text).join("");
  }
  return String(value);
}

export async function parseMashovSchedule(buffer: ArrayBuffer): Promise<ParsedSlot[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const sheet = wb.worksheets[0];
  if (!sheet) throw new Error("לא נמצא גיליון בקובץ");

  let headerRowNumber: number | null = null;
  sheet.eachRow((row, rowNumber) => {
    if (headerRowNumber) return;
    const first = cellText(row.getCell(1).value).trim();
    if (first === "שיעור") headerRowNumber = rowNumber;
  });
  if (!headerRowNumber) throw new Error("לא נמצאה שורת הכותרות (עמודת 'שיעור')");

  const headerRow = sheet.getRow(headerRowNumber);
  const columnDay = new Map<number, number>();
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    if (colNumber === 1) return;
    const text = cellText(cell.value).trim();
    const firstWord = text.split(/\s|\n/)[0];
    if (firstWord in DAY_NAMES) columnDay.set(colNumber, DAY_NAMES[firstWord]);
  });
  if (columnDay.size === 0) throw new Error("לא זוהו עמודות ימים בקובץ");

  const slots: ParsedSlot[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber <= headerRowNumber!) return;
    const periodRaw = cellText(row.getCell(1).value).trim();
    const periodMatch = periodRaw.match(/^\d+/);
    if (!periodMatch) return;
    const period = parseInt(periodMatch[0], 10);

    for (const [colNumber, day] of columnDay) {
      const raw = cellText(row.getCell(colNumber).value).trim();
      if (!raw) continue;
      const subject = raw
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
        .join(" · ");
      slots.push({ day_of_week: day, period, subject });
    }
  });

  return slots;
}
