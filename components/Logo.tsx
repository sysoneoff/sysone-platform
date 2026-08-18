import Image from "next/image";
import Link from "next/link";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link className="brandLogo" href="/" aria-label="SysOne home">
      <Image
        src={compact ? "/brand/sysone-symbol.webp" : "/brand/sysone-horizontal.webp"}
        alt="SysOne"
        width={compact ? 42 : 190}
        height={compact ? 42 : 64}
        priority
      />
    </Link>
  );
}
