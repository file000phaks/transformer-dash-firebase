import { Menu, Search, User, ChevronDown } from "lucide-react";
import NotificationBell from "./NotificationBell";
import ThemeToggle from "./ThemeToggle";
import { Link, useLocation } from "react-router-dom";

export default function TopBar({ onOpenMobileMenu }: { onOpenMobileMenu: () => void }) {
  const location = useLocation();

  const getPageTitle = () => {
    if (location.pathname === "/" || location.pathname.startsWith("/transformers")) {
      return "Transformers";
    }
    if (location.pathname.startsWith("/dashboard")) return "Dashboard";
    if (location.pathname.startsWith("/alerts")) return "Alerts";
    if (location.pathname.startsWith("/sensors")) return "Sensors";
    if (location.pathname.startsWith("/map")) return "Fleet Map";
    return "Transformers";
  };

  const title = getPageTitle();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-card px-4 py-2.5 shadow-xs md:px-6">
      {/* Left: Hamburger & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          aria-label="Open menu"
          onClick={onOpenMobileMenu}
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <nav className="flex items-center gap-2 text-xs font-medium" aria-label="Breadcrumb">
          <Link to="/" className="text-muted-foreground hover:text-foreground">
            Home
          </Link>
          <span className="text-muted-foreground/60">/</span>
          <span className="font-semibold text-blue-600 dark:text-blue-400">
            {title}
          </span>
        </nav>
      </div>

      {/* Right: Actions & User Info */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          aria-label="Search"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Search className="h-4 w-4" />
        </button>

        <NotificationBell />
        <ThemeToggle />

        {/* Generic User Avatar */}
        <div className="ml-1 flex items-center gap-1.5 rounded-xl border bg-muted/30 px-2.5 py-1.5 transition-colors hover:bg-muted/60 cursor-pointer">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white shadow-xs">
            <User className="h-4 w-4" />
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </div>
    </header>
  );
}
