import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/redirect-add-contribution")({
  component: RedirectAddContribution,
});

function RedirectAddContribution() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: "/add-contribution" });
  }, [navigate]);

  return null;
}
