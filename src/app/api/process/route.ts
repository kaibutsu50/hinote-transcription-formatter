import { NextRequest, NextResponse } from 'next/server';
import { processSpeechFile } from '@/lib/speechProcessor';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'ファイルが選択されていません' },
        { status: 400 }
      );
    }
    
    if (!file.name.endsWith('.txt')) {
      return NextResponse.json(
        { error: 'テキストファイル（.txt）のみサポートしています' },
        { status: 400 }
      );
    }
    
    const content = await file.text();
    const processedContent = await processSpeechFile(content);
    
    return NextResponse.json({
      success: true,
      content: processedContent,
      filename: file.name.replace('.txt', '_processed.txt')
    });
    
  } catch (error) {
    console.error('Processing error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : '処理中にエラーが発生しました'
      },
      { status: 500 }
    );
  }
}