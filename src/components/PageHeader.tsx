import { useTranslation } from "react-i18next";

export function PageHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl md:text-3xl font-bold text-foreground">{title}</h1>
      {action}
    </div>
  );
}

export function EmptyState() {
  const { t } = useTranslation();
  return <div className="text-center text-muted-foreground py-12">{t("common.empty")}</div>;
}
