import { useTranslation } from "react-i18next";

export function PageHeader({
  title,
  action,
  logo,
}: {
  title: string;
  action?: React.ReactNode;
  logo?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
      <div className="flex items-center gap-3">
        {logo && <div className="shrink-0">{logo}</div>}
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">{title}</h1>
      </div>
      {action}
    </div>
  );
}

export function EmptyState() {
  const { t } = useTranslation();
  return <div className="text-center text-muted-foreground py-12">{t("common.empty")}</div>;
}
