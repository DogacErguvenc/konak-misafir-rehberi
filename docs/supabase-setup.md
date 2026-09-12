# Konak hesaplarını ve ortak veritabanını etkinleştirme

Konak Supabase projesi (`engsmwhpktkbielnxoju`, Frankfurt) oluşturuldu ve uygulamanın bağlantı ayarları 12 Eylül 2026'da yapılandırıldı. Şema kuruldu; canlı API bağlantısı ve anonim tablo erişim engelleri doğrulandı. Canlı PostgreSQL üzerinde geçici iki kullanıcı kimliğiyle işletme ayrımı, taslak/yayın ayrımı ve yayından kaldırma denendi; işlem sonunda tüm deneme verileri geri alındı. Bu kontrol gerçek kullanıcı girişi veya e-posta teslimi testi değildir.

Site URL ve canlı `/dashboard/`, `/sifre-yenile/` dönüş adresleri kaydedildi. E-posta ile kayıt ve e-posta doğrulama açık. Yerel `.env.local` ve Sites ortam ayarlarında yalnızca public bağlantı değerleri bulunur; statik dağıtım için bu değerlerle yeniden derleme gerekir.

**Kalan kabul adımları:** kullanıcının ilk Konak hesabını açıp doğrulaması, gerçek rehber yayımlama/QR ve şifre yenileme denemesi, müşterilere e-posta için özel SMTP ve misafir erişimi için site paylaşımının açılması. Site hâlâ sahibine özel; satışa hazır olduğu iddia edilmez. Aşağıdaki adımlar yeni bir ortamda kurulum veya sonraki bakım içindir.

## 1. Projeyi oluştur

