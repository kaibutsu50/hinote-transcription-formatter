'use client';

interface DownloadButtonProps {
  content: string;
  filename: string;
  disabled?: boolean;
}

export default function DownloadButton({ content, filename, disabled = false }: DownloadButtonProps) {
  const handleDownload = () => {
    if (disabled || !content) return;
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleDownload}
      disabled={disabled || !content}
      className={`
        px-6 py-3 rounded-lg font-medium transition-all
        ${disabled || !content
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
        }
      `}
    >
      <div className="flex items-center space-x-2">
        <svg 
          className="w-5 h-5" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
          />
        </svg>
        <span>ダウンロード</span>
      </div>
    </button>
  );
}