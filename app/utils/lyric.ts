import { franc, francAll } from 'franc';
function parseTimeToSeconds(timeStr: string) {
  // 支持格式 "00:01:30,500" 和 "01:30.50"
  let parts;
  if (timeStr.includes(',')) {
    parts = timeStr.split(/[:,]/); // "00:01:30,500"
    return parseInt(parts[0]!) * 3600 + parseInt(parts[1]!) * 60 + parseInt(parts[2]!) + parseInt(parts[3]!) / 1000;
  } else if (timeStr.includes(':')) {
    parts = timeStr.split(/[:.]/); // "01:30.50"
    return parseInt(parts[0]!) * 60 + parseInt(parts[1]!) + (parts[2] ? parseInt(parts[2]) / 100 : 0);
  }
  return 0;
}

// 将SRT或LRC格式转换为自定义JSON格式
export function convertSRTorLRCtoCustomJSON(inputText: string, format = 'srt') {
  let lang = ''
  let allContent = ''
  // 将输入文本按行分割
  const lines = inputText.split('\n');
  const result = [];
  let i = 0;
  // 遍历每一行
  while (i < lines.length) {
    const line = lines[i]!.trim();
    // 跳过空行和序号行
    if (!line || /^\d+$/.test(line)) {
      i++;
      continue;
    }

    // SRT 格式处理
    if (format === 'srt' && line.includes('-->')) {
      const [start, end] = line.split('-->').map((t) => parseTimeToSeconds(t.trim()));
      let content = '';
      i++;
      while (i < lines.length && lines[i]!.trim()) {
        // content.push(lines[i]!.trim());
        content += lines[i]!.trim() + '\n'
        allContent += lines[i]!.trim() + '\n'
        i++;
      }
      result.push({
        from: Number(start!.toFixed(2)),
        to: Number(end!.toFixed(2)),
        location: 2,
        content: content,
      });
    }

    // LRC 格式处理
    else if (format === 'lrc' && /^\[\d+:\d+/.test(line)) {
      const regex = /\[(\d+:\d+(?:\.\d+)?)\]/g;
      let matches;
      let text = line.replace(regex, '').trim();
      while ((matches = regex.exec(line)) !== null) {
        const start = parseTimeToSeconds(matches[1]!);
        result.push({
          from: Number(start.toFixed(2)),
          to: Number((start + 3).toFixed(2)), // LRC 没有 end 时间，默认 +3s
          location: 2,
          content: text,
        });
      }
    } else {
      i++;
    }
  }
  lang = franc(allContent);
  return {
    fontSize: null,
    fontColor: null,
    backgroundAlpha: null,
    backgroundColor: null,
    Stroke: 'none',
    lang: lang,
    body: result,
    type: "subtitle",
    version: "",
  };
}
