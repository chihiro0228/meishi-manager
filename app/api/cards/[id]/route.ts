import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const cardId = Number(id)
  if (isNaN(cardId)) {
    return NextResponse.json({ error: '不正なID' }, { status: 400 })
  }

  const supabase = await createClient()

  // 画像パスを取得してからレコード削除
  const { data: card } = await supabase
    .from('business_cards')
    .select('image_path, back_image_path')
    .eq('id', cardId)
    .single()

  const { error } = await supabase
    .from('business_cards')
    .delete()
    .eq('id', cardId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Storage上の画像を削除（失敗してもエラーにしない）
  const pathsToDelete = [card?.image_path, card?.back_image_path].filter(Boolean) as string[]
  if (pathsToDelete.length > 0) {
    await supabase.storage.from('business-card-images').remove(pathsToDelete)
  }

  return NextResponse.json({ success: true })
}
