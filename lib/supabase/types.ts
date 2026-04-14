export type CardStatus = 'active' | 'archived'

export interface BusinessCard {
  id: number
  full_name: string | null
  name_reading: string | null
  company_name: string | null
  department: string | null
  title: string | null
  email: string | null
  phone: string | null
  mobile: string | null
  address: string | null
  postal_code: string | null
  website: string | null
  image_path: string | null
  back_image_path: string | null
  ocr_raw_text: string | null
  ocr_engine: string | null
  product_id: string | null
  manufacturer_ref: string | null
  tags: string[]
  notes: string | null
  met_at: string | null
  met_context: string | null
  status: CardStatus
  created_at: string
  updated_at: string
}

export type BusinessCardInsert = Omit<BusinessCard, 'id' | 'created_at' | 'updated_at'>
export type BusinessCardUpdate = Partial<BusinessCardInsert>

export interface ParsedCardData {
  full_name?: string
  name_reading?: string
  company_name?: string
  department?: string
  title?: string
  email?: string
  phone?: string
  mobile?: string
  address?: string
  postal_code?: string
  website?: string
}
