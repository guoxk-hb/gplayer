import type { Subtitle } from '../types';

function parseTimeToSeconds(timeStr: string): number {
  // Supports "00:01:30,500" (SRT) and "01:30.50" (LRC)
  let parts: string[];
  if (timeStr.includes(',')) {
    parts = timeStr.split(/[:,]/); // "00:01:30,500"
    return (
      Number.parseInt(parts[0]!) * 3600 +
      Number.parseInt(parts[1]!) * 60 +
      Number.parseInt(parts[2]!) +
      Number.parseInt(parts[3]!) / 1000
    );
  } else if (timeStr.includes(':')) {
    parts = timeStr.split(/[:.]/); // "01:30.50"
    return (
      Number.parseInt(parts[0]!) * 60 +
      Number.parseInt(parts[1]!) +
      (parts[2] ? Number.parseInt(parts[2]) / 100 : 0)
    );
  }
  return 0;
}

/**
 * Convert SRT or LRC subtitle text to the internal Subtitle JSON format.
 *
 * @param inputText - Raw subtitle file content as string
 * @param format - File format: 'srt' or 'lrc' (default: 'srt')
 * @param lang - ISO 639-3 language code (e.g. 'cmn', 'kor', 'eng').
 *               Since auto-detection is not performed, the caller must supply this.
 * @returns A Subtitle object
 */
export function convertSRTorLRCtoCustomJSON(
  inputText: string,
  format: string = 'srt',
  lang: string = '',
): Subtitle {
  const lines = inputText.split('\n');
  const result: Subtitle['body'] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]!.trim();

    // skip blank lines and sequence-number lines
    if (!line || /^\d+$/.test(line)) {
      i++;
      continue;
    }

    // SRT format
    if (format === 'srt' && line.includes('-->')) {
      const [start, end] = line
        .split('-->')
        .map((t) => parseTimeToSeconds(t.trim()));
      let content = '';
      i++;
      while (i < lines.length && lines[i]!.trim()) {
        content += `${lines[i]!.trim()}\n`;
        i++;
      }
      result.push({
        from: Number(start!.toFixed(2)),
        to: Number(end!.toFixed(2)),
        location: 2,
        content,
      });
    }

    // LRC format
    else if (format === 'lrc' && /^\[\d+:\d+/.test(line)) {
      const regex = /\[(\d+:\d+(?:\.\d+)?)\]/g;
      const text = line.replace(regex, '').trim();
      let matches: RegExpExecArray | null;
      // reset lastIndex before looping
      regex.lastIndex = 0;
      while ((matches = regex.exec(line)) !== null) {
        const startTime = parseTimeToSeconds(matches[1]!);
        result.push({
          from: Number(startTime.toFixed(2)),
          to: Number((startTime + 3).toFixed(2)), // LRC has no end time; default +3s
          location: 2,
          content: text,
        });
      }
      i++;
    } else {
      i++;
    }
  }

  return {
    fontSize: null,
    fontColor: null,
    backgroundAlpha: null,
    backgroundColor: null,
    Stroke: 'none',
    lang,
    body: result,
    type: 'subtitle',
    version: '',
  };
}

/**
 * Parse an SRT subtitle string into a Subtitle object.
 *
 * @param text - SRT file content
 * @param lang - ISO 639-3 language code (e.g. 'cmn', 'kor', 'eng')
 */
export function parseSRT(text: string, lang: string): Subtitle {
  return convertSRTorLRCtoCustomJSON(text, 'srt', lang);
}

/**
 * Parse an LRC subtitle string into a Subtitle object.
 *
 * @param text - LRC file content
 * @param lang - ISO 639-3 language code (e.g. 'cmn', 'kor', 'eng')
 */
export function parseLRC(text: string, lang: string): Subtitle {
  return convertSRTorLRCtoCustomJSON(text, 'lrc', lang);
}
