/**
 * EmployeePhoto.tsx — Resolves /manus-storage/ paths to presigned URLs
 * Uses tRPC to get a direct CloudFront presigned URL, bypassing the 307 redirect
 * which can fail in some browser/proxy environments.
 */
import { trpc } from "@/lib/trpc";

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

  // Only fetch presigned URL if photoUrl is a /manus-storage/ path
  const isStoragePath = !!photoUrl && photoUrl.startsWith("/manus-storage/");
  const { data } = trpc.employee.getPhotoUrl.useQuery(
    { storagePath: photoUrl ?? "" },
    { enabled: isStoragePath, staleTime: 1000 * 60 * 50 } // cache for 50 min (presigned URLs expire in ~1hr)
  );

  const resolvedUrl = isStoragePath ? data?.url : photoUrl;

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
