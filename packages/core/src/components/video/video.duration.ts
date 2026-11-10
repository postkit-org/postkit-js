/** A video running time, as readers see it and as `<time datetime>` takes it. */
export interface PostkitVideoDuration {
  /** The clock text: `0:24`, `12:05`, `1:02:03`. */
  readonly text: string;
  /** The ISO 8601 duration: `PT24S`, `PT12M5S`, `PT1H2M3S`. */
  readonly dateTime: string;
}

const clockPattern = /^(?:(\d+):)?([0-5]?\d):([0-5]\d)$/;
const isoPattern = /^PT(?=\d)(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?$/i;

/**
 * Reads Video's `duration`: clock text (`0:24`, `1:02:03`) or an ISO 8601
 * duration (`PT24S`). Returns `undefined` for anything else, which views
 * leave out.
 */
export function postkitVideoDuration(
  value: string | undefined,
): PostkitVideoDuration | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;

  let hours: number;
  let minutes: number;
  let seconds: number;
  const clock = clockPattern.exec(trimmed);
  const iso = clock ? undefined : isoPattern.exec(trimmed);
  if (clock) {
    hours = Number(clock[1] ?? 0);
    minutes = Number(clock[2]);
    seconds = Number(clock[3]);
  } else if (iso) {
    const total =
      Number(iso[1] ?? 0) * 3600 +
      Number(iso[2] ?? 0) * 60 +
      Math.round(Number(iso[3] ?? 0));
    hours = Math.floor(total / 3600);
    minutes = Math.floor((total % 3600) / 60);
    seconds = total % 60;
  } else {
    return undefined;
  }

  const pad = (part: number) => String(part).padStart(2, '0');
  const text =
    hours > 0
      ? `${hours}:${pad(minutes)}:${pad(seconds)}`
      : `${minutes}:${pad(seconds)}`;
  const dateTime = `PT${hours ? `${hours}H` : ''}${minutes ? `${minutes}M` : ''}${
    seconds || (!hours && !minutes) ? `${seconds}S` : ''
  }`;
  return { text, dateTime };
}
