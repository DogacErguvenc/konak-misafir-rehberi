# Konak — Dijital Misafir Rehberi

Türkiye'deki villa, bungalov ve kısa dönem kiralama işletmeleri için Next.js App Router MVP'si. Misafir rehberi, dört adımlı ev sahibi paneli ve etkileşimli telefon önizlemeli açılış sayfası aynı veri modelini kullanır.

**Hesap ve ortak veritabanı aşaması:** Supabase Auth, işletme yalıtımı, yayımlanmış rehberler, taslaklar ve eski kayıt aktarımı eklendi. Canlı bağlantıyı açmak için [Supabase kurulumunu](docs/supabase-setup.md) tamamlayın. İki bağlantı değişkeni tanımlı değilken mevcut yerel deneme modu korunur; eksik veya hatalı bulut ayarı sessizce yerel kayda dönmez.

## Kurulum

Node.js 20.9+ gereklidir. Kilitli sürümlerle bu projeyi kurmak için `npm ci` çalıştırın. Yeni bir projede bütün bağımlılıkları tek komutla kurmak için:

```powershell
npm install next@^16 react@^19 react-dom@^19 typescript @types/node @types/react @types/react-dom tailwindcss @tailwindcss/postcss @radix-ui/react-accordion @radix-ui/react-slot class-variance-authority lucide-react clsx tailwind-merge next-themes qrcode.react sonner zod tsx
```

```powershell
npm run dev
```

Yerel adres: http://localhost:3000

```powershell
npm run typecheck
npm test
npm run build
npm start
```

## Dosya ve klasör yapısı

```text
app/
  globals.css                   # Tema tokenları, responsive tasarım, QR baskı stilleri
  layout.tsx                    # Metadata ve ortak sağlayıcılar
  page.tsx                      # Açılış sayfası + canlı telefon önizlemesi
  not-found.tsx                 # Bilinmeyen sayfa durumu
  dashboard/page.tsx            # Ev sahibi paneli
  rehber/[slug]/page.tsx         # Dinamik misafir rehberi
components/
  navbar.tsx                    # Navbar, logo, tema değiştirici
  providers.tsx                 # next-themes ve Sonner bildirimleri
  ui/
    button.tsx                  # Shadcn/CVA düğmesi
    input.tsx                   # Input ve Textarea
    accordion.tsx               # Shadcn/Radix erişilebilir akordeon
  guide/
    guide-view.tsx              # Misafir ekranı, dil seçimi, çevre kartları
    guest-loader.tsx            # LocalStorage sorgusu ve bulunamadı durumları
    static-route-fallback.tsx   # Statik yayında sonradan oluşturulan rehber adresleri
    wifi-card.tsx               # Pano kopyalama + hata/başarı bildirimi
    instructions-accordion.tsx  # Cihaz ve ev talimatları
  dashboard/
    dashboard-editor.tsx        # Dört adım, doğrulama, dinamik maddeler, önizleme
    qr-generator.tsx            # Gerçek SVG QR, link kopyalama, Print/PDF
lib/
  mock-data.ts                  # Gerçekçi ve kurgusal Sapanca örneği
  types.ts                      # TypeScript tipleri + Zod şeması
  i18n.ts                       # TR / EN / AR arayüz sözlüğü
  utils.ts                      # cn, Türkçe slug, güvenli URL, WhatsApp biçimleme
  public-route.ts                # Rehber URL eşleştirme ve geçersiz yol kontrolü
  webmcp.ts                     # Destekleyen istemciler için isteğe bağlı araçlar
  repositories/
    guide-repository.ts         # Değiştirilebilir veri katmanı
public/
  icon.svg                      # Konak simgesi
scripts/
  build-sites.mjs               # Sites için Next.js statik export + SPA kontrolü
tests/
  guide-repository.test.ts       # Kayıt, tekrar açma, slug, hata ve URL testleri
.openai/hosting.json            # Sites hedefi
components.json                # Shadcn yapılandırması
next.config.ts
postcss.config.mjs
tsconfig.json
package.json
package-lock.json
```

## Kullanım

1. `/` açılış sayfasındaki telefonu kaydırabilir; Wi-Fi kartını, talimatları ve dili deneyebilirsiniz.
2. `/dashboard` örnek bilgilerle başlar. Ev adı, fotoğraf ve adresi düzenleyin.
3. Wi-Fi ve WhatsApp alanlarını değiştirin. Talimat ve çevre önerisi ekleyip çıkarın.
4. `Kaydet & QR oluştur` bütün formu doğrular, tarayıcıya kaydeder ve benzersiz slug üretir.
5. Gerçek QR kod, mevcut sitenin origin'i ile `/rehber/[slug]` bağlantısını içerir. Yeniden adlandırma, mevcut slug'ı değiştirmez.
6. `QR kartını yazdır / PDF` tarayıcının baskı penceresini açar. A5 portre kartı veya PDF olarak kaydetme kullanılabilir.
7. Panelde kayıtlı rehber seçilerek yeniden düzenlenebilir. Kayıtlar sayfa yenilense de korunur.

## MVP sınırları

