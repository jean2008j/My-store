# Owl Store — نسخة العرض (Demo)

متجر ملابس (OWL) مبني بـ React + Vite + TanStack Router + Zustand.

**هذه النسخة ديمو بالكامل — بدون أي ربط فعلي بقاعدة بيانات.**

كل البيانات (منتجات، طلبات، إعدادات، سلة) تعيش في المتصفح عبر:
- بيانات البذور (seed) من `src/lib/store/catalog.ts`
- تخزين محلي (localStorage) عبر Zustand persist

## التشغيل

```bash
npm install
npm run dev
```

افتح: http://localhost:3000

## لوحة الإدارة

المسار: `/admin`

رمز الدخول التجريبي: **OWL-2026**

## ماذا يعمل في الديمو؟

| الميزة | الحالة |
|--------|--------|
| تصفح المنتجات + البحث | ✅ من الـ seed |
| السلة + الطلب | ✅ محلي |
| لوحة الأدمن (تعديل منتجات، أسعار، مخزون) | ✅ يحفظ محلياً |
| إحصائيات / عروض / شحن | ✅ محلي أو واجهة فقط |
| كلمة سر المتجر (Store Gate) | ✅ محلي |
| رفع صور إلى Storage | ❌ معطل (يبقى data URL محلياً) |
| طلبات حقيقية + تيليغرام | ❌ لا إرسال خارجي |
| Supabase / Auth / Edge Functions | ❌ معطل بالكامل |

## إعادة تفعيل Supabase لاحقاً

1. في `src/lib/db-service.js` غيّر:
   ```js
   const FORCE_DEMO = false
   ```
2. أضف ملف `.env`:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```
3. شغّل ملفات SQL الموجودة في جذر المشروع (`supabase-*.sql`) داخل مشروعك على Supabase.

## التقنيات

- React 19 + Vite 8
- TanStack Router
- Zustand (persist)
- Tailwind CSS 4
- Supabase JS (موجود لكن معطل في الديمو)
- Sonner (toasts)
- Lucide icons

---

**ملاحظة:** الملفات `supabase-*.sql` و `supabase/` بقيت للمرجع فقط. الديمو لا يحتاجها.
