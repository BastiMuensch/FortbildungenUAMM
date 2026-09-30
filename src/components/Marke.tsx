import Image from "next/image";

import { cn } from "@/lib/utils";

export function Marke({
  zusatz,
  className,
  kompakt = false,
}: {
  zusatz: string;
  className?: string;
  kompakt?: boolean;
}) {
  return (
    <span className={cn("flex min-w-0 items-start gap-2.5", className)}>
      <Image
        src="/weiter-symbol.svg"
        width={kompakt ? 38 : 42}
        height={kompakt ? 38 : 42}
        alt=""
        aria-hidden
        className="shrink-0"
      />
      <span className="min-w-0 leading-tight">
        <span className={cn("block whitespace-nowrap font-bold tracking-[-0.07em] text-foreground", kompakt ? "text-[1.45rem]" : "text-2xl")}>
          weiter<span className="text-markenblau">.bilden</span>
        </span>
        <span className="mt-0.5 block break-words text-[0.72rem] leading-snug font-normal tracking-normal text-muted-foreground" title={zusatz}>
          {zusatz}
        </span>
      </span>
    </span>
  );
}