- LocalStorage yalnızca aynı origin, tarayıcı profili ve cihazda kullanılabilir. Yeni bir rehberin QR'ı başka telefonda o rehbere erişim sağlamaz. Her cihazda erişilebilen demo: `/rehber/sapanca-doga-3`.
- Supabase bağlandığında dashboard oturum gerektirir. Veritabanı yetkilendirmesi istemciden bağımsız olarak işletme üyeliğini kontrol eder; yayımlanan rehberler farklı cihazlardan okunur. Henüz bağlanmamış yerel denemede hesap/erişim kontrolü yoktur. Ödeme ve abonelik bu aşamada yoktur.
- Sites yayını özel önizlemedir; kamuya açık misafir erişimi değildir. Gerçek işletme kullanımında hem paylaşım erişimi hem sunucu verisi gerekir.
- TR/EN/AR seçiminde arayüz metinleri değişir; Arapça görünüm RTL'dir. Ev sahibinin girdiği metinler otomatik çevrilmez; yabancı dilde bu durum açıklanır.
- Mobil uygulama hissi vardır; service worker, çevrimdışı kullanım veya tam yüklenebilir PWA bu aşamanın kapsamına dahil değildir.
- İşletme adı, adres, WhatsApp numarası ve mesafeler örnek içeriktir. Fotoğraflar temsili stok fotoğraflardır. Eczane kartı güncel bir nöbet listesi iddiasında bulunmaz.
- URL alanlarında yalnızca HTTP/HTTPS kabul edilir. Tarayıcı panosu izin vermediğinde kullanıcıya elle kopyalama yolu belirtilir. Depolama hataları başarılı kayıt gibi gösterilmez ve bozuk kayıtlar sessizce ezilmez.

## Supabase'e geçiş

`CloudGuideRepository`, mevcut veri arayüzünü uygular. `HostDashboard` oturum ve işletmeyi seçip repository'yi editöre geçirir; misafirler yalnızca `get_published_guide(slug)` fonksiyonunu kullanır. SQL fonksiyonları `auth.uid()` ile yetki kontrolü yapar. `workspaces`, `workspace_members`, `guides` tablolarına doğrudan API erişimi verilmez; her tabloda RLS açıktır.

Şema ve izinler: `supabase/migrations/202609110001_tenant_guidebooks.sql`. `draft_data` ve `published_data` ayrı tutulur. İçe aktarım `(workspace_id, source_id)` üzerinden tekrar edilebilir ve güncel bulut verisini ezmez. Yazmalar `revision` ile eşzamanlı düzenleme çakışmasını bildirir. Kurulum, SMTP, paylaşım erişimi ve canlı kabul adımları: [docs/supabase-setup.md](docs/supabase-setup.md). `npm test` SQL şemasını ve izinleri yerel PostgreSQL motorunda da çalıştırır.

## Sites statik dağıtımı

Varsayılan `npm run build` ve `npm start`, gerçek Next.js Node sunucusunu kullanır. `npm run build:sites` aynı uygulamayı `out/` içine statik çıkarır. `.openai/hosting.json` içindeki `static.not_found_handling: "single-page-application"`, derlemeden sonra oluşturulan URL'ler için `index.html` döndürür. `StaticRouteFallback`, gerçek tarayıcı URL'si `/rehber/<slug>` ise ilgili rehberi LocalStorage'dan açar. Ana sayfa korunur; ilgisiz veya geçersiz yollar sayfa bulunamadı ekranını gösterir. 404 belgesinde de aynı rehber kurtarma bileşeni bulunur. `_redirects` dosyasının Sites tarafından işlendiği varsayılmaz. Başka statik hostta `index.html` SPA fallback ayarı gerekir. Genel SPA fallback nedeniyle bilinmeyen yolların HTTP durumu 200 olabilir; gerçek sunucu 404 durumları gerektiğinde normal Next.js sunucusu kullanılmalıdır. Supabase SSR aşamasında bu statik adaptör kaldırılabilir.

Kaynaklar: [Next.js Static Exports](https://nextjs.org/docs/app/guides/static-exports), [Cloudflare Static Assets Redirects](https://developers.cloudflare.com/workers/static-assets/redirects/).

## Fotoğraf kaynakları

- Bungalov: [Musa Ortaç / Pexels](https://www.pexels.com/photo/luxury-house-with-pool-in-forest-17675658/)
- Kahvaltı: [ENESFİLM / Pexels](https://www.pexels.com/photo/turkish-breakfast-on-table-9491134/)
- Göl ve orman: [Ömer BÜLBÜL / Pexels](https://www.pexels.com/photo/lake-in-forest-18018894/)
- [Pexels lisansı](https://www.pexels.com/license/). Gerçek Sapanca işletmesine veya mekana ait oldukları iddia edilmez.

## Doğrulama

`npm test`, LocalStorage akışını bellek adaptörüyle sınar: isim çakışması, yeniden adlandırma sonrası sabit bağlantı, yeniden açma, bozuk kayıt koruması, kota hatası, URL güvenliği ve telefon biçimleme. `npm run typecheck` TypeScript denetimidir; `npm run build` üretim derlemesidir. Tarayıcı etkileşim/görsel ve fiziksel QR tarama testleri ayrı kabul kontrolleridir.

WebMCP desteklenmeyen tarayıcıda normal arayüz etkilenmez. Tarayıcı model-context ortamı olmadığı durumda WebMCP entegrasyonu uçtan uca doğrulanmış sayılmaz.
