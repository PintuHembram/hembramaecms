import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/PageHeader";
import { exportToExcel } from "@/lib/excel";

export const Route = createFileRoute("/_authenticated/reports")({
  component: ReportsPage,
});

type Row = {
  product_name: string; quantity: number; unit: string | null; price: number | null;
  category: string;
  events?: { name: string };
  contributors?: { name: string; village: string | null };
};

function ReportsPage() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("contributions")
        .select("product_name, quantity, unit, price, category, events(name), contributors(name, village)");
      setRows((data as any) ?? []);
    })();
  }, []);

  const groupBy = <K extends string>(key: (r: Row) => K) => {
    const m = new Map<string, { count: number; qty: number; cash: number }>();
    rows.forEach((r) => {
      const k = key(r) || "—";
      const cur = m.get(k) ?? { count: 0, qty: 0, cash: 0 };
      cur.count++;
      cur.qty += Number(r.quantity) || 0;
      if (r.category === "cash") cur.cash += Number(r.price) || 0;
      m.set(k, cur);
    });
    return Array.from(m.entries()).map(([key, v]) => ({ key, ...v })).sort((a, b) => b.count - a.count);
  };

  const byEvent = groupBy((r) => r.events?.name ?? "—");
  const byProduct = groupBy((r) => r.product_name);
  const byVillage = groupBy((r) => r.contributors?.village ?? "—");
  const byContributor = groupBy((r) => r.contributors?.name ?? "—");

  const Section = ({ title, label, data }: { title: string; label: string; data: { key: string; count: number; qty: number; cash: number }[] }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{title}</CardTitle>
        <Button variant="outline" size="sm" onClick={() => exportToExcel(data.map((d) => ({ [label]: d.key, Entries: d.count, Quantity: d.qty, Cash: d.cash })), title.replace(/\s+/g, "_"))}>
          <Download className="h-4 w-4 mr-1" />{t("common.export")}
        </Button>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{label}</TableHead>
              <TableHead className="text-right">Entries</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Cash (₹)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">{t("common.empty")}</TableCell></TableRow>
            ) : data.map((d) => (
              <TableRow key={d.key}>
                <TableCell>{d.key}</TableCell>
                <TableCell className="text-right">{d.count}</TableCell>
                <TableCell className="text-right">{d.qty}</TableCell>
                <TableCell className="text-right">{d.cash.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  return (
    <div>
      <PageHeader title={t("reports.title")} />
      <div className="grid gap-4 md:grid-cols-2">
        <Section title={t("reports.byEvent")} label={t("contributions.event")} data={byEvent} />
        <Section title={t("reports.byProduct")} label={t("contributions.product")} data={byProduct} />
        <Section title={t("reports.byVillage")} label={t("contributors.village")} data={byVillage} />
        <Section title={t("reports.byContributor")} label={t("contributors.name")} data={byContributor} />
      </div>
    </div>
  );
}
