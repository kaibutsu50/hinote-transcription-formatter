import { describe, it, expect, vi } from 'vitest'
import { processFileAction } from './actions'

// Mock the speechProcessor module
vi.mock('@/lib/speechProcessor', () => ({
  processSpeechFile: vi.fn()
}))

// Mock File.text() method for Node.js environment  
global.File = class MockFile extends Blob {
  public name: string
  public lastModified: number = Date.now()
  public webkitRelativePath: string = ''
  
  constructor(bits: BlobPart[], name: string, options?: FilePropertyBag) {
    super(bits, { type: options?.type || '' })
    this.name = name
    if (options?.lastModified) {
      this.lastModified = options.lastModified
    }
  }
  
  async text(): Promise<string> {
    return super.text()
  }
} as typeof File

describe('processFileAction', () => {
  it('should return error when no file is provided', async () => {
    const formData = new FormData()
    
    const result = await processFileAction(formData)
    
    expect(result.success).toBe(false)
    expect(result.error).toBe('ファイルが選択されていません')
  })

  it('should return error for non-txt files', async () => {
    const formData = new FormData()
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
    formData.append('file', file)
    
    const result = await processFileAction(formData)
    
    expect(result.success).toBe(false)
    expect(result.error).toBe('テキストファイル（.txt）のみサポートしています')
  })

  it('should process txt file successfully', async () => {
    const { processSpeechFile } = await import('@/lib/speechProcessor')
    vi.mocked(processSpeechFile).mockResolvedValue('橋口: お願いします。\n中本: 聞こえてますか?\n')

    const formData = new FormData()
    const fileContent = `橋口:

お願いします。

中本:

聞こえてますか?

`
    const file = new File([fileContent], 'test.txt', { type: 'text/plain' })
    formData.append('file', file)
    
    const result = await processFileAction(formData)
    
    expect(result.success).toBe(true)
    expect(result.content).toBe('橋口: お願いします。\n中本: 聞こえてますか?\n')
    expect(result.filename).toBe('test_processed.txt')
    expect(processSpeechFile).toHaveBeenCalledWith(fileContent)
  })

  it('should handle processing errors', async () => {
    const { processSpeechFile } = await import('@/lib/speechProcessor')
    vi.mocked(processSpeechFile).mockRejectedValue(new Error('Processing failed'))

    const formData = new FormData()
    const file = new File(['invalid content'], 'test.txt', { type: 'text/plain' })
    formData.append('file', file)
    
    const result = await processFileAction(formData)
    
    expect(result.success).toBe(false)
    expect(result.error).toBe('Processing failed')
  })

  it('should handle non-Error exceptions', async () => {
    const { processSpeechFile } = await import('@/lib/speechProcessor')
    vi.mocked(processSpeechFile).mockRejectedValue('String error')

    const formData = new FormData()
    const file = new File(['content'], 'test.txt', { type: 'text/plain' })
    formData.append('file', file)
    
    const result = await processFileAction(formData)
    
    expect(result.success).toBe(false)
    expect(result.error).toBe('処理中にエラーが発生しました')
  })
})