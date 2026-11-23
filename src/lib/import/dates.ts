const EXCEL_EPOCH_UTC = Date.UTC(1899, 11, 30);
const DAY_MS = 24 * 60 * 60 * 1000;
const EXCEL_SERIAL_MIN = 20000;
const EXCEL_SERIAL_MAX = 60000;
const SLASH_DATE = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/;

export type ShotWhen = {
  startsOn: Date | null;
  label: string | null;
};

export function utcDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

export function fromExcelSerial(serial: number): Date {
  return new Date(EXCEL_EPOCH_UTC + Math.floor(serial) * DAY_MS);
}

function expandYear(year: number): number {
  if (year >= 100) {
    return year;
  }
  return year >= 70 ? 1900 + year : 2000 + year;
}

export function parseShotWhen(value: unknown): ShotWhen {
  if (value == null || value === "") {
    return { startsOn: null, label: null };
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return {
      startsOn: utcDate(
        value.getUTCFullYear(),
        value.getUTCMonth() + 1,
        value.getUTCDate(),
      ),
      label: null,
    };
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    if (value >= EXCEL_SERIAL_MIN && value <= EXCEL_SERIAL_MAX) {
      return { startsOn: fromExcelSerial(value), label: null };
    }
    return { startsOn: null, label: String(value) };
  }

  const text = String(value).trim();
  if (!text) {
    return { startsOn: null, label: null };
  }

  const asNumber = Number(text);
  if (Number.isFinite(asNumber) && asNumber >= EXCEL_SERIAL_MIN && asNumber <= EXCEL_SERIAL_MAX) {
    return { startsOn: fromExcelSerial(asNumber), label: null };
  }

  const slash = SLASH_DATE.exec(text);
  if (slash) {
    const day = Number(slash[1]);
    const month = Number(slash[2]);
    const year = expandYear(Number(slash[3]));
    const date = utcDate(year, month, day);
    if (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() + 1 === month &&
      date.getUTCDate() === day
    ) {
      return { startsOn: date, label: null };
    }
  }

  return { startsOn: null, label: text };
}
