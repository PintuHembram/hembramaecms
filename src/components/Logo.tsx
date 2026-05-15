const sizeClasses: Record<"sm" | "md" | "lg", string> = {
  sm: "h-10 w-10",
  md: "h-14 w-14",
  lg: "h-20 w-20",
};

export function Logo({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <div
      className={`relative inline-flex items-center justify-center overflow-hidden rounded-full bg-secondary/10 text-primary shadow-sm ring-1 ring-border/40 ${sizeClasses[size]} ${className}`}
    >
      <img
        src="/adivasi-logo.png"
        alt="Adivasi Contributions logo"
        className="h-full w-full object-contain"
        loading="eager"
        decoding="async"
      />
    </div>
  );
}
