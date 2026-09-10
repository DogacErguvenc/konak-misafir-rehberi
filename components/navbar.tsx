"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { ArrowUpRight, House, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" aria-label="Konak ana sayfa" className="logo">
      <span className="logo-mark">
        <House size={22} strokeWidth={2.2} />
      </span>
      <span>
        konak<span className="logo-period">.</span>
      </span>
      {!compact && (
        <span className="logo-descriptor">
          İyi ev sahipliğinin
          <br />
          dijital hali.
        </span>
      )}
    </Link>
  );
}
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      aria-label={mounted && resolvedTheme === "dark" ? "Açık temaya geç" : "Koyu temaya geç"}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      {mounted && resolvedTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </Button>
  );
}
export function Navbar({ dashboard = false }: { dashboard?: boolean }) {
  return (
    <header className="site-navbar">
      <div className="navbar-inner">
        <Logo />
        <nav aria-label="Ana gezinme" className="nav-links">
          {dashboard ? (
            <Link href="/">Ana sayfaya dön</Link>
          ) : (
            <>
              <a href="#nasil-calisir">Nasıl çalışır?</a>
              <Link href="/rehber/sapanca-doga-3">
                Örnek rehber <ArrowUpRight size={14} />
              </Link>
            </>
          )}
        </nav>
        <div className="nav-actions">
          <ThemeToggle />
          <Button asChild size="sm">
            <Link href={dashboard ? "/rehber/sapanca-doga-3" : "/dashboard"}>
              {dashboard ? "Örnek rehber" : "Ücretsiz başla"}
              <ArrowUpRight size={16} />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
