import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Pencil, Trash2, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/hooks/use-auth";
import { exportToExcel } from "@/lib/excel";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/contributors")({
  component: ContributorsPage,
});

type C = { id: string; name: string; address: string | null; mobile: string | null; alt_mobile: string | null; village: string | null; contribution_date: string | null };

function ContributorsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [items, setItems] = useState<C[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<C | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", address: "", mobile: "", alt_mobile: "", village: "", contribution_date: "" });

  const load = async () => {
    const { data } = await supabase.from("contributors").select("*").order("created_at", { ascending: false });
    setItems(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", address: "", mobile: "", alt_mobile: "", village: "", contribution_date: new Date().toISOString().slice(0, 10) });
    setOpen(true);
  };
  const openEdit = (c: C) => {
    setEditing(c);
    setForm({ name: c.name, address: c.address ?? "", mobile: c.mobile ?? "", alt_mobile: c.alt_mobile ?? "", village: c.village ?? "", contribution_date: c.contribution_date ?? "" });
    setOpen(true);
  };

  const save = async () => {
    if (!user) return;
    const payload = { ...form, created_by: user.id };
    const { error } = editing
      ? await supabase.from("contributors").update(payload).eq("id", editing.id)
      : await supabase.from("contributors").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success("Saved"); setOpen(false); load();
  };

  const remove = async (id: string) => {
    if (!confirm(t("common.confirmDelete"))) return;
    await supabase.from("contributors").delete().eq("id", id);
    load();
  };

  const q = search.toLowerCase();
  const filtered = items.filter((i) =>
    i.name.toLowerCase().includes(q) ||
    (i.mobile ?? "").includes(q) ||
    (i.village ?? "").toLowerCase().includes(q)
  );

  const exportXls = () => exportToExcel(filtered.map((c, idx) => ({
    "SL.NO": idx + 1, Name: c.name, Address: c.address ?? "", Mobile: c.mobile ?? "",
    "Alt Mobile": c.alt_mobile ?? "", Village: c.village ?? "", Date: c.contribution_date ?? "",
  })), "contributors", "Contributors");

  return (
    <div>
      <PageHeader
        title={t("contributors.title")}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportXls}><Download className="h-4 w-4 mr-1" />{t("common.export")}</Button>
            <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" />{t("contributors.new")}</Button>
          </div>
        }
      />
      <Card className="mb-4"><CardContent className="p-3">
        <Input placeholder={`${t("common.search")} (${t("contributors.name")} / ${t("contributors.mobile")} / ${t("contributors.village")})`} value={search} onChange={(e) => setSearch(e.target.value)} />
      </CardContent></Card>
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>{t("contributors.name")}</TableHead>
                <TableHead>{t("contributors.mobile")}</TableHead>
                <TableHead>{t("contributors.village")}</TableHead>
                <TableHead>{t("contributors.contributionDate")}</TableHead>
                <TableHead className="text-right">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">{t("common.empty")}</TableCell></TableRow>
              ) : filtered.map((c, idx) => (
                <TableRow key={c.id}>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.mobile}</TableCell>
                  <TableCell>{c.village}</TableCell>
                  <TableCell>{c.contribution_date}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? t("contributors.editTitle") : t("contributors.new")}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>{t("contributors.name")}</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>{t("contributors.address")}</Label><Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{t("contributors.mobile")}</Label><Input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} /></div>
              <div><Label>{t("contributors.altMobile")}</Label><Input value={form.alt_mobile} onChange={(e) => setForm({ ...form, alt_mobile: e.target.value })} /></div>
            </div>
            <div><Label>{t("contributors.village")}</Label><Input value={form.village} onChange={(e) => setForm({ ...form, village: e.target.value })} /></div>
            <div><Label>{t("contributors.contributionDate")}</Label><Input type="date" value={form.contribution_date} onChange={(e) => setForm({ ...form, contribution_date: e.target.value })} /></div>
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
