import { NavLink } from "react-router-dom";
import {
  LayoutGrid,
  MapPinned,
  Waves,
  Bell,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import NotificationBell from "./NotificationBell";
import { cn } from "@/lib/utils";

type Props = {
  collapsed: boolean;
  setCollapsed: ( v: boolean ) => void;
  mobileOpen: boolean;
  setMobileOpen: ( v: boolean ) => void;
};

function NavItem( {
  to,
  label,
  Icon,
  collapsed,
}: {
  to: string;
  label: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  collapsed: boolean;
} ) {
  return (
    <NavLink
      to={to}
      end
      className={( { isActive } ) =>
        cn(
          "flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          isActive && "bg-accent text-accent-foreground",
          collapsed && "justify-center",
        )
      }
    >
      <Icon className="h-4 w-4" />
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
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
          "sticky top-0 hidden h-[100dvh] shrink-0 border-r bg-sidebar p-4 md:block",
          collapsed ? "w-16" : "w-64",
        )}
      >

        <div
          className={cn(
            "flex items-center",
            collapsed ? "justify-center" : "justify-between",
          )}
        >
          <div className="flex items-center gap-2">

            <div className="h-8 w-8 rounded-md bg-gradient-to-br from-primary to-cyan-500" />

            {!collapsed && (
              <span className="text-sm font-semibold">Transformer Guard</span>
            )}

          </div>

          <div className="flex items-center gap-1">
            {!collapsed && <NotificationBell />}
            {!collapsed && <ThemeToggle />}
          </div>

        </div>

        <nav className="mt-6 grid gap-1">

          <NavItem
            to="/dashboard"
            label="Dashboard"
            Icon={LayoutGrid}
            collapsed={collapsed}
          />

          <NavItem
            to="/transformers"
            label="Transformers"
            Icon={MapPinned}
            collapsed={collapsed}
          />

          {/* <NavItem
            to="/alerts"
            label="Alerts"
            Icon={Bell}
            collapsed={collapsed}
          /> */}

          <NavItem
            to="/sensors"
            label="Sensors"
            Icon={Waves}
            collapsed={collapsed}
          />
        </nav>

        <div
          className={cn(
            "absolute bottom-4 left-0 right-0 px-4",
            collapsed && "px-2",
          )}
        >
          <button
            aria-label="Toggle sidebar"
            onClick={() => setCollapsed( !collapsed )}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-md border bg-background py-2 text-sm hover:bg-accent",
              collapsed && "px-0",
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
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileOpen( false )}
        />
      )}
      
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 border-r bg-sidebar p-4 transition-transform md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
        role="dialog"
        aria-modal="true"
      >
     
        <div className="flex items-center justify-between">
     
          <div className="flex items-center gap-2">
     
            <div className="h-8 w-8 rounded-md bg-gradient-to-br from-primary to-cyan-500" />
            <span className="text-sm font-semibold">Transformer Guard</span>
     
          </div>
     
          <div className="flex items-center gap-2">
     
            <ThemeToggle />
            <button
              aria-label="Close sidebar"
              onClick={() => setMobileOpen( false )}
              className="rounded-md p-1 hover:bg-accent"
            >
              <X className="h-4 w-4" />
            </button>
     
          </div>
     
        </div>
     
        <nav className="mt-6 grid gap-1" onClick={() => setMobileOpen( false )}>
          <NavItem
            to="/dashboard"
            label="Dashboard"
            Icon={LayoutGrid}
            collapsed={false}
          />
          <NavItem
            to="/transformers"
            label="Transformers"
            Icon={MapPinned}
            collapsed={false}
          />
          <NavItem to="/alerts" label="Alerts" Icon={Bell} collapsed={false} />
          <NavItem
            to="/sensors"
            label="Sensors"
            Icon={Waves}
            collapsed={false}
          />
        </nav>
      </aside>
    </>
  );
}
