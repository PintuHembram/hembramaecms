import { Logo } from "@/components/Logo";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { createFileRoute } from "@tanstack/react-router";
import { Calendar, Gift, IndianRupee, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({ events: 0, contributors: 0, contributions: 0, cash: 0 });
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [e, c, cn, cash, rec] = await Promise.all([
        supabase.from("events").select("id", { count: "exact", head: true }),
        supabase.from("contributors").select("id", { count: "exact", head: true }),
        supabase.from("contributions").select("id", { count: "exact", head: true }),
        supabase.from("contributions").select("price").eq("category", "cash"),
        supabase.from("contributions").select("id, product_name, quantity, unit, created_at, contributors(name), events(name)").order("created_at", { ascending: false }).limit(8),
      ]);
      const cashTotal = (cash.data ?? []).reduce((s, r: any) => s + Number(r.price ?? 0), 0);
      setStats({
        events: e.count ?? 0,
        contributors: c.count ?? 0,
        contributions: cn.count ?? 0,
        cash: cashTotal,
      });
      setRecent(rec.data ?? []);
    })();
  }, []);

  const cards = [
    { label: t("dashboard.totalEvents"), value: stats.events, icon: Calendar },
    { label: t("dashboard.totalContributors"), value: stats.contributors, icon: Users },
    { label: t("dashboard.totalContributions"), value: stats.contributions, icon: Gift },
    { label: t("dashboard.cashSummary"), value: `₹ ${stats.cash.toLocaleString()}`, icon: IndianRupee },
  ];

  return (
    <div>
      <PageHeader title={t("dashboard.title")} logo={<Logo size="sm" />} />
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <c.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">{c.label}</div>
                <div className="text-xl font-bold">{c.value}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle>{t("dashboard.recent")}</CardTitle></CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <div className="text-center text-muted-foreground py-6">{t("common.empty")}</div>
          ) : (
            <ul className="divide-y">
              {recent.map((r) => (
                <li key={r.id} className="py-2 flex justify-between text-sm">
                  <span>
                    <span className="font-medium">{r.contributors?.name}</span>
                    <span className="text-muted-foreground"> · {r.events?.name}</span>
                  </span>
                  <span className="text-muted-foreground">{r.product_name} · {r.quantity} {r.unit ?? ""}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
