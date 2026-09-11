export function accountError(error: unknown) {
  const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
  const message = error instanceof Error ? error.message : "";
  if (code === "invalid_credentials") return "E-posta veya şifre hatalı.";
  if (code === "email_not_confirmed")
    return "Giriş yapmadan önce e-postanıza gelen doğrulama bağlantısını açın.";
  if (code === "over_email_send_rate_limit" || code === "over_request_rate_limit")
    return "Çok fazla deneme yapıldı. Lütfen biraz sonra tekrar deneyin.";
  if (code === "weak_password") return "Daha güçlü bir şifre seçin; en az 10 karakter kullanın.";
  if (code === "same_password") return "Yeni şifreniz eskisinden farklı olmalı.";
  if (code === "42501" || code === "PGRST301")
    return "Bu işlem için yetkiniz yok veya oturumunuz sona erdi. Yeniden giriş yapın.";
  if (code === "40001")
    return "Bu rehber başka bir sekmede güncellendi. Son kaydı açıp değişikliklerinizi yeniden uygulayın.";
  if (code === "PGRST202" || code === "42P01")
    return "Veritabanı kurulumu tamamlanmamış. Lütfen işletme yöneticisine bildirin.";
  if (code === "email_address_not_authorized")
    return "Doğrulama e-postası gönderilemedi. E-posta hizmeti henüz kullanıma açılmamış.";
  if (code === "validation_failed" || code === "22023")
    return "Bilgileri kontrol edip tekrar deneyin.";
  if (/fetch|network/i.test(message))
    return "Bağlantı kurulamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.";
  return "İşlem tamamlanamadı. Lütfen tekrar deneyin.";
}
