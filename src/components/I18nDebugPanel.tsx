import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import i18n from "@/lib/i18n";
import { Bug, ChevronDown, ChevronUp, Check, X } from "lucide-react";

function collectKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  const keys: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      keys.push(...collectKeys(v as Record<string, unknown>, path));
    } else {
      keys.push(path);
    }
  }
  return keys;
}

export function I18nDebugPanel() {
  const isDev = import.meta.env.DEV;
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!isDev) return;
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [isDev]);

  if (!isDev) return null;

  const initialized = i18n.isInitialized;
  const currentLang = i18n.language ?? "—";
  const resolvedLang = i18n.resolvedLanguage ?? "—";

  const store = (i18n.services?.resourceStore?.data ?? {}) as Record<string, Record<string, unknown>>;
  const langs = Object.keys(store);
  const allKeys = langs.map((lng) => {
    const nsData = store[lng]?.translation as Record<string, unknown> | undefined;
    return { lng, keys: nsData ? collectKeys(nsData) : [] };
  });
  const totalKeys = allKeys.reduce((sum, item) => sum + item.keys.length, 0);

  return (
    <div className="fixed bottom-4 right-4 z-[9999] font-mono text-xs">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full bg-foreground px-3 py-2 text-background shadow-lg hover:bg-foreground/90"
      >
        <Bug className="h-4 w-4" />
        <span>i18n</span>
        {initialized ? (
          <Check className="h-3 w-3 text-green-500" />
        ) : (
          <X className="h-3 w-3 text-red-500" />
        )}
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
      </button>

      {open && (
        <div className="mt-2 w-80 max-h-[70vh] overflow-auto rounded-lg border border-border bg-card p-4 shadow-xl">
          <div className="mb-3 space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Initialized</span>
              <span className={initialized ? "text-green-600" : "text-red-600"}>
                {initialized ? "Yes" : "No"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Language</span>
              <span className="font-semibold">{currentLang}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Resolved</span>
              <span className="font-semibold">{resolvedLang}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Keys</span>
              <span className="font-semibold">{totalKeys}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tick</span>
              <span className="font-semibold">{tick}</span>
            </div>
          </div>

          <div className="border-t border-border pt-2">
            <p className="mb-1 font-semibold text-muted-foreground">Loaded Resources</p>
            {allKeys.map(({ lng, keys }) => (
              <details key={lng} className="mb-1">
                <summary className="cursor-pointer py-1 font-semibold hover:text-primary">
                  {lng} ({keys.length} keys)
                </summary>
                <ul className="ml-2 max-h-40 overflow-auto border-l border-border pl-2">
                  {keys.map((k) => (
                    <li key={k} className="py-0.5 text-muted-foreground">
                      <span className="text-foreground">{k}</span>
                      <span className="ml-1 text-[10px] text-primary">
                        = {t(k, { lng })}
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
