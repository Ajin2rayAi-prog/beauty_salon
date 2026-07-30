# سالن‌پرو — پلتفرم مدیریت و رزرو سالن زیبایی (Multi-Tenant SaaS)

پلتفرم فارسی (RTL) رزرو نوبت و مدیریت سالن‌های زیبایی بانوان، طراحی‌شده برای فروش به‌صورت محصول لایسنس‌دار. هر مالکِ سالن سایت اختصاصی خودش را روی یک ساب‌دامین دارد و مالک پلتفرم لایسنس‌ها و قابلیت‌ها را کنترل می‌کند.

## استک فنی
- **Next.js 14.1** (App Router) + **TypeScript**
- **Prisma 5 + SQLite** (`prisma/dev.db`)
- **NextAuth v4** (Credentials + JWT)
- **Tailwind CSS 3** + متغیرهای CSS، فونت Vazirmatn، RTL
- نمودار: `recharts` — آیکون: `lucide-react` — تاریخ شمسی: `jalaali-js`

## نقش‌ها
| نقش | دسترسی |
|-----|--------|
| `PLATFORM` | مالک پلتفرم: مدیریت tenantها، لایسنس‌ها، و روشن/خاموش‌کردن قابلیت هر سالن |
| `ADMIN` | مدیر سالن: نوبت‌ها، لاین‌ها، خدمت‌دهنده‌ها، مالی، محتوای سایت، پرونده مشتری، انبار، نظرات |
| `PROVIDER` | خدمت‌دهنده: تقویم، برنامه کاری، نمونه‌کار، درآمد خودش |
| `CUSTOMER` | مشتری: رزرو و مشاهده نوبت‌ها و امتیاز باشگاه |

## اجرا
```bash
npm install
cp .env.example .env          # مقادیر را تنظیم کنید
npx prisma db push            # ساخت اسکیمای دیتابیس
npm run seed                  # دادهٔ دموی سالن «کیا»
npm run build && npx next start -p 9091
```
ورود دمو (همه با رمز `1234`): `platform@salon.local` • `admin@kia.local` • `sara@kia.local` (خدمت‌دهنده)

## سیستم لایسنس و فعال‌سازی قابلیت
- هر `Tenant` یک `License` با پلن `STARTER | PRO | WHITELABEL` دارد. لایسنس منقضی/معلق ⇒ همهٔ قابلیت‌ها خاموش و سایت عمومی سالن دارک می‌شود.
- `src/lib/entitlements.ts` قابلیت مؤثر را چنین حساب می‌کند:
  `effective = featureOverrides[key] ?? PLAN_FEATURES[plan][key]`
- مالک پلتفرم در `/platform/salons/[id]/features` هر قابلیت را per-salon روشن/خاموش می‌کند (override روی پیش‌فرض پلن).
- گارد سرور: `requireFeature(salonId, key)` (صفحه) و `assertFeatureApi(salonId, key)` (API). منوها هم بر اساس قابلیت مخفی می‌شوند.

کلیدهای قابلیت: `onlineBooking, lineIntro, providerPanel, finance, customerRecords, reminders, inventory, multiBranch, reviews, socialCta, loyalty, seo, subdomainSite`.

## سایت مستقل هر سالن (ساب‌دامین)
- `src/middleware.ts` هاست را می‌خواند و `{subdomain}.{ROOT_DOMAIN}` را به `/s/{subdomain}` بازنویسی می‌کند.
- صفحهٔ `/s/[salonSlug]` با `slug` یا `subdomain` سالن را resolve می‌کند (مسیر `/s/{slug}` همیشه به‌عنوان fallback کار می‌کند).
- محتوای سایت را خودِ مدیر سالن از `/admin/content` می‌گذارد. در پلن `WHITELABEL` برند «سالن‌پرو» حذف و نام سالن جایگزین می‌شود.
- برای تست لوکال: مقدار `ROOT_DOMAIN` را ست کنید و از فایل hosts استفاده کنید، یا مستقیم `/s/kia` را باز کنید.

## قابلیت‌ها
- **رزرو آنلاین**: لاین → خدمت → خدمت‌دهنده → اسلات → پرداخت (نقدی/آنلاین ZarinPal، بیعانه ۳۰٪).
- **مالی**: تفکیک درآمد سالن/خدمت‌دهنده بر پایهٔ RENT یا PERCENTAGE.
- **پرونده مشتری**: فرمول رنگ، حساسیت‌ها، یادداشت پوست، تاریخچهٔ سرویس، دکمهٔ واتساپ.
- **انبار**: محصولات/مواد مصرفی با آستانهٔ کمبود موجودی و تعدیل موجودی.
- **نظرات مشتریان**: ثبت عمومی + تأیید ادمین + نمایش در سایت + میانگین امتیاز روی سالن.
- **باشگاه مشتریان**: امتیاز به‌ازای هر پرداخت (۱ امتیاز/۱۰٬۰۰۰ تومان) و سطح‌بندی BRONZE/SILVER/GOLD.
- **چندشعبه**: سوییچر سالن در پنل ادمین (کوکی `active_salon`)، ایزوله‌شده در سطح `tenantId`.
- **CTA سوشال**: لینک واقعی واتساپ (`wa.me`)، اینستاگرام، تلگرام و تماس.
- **یادآوری**: SMS خودکار (Kavenegar) + یادآوری cron + دکمهٔ click-to-chat واتساپ.
- **SEO**: `generateMetadata` per salon، `sitemap.xml`، `robots.txt`، JSON-LD `BeautySalon`، فیلدهای Google Business (lat/lng/placeId/rating).

## یادآوری خودکار (cron)
`GET|POST /api/cron/reminders` نوبت‌های `REMINDER_WINDOW_HOURS` آینده را یک‌بار SMS می‌کند (idempotent با `Appointment.reminderSentAt`). با `CRON_SECRET` محافظت می‌شود (هدر `x-cron-secret` یا `?secret=`). بدون کلید Kavenegar، پیام‌ها در `SmsLog` با وضعیت `SKIPPED` ثبت می‌شوند.

## متغیرهای محیطی
```
NEXTAUTH_URL=http://localhost:9091
NEXTAUTH_SECRET=...
ROOT_DOMAIN=localhost                 # دامنهٔ ریشه برای ساب‌دامین‌ها
PLATFORM_EMAIL=platform@salon.local   # مالک پلتفرم (seed)
PLATFORM_PASSWORD=1234
ZARINPAL_MERCHANT_ID=XXXXXXXX-...     # درگاه پرداخت
ZARINPAL_SANDBOX=true
KAVENEGAR_API_KEY=                     # خالی = SMS شبیه‌سازی/SKIPPED
KAVENEGAR_SENDER=
SMS_COST_PER_MESSAGE=400
CRON_SECRET=                           # محافظت از endpoint یادآوری
REMINDER_WINDOW_HOURS=24
```
> `.env` و `prisma/dev.db` هرگز commit نمی‌شوند.
