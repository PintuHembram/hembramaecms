import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
    HeadContent,
    Outlet,
    Scripts,
    createRootRouteWithContext,
    useRouter,
} from "@tanstack/react-router";
import { useEffect } from "react";

import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import "../i18n";
import appCss from "../styles.css?url";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Adivasi Event Contribution Management System" },
      { name: "description", content: "Multilingual community event contribution management" },
      { property: "og:title", content: "Adivasi Event Contribution Management System" },
      { name: "twitter:title", content: "Adivasi Event Contribution Management System" },
      { property: "og:description", content: "Multilingual community event contribution management" },
      { name: "twitter:description", content: "Multilingual community event contribution management" },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/qZoW4rfy36Tnj9pvTsK0LijaiU52/social-images/social-1778780736057-adivasi_logo.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/qZoW4rfy36Tnj9pvTsK0LijaiU52/social-images/social-1778780736057-adivasi_logo.webp" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/adivasi-logo.png" },
      { rel: "apple-touch-icon", href: "/adivasi-logo.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">404</h1>
        <a href="/" className="text-primary underline">Go home</a>
      </div>
    </div>
  ),
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      router.invalidate();
    });
    return () => subscription.unsubscribe();
  }, [router]);

  useEffect(() => {
    const pathname = router.state.location.pathname;
    if (pathname === "/_authenticated") {
      router.navigate({ to: "/", replace: true });
      return;
    }

    if (pathname.startsWith("/_authenticated/")) {
      const redirectPath = pathname.replace("/_authenticated", "");
      router.navigate({ to: redirectPath, replace: true });
    }
  }, [router]);

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster />
    </QueryClientProvider>
  );
}
