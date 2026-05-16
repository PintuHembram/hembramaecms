import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  IndianRupee,
  Loader2,
  Package,
  Plus,
  Sparkles,
  StickyNote,
  Trash2,
  User2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CATEGORY_OPTIONS = [
  { id: "rice", labelKey: "contributions.categories.rice" },
  { id: "wheat", labelKey: "contributions.categories.wheat" },
  { id: "hadiya", labelKey: "contributions.categories.hadiya" },
  { id: "saree", labelKey: "contributions.categories.saree" },
  { id: "dhoti", labelKey: "contributions.categories.dhoti" },
  { id: "gamcha", labelKey: "contributions.categories.gamcha" },
  { id: "cash", labelKey: "contributions.categories.cash" },
  { id: "vegetables", labelKey: "contributions.categories.vegetables" },
  { id: "decoration", labelKey: "contributions.categories.decoration" },
  { id: "others", labelKey: "contributions.categories.others" },
] as const;

const UNIT_OPTIONS = ["kg", "piece", "liter", "bundle", "rupee"] as const;

type CategoryId = (typeof CATEGORY_OPTIONS)[number]["id"];
type UnitId = (typeof UNIT_OPTIONS)[number];

type ContributionItem = {
  category: CategoryId;
  productName: string;
  quantity: number;
  unit: UnitId;
  price: number | null;
};

type FormValues = {
  event_id: string;
  event_date: string;
  entry_name: string;
  contributor_fullName: string;
  contributor_mobile: string;
  contributor_village: string;
  contributor_address: string;
  items: ContributionItem[];
  notes: string;
};

const DRAFT_KEY = "adivasi-add-contribution-draft";

const defaultValues: FormValues = {
  event_id: "",
  event_date: new Date().toISOString().slice(0, 10),
  entry_name: "",
  contributor_fullName: "",
  contributor_mobile: "",
  contributor_village: "",
  contributor_address: "",
  items: [{ category: "rice", productName: "", quantity: 1, unit: "kg", price: null }],
  notes: "",
};

function getSchema(t: (key: string) => string) {
  return z.object({
    event_id: z.string().min(1, { message: t("validation.required") }),
    event_date: z.string().min(1, { message: t("validation.required") }),
    entry_name: z.string().min(3, { message: t("validation.required") }),
    contributor_fullName: z.string().min(2, { message: t("validation.required") }),
    contributor_mobile: z.string().min(10, { message: t("validation.required") }),
    contributor_village: z.string().min(2, { message: t("validation.required") }),
    contributor_address: z.string().min(5, { message: t("validation.required") }),
    items: z
      .array(
        z.object({
          category: z.enum(CATEGORY_OPTIONS.map((category) => category.id) as [CategoryId, ...CategoryId[]], {
            errorMap: () => ({ message: t("validation.required") }),
          }),
          productName: z.string().min(1, { message: t("validation.required") }),
          quantity: z.preprocess((value) => {
            if (typeof value === "string") return Number(value);
            return value;
          }, z.number({ invalid_type_error: t("validation.required") }).min(0.01, { message: t("validation.positive") })),
          unit: z.enum([...UNIT_OPTIONS] as [UnitId, ...UnitId[]], {
            errorMap: () => ({ message: t("validation.required") }),
          }),
          price: z.preprocess((value) => {
            if (value === "" || value === null || value === undefined) return null;
            return Number(value);
          }, z.number().nullable()),
        }),
      )
      .min(1, { message: t("validation.minItems") }),
    notes: z.string().optional(),
  });
}

export const Route = createFileRoute("/_authenticated/add-contribution")({
  component: AddContributionPage,
});

function AddContributionPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [events, setEvents] = useState<{ id: string; name: string; event_date: string }[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [draftMessage, setDraftMessage] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(getSchema(t)) as unknown as import("react-hook-form").Resolver<FormValues>,
    defaultValues,
    mode: "onChange",
  });

  const { control, register, watch, handleSubmit, reset, formState } = form;
  const { errors, isValid } = formState;
  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const watchValues = watch();

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === watchValues.event_id),
    [events, watchValues.event_id],
  );

  const totals = useMemo(() => {
    const items = watchValues.items ?? [];
    const count = items.length;
    const quantity = items.reduce((sum, it) => sum + (Number(it?.quantity) || 0), 0);
    const value = items.reduce((sum, it) => {
      const q = Number(it?.quantity) || 0;
      const p = Number(it?.price) || 0;
      return sum + q * p;
    }, 0);
    return { count, quantity, value };
  }, [watchValues.items]);

  const progress = useMemo(() => {
    const v = watchValues;
    const checks = [
      !!v.event_id,
      !!v.event_date,
      (v.entry_name?.length ?? 0) >= 3,
      (v.contributor_fullName?.length ?? 0) >= 2,
      (v.contributor_mobile?.length ?? 0) >= 10,
      (v.contributor_village?.length ?? 0) >= 2,
      (v.contributor_address?.length ?? 0) >= 5,
      (v.items?.length ?? 0) >= 1 && v.items.every((it) => it.productName && Number(it.quantity) > 0),
    ];
    const done = checks.filter(Boolean).length;
    return Math.round((done / checks.length) * 100);
  }, [watchValues]);

  useEffect(() => {
    const loadOptions = async () => {
      const [eventsResponse] = await Promise.all([
        supabase.from("events").select("id, name, event_date").order("event_date", { ascending: false }),
      ]);
      setEvents(eventsResponse.data ?? []);
    };

    loadOptions();
  }, []);

  useEffect(() => {
    const saved = window.localStorage.getItem(DRAFT_KEY);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved) as FormValues;
      reset({ ...defaultValues, ...parsed });
      setDraftMessage(t("contributions.page.draftRestored"));
    } catch {
      window.localStorage.removeItem(DRAFT_KEY);
    }
  }, [reset, t]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(watchValues));
      setDraftMessage(t("contributions.page.draftSaved"));
    }, 600);

    return () => window.clearTimeout(timer);
  }, [watchValues, t]);

  const onClearDraft = () => {
    reset(defaultValues);
    window.localStorage.removeItem(DRAFT_KEY);
    setDraftMessage(null);
    toast.success(t("contributions.actions.clearDraft"));
  };

  const saveContribution = async (values: FormValues, keepDraft = false) => {
    if (!user) {
      toast.error(t("common.loginRequired") || "Login required");
      return;
    }

    setIsSaving(true);
    try {
      const { data: contributorData, error: contributorError } = await supabase
        .from("contributors")
        .insert({
          name: values.contributor_fullName,
          mobile: values.contributor_mobile,
          village: values.contributor_village,
          address: values.contributor_address,
          contribution_date: values.event_date,
          created_by: user.id,
        })
        .select("id")
        .single();

      if (contributorError || !contributorData) {
        throw contributorError ?? new Error("Could not create contributor.");
      }

      const payload = values.items.map((item) => ({
        event_id: values.event_id,
        contributor_id: contributorData.id,
        category: item.category,
        product_name: item.productName,
        quantity: item.quantity,
        unit: item.unit,
        price: item.price,
        notes: values.notes || null,
        created_by: user.id,
      }));

      const { error: contributionsError } = await supabase.from("contributions").insert(payload);
      if (contributionsError) throw contributionsError;

      toast.success(t("contributions.actions.saveSuccess") || "Contribution saved successfully.");
      if (!keepDraft) {
        reset(defaultValues);
        window.localStorage.removeItem(DRAFT_KEY);
      } else {
        reset({ ...defaultValues, event_id: values.event_id, event_date: values.event_date });
      }
      setDraftMessage(null);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const onSubmit = async (values: FormValues) => saveContribution(values, false);
  const onSubmitAddAnother = async (values: FormValues) => saveContribution(values, true);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
      <div className="sticky top-0 z-20 border-b border-slate-200/80 bg-background/95 backdrop-blur-xl py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <PageHeader title={t("contributions.page.title")} />
            <p className="max-w-3xl text-sm text-slate-500 dark:text-slate-400">{t("contributions.page.subtitle")}</p>
          </div>
          <Button
            variant="outline"
            className="rounded-full px-4 py-2 text-sm"
            onClick={() => navigate({ to: "/_authenticated/contributions" })}
          >
            <ArrowLeft className="h-4 w-4" />
            {t("common.back")}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 pt-6 lg:grid-cols-[1.08fr_0.92fr]">
        <section className="space-y-6">
          <Card className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xl shadow-slate-900/5 dark:border-slate-700/50 dark:bg-slate-950 dark:shadow-none">
            <CardContent className="space-y-6 p-8">
              <div className="flex items-center justify-between gap-4 rounded-3xl border border-emerald-100/80 bg-emerald-50/80 px-4 py-4 text-slate-900 shadow-sm dark:border-emerald-400/20 dark:bg-slate-900/80 dark:text-slate-100">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
                    <CalendarDays className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-300">{t("contributions.page.eventSection")}</p>
                    <h2 className="mt-0.5 text-lg font-semibold">{t("contributions.page.eventSection")}</h2>
                  </div>
                </div>
                <div className="hidden md:inline-flex items-center gap-2 rounded-2xl bg-white/90 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm dark:bg-slate-900/90 dark:text-slate-200">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  {t("contributions.page.autoSave")}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="event_id">{t("contributions.event")}</Label>
                  <select
                    id="event_id"
                    className="flex h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
                    {...register("event_id")}
                  >
                    <option value="">{t("common.select") || "Select event"}</option>
                    {events.map((event) => (
                      <option key={event.id} value={event.id}>{event.name}</option>
                    ))}
                  </select>
                  {errors.event_id && <p className="text-sm text-destructive">{errors.event_id.message}</p>}
                  {selectedEvent?.event_date && (
                    <p className="text-sm text-slate-500">{t("contributions.page.eventDate")} {selectedEvent.event_date}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="event_date">{t("common.date")}</Label>
                  <Input id="event_date" type="date" {...register("event_date")} />
                  {errors.event_date && <p className="text-sm text-destructive">{errors.event_date.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="entry_name">{t("contributions.page.entryName")}</Label>
                <Input
                  id="entry_name"
                  placeholder={t("contributions.placeholders.entryName")}
                  {...register("entry_name")}
                />
                {errors.entry_name && <p className="text-sm text-destructive">{errors.entry_name.message}</p>}
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xl shadow-slate-900/5 dark:border-slate-700/50 dark:bg-slate-950 dark:shadow-none">
            <CardContent className="space-y-6 p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-violet-700 dark:text-violet-300">{t("contributions.page.contributorSection")}</p>
                  <h2 className="mt-1 text-lg font-semibold">{t("contributions.page.contributorSection")}</h2>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contributor_fullName">{t("contributions.page.fullName")}</Label>
                  <Input id="contributor_fullName" placeholder={t("contributions.page.fullName") as string} {...register("contributor_fullName")} />
                  {errors.contributor_fullName && <p className="text-sm text-destructive">{errors.contributor_fullName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contributor_mobile">{t("contributions.page.mobile")}</Label>
                  <Input id="contributor_mobile" type="tel" placeholder={t("contributions.placeholders.mobile")} {...register("contributor_mobile")} />
                  {errors.contributor_mobile && <p className="text-sm text-destructive">{errors.contributor_mobile.message}</p>}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contributor_village">{t("contributions.page.village")}</Label>
                  <Input id="contributor_village" placeholder={t("contributions.placeholders.village")} {...register("contributor_village")} />
                  {errors.contributor_village && <p className="text-sm text-destructive">{errors.contributor_village.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contributor_address">{t("contributions.page.address")}</Label>
                  <Input id="contributor_address" placeholder={t("contributions.placeholders.address")} {...register("contributor_address")} />
                  {errors.contributor_address && <p className="text-sm text-destructive">{errors.contributor_address.message}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-6">
          <Card className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xl shadow-slate-900/5 dark:border-slate-700/50 dark:bg-slate-950 dark:shadow-none">
            <CardContent className="space-y-6 p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-indigo-700 dark:text-indigo-300">{t("contributions.page.itemsSection")}</p>
                  <h2 className="mt-1 text-lg font-semibold">{t("contributions.page.itemsSection")}</h2>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  className="rounded-full px-4 py-2 text-sm"
                  onClick={() => append({ category: "rice", productName: "", quantity: 1, unit: "kg", price: null })}
                >
                  <Plus className="h-4 w-4" />
                  {t("contributions.actions.addItem")}
                </Button>
              </div>

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="rounded-[1.75rem] border border-slate-200/90 bg-slate-50 p-4 shadow-sm transition hover:shadow-md dark:border-slate-700/80 dark:bg-slate-900">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
                      <div className="flex-1 space-y-2">
                        <Label htmlFor={`items.${index}.category`}>{t("contributions.category")}</Label>
                        <Controller
                          control={control}
                          name={`items.${index}.category` as const}
                          render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger className="rounded-xl">
                                <SelectValue placeholder={t("contributions.category")} />
                              </SelectTrigger>
                              <SelectContent>
                                {CATEGORY_OPTIONS.map((category) => (
                                  <SelectItem key={category.id} value={category.id}>
                                    {t(category.labelKey)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {errors.items?.[index]?.category && (
                          <p className="text-sm text-destructive">{errors.items?.[index]?.category?.message}</p>
                        )}
                      </div>

                      <div className="flex-1 space-y-2">
                        <Label htmlFor={`items.${index}.productName`}>{t("contributions.product")}</Label>
                        <Input id={`items.${index}.productName`} placeholder={t("contributions.product")} {...register(`items.${index}.productName` as const)} />
                        {errors.items?.[index]?.productName && (
                          <p className="text-sm text-destructive">{errors.items?.[index]?.productName?.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-4">
                      <div className="space-y-2">
                        <Label htmlFor={`items.${index}.quantity`}>{t("contributions.quantity")}</Label>
                        <Input id={`items.${index}.quantity`} type="number" step="0.01" min="0" {...register(`items.${index}.quantity` as const, { valueAsNumber: true })} />
                        {errors.items?.[index]?.quantity && (
                          <p className="text-sm text-destructive">{errors.items?.[index]?.quantity?.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`items.${index}.unit`}>{t("contributions.unit")}</Label>
                        <Controller
                          control={control}
                          name={`items.${index}.unit` as const}
                          render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger className="rounded-xl">
                                <SelectValue placeholder={t("contributions.unit")} />
                              </SelectTrigger>
                              <SelectContent>
                                {UNIT_OPTIONS.map((unit) => (
                                  <SelectItem key={unit} value={unit}>{t(`contributions.units.${unit}`)}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {errors.items?.[index]?.unit && (
                          <p className="text-sm text-destructive">{errors.items?.[index]?.unit?.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`items.${index}.price`}>{t("contributions.price")}</Label>
                        <Input id={`items.${index}.price`} type="number" step="0.01" {...register(`items.${index}.price` as const)} />
                      </div>
                      <div className="flex items-end gap-2 pt-2">
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-12 w-full rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                          onClick={() => append({ category: "rice", productName: "", quantity: 1, unit: "kg", price: null })}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-12 w-full rounded-xl"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {errors.items?.message && <p className="text-sm text-destructive">{errors.items.message}</p>}
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xl shadow-slate-900/5 dark:border-slate-700/50 dark:bg-slate-950 dark:shadow-none">
            <CardContent className="space-y-4 p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{t("contributions.page.notesSection")}</p>
                  <h2 className="mt-1 text-lg font-semibold">{t("contributions.page.notesSection")}</h2>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">{t("common.notes")}</Label>
                <Textarea id="notes" placeholder={t("contributions.placeholders.notes")} {...register("notes")} className="min-h-[160px] rounded-2xl" />
              </div>
            </CardContent>
          </Card>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-900/5 dark:border-slate-700/50 dark:bg-slate-950 dark:shadow-none">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t("contributions.page.readyToSave")}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t("contributions.page.readyDescription")}</p>
                {draftMessage && <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">{draftMessage}</p>}
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Button type="button" variant="outline" className="rounded-xl" onClick={onClearDraft}>
                  {t("contributions.actions.clearDraft")}
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmit(onSubmit)}
                  disabled={!isValid || isSaving}
                  className="rounded-xl bg-gradient-to-r from-emerald-600 to-violet-600 text-white shadow-lg shadow-emerald-500/20 hover:scale-[1.01] transition-transform duration-200"
                >
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {t("contributions.actions.save")}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="rounded-xl"
                  onClick={handleSubmit(onSubmitAddAnother)}
                  disabled={!isValid || isSaving}
                >
                  {t("contributions.actions.saveAddAnother")}
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
