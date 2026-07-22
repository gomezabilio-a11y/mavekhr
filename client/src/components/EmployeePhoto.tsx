/**
 * EmployeePhoto.tsx — Renders employee photos from /api/download/ paths
 */

interface EmployeePhotoProps {
  photoUrl: string | null | undefined;
  initials: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  bgColor?: string;
}

export default function EmployeePhoto({
  photoUrl,
  initials,
  size = "md",
  className = "",
  bgColor = "oklch(0.42 0.18 255)",
}: EmployeePhotoProps) {
  const sizeClass = size === "sm" ? "w-7 h-7 text-xs" : size === "lg" ? "w-16 h-16 text-lg" : "w-8 h-8 text-xs";

  // Convert /manus-storage/ paths to /api/download/ paths
  let resolvedUrl = photoUrl;
  if (photoUrl?.startsWith("/manus-storage/")) {
    resolvedUrl = photoUrl.replace("/manus-storage/", "/api/download/");
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 ${sizeClass} ${className}`}
      style={{ background: resolvedUrl ? undefined : bgColor }}
    >
      {resolvedUrl
        ? <img src={resolvedUrl} alt={initials} className="w-full h-full object-cover" />
        : <span className="font-semibold text-white">{initials}</span>
      }
    </div>
  );
}
