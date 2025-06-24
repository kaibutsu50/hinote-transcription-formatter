'use client';

import { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import DownloadButton from '@/components/DownloadButton';

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedContent, setProcessedContent] = useState('');
  const [filename, setFilename] = useState('');
  const [error, setError] = useState('');

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    setError('');
    setProcessedContent('');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/process', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (result.success) {
        setProcessedContent(result.content);
        setFilename(result.filename);
      } else {
        setError(result.error || '処理に失敗しました');
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            書き起こしフォーマッター
          </h1>
          <p className="text-lg text-gray-600">
            書き起こしツールの出力を読みやすい形にフォーマットします
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <FileUpload onFileUpload={handleFileUpload} isProcessing={isProcessing} />
          
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}
          
          {processedContent && (
            <div className="mt-8 space-y-6">
              <div className="border-t pt-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  処理結果
                </h2>
                <div className="bg-gray-50 rounded-lg p-4 max-h-80 overflow-y-auto">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                    {processedContent}
                  </pre>
                </div>
              </div>
              
              <div className="flex justify-center">
                <DownloadButton 
                  content={processedContent} 
                  filename={filename}
                />
              </div>
            </div>
          )}
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>
            対応形式: 4行セット形式（発話者行、空行、発言内容行、空行）のテキストファイル
          </p>
        </div>
      </div>
    </div>
  );
}