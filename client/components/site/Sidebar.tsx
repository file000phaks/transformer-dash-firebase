import { NavLink } from "react-router-dom";
import {
  LayoutGrid,
  Bell,
  ChevronLeft,
  ChevronRight,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  collapsed: boolean;
  setCollapsed: ( v: boolean ) => void;
  mobileOpen: boolean;
  setMobileOpen: ( v: boolean ) => void;
};

// Transformers is the primary landing route (see "Multi-Transformer Platform
// Restructure" in Questions.md) — Sensors/Map remain reachable by direct URL
// but are left out of the nav, same as before.
const NAV_ITEMS = [
  { to: "/", label: "Transformers", Icon: LayoutGrid },
  { to: "/alerts", label: "Alerts", Icon: Bell },
];

function NavItem( {
  to,
  label,
  Icon,
  collapsed,
  onNavigate,
}: {
  to: string;
  label: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  collapsed: boolean;
  onNavigate?: () => void;
} ) {
  return (
    <NavLink
      to={to}
      end
      onClick={onNavigate}
      className={( { isActive } ) =>
        cn(
          "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
          isActive && "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary",
          collapsed && "justify-center",
        )
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  );
}

function Brand( { collapsed }: { collapsed?: boolean } ) {
  return (
    <div className="flex items-center gap-2">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
        <Zap className="h-4 w-4" />
      </div>
      {!collapsed && (
        <span className="truncate text-sm font-semibold tracking-tight">
          NUST Transformer Guard
        </span>
      )}
    </div>
  );
}

export default function Sidebar( {
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}: Props ) {
  return (
    <>

      {/* Desktop sidebar */}

      <aside
        className={cn(
          "sticky top-0 hidden h-[100dvh] shrink-0 border-r bg-sidebar p-4 md:flex md:flex-col",
          collapsed ? "w-16" : "w-64",
        )}
      >

        <div className={cn( "flex items-center", collapsed && "justify-center" )}>
          <Brand collapsed={collapsed} />
        </div>

        <nav className="mt-6 grid gap-1">
          {NAV_ITEMS.map( ( item ) => (
            <NavItem key={item.to} {...item} collapsed={collapsed} />
          ) )}
        </nav>

        <div className="mt-auto pt-4">
          <button
            aria-label="Toggle sidebar"
            onClick={() => setCollapsed( !collapsed )}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-md border bg-background py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/40 md:hidden"
          onClick={() => setMobileOpen( false )}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-sidebar p-4 transition-transform md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
        role="dialog"
        aria-modal="true"
      >

        <div className="flex items-center justify-between">
          <Brand />
          <button
            aria-label="Close sidebar"
            onClick={() => setMobileOpen( false )}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="mt-6 grid gap-1">
          {NAV_ITEMS.map( ( item ) => (
            <NavItem
              key={item.to}
              {...item}
              collapsed={false}
              onNavigate={() => setMobileOpen( false )}
            />
          ) )}
        </nav>
      </aside>
    </>
  );
}
