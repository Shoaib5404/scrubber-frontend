import Image from "next/image";
import { BRAND_ASSETS, BRAND_MARK_ALT } from "@/lib/brand";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  /**
   * `logo` — horizontal wordmark (dashboard header, auth, marketing).
   * `mark` — square favicon-style mark (collapsed sidebar, compact spots).
   */
  variant?: "logo" | "mark" | "full";
  priority?: boolean;
  alt?: string;
};

const VARIANT_META = {
  logo: { width: 300, height: 112, src: BRAND_ASSETS.logo },
  full: { width: 300, height: 112, src: BRAND_ASSETS.logo },
  mark: { width: 128, height: 128, src: BRAND_ASSETS.mark },
} as const;

export function BrandLogo({
  className,
  variant = "logo",
  priority = false,
  alt = BRAND_MARK_ALT,
}: BrandLogoProps) {
  const resolved = variant === "full" ? "logo" : variant;
  const size = VARIANT_META[resolved];

  return (
    <Image
      src={size.src}
      alt={alt}
      width={size.width}
      height={size.height}
      priority={priority}
      unoptimized
      className={cn(
        "object-contain",
        resolved === "logo" ? "h-10 w-auto" : "size-8",
        className,
      )}
    />
  );
}

export { BRAND_ASSETS, BRAND_NAME, BRAND_MARK_ALT, brandAssetUrl } from "@/lib/brand";
