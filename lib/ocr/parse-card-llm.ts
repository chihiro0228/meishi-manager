import Anthropic from '@anthropic-ai/sdk'
import type { ParsedCardData } from '@/lib/supabase/types'

const client = new Anthropic()

/**
 * Claude LLM を使って名刺のOCRテキストから構造化データを抽出する。
 * Eight/Sansanが採用するコンテキスト理解ベースの抽出アプローチに相当する。
 */
export async function parseCardTextWithLLM(rawText: string): Promise<ParsedCardData> {
  if (!rawText.trim()) return {}

  const message = await client.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 512,
    system: `あなたは名刺情報の抽出専門AIです。
OCRで読み取った名刺テキストから、各フィールドを正確に抽出してJSONで返してください。

# 抽出ルール
- full_name: 人物の氏名（姓＋名）。会社名・部署名・役職名は含めない
- name_reading: 氏名のふりがな（ひらがな or カタカナ）。ない場合はnull
- company_name: 会社・法人名。「株式会社」「有限会社」などの法人格も含める
- department: 部署名・チーム名。ない場合はnull
- title: 役職名（部長・課長・代表取締役など）。ない場合はnull
- email: メールアドレス。ない場合はnull
- phone: 固定電話番号（市外局番付き）。ない場合はnull
- mobile: 携帯電話番号（090/080/070始まり）。ない場合はnull
- postal_code: 郵便番号（ハイフン付き、例: 150-0001）。ない場合はnull
- address: 住所（都道府県から番地まで）。ない場合はnull
- website: WebサイトURL。ない場合はnull

# 重要な注意事項
- 氏名の抽出が最重要。名刺に記載された人物の名前を必ず正確に特定すること
- 会社名と氏名を混同しない
- 部署名・役職名を氏名として抽出しない
- 英語名刺の場合は英語でそのまま抽出する
- 不明な場合はnullを返す（推測しない）

# 出力形式
必ずJSONのみを返すこと。説明文や前置きは不要。
{
  "full_name": "...",
  "name_reading": "...",
  "company_name": "...",
  "department": "...",
  "title": "...",
  "email": "...",
  "phone": "...",
  "mobile": "...",
  "postal_code": "...",
  "address": "...",
  "website": "..."
}`,
    messages: [
      {
        role: 'user',
        content: `以下の名刺OCRテキストから情報を抽出してください:\n\n${rawText}`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') return {}

  try {
    // JSONブロックが```json...```で囲まれている場合も対応
    const jsonText = content.text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
    const extracted = JSON.parse(jsonText)

    const result: ParsedCardData = {}
    if (extracted.full_name) result.full_name = extracted.full_name
    if (extracted.name_reading) result.name_reading = extracted.name_reading
    if (extracted.company_name) result.company_name = extracted.company_name
    if (extracted.department) result.department = extracted.department
    if (extracted.title) result.title = extracted.title
    if (extracted.email) result.email = extracted.email
    if (extracted.phone) result.phone = extracted.phone
    if (extracted.mobile) result.mobile = extracted.mobile
    if (extracted.postal_code) result.postal_code = extracted.postal_code
    if (extracted.address) result.address = extracted.address
    if (extracted.website) result.website = extracted.website
    return result
  } catch (e) {
    console.error('LLM JSON parse error:', e, content.text)
    return {}
  }
}
