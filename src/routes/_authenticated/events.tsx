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

export const Route = createFileRoute("/_authenticated/events")({
  component: EventsPage,
});

type Event = {
  id: string; name: string; event_type: string; event_date: string;
  location: string | null; host_family: string | null; notes: string | null;
};

function EventsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [items, setItems] = useState<Event[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Event | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", event_type: "marriage", event_date: "", location: "", host_family: "", notes: "" });

  const load = async () => {
    const { data } = await supabase.from("events").select("*").order("event_date", { ascending: false });
    setItems(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", event_type: "marriage", event_date: new Date().toISOString().slice(0, 10), location: "", host_family: "", notes: "" });
    setOpen(true);
  };
  const openEdit = (e: Event) => {
    setEditing(e);
    setForm({ name: e.name, event_type: e.event_type, event_date: e.event_date, location: e.location ?? "", host_family: e.host_family ?? "", notes: e.notes ?? "" });
    setOpen(true);
  };

  const save = async () => {
    if (!user) return;
    const payload = { ...form, created_by: user.id };
    const { error } = editing
      ? await supabase.from("events").update(payload).eq("id", editing.id)
      : await supabase.from("events").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success("Saved");
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm(t("common.confirmDelete"))) return;
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    load();
  };

  const filtered = items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));

  const exportXls = () => {
    exportToExcel(filtered.map((e) => ({
      Name: e.name, Type: t(`events.types.${e.event_type}` as any, e.event_type),
      Date: e.event_date, Location: e.location ?? "", Host: e.host_family ?? "", Notes: e.notes ?? "",
    })), "events", "Events");
  };

  return (
    <div>
      <PageHeader
        title={t("events.title")}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportXls}><Download className="h-4 w-4 mr-1" />{t("common.export")}</Button>
            <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" />{t("events.new")}</Button>
          </div>
        }
      />
      <Card className="mb-4"><CardContent className="p-3">
        <Input placeholder={t("common.search")} value={search} onChange={(e) => setSearch(e.target.value)} />
      </CardContent></Card>
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("events.name")}</TableHead>
                <TableHead>{t("events.type")}</TableHead>
                <TableHead>{t("events.date")}</TableHead>
                <TableHead>{t("events.location")}</TableHead>
                <TableHead>{t("events.host")}</TableHead>
                <TableHead className="text-right">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">{t("common.empty")}</TableCell></TableRow>
              ) : filtered.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.name}</TableCell>
                  <TableCell>{t(`events.types.${e.event_type}` as any, e.event_type)}</TableCell>
                  <TableCell>{e.event_date}</TableCell>
                  <TableCell>{e.location}</TableCell>
                  <TableCell>{e.host_family}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(e)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(e.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? t("events.editTitle") : t("events.new")}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>{t("events.name")}</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>{t("events.type")}</Label>
              <Select value={form.event_type} onValueChange={(v) => setForm({ ...form, event_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["marriage", "festival", "social", "ceremony", "other"].map((k) => (
                    <SelectItem key={k} value={k}>{t(`events.types.${k}` as any)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>{t("events.date")}</Label><Input type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} /></div>
            <div><Label>{t("events.location")}</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
            <div><Label>{t("events.host")}</Label><Input value={form.host_family} onChange={(e) => setForm({ ...form, host_family: e.target.value })} /></div>
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
