# Konak: ChatGPT'den bağımsız barındırma

14 Eylül 2026: bağımsız kurulum hazırlığı. Canlı taşıma henüz tamamlanmadı.

## Hedef yapı

- Domain: işletmecinin kendi kayıt hesabında; sağlayıcı seçimi barındırmadan bağımsızdır.
- DNS ve web yayını: işletmecinin Cloudflare hesabı, Workers Static Assets.
- Kaynak kod: işletmecinin kendi GitHub hesabında özel depo; yerel kopya ayrıca saklanır.
- Hesaplar ve rehberler: mevcut Supabase projesi. Veriyi yeniden oluşturmak veya şemayı sıfırlamak gerekmez.
- Müşteri yazışmaları: alan adına ait gerçek posta kutusu.
- Kayıt ve şifre yenileme mesajları: Supabase'e bağlı, otomatik gönderime uygun özel SMTP hizmeti.

Uygulama çalışırken OpenAI API çağrısı yapmaz. Yeni derleme komutu Sites hesabını veya `.openai/hosting.json` dosyasını okumaz. Eski Sites ayarları, yeni yayının doğrulanmasına kadar geri dönüş için korunur; Cloudflare bunları kullanmaz. Taşıma tamamlandığında geliştirme, yayımlama ve ziyaretçi erişimi ChatGPT aboneliği gerektirmemelidir.

## Derleme ve yerel doğrulama

Node.js 22 LTS veya kullanılan Wrangler sürümünün desteklediği daha yeni bir LTS sürümü ve npm kullanın.

```sh
npm ci
npm run build:cloudflare
npm run preview:cloudflare
```

Derleme ortamına `.env.example` dosyasındaki iki `NEXT_PUBLIC_SUPABASE_*` değişkenini ekleyin. Next.js bu değerleri derleme sırasında JavaScript'e koyar; Cloudflare'da sonradan yalnızca çalışma zamanı değişkeni tanımlamak yeterli değildir. URL ile publishable/anon anahtarı kullanılmalıdır. Service-role, secret key ve SMTP parolası tarayıcı paketine veya Git deposuna konulmaz.

`build:cloudflare`, Supabase ayarı eksikse yayını durdurur; canlı sürümün yanlışlıkla cihazla sınırlı yerel deneme moduna dönmesini önler. `build:static`, bilerek bağımsız yerel demo üretmek için aynı dışa aktarma işlemini kullanır. Normal `npm run build` / `npm start` ile Next.js Node sunucusu da kullanılabilir.

`wrangler.jsonc` yalnızca `out/` dizinini yayımlar. `.env.local`, kaynak kod ve yerel arşivler web dosyalarına dahil değildir. Projede özel Worker sunucu kodu yoktur; istekler statik dosyalara gider, değişken rehber verisi Supabase'den yüklenir.

## Hesaplara bağlama

1. GitHub'da kullanıcıya ait özel depo oluşturun ve kaynak kodu aktarın. `.env*` (`.env.example` hariç), `.dev.vars*`, `.wrangler/`, `node_modules/`, `out/` ve arşivleri dahil etmeyin.
2. Cloudflare Workers & Pages bölümünden yeni Worker oluşturup yalnızca bu depoya erişim veren GitHub bağlantısını kullanın. Hesap erişimi onayını kullanıcıya gösterin.
3. Worker adı `konak-misafir-rehberi`, build komutu `npm run build:cloudflare`, deploy komutu `npx wrangler deploy` olsun. Bu yapılandırma tam Next.js sunucu adaptörü gerektirmez.
4. İki Supabase bağlantı değişkenini build ortamına ekleyin. `.env.local` dosyasını GitHub'a göndermeyin.
5. Yayından önce içeriği ve erişim kapsamını kullanıcıya gösterin. Mevcut Sites yayını özel erişimlidir; bağımsız herkese açık yayın ayrı bir erişim değişikliğidir. Yalnızca yayımlanan rehberler misafirlere açılır; panel Supabase oturumu ister.
6. Cloudflare'ın verdiği yeni adresle kabul kontrollerini yapın. Sonra seçilen domaini bağlayın; DNS ve HTTPS doğrulamasını tamamlayın.

