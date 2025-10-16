import { Link, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground",
    isActive && "text-foreground",
  );

export default function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-gradient-to-br from-primary to-cyan-500" />
          <span className="text-base font-semibold tracking-tight">
            Transformer Guard
          </span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          <NavLink to="/" className={navLinkClass} end>
            Home
          </NavLink>
          <NavLink to="/dashboard" className={navLinkClass}>
            Dashboard
          </NavLink>
          <a
            href="#implementation"
            className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Implementation
          </a>
          <a
            href="#technology"
            className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Technology
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <a href="mailto:phakamilemlala1613@gmail.com?subject=LoRaGuard%20Demo%20Request" aria-label="Request a demo">
            <Button size="sm">Request Demo</Button>
          </a>
        </div>
      </div>
    </header>
  );
}
