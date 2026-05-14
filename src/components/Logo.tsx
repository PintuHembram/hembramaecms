
const sizeClasses: Record<string, string> = {
  sm: "h-10 w-10",
  md: "h-14 w-14",
  lg: "h-16 w-16",
};

export function Logo({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <div className={`relative inline-flex items-center justify-center overflow-hidden rounded-2xl bg-primary text-primary-foreground ${sizeClasses[size]} ${className}`}>
      <img
        src="/logo.png"
        alt="Adivasi Contributions"
        className="absolute inset-0 h-full w-full object-contain"
        onError={(event) => {
          const img = event.currentTarget as HTMLImageElement;
          img.style.display = "none";
        }}
      />
      <span className="relative text-lg font-bold">A</span>
    </div>
  );
}