Cloudflare CLI ile yayın yapılırsa `npm run deploy:cloudflare` derleyip yayımlar. Bu komut harici yayını değiştirir; hedef hesap doğrulanıp yayına izin verilmeden çalıştırılmamalıdır.

## QR ve hesap bağlantıları

- `assets.not_found_handling: "single-page-application"` zorunludur. Yeni rehber slug'ları derlemeden sonra oluştuğu için dosya sisteminde bulunmaz. Sunucu `index.html` döndürür; `StaticRouteFallback` gerçek adresi okuyup yayımlanmış rehberi getirir.
- Sadece örnek rehberi açmak yeterli test değildir. Derlemede olmayan yayımlanmış bir rehber adresi doğrudan açılmalı ve yenilenmelidir.
- Supabase Auth Site URL'sini son domainle güncelleyin; `https://<domain>/dashboard/` ve `https://<domain>/sifre-yenile/` adreslerini dönüş izinlerine ekleyin. Geçiş testinde kullanılan Cloudflare adresini de gerektiği süre boyunca ayrıca izin listesine alın.
- Supabase'deki işletmeler ve rehberler aynı kalır. Oturumlar ve yalnızca LocalStorage'da kalan taslaklar alan adına bağlıdır. Yerel kayıtları eski adresten buluta aktarın; yeni adreste tekrar giriş yapın.
- Yeni QR'lar mevcut site adresinden üretilir. Eski `.chatgpt.site` adresini taşıyan basılı QR'lar kendiliğinden değişmez. Bağımsızlık için son domaine ait QR kartlarını yeniden oluşturun ve fiziksel cihazda okutun.
- Mevcut genel SPA fallback, bilinmeyen bir sayfada görsel 404 gösterirken HTTP 200 döndürebilir. Gerçek HTTP 404 gerekli olduğunda ayrı bir sunucu yönlendirmesi değerlendirilmelidir.

## Geçişin tamamlanma koşulları

- Yeni site, ChatGPT oturumu bulunmayan bir tarayıcıda açılıyor.
- Kayıt/doğrulama, giriş, çıkış ve şifre yenileme yeni adreste çalışıyor.
- Başka işletmeye ait taslak ve yönetim işlemleri erişilemez durumda.
- Derlemeden sonra oluşturulan yayımlanmış rehber doğrudan bağlantı ve fiziksel QR ile açılıyor.
- Wi-Fi kopyalama, WhatsApp, harita ve QR yazdırma çalışıyor.
- Kaynaklar GitHub'da ve yerelde; Supabase verileri için ayrıca dışa aktarım/yedek planı var. GitHub kaynak yedeği müşteri veritabanı yedeği değildir.
- Domain ve hizmet hesapları kullanıcıya ait; yeni bağlantılar doğrulandıktan sonra eski yayın ayrıca devreden çıkarılıyor.

## E-posta seçimi

Üç ürün aynı şey değildir: yönlendirme gelen mesajı mevcut adrese taşır; posta kutusu markalı adresten gönderip almayı sağlar; uygulama SMTP hizmeti otomatik doğrulama ve şifre yenileme mesajlarını gönderir. Domainle verilen paketin tam posta kutusu mu, sadece yönlendirme mi, süreli deneme mi olduğu kontrol edilmelidir. Posta kutusunun SMTP'si varsa otomatik gönderim politikası ve sınırları ayrıca doğrulanır. Domain başka sağlayıcıdan alınsa da e-posta DNS kayıtlarıyla bağlanabilir.

## Kaynaklar

- [Cloudflare Static Assets](https://developers.cloudflare.com/workers/static-assets/)
- [Cloudflare statik dosya ücretlendirmesi](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/)
- [Cloudflare yönlendirme ayarları](https://developers.cloudflare.com/workers/wrangler/configuration/#assets)
- [Supabase özel SMTP](https://supabase.com/docs/guides/auth/auth-smtp)
- [Supabase dönüş adresleri](https://supabase.com/docs/guides/auth/redirect-urls)
