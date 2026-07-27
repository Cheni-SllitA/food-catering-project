import { supabase } from './supabaseClient'

const BUCKET = 'images'

export async function uploadImage(file, folder = 'products') {
  const ext = file.name.split('.').pop()
  const path = `${folder}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw error
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

const REPORTS_BUCKET = 'reports'

export async function uploadReportFile(content, filename) {
  const blob = new Blob([content], { type: 'text/csv' })
  const path = `${crypto.randomUUID()}-${filename}`
  const { error } = await supabase.storage.from(REPORTS_BUCKET).upload(path, blob, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw error
  const { data } = supabase.storage.from(REPORTS_BUCKET).getPublicUrl(path)
  return data.publicUrl
}
