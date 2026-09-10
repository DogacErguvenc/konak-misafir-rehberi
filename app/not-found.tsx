import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function NotFound() {
  return (
    <main className="guide-not-found">
      <h1>Bu sayfa bulunamadı.</h1>
      <p>Bağlantıyı kontrol edin veya ana sayfaya dönün.</p>
      <Button asChild>
        <Link href="/">Ana sayfaya dön</Link>
      </Button>
    </main>
  );
}
