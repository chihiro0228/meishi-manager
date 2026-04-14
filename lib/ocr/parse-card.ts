import type { ParsedCardData } from '@/lib/supabase/types'

/**
 * Google Vision API のOCR生テキストから名刺情報を構造化して抽出する
 */
export function parseCardText(rawText: string): ParsedCardData {
  if (!rawText.trim()) return {}

  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  const result: ParsedCardData = {}

  // --- 電話番号（複数抽出して振り分け）---
  const phonePattern = /(?:Tel|TEL|電話|℡|☎)?[\s:：]*(0\d{1,4}[-\s]\d{1,4}[-\s]\d{4})/g
  const mobilePattern = /(?:携帯|Mobile|m\.?)[\s:：]*(0[789]0[-\s]\d{4}[-\s]\d{4})/gi
  const mobileMatches = [...rawText.matchAll(mobilePattern)]
  if (mobileMatches.length > 0) {
    result.mobile = mobileMatches[0][1].replace(/\s/g, '-')
  }
  const phoneMatches = [...rawText.matchAll(phonePattern)]
  for (const m of phoneMatches) {
    const num = m[1].replace(/\s/g, '-')
    const isMobile = /^0[789]0/.test(num)
    if (isMobile && !result.mobile) {
      result.mobile = num
    } else if (!isMobile && !result.phone) {
      result.phone = num
    }
  }

  // --- メールアドレス ---
  const emailMatch = rawText.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/)
  if (emailMatch) result.email = emailMatch[0]

  // --- 郵便番号 ---
  const postalMatch = rawText.match(/〒?\s*(\d{3}[-−]\d{4})/)
  if (postalMatch) result.postal_code = postalMatch[1]

  // --- URL/Website ---
  const urlMatch = rawText.match(/https?:\/\/[^\s\n]+|www\.[^\s\n]+/)
  if (urlMatch) result.website = urlMatch[0]

  // 既に抽出した情報を使った行をスキップするためのセット
  const usedLines = new Set<string>()
  if (result.email) markUsed(lines, result.email, usedLines)
  if (result.website) markUsed(lines, result.website, usedLines)
  if (result.phone) markUsed(lines, result.phone.replace(/-/g, ''), usedLines)
  if (result.mobile) markUsed(lines, result.mobile.replace(/-/g, ''), usedLines)

  // --- 会社名 ---
  const companyKeywords = /株式会社|有限会社|合同会社|一般社団法人|社団法人|財団法人|独立行政法人|Co\.|Ltd\.|Inc\.|Corp\.|GmbH|LLC/
  for (const line of lines) {
    if (!usedLines.has(line) && companyKeywords.test(line)) {
      result.company_name = line
      usedLines.add(line)
      break
    }
  }

  // --- 部署・役職 ---
  const deptKeywords = /部|課|室|グループ|チーム|Division|Department|Group/
  const titleKeywords = /長|部長|課長|室長|係長|主任|マネージャー|Manager|Director|Officer|Executive|代表|社長|会長|専務|常務|取締役|担当|リーダー|Leader/
  for (const line of lines) {
    if (usedLines.has(line) || line === result.company_name) continue
    if (!result.department && deptKeywords.test(line) && line.length <= 30) {
      result.department = line
      usedLines.add(line)
    } else if (!result.title && titleKeywords.test(line) && line.length <= 30) {
      result.title = line
      usedLines.add(line)
    }
  }

  // --- 住所 ---
  const addressPattern = /(?:〒\s*\d{3}[-−]\d{4}\s*)?(?:[都道府県]|東京|大阪|京都|北海道).+/
  for (const line of lines) {
    if (!usedLines.has(line) && addressPattern.test(line)) {
      result.address = (result.postal_code ? `〒${result.postal_code} ` : '') + line
      usedLines.add(line)
      break
    }
  }
  // 郵便番号行だけの場合は次の行を住所とみなす
  if (!result.address && result.postal_code) {
    const postalLine = lines.find((l) => l.includes(result.postal_code!))
    if (postalLine) {
      const idx = lines.indexOf(postalLine)
      const nextLine = lines[idx + 1]
      if (nextLine && !usedLines.has(nextLine)) {
        result.address = `〒${result.postal_code} ${nextLine}`
        usedLines.add(nextLine)
      }
    }
  }

  // --- 氏名（残った短い行から推定）---
  // 日本語氏名: 漢字・ひらがな・カタカナのみで2〜8文字
  // 英語氏名: 大文字始まりの単語が2〜4個
  const namePatternJP = /^[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]{2,8}$/
  const namePatternEN = /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}$/
  for (const line of lines) {
    if (usedLines.has(line)) continue
    if (namePatternJP.test(line) || namePatternEN.test(line)) {
      result.full_name = line
      usedLines.add(line)
      break
    }
  }

  // --- ふりがな ---
  const readingPattern = /^[\u3040-\u309f\u30a0-\u30ff\s]{2,20}$/
  for (const line of lines) {
    if (usedLines.has(line)) continue
    if (readingPattern.test(line)) {
      result.name_reading = line
      usedLines.add(line)
      break
    }
  }

  return result
}

function markUsed(lines: string[], value: string, usedSet: Set<string>) {
  for (const line of lines) {
    if (line.includes(value)) usedSet.add(line)
  }
}
