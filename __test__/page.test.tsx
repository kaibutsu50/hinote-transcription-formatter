import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import Home from '@/app/page'
import { processFileAction } from '@/app/actions'

// Mock the processFileAction
vi.mock('@/app/actions', () => ({
  processFileAction: vi.fn()
}))

// Mock FileUpload and DownloadButton components
vi.mock('@/components/FileUpload', () => ({
  default: ({ onFileUpload, isProcessing }: { onFileUpload: (file: File) => void, isProcessing: boolean }) => (
    <div data-testid="file-upload">
      <button 
        onClick={() => onFileUpload(new File(['test content'], 'test.txt', { type: 'text/plain' }))}
        disabled={isProcessing}
        data-testid="upload-button"
      >
        {isProcessing ? 'Processing...' : 'Upload File'}
      </button>
    </div>
  )
}))

vi.mock('@/components/DownloadButton', () => ({
  default: ({ content, filename }: { content: string, filename: string }) => (
    <button data-testid="download-button" data-content={content} data-filename={filename}>
      ダウンロード
    </button>
  )
}))

describe('Home Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should display download link when server processing completes successfully', async () => {
    // Arrange: Mock successful processing
    const mockProcessedContent = '処理済みのテキスト内容'
    const mockFilename = 'processed_test.txt'
    
    vi.mocked(processFileAction).mockResolvedValue({
      success: true,
      content: mockProcessedContent,
      filename: mockFilename
    })

    const user = userEvent.setup()

    // Act: Render component and trigger file upload
    render(<Home />)
    
    const uploadButton = screen.getByTestId('upload-button')
    await user.click(uploadButton)

    // Assert: Wait for processing to complete and check results
    await waitFor(() => {
      expect(screen.getByText('処理結果')).toBeInTheDocument()
    })

    // Check that processed content is displayed
    expect(screen.getByText(mockProcessedContent)).toBeInTheDocument()

    // Check that download button is rendered with correct props
    const downloadButton = screen.getByTestId('download-button')
    expect(downloadButton).toBeInTheDocument()
    expect(downloadButton).toHaveAttribute('data-content', mockProcessedContent)
    expect(downloadButton).toHaveAttribute('data-filename', mockFilename)
    expect(downloadButton).toHaveTextContent('ダウンロード')
  })

  it('should display error message when processing fails', async () => {
    // Arrange: Mock failed processing
    const mockError = 'ファイルの処理に失敗しました'
    
    vi.mocked(processFileAction).mockResolvedValue({
      success: false,
      error: mockError
    })

    const user = userEvent.setup()

    // Act: Render component and trigger file upload
    render(<Home />)
    
    const uploadButton = screen.getByTestId('upload-button')
    await user.click(uploadButton)

    // Assert: Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText(mockError)).toBeInTheDocument()
    })

    // Check that download button is NOT rendered
    expect(screen.queryByTestId('download-button')).not.toBeInTheDocument()
    expect(screen.queryByText('処理結果')).not.toBeInTheDocument()
  })

  it('should handle network errors gracefully', async () => {
    // Arrange: Mock network error
    vi.mocked(processFileAction).mockRejectedValue(new Error('Network error'))

    const user = userEvent.setup()

    // Act: Render component and trigger file upload
    render(<Home />)
    
    const uploadButton = screen.getByTestId('upload-button')
    await user.click(uploadButton)

    // Assert: Wait for network error message
    await waitFor(() => {
      expect(screen.getByText('ネットワークエラーが発生しました')).toBeInTheDocument()
    })

    // Check that download button is NOT rendered
    expect(screen.queryByTestId('download-button')).not.toBeInTheDocument()
    expect(screen.queryByText('処理結果')).not.toBeInTheDocument()
  })

  it('should show processing state during file upload', async () => {
    // Arrange: Mock delayed processing
    let resolveProcessing: (value: any) => void
    const processingPromise = new Promise(resolve => {
      resolveProcessing = resolve
    })
    
    vi.mocked(processFileAction).mockReturnValue(processingPromise)

    const user = userEvent.setup()

    // Act: Render component and start file upload
    render(<Home />)
    
    const uploadButton = screen.getByTestId('upload-button')
    await user.click(uploadButton)

    // Assert: Check processing state
    expect(screen.getByText('Processing...')).toBeInTheDocument()
    
    // Complete processing
    resolveProcessing!({
      success: true,
      content: 'test content',
      filename: 'test.txt'
    })

    // Assert: Check that processing state is cleared
    await waitFor(() => {
      expect(screen.getByText('Upload File')).toBeInTheDocument()
    })
  })
})