[Supabase hesabını aç](https://supabase.com/dashboard/sign-up), ardından dashboard üzerinden bir proje oluştur. Proje adı olarak `Konak` kullanılabilir. Veritabanı şifresini kendin belirle ve şifre yöneticinde sakla; sohbet içinde paylaşma. Ücretli plan veya ek hizmet seçimi gerekmiyor; hesabındaki plan ve kapasite seçeneklerini kontrol et.

## 2. Veritabanını hazırla

Yeni projenin SQL Editor ekranında `supabase/migrations/202609110001_tenant_guidebooks.sql` dosyasının tamamını bir kez çalıştır. Mevcut veritabanında önceden `workspaces`, `workspace_members` veya `guides` tabloları varsa önce isim çakışmasını kontrol et; silme veya sıfırlama yapma.

API ayarlarında yalnızca standart `public` şeması API üzerinden açık kalmalı. `konak_private` şemasını exposed schemas listesine ekleme. Tüm tabloların RLS'si açıktır; anon/authenticated rollere doğrudan tablo erişimi verilmez. İşlemler kimliği ve işletme üyeliğini kontrol eden dar kapsamlı fonksiyonlardan geçer.

## 3. Uygulamayı bağla

Supabase Connect / Project Settings ekranından **Project URL** ve **Publishable key** değerlerini al. Bunlar istemci bağlantısı içindir. `secret`, `service_role`, veritabanı şifresi ve kişisel erişim token'ı kullanma.

`.env.example` dosyasını `.env.local` olarak kopyala ve aşağıdaki iki alanı doldur:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Bu dosya Git'e eklenmez. Anahtarlar derleme anında tarayıcı paketine konur; statik Sites yayını yalnızca runtime değişkeni değiştirilerek bağlanmaz. Değerler değişince yerel sunucuyu yeniden başlat, bağlantıyı doğrula, yeniden derle ve yayımla.

```powershell
npm run check:cloud
npm test
npm run build:sites
```

`check:cloud` yazma işlemi yapmaz: Auth servisinin erişimini, yayımlanmış rehber fonksiyonunun varlığını ve anonim tablo okumalarının engellendiğini kontrol eder.

## 4. E-posta doğrulama ve şifre yenileme

Authentication → URL Configuration:

- Site URL: `https://konak-misafir-rehberi.dogac-erguvenc.chatgpt.site`
- Redirect URLs: `https://konak-misafir-rehberi.dogac-erguvenc.chatgpt.site/dashboard/`
- Redirect URLs: `https://konak-misafir-rehberi.dogac-erguvenc.chatgpt.site/sifre-yenile/`
- Yerel ortamda e-posta akışını deneyeceksen ayrıca `http://localhost:3000/dashboard/` ve `http://localhost:3000/sifre-yenile/` ekle. Bu isteğe bağlı adresler canlı projeye eklenmedi.

Email/password sağlayıcısını ve e-posta doğrulamasını açık bırak. Uygulama tarayıcı tabanlı Supabase implicit akışını kullanır; token'ları Supabase istemcisi işler. Misafirler hesap açmaz.

**Gerçek müşterilere kayıt açmadan önce özel SMTP bağlanmalıdır.** Supabase'in varsayılan göndericisi deneme içindir; proje ekibi dışındaki adreslere gönderim ve gönderim sıklığı kısıtlıdır. Gönderici alan adı ve SMTP hizmeti kullanıcıya ait olmalı; şifre veya SMTP anahtarını tarayıcıya koyma. E-posta doğrulamasını kaldırmak bu kurulumu tamamlamanın yerine geçmez.

## 5. İlk işletme ve eski kayıtlar

1. `/kayit` üzerinden işletme adı, e-posta ve şifre ile kayıt ol.
2. E-posta doğrulama bağlantısını aç ve `/dashboard` üzerinden işletmeni oluştur.
3. Eski rehberleri oluşturduğun **aynı tarayıcıda ve aynı site adresinde** paneli aç.
4. “Bu tarayıcıdaki rehberleri hesabınıza aktarın” bölümünde aktarılacak kayıtları seç.
5. Aktarımlar taslaktır; içerikleri inceleyip “Kaydet & yayımla” ile misafire aç.
6. Eski slug başka bir rehberde kullanılmıyorsa aktarımda korunur. Çakışma varsa yeni bağlantı üretilir; paneldeki son QR kodunu kullan. Daha sonra ev adını değiştirmek adresi değiştirmez.

Aktarım eski LocalStorage kayıtlarını silmez. Aynı kayıt tekrar aktarıldığında buluttaki güncel içerik ezilmez. Her hesap başlangıçta bir işletme oluşturur; üyelik modeli aynı işletmede birden çok kullanıcıyı destekler, ekip davet ekranı bu aşamada yoktur.

## 6. Misafir erişimi ve kabul testi

Sites yayını şu anda sahibine özel önizlemedir. Supabase bağlantısı tek başına sitenin paylaşım ayarını değiştirmez. Gerçek misafirlerin QR ile erişmesi için, içerik kontrolünden sonra site erişimi kamuya açılmalı veya halka açık bir alan adına dağıtılmalıdır.

Hesap bağlandıktan sonra gerçek Supabase ortamında doğrula:

- İki farklı işletme hesabı oluştur; her hesap yalnızca kendi rehberlerini görmeli.
- Rehberi yayımla; oturumsuz farklı tarayıcı/telefonda QR bağlantısını aç. Wi-Fi kopyalama çalışmalı.
- Yayımdaki rehberin taslağını değiştir; misafir hâlâ son yayımlanan sürümü görmeli.
- Tekrar yayımla; misafir yeni içeriği görmeli. Yayından kaldırınca yeni okumalar içerik döndürmemeli.
- Şifremi unuttum akışını e-posta gönderiminden şifre güncellemeye kadar dene.
- İki sekmede aynı rehberi düzenle; eski sürümle yapılan kayıt güncel veriyi ezmeden hata vermeli.

Yerel testler PGlite PostgreSQL motorunda şemayı, fonksiyon izinlerini, iki işletme kimliğini, taslak/yayın ayrımını, tekrar aktarımı ve sürüm çakışmasını çalıştırır. Supabase Auth, PostgREST, e-posta teslimi ve farklı cihaz testleri canlı proje olmadan doğrulanmış sayılmaz.

## Bu aşamanın kapsamı

Hazır: kayıt/giriş/çıkış, şifre yenileme, işletme oluşturma, işletmeye özel çoklu rehber, taslak/yayın/yayından kaldırma, QR paylaşımı, eski kayıt aktarımı ve veritabanı yetkilendirmesi.

Ayrı ürün aşamaları: abonelik ve ödeme, ekip davetleri, müşteri destek paneli, rezervasyon/PMS entegrasyonu. Yayımlanmış rehbere bağlantıyı bilen herkes erişebilir; rezervasyona özel süreli erişim henüz yoktur. Yayından kaldırmak daha önce açılmış bir sayfayı veya indirilmiş bilgiyi geri alamaz.

Kaynaklar: [Supabase parola ile giriş](https://supabase.com/docs/guides/auth/passwords), [API anahtarları](https://supabase.com/docs/guides/getting-started/api-keys), [SMTP kurulumu](https://supabase.com/docs/guides/auth/auth-smtp), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).
