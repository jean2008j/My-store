import { createClient } from '@supabase/supabase-js'

// DEMO MODE — forced off. No real database connection.
// All data lives in the browser (Zustand + localStorage + seed).
// Admin PIN: OWL-2026
// To re-enable: set FORCE_DEMO = false and add VITE_SUPABASE_* to .env
const FORCE_DEMO = true

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = FORCE_DEMO
  ? false
  : Boolean(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('placeholder'))

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// ---------- Helpers ----------
// يحوّل أخطاء Supabase التقنية إلى جملة مفهومة تقولك شو تعمل
export function explainSupabaseError(message = '') {
  if (/row-level security|violates row-level|not authorized|jwt|permission denied/i.test(message)) {
    return `انتهت جلسة الدخول أو ما عندك صلاحية. اعمل تسجيل خروج ثم ادخل من جديد. (${message})`
  }
  if (/bucket not found/i.test(message)) {
    return 'مخزن الصور product-media غير موجود. شغّل ملف supabase-fix.sql بـ Supabase. (' + message + ')'
  }
  if (/schema cache|column .* does not exist|relation .* does not exist/i.test(message)) {
    return `جدول ناقص بقاعدة البيانات. شغّل ملف supabase-fix.sql بـ Supabase. (${message})`
  }
  return message
}

// ---------- Media (Supabase Storage) ----------
const MEDIA_BUCKET = 'product-media'
const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'video/mp4': 'mp4', 'video/webm': 'webm' }

// يرفع صورة/فيديو (data URL) إلى Storage ويرجّع رابطها العام
export async function uploadMediaToStorage(dataUrl, folder = 'misc') {
  if (!supabase) throw new Error('Supabase غير مُعرّف')
  const blob = await (await fetch(dataUrl)).blob()
  const path = `${folder}/${crypto.randomUUID()}.${EXT[blob.type] || 'bin'}`
  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, blob, { contentType: blob.type, cacheControl: '31536000' })
  if (error) throw new Error(explainSupabaseError(error.message))
  return supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl
}

// ---------- Products ----------
export async function fetchProductsFromDatabase() {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('products')
    .select('data')
    .not('data', 'is', null)
    .order('created_at', { ascending: false })
  if (error) {
    console.error('خطأ في جلب المنتجات:', error.message)
    return []
  }
  return (data || []).map((row) => row.data).filter(Boolean)
}

export async function upsertProductToDatabase(product) {
  if (!supabase) return { ok: false, message: 'Supabase غير مُعرّف' }
  const stockTotal = Object.values(product.stock || {}).reduce((a, b) => a + (Number(b) || 0), 0)
  const { error } = await supabase.from('products').upsert(
    {
      pid: product.id,
      name: product.name,
      price: product.price,
      stock: stockTotal,
      image_url: typeof product.images?.[0] === 'string' && !product.images[0].startsWith('data:') ? product.images[0] : null,
      category: product.tags?.[0] ?? null,
      data: product,
    },
    { onConflict: 'pid' },
  )
  if (error) console.error('خطأ في حفظ المنتج:', error.message)
  return error ? { ok: false, message: explainSupabaseError(error.message) } : { ok: true }
}

export async function deleteProductFromDatabase(id) {
  if (!supabase) return
  const { error } = await supabase.from('products').delete().eq('pid', id)
  if (error) console.error('خطأ في حذف المنتج:', error.message)
}
