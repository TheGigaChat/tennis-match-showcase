"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUnreadTotal } from "@/hooks/useUnreadTotal";

type NavKey = "discover" | "messages" | "profile";

type BottomNavProps = {
  active?: NavKey;
  navClassName?: string;
  innerClassName?: string;
  backgroundClassName?: string;
};

const NAV_ITEMS: Array<{
  key: NavKey;
  href: string;
  icon: string;
  activeIcon: string;
  label: string;
}> = [
  {
    key: "discover",
    href: "/discover",
    icon: "/discover.svg",
    activeIcon: "/discover-active.svg",
    label: "Discover",
  },
  {
    key: "messages",
    href: "/messages",
    icon: "/message-circle.svg",
    activeIcon: "/message-circle-active.svg",
    label: "Messages",
  },
  {
    key: "profile",
    href: "/profile",
    icon: "/profile.svg",
    activeIcon: "/profile-active.svg",
    label: "Profile",
  },
];

export default function BottomNav({
  active,
  navClassName,
  innerClassName,
  backgroundClassName,
}: BottomNavProps) {
  const pathname = usePathname();
  const activeChatId =
    pathname && pathname.startsWith("/messages/")
      ? pathname.split("/")[2] ?? undefined
      : undefined;
  const unreadTotal = useUnreadTotal(activeChatId);
  const badgeLabel = unreadTotal > 99 ? "99+" : unreadTotal > 0 ? String(unreadTotal) : null;

  const isTransparent =
    !backgroundClassName || backgroundClassName.includes("bg-transparent");

  const navClasses = [
    "fixed inset-x-0 bottom-0 z-30 pointer-events-none py-3",
    backgroundClassName ?? "bg-transparent",
    navClassName,
  ]
    .filter(Boolean)
    .join(" ");

  const innerClasses = ["mx-auto w-full max-w-phone px-4", innerClassName]
    .filter(Boolean)
    .join(" ");

  return (
    <nav className={navClasses}>
      <div className={innerClasses}>
        <ul className="grid grid-cols-3">
          {NAV_ITEMS.map((item) => (
            <NavItem
              key={item.key}
              href={item.href}
              icon={active === item.key ? item.activeIcon : item.icon}
              label={item.label}
              badge={item.key === "messages" ? badgeLabel : null}
              useIconBackdrop={isTransparent}
            />
          ))}
          {/* <NavItem href="/courts" icon="/courts.svg" label="Courts" /> */}
        </ul>
      </div>
    </nav>
  );
}

function NavItem({
  href,
  icon,
  label,
  badge,
  useIconBackdrop,
}: {
  href: string;
  icon: string;
  label: string;
  badge?: string | null;
  useIconBackdrop?: boolean;
}) {
  return (
    <li className="flex items-center justify-center p-1">
      <Link
        href={href}
        className="pointer-events-auto flex flex-col items-center gap-1 rounded-xl px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-800/60"
      >
        <span
          className={[
            "relative",
            useIconBackdrop
              ? "grid place-items-center rounded-full bg-white/90 shadow-sm ring-1 ring-white/70 p-2"
              : "",
          ].join(" ")}
        >
          <Image
            src={icon}
            alt=""
            width={24}
            height={24}
            style={{ width: "clamp(20px, 5.5vw, 26px)", height: "auto" }}
          />
          {badge ? (
            <span
              className={[
                "absolute -top-2 -right-2",
                "grid place-items-center rounded-full",
                "bg-red-500 text-white",
                "text-[10px] font-semibold leading-none",
                "min-w-[18px] h-[18px] px-[5px]",
                "shadow-sm ring-1 ring-white/60",
              ].join(" ")}
              aria-label={`Unread messages: ${badge}`}
            >
              {badge}
            </span>
          ) : null}
        </span>
        <span className="sr-only">{label}</span>
      </Link>
    </li>
  );
}
