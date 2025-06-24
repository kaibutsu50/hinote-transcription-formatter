import { describe, it, expect } from 'vitest'
import { processSpeechFile } from '../src/lib/speechProcessor'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('speechProcessor', () => {
  describe('processSpeechFile', () => {
    it('should process basic 4-line format correctly', async () => {
      const input = `橋口:

お願いします。

中本:

聞こえてますか?

`
      const expected = `橋口: お願いします。
中本: 聞こえてますか?
`
      const result = await processSpeechFile(input)
      expect(result).toBe(expected)
    })

    it('should concatenate consecutive speeches from same speaker', async () => {
      const input = `橋口:

お願いします。

橋口:

分かりました。

中本:

聞こえてますか?

`
      const expected = `橋口: お願いします。分かりました。
中本: 聞こえてますか?
`
      const result = await processSpeechFile(input)
      expect(result).toBe(expected)
    })

    it('should handle timestamp prefix in speaker line', async () => {
      const input = `[10:30] 橋口:

お願いします。

[10:31] 中本:

聞こえてますか?

`
      const expected = `橋口: お願いします。
中本: 聞こえてますか?
`
      const result = await processSpeechFile(input)
      expect(result).toBe(expected)
    })

    it('should handle timestamp range format', async () => {
      const input = `00:00:27 - 00:00:29 橋口:

お願いします。

00:00:36 - 00:00:52 中本:

聞こえてますか?

`
      const expected = `橋口: お願いします。
中本: 聞こえてますか?
`
      const result = await processSpeechFile(input)
      expect(result).toBe(expected)
    })

    it('should replace trailing comma with period', async () => {
      const input = `橋口:

お願いします、

橋口:

分かりました、

中本:

聞こえてますか?

`
      const expected = `橋口: お願いします、分かりました。
中本: 聞こえてますか?
`
      const result = await processSpeechFile(input)
      expect(result).toBe(expected)
    })

    it('should handle complex real-world data like sample.txt', async () => {
      const input = `橋口:

お願いします。

中本:

聞こえてますか?

橋口:

私は聞こえてます。 でもちょっと、 木曽さんの声はまだ、 一瞬さっきちょっと聞こえましたけど。

江藤:

大丈夫です。

橋口:

OKです。

江藤:

ちょっとカメラが壊れちゃって。

橋口:

分かりました。 申し訳ないです。

`
      const expected = `橋口: お願いします。
中本: 聞こえてますか?
橋口: 私は聞こえてます。 でもちょっと、 木曽さんの声はまだ、 一瞬さっきちょっと聞こえましたけど。
江藤: 大丈夫です。
橋口: OKです。
江藤: ちょっとカメラが壊れちゃって。
橋口: 分かりました。 申し訳ないです。
`
      const result = await processSpeechFile(input)
      expect(result).toBe(expected)
    })

    it('should throw error for invalid format - non-empty second line', async () => {
      const input = `橋口:
not empty
お願いします。

`
      await expect(processSpeechFile(input)).rejects.toThrow('2行目が空行ではありません')
    })

    it('should throw error for invalid format - non-empty fourth line', async () => {
      const input = `橋口:

お願いします。
not empty
`
      await expect(processSpeechFile(input)).rejects.toThrow('3行目が空行ではありません')
    })

    it('should handle empty input', async () => {
      const result = await processSpeechFile('')
      expect(result).toBe('')
    })

    it('should handle input with no proper speaker format', async () => {
      const input = `No speaker here

Some content

`
      const result = await processSpeechFile(input)
      expect(result).toBe('')
    })

    it('should extract speaker name correctly from various formats', async () => {
      const input = `時刻情報 橋口:

お願いします。

12:30 中本太郎:

聞こえてますか?

[timestamp] 江藤さん:

大丈夫です。

`
      const expected = `橋口: お願いします。
中本太郎: 聞こえてますか?
江藤さん: 大丈夫です。
`
      const result = await processSpeechFile(input)
      expect(result).toBe(expected)
    })

    it('should handle multiple consecutive same speaker with different content', async () => {
      const input = `橋口:

第一段階です。

橋口:

第二段階です。

橋口:

第三段階です。

中本:

了解しました。

`
      const expected = `橋口: 第一段階です。第二段階です。第三段階です。
中本: 了解しました。
`
      const result = await processSpeechFile(input)
      expect(result).toBe(expected)
    })

    it('should handle complex timestamp format with consecutive same speaker', async () => {
      const input = `00:01:41 - 00:01:43 橋口:

お願いします、

00:01:43 - 00:01:44 橋口:

お願いします、

00:01:44 - 00:01:44 橋口:

お願いします、

00:01:44 - 00:01:45 橋口:

お願いします、

00:01:45 - 00:01:51 橋口:

今日はですね 前回ちょっと前 に 実験したデータについて少しちょっと、

00:02:13 - 00:02:15 柴田:

上画面共有させていただきます、

`
      const expected = `橋口: お願いします、お願いします、お願いします、お願いします、今日はですね 前回ちょっと前 に 実験したデータについて少しちょっと。
柴田: 上画面共有させていただきます。
`
      const result = await processSpeechFile(input)
      expect(result).toBe(expected)
    })

    it('should handle sample2.txt format with "未知の話者" and various prefixes', async () => {
      const input = `00:05:43 - 00:05:45 未知の話者:

不明な音 なるほど、

00:05:46 - 00:05:49 中本:

りなたむ そうですね なので僕 も その時系列のほうを使ってスイング、

00:05:49 - 00:05:54 中本:

速度については出していて それだ と そんなにおかしくないかなという、

`
      const expected = `未知の話者: 不明な音 なるほど。
中本: りなたむ そうですね なので僕 も その時系列のほうを使ってスイング、速度については出していて それだ と そんなにおかしくないかなという。
`
      const result = await processSpeechFile(input)
      expect(result).toBe(expected)
    })

    it('should process actual sample.txt file correctly', async () => {
      const sampleContent = readFileSync(join(__dirname, 'data/sample.txt'), 'utf-8')
      const expected = `橋口: お願いします。
中本: 聞こえてますか?
橋口: 私は聞こえてます。 でもちょっと、 木曽さんの声はまだ、 一瞬さっきちょっと聞こえましたけど。
江藤: 大丈夫です。
橋口: OKです。
江藤: ちょっとカメラが壊れちゃって。
橋口: 分かりました。 申し訳ないです。
`
      const result = await processSpeechFile(sampleContent)
      expect(result).toBe(expected)
    })

    it('should process actual sample2.txt file correctly', async () => {
      const sample2Content = readFileSync(join(__dirname, 'data/sample2.txt'), 'utf-8')
      const expected = `橋口: お願いします。
中本: 聞こえてますか?
橋口: 私は聞こえてます。でもちょっと、木曽さんの声はまだ、一瞬さっきちょっと聞こえましたけど。
江藤: 大丈夫です。
橋口: OKです。
江藤: ちょっとカメラが壊れちゃって。
橋口: 分かりました。申し訳ないです。
`
      const result = await processSpeechFile(sample2Content)
      expect(result).toBe(expected)
    })
  })
})