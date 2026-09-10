import type { Guide } from "@/lib/types";

// Örnek işletme ve iletişim bilgileri kurgusaldır. Fotoğraflar temsilidir.
export const mockGuide: Guide = {
  id: "demo-sapanca",
  slug: "sapanca-doga-3",
  name: "Sapanca Doğa Bungalov #3",
  coverImage:
    "https://images.pexels.com/photos/17675658/pexels-photo-17675658/free-photo-of-luxury-house-with-pool-in-forest.jpeg?auto=compress&dpr=1&h=750&w=1260",
  address: "Kırkpınar Mahallesi, Çamlık Sokak No: 12, Sapanca / Sakarya",
  location: "Sapanca, Sakarya",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Kirkpinar+Sapanca+Sakarya",
  wifiName: "DogaBungalov_3",
  wifiPassword: "HosGeldiniz2026!",
  whatsapp: "+90 555 000 00 00",
  checkIn: "15:00",
  checkOut: "11:00",
  updatedAt: "2026-09-10T09:00:00.000Z",
  instructions: [
    {
      id: "climate",
      title: "Klima ve ısıtma ayarı",
      description:
        "Kumanda, salon girişindeki ahşap rafta. Açma düğmesine basın; MODE ile yazın kar, kışın güneş simgesini seçin. Konfor için 23–24 °C öneriyoruz. Kapı ve pencereleri kapalı tutun. Evden ayrılırken klimayı kapatın.",
    },
    {
      id: "pool",
      title: "Jakuzi ve havuz kullanımı",
      description:
        "Jakuziyi su seviyesi jetlerin üzerine çıkana kadar doldurun, ardından jet düğmesine basın. Köpük ve banyo tuzu kullanmayın. Havuz 09:00–22:00 arasında kullanılabilir. Cam eşya getirmeyin; çocuklara her zaman bir yetişkin eşlik etsin.",
    },
    {
      id: "water",
      title: "Sıcak su ve kombi",
      description:
        "Sıcak su otomatik olarak devreye girer; musluğu açtıktan sonra yaklaşık 30 saniye bekleyin. Kombinin ayarlarını değiştirmeyin. Su ısınmıyorsa ya da ekranda hata kodu varsa ev sahibine WhatsApp üzerinden ulaşın.",
    },
    {
      id: "rules",
      title: "Giriş, çıkış ve ev kuralları",
      description:
        "Giriş 15:00, çıkış 11:00. Anahtar teslimi için gelmeden önce bize ulaşın. 22:00–09:00 arasında sessizliğe özen gösterin. İçeride sigara içilmez. Çöpleri kapının sağındaki kapaklı kutuya bırakın. Çıkarken ışıkları kapatın ve anahtarı teslim edin.",
    },
  ],
  places: [
    {
      id: "restaurant",
      name: "Göl kenarında kahvaltı",
      category: "restaurant",
      distance: "2,4 km · 6 dk",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Sapanca+gol+kenari+kahvalti",
      imageUrl:
        "https://images.pexels.com/photos/9491134/pexels-photo-9491134.jpeg?cs=srgb&dl=pexels-enesfilm-9491134.jpg&fm=jpg",
    },
    {
      id: "nature",
      name: "Sapanca Gölü yürüyüş yolu",
      category: "nature",
      distance: "3,1 km · 8 dk",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Sapanca+Golu+yuruyus+yolu",
      imageUrl:
        "https://images.pexels.com/photos/18018894/pexels-photo-18018894.jpeg?cs=srgb&dl=pexels-sevenbcollection-18018894.jpg&fm=jpg",
    },
    {
      id: "market",
      name: "Kırkpınar marketleri",
      category: "market",
      distance: "850 m · 10 dk yürüyüş",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Kirkpinar+Sapanca+market",
      imageUrl: "",
    },
    {
      id: "pharmacy",
      name: "Yakındaki eczaneler",
      category: "pharmacy",
      distance: "Nöbet durumunu teyit edin",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Sapanca+nobetci+eczane",
      imageUrl: "",
    },
  ],
};
