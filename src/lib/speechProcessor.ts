interface SpeechData {
  speaker: string;
  body: string;
}

/**
 * 発話データを1件ずつストリーミング処理する関数
 */
async function* parseSpeechStream(content: string): AsyncGenerator<SpeechData> {
  const lines = content.split('\n');
  
  let speakerLine = "";
  let bodyLine = "";
  let lineCount = 0;
  
  for (const line of lines) {
    const remainder = lineCount % 4;
    
    if (remainder === 0) {
      // 1行目: 時間と発話者
      speakerLine = line;
    } else if (remainder === 1) {
      // 2行目: 空行
      if (line !== "") {
        throw new Error(`Error: 2行目が空行ではありません (Line: ${lineCount + 1})`);
      }
    } else if (remainder === 2) {        
      // 3行目: 発言内容
      bodyLine = line;
    } else if (remainder === 3) {
      // 4行目: 空行
      if (line !== "") {
        throw new Error(`Error: 3行目が空行ではありません (Line: ${lineCount + 1})`);
      }
      if (speakerLine) {
        const speakerMatch = speakerLine.match(/(.*):/);
        if (speakerMatch && speakerMatch[1]) {
          // タイムスタンプや時刻情報を除去して話者名を抽出
          let cleanSpeaker = speakerMatch[1].trim();
          
          // 複数の時刻形式を除去
          cleanSpeaker = cleanSpeaker
            .replace(/^\d{2}:\d{2}:\d{2}\s*-\s*\d{2}:\d{2}:\d{2}\s*/, '') // 00:00:27 - 00:00:29
            .replace(/^\[\d{1,2}:\d{2}\]\s*/, '') // [10:30]
            .replace(/^\d{1,2}:\d{2}\s*/, '') // 12:30  
            .replace(/^時刻情報\s*/, '') // 「時刻情報 」
            .trim();
          
          // 日本語の名前を抽出 (最後の単語が日本語文字を含む場合)
          if (cleanSpeaker.includes(' ')) {
            const parts = cleanSpeaker.split(/\s+/).filter(part => part.trim() !== '');
            // 最後の部分が日本語文字を含むか確認
            for (let i = parts.length - 1; i >= 0; i--) {
              if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(parts[i])) {
                cleanSpeaker = parts[i];
                break;
              }
            }
          }
          
          // 空の場合はスキップ
          if (cleanSpeaker) {
            yield {
              speaker: cleanSpeaker,
              body: bodyLine.trim()
            };
          }
        }
      }
      speakerLine = "";
      bodyLine = "";
    }
    
    lineCount++;
  }
  
  // 最後のデータを処理
  if (speakerLine) {
    const speakerMatch = speakerLine.match(/(.*):/);
    if (speakerMatch && speakerMatch[1]) {
      // タイムスタンプや時刻情報を除去して話者名を抽出
      let cleanSpeaker = speakerMatch[1].trim();
      
      // 複数の時刻形式を除去
      cleanSpeaker = cleanSpeaker
        .replace(/^\d{2}:\d{2}:\d{2}\s*-\s*\d{2}:\d{2}:\d{2}\s*/, '') // 00:00:27 - 00:00:29
        .replace(/^\[\d{1,2}:\d{2}\]\s*/, '') // [10:30]
        .replace(/^\d{1,2}:\d{2}\s*/, '') // 12:30
        .replace(/^時刻情報\s*/, '') // 「時刻情報 」
        .trim();
      
      // 日本語の名前を抽出 (最後の単語が日本語文字を含む場合)
      if (cleanSpeaker.includes(' ')) {
        const parts = cleanSpeaker.split(/\s+/).filter(part => part.trim() !== '');
        // 最後の部分が日本語文字を含むか確認
        for (let i = parts.length - 1; i >= 0; i--) {
          if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(parts[i])) {
            cleanSpeaker = parts[i];
            break;
          }
        }
      }
      
      // 空の場合はスキップ
      if (cleanSpeaker) {
        yield {
          speaker: cleanSpeaker,
          body: bodyLine.trim()
        };
      }
    }
  }
}

/**
 * 同じ発話者の発言を連結しながらストリーミング処理する関数
 */
async function* concatSpeakerSpeechesStream(content: string): AsyncGenerator<SpeechData> {
  let currentSpeech: SpeechData | null = null;
  
  for await (const speech of parseSpeechStream(content)) {
    if (!currentSpeech) {
      currentSpeech = { ...speech };
      continue;
    }
    
    if (speech.speaker === currentSpeech.speaker) {
      // 同じ発話者の場合は発言を連結
      currentSpeech.body += speech.body;
    } else {
      // 異なる発話者の場合は現在の発話を出力して新しい発話に切り替え
      // 入力値の仕様上、speech.body の最後の一文字に余計な「、」が入ってしまうので「。」に置換
      currentSpeech.body = currentSpeech.body.replace(/、$/, "。");
      yield currentSpeech;
      currentSpeech = { ...speech };
    }
  }
  
  // 最後の発話を出力
  if (currentSpeech) {
    currentSpeech.body = currentSpeech.body.replace(/、$/, "。");
    yield currentSpeech;
  }
}

/**
 * 書き起こしファイルを処理してフォーマット済みテキストを返す
 */
export async function processSpeechFile(content: string): Promise<string> {
  const results: string[] = [];
  
  try {
    for await (const speech of concatSpeakerSpeechesStream(content)) {
      results.push(`${speech.speaker}: ${speech.body}\n`);
    }
    return results.join('');
  } catch (error) {
    throw new Error(`処理中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
  }
}