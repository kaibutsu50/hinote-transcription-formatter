'use server';

import { processSpeechFile } from '@/lib/speechProcessor';

export async function processFileAction(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    
    if (!file) {
      return {
        success: false,
        error: 'ファイルが選択されていません'
      };
    }
    
    
    if (!file.name || !file.name.endsWith('.txt')) {
      return {
        success: false,
        error: 'テキストファイル（.txt）のみサポートしています'
      };
    }
    
    const content = await file.text();
    const processedContent = await processSpeechFile(content);
    
    return {
      success: true,
      content: processedContent,
      filename: file.name ? file.name.replace('.txt', '_processed.txt') : 'processed.txt'
    };
    
  } catch (error) {
    console.error('Processing error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '処理中にエラーが発生しました'
    };
  }
}