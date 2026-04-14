import { NextRequest, NextResponse } from 'next/server'
import { parseCardText } from '@/lib/ocr/parse-card'

export async function POST(request: NextRequest) {
  const apiKey = process.env.GOOGLE_CLOUD_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'OCR APIキーが設定されていません' }, { status: 500 })
  }

  let imageBase64: string
  let mimeType: string

  const contentType = request.headers.get('content-type') || ''
  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData()
    const file = formData.get('image') as File | null
    if (!file) {
      return NextResponse.json({ error: '画像が見つかりません' }, { status: 400 })
    }
    const buffer = await file.arrayBuffer()
    imageBase64 = Buffer.from(buffer).toString('base64')
    mimeType = file.type || 'image/jpeg'
  } else {
    const body = await request.json()
    imageBase64 = body.image
    mimeType = body.mimeType || 'image/jpeg'
  }

  try {
    const visionRes = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [
            {
              image: { content: imageBase64 },
              features: [{ type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 }],
              imageContext: { languageHints: ['ja', 'en'] },
            },
          ],
        }),
      }
    )

    if (!visionRes.ok) {
      const errText = await visionRes.text()
      console.error('Vision API error:', errText)
      return NextResponse.json({ error: 'OCR処理に失敗しました' }, { status: 500 })
    }

    const visionData = await visionRes.json()
    const rawText: string =
      visionData.responses?.[0]?.fullTextAnnotation?.text || ''

    const parsed = parseCardText(rawText)

    return NextResponse.json({ rawText, parsed })
  } catch (err) {
    console.error('OCR route error:', err)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
