import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Pencil, Trash2, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/hooks/use-auth";
import { exportToExcel } from "@/lib/excel";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/contributions")({
  component: ContributionsPage,
});

type Row = {
  id: string; event_id: string; contributor_id: string; category: string;
  product_name: string; quantity: number; unit: string | null; price: number | null; notes: string | null;
  events?: { name: string }; contributors?: { name: string; village: string | null };
};

const CATEGORIES = ["ହାଣ୍ଡିଆ", "ଚାଉଳ", "ଟଙ୍କା", "ପିଆଜ", "ରସୁଣ"] as const;
const UNITS = ["kg", "piece", "liter", "bundle", "rupee"] as const;

function ContributionsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [items, setItems] = useState<Row[]>([]);
  const [events, setEvents] = useState<{ id: string; name: string }[]>([]);
  const [contributors, setContributors] = useState<{ id: string; name: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [filterEvent, setFilterEvent] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    event_id: "", contributor_id: "", category: "food", product_name: "",
    quantity: 1, unit: "kg", price: "", notes: "",
  });

  const load = async () => {
    const { data } = await supabase
      .from("contributions")
      .select("*, events(name), contributors(name, village)")
      .order("created_at", { ascending: false });
    setItems((data as any) ?? []);
    const [{ data: ev }, { data: ct }] = await Promise.all([
      supabase.from("events").select("id, name").order("event_date", { ascending: false }),
      supabase.from("contributors").select("id, name").order("name"),
    ]);
    setEvents(ev ?? []); setContributors(ct ?? []);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ event_id: events[0]?.id ?? "", contributor_id: contributors[0]?.id ?? "", category: "food", product_name: "", quantity: 1, unit: "kg", price: "", notes: "" });
    setOpen(true);
  };
  const openEdit = (r: Row) => {
    setEditing(r);
    setForm({
      event_id: r.event_id, contributor_id: r.contributor_id, category: r.category,
      product_name: r.product_name, quantity: r.quantity, unit: r.unit ?? "kg",
      price: r.price?.toString() ?? "", notes: r.notes ?? "",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!user) return;
    if (!form.event_id || !form.contributor_id) { toast.error("Pick event and contributor"); return; }
    const payload = {
      event_id: form.event_id, contributor_id: form.contributor_id, category: form.category,
      product_name: form.product_name, quantity: Number(form.quantity), unit: form.unit,
      price: form.price ? Number(form.price) : null, notes: form.notes, created_by: user.id,
    };
    const { error } = editing
      ? await supabase.from("contributions").update(payload).eq("id", editing.id)
      : await supabase.from("contributions").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success("Saved"); setOpen(false); load();
  };

  const remove = async (id: string) => {
    if (!confirm(t("common.confirmDelete"))) return;
    await supabase.from("contributions").delete().eq("id", id);
    load();
  };

  const q = search.toLowerCase();
  const filtered = items.filter((r) =>
    (filterEvent === "all" || r.event_id === filterEvent) &&
    (r.product_name.toLowerCase().includes(q) ||
     (r.contributors?.name ?? "").toLowerCase().includes(q) ||
     (r.contributors?.village ?? "").toLowerCase().includes(q))
  );

  const exportXls = () => exportToExcel(filtered.map((r, idx) => ({
    "SL.NO": idx + 1, Contributor: r.contributors?.name ?? "", Village: r.contributors?.village ?? "",
    Event: r.events?.name ?? "", Category: t(`contributions.categories.${r.category}` as any, r.category),
    Product: r.product_name, Quantity: r.quantity, Unit: r.unit ?? "", Price: r.price ?? "", Notes: r.notes ?? "",
  })), "contributions", "Contributions");

  return (
    <div>
      <PageHeader
        title={t("contributions.title")}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportXls}><Download className="h-4 w-4 mr-1" />{t("common.export")}</Button>
            <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" />{t("contributions.new")}</Button>
          </div>
        }
      />
      <Card className="mb-4"><CardContent className="p-3 flex flex-col md:flex-row gap-3">
        <Input className="md:flex-1" placeholder={t("common.search")} value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select value={filterEvent} onValueChange={setFilterEvent}>
          <SelectTrigger className="md:w-64"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.all")} {t("contributions.event")}</SelectItem>
            {events.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </CardContent></Card>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("contributions.contributor")}</TableHead>
                <TableHead>{t("contributions.event")}</TableHead>
                <TableHead>{t("contributions.category")}</TableHead>
                <TableHead>{t("contributions.product")}</TableHead>
                <TableHead>{t("contributions.quantity")}</TableHead>
                <TableHead>{t("contributions.price")}</TableHead>
                <TableHead className="text-right">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">{t("common.empty")}</TableCell></TableRow>
              ) : filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.contributors?.name}</TableCell>
                  <TableCell>{r.events?.name}</TableCell>
                  <TableCell>{t(`contributions.categories.${r.category}` as any, r.category)}</TableCell>
                  <TableCell>{r.product_name}</TableCell>
                  <TableCell>{r.quantity} {r.unit}</TableCell>
                  <TableCell>{r.price ? `₹${r.price}` : "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? t("contributions.editTitle") : t("contributions.new")}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>{t("contributions.event")}</Label>
              <Select value={form.event_id} onValueChange={(v) => setForm({ ...form, event_id: v })}>
                <SelectTrigger><SelectValue placeholder="…" /></SelectTrigger>
                <SelectContent>{events.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>{t("contributions.contributor")}</Label>
              <Select value={form.contributor_id} onValueChange={(v) => setForm({ ...form, contributor_id: v })}>
                <SelectTrigger><SelectValue placeholder="…" /></SelectTrigger>
                <SelectContent>{contributors.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>{t("contributions.category")}</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{t(`contributions.categories.${c}` as any)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>{t("contributions.product")}</Label><Input value={form.product_name} onChange={(e) => setForm({ ...form, product_name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{t("contributions.quantity")}</Label><Input type="number" step="0.01" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} /></div>
              <div><Label>{t("contributions.unit")}</Label>
                <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{UNITS.map((u) => <SelectItem key={u} value={u}>{t(`contributions.units.${u}` as any)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>{t("contributions.price")}</Label><Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
            <div><Label>{t("common.notes")}</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={save}>{t("common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
