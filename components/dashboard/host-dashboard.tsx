"use client";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { Building2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/auth-provider";
import { AuthForm } from "@/components/auth/auth-form";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashboardEditor } from "./dashboard-editor";
import { CloudGuideRepository } from "@/lib/repositories/cloud-guide-repository";
import { getGuideRepository } from "@/lib/repositories/guide-repository";
import type { Guide } from "@/lib/types";
import { getSupabaseClient } from "@/lib/supabase/client";
import { accountError } from "@/lib/supabase/errors";

const workspaceSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  role: z.enum(["owner", "editor"]),
});
type Workspace = z.infer<typeof workspaceSchema>;

export function HostDashboard() {
  const auth = useAuth();
  const local = useMemo(
    () => ({
      list: () => getGuideRepository().list(),
      findBySlug: (slug: string) => getGuideRepository().findBySlug(slug),
      save: (guide: Guide) => getGuideRepository().save(guide),
    }),
    [],
  );
  if (!auth.configured) return <DashboardEditor repository={local} />;
  if (auth.loading)
    return (
      <main className="guide-loading" aria-busy="true">
        Oturumunuz kontrol ediliyor…
      </main>
    );
  if (!auth.session || auth.error) return <AuthForm mode="login" />;
  return (
    <WorkspaceDashboard
      key={auth.session.user.id}
      initialName={String(auth.session.user.user_metadata.business_name ?? "").slice(0, 100)}
    />
  );
}

function WorkspaceDashboard({ initialName }: { initialName: string }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selected, setSelected] = useState("");
  const [name, setName] = useState(initialName);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const client = getSupabaseClient();
  const repository = useMemo(() => new CloudGuideRepository(client, selected), [client, selected]);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    void (async () => {
      try {
        const { data, error } = await client.rpc("list_workspaces");
        if (error) throw error;
        const list = workspaceSchema.array().parse(data);
        if (active) {
          setWorkspaces(list);
          setSelected(list[0]?.id ?? "");
        }
      } catch (error) {
        if (active) setError(accountError(error));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [client, attempt]);
  async function create(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const { data, error } = await client.rpc("create_workspace", { p_name: name.trim() });
      if (error) throw error;
      const workspace = workspaceSchema.parse(data);
      setWorkspaces([workspace]);
      setSelected(workspace.id);
    } catch (error) {
      setError(accountError(error));
    } finally {
      setBusy(false);
    }
  }
  const workspace = workspaces.find((w) => w.id === selected);
  if (loading)
    return (
      <main className="guide-loading" aria-busy="true">
        İşletmeniz yükleniyor…
      </main>
    );
  if (workspace)
    return (
      <DashboardEditor
        key={workspace.id}
        repository={repository}
        workspace={workspace}
        workspacePicker={
          workspaces.length > 1 ? (
            <label className="form-field">
              İşletme
              <select value={selected} onChange={(event) => setSelected(event.target.value)}>
                {workspaces.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null
        }
      />
    );
  return (
    <div>
      <Navbar dashboard />
      <main className="onboarding-layout">
        <section className="account-card">
          <Building2 size={32} />
          <h1>İşletmenizi oluşturalım.</h1>
          <p>Bu alanda yalnızca işletmenize ait evler ve rehberler yer alacak.</p>
          {error && (
            <div className="field-error" role="alert">
              {error}
              <Button variant="ghost" onClick={() => setAttempt((v) => v + 1)}>
                Tekrar dene
              </Button>
            </div>
          )}
          {!error && (
            <form onSubmit={create} className="account-form">
              <label className="form-field" htmlFor="workspace-name">
                İşletme adı
                <Input
                  id="workspace-name"
                  autoComplete="organization"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  minLength={2}
                  maxLength={100}
                  required
                />
              </label>
              <Button type="submit" disabled={busy}>
                {busy ? "Oluşturuluyor…" : "İşletmemi oluştur"}
              </Button>
            </form>
          )}
          <SignOutButton />
        </section>
      </main>
    </div>
  );
}

export function SignOutButton() {
  const [busy, setBusy] = useState(false);
  async function signOut() {
    setBusy(true);
    try {
      const { error } = await getSupabaseClient().auth.signOut({ scope: "local" });
      if (error) throw error;
    } catch (error) {
      toast.error(accountError(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Button variant="ghost" type="button" size="sm" disabled={busy} onClick={signOut}>
      <LogOut size={15} />
      {busy ? "Çıkılıyor…" : "Çıkış yap"}
    </Button>
  );
}
