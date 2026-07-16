import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  size?: number;
  className?: string;
  priority?: boolean;
};

export function BrandLogo({ size = 36, className, priority = false }: BrandLogoProps) {
  return (
    <Image
      src="/gcu-logo.png"
      alt="Garden City University"
      width={size}
      height={size}
      className={cn("shrink-0 rounded-lg object-contain", className)}
      priority={priority}
    />
  );
}
