import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutGrid,
  MapPin,
  Compass,
  Building2,
  Radio,
  Zap,
  Activity,
  AlertTriangle,
  Cpu,
  Shield,
  Users,
  ShieldCheck,
  Key,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  collapsed: boolean;
  setCollapsed: ( v: boolean ) => void;
  mobileOpen: boolean;
  setMobileOpen: ( v: boolean ) => void;
};

type NavItemConfig = {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
};

type NavGroup = {
  title: string;
  items: NavItemConfig[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    title: "DASHBOARD",
    items: [
      { label: "Dashboard", to: "/dashboard", icon: LayoutGrid },
    ],
  },
  {
    title: "ASSETS",
    items: [
      { label: "Regions", to: "/regions", icon: MapPin },
      { label: "Districts", to: "/districts", icon: Compass },
      { label: "Depots", to: "/depots", icon: Building2 },
      { label: "Sites", to: "/sites", icon: Radio },
      { label: "Transformers", to: "/", icon: Zap },
      { label: "Sensors", to: "/sensors", icon: Activity },
    ],
  },
  {
    title: "OPERATIONS",
    items: [
      { label: "Alerts", to: "/alerts", icon: AlertTriangle },
      { label: "New Controllers", to: "/controllers", icon: Cpu },
      { label: "Control", to: "/control", icon: Shield },
    ],
  },
  {
    title: "ADMINISTRATION",
    items: [
      { label: "Users", to: "/users", icon: Users },
      { label: "Roles", to: "/roles", icon: ShieldCheck },
      { label: "Permissions", to: "/permissions", icon: Key },
      { label: "User Types", to: "/user-types", icon: UserCheck },
    ],
  },
];

function Brand( { collapsed }: { collapsed?: boolean } ) {
  return (
    <div className={cn( "flex items-center gap-2.5", collapsed ? "justify-center w-full" : "w-full" )}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
        <Zap className="h-5 w-5 fill-white" />
      </div>
      {!collapsed && (
        <div className="flex flex-col">
          <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
            Transformer Guard
          </span>
          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
            Monitoring System
          </span>
        </div>
      )}
    </div>
  );
}

function NavItem( {
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItemConfig;
  collapsed: boolean;
  onNavigate?: () => void;
} ) {
  const location = useLocation();
  const Icon = item.icon;

  const isTransformers = item.to === "/";
  const isActive = isTransformers
    ? location.pathname === "/" || location.pathname.startsWith( "/transformers" )
    : location.pathname === item.to || ( item.to !== "/" && location.pathname.startsWith( item.to ) );

  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150",
        isActive
          ? "bg-blue-600 text-white shadow-xs font-semibold"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white",
        collapsed && "justify-center px-2",
      )}
      title={collapsed ? item.label : undefined}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0 transition-transform group-hover:scale-105",
          isActive
            ? "text-white"
            : "text-slate-400 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-white",
        )}
      />
      {!collapsed && <span className="truncate">{item.label}</span>}
      {!collapsed && item.badge && (
        <span
          className={cn(
            "ml-auto rounded-full px-1.5 py-0.5 text-[10px]",
            isActive
              ? "bg-white/20 text-white"
              : "bg-blue-50 text-blue-600 border border-blue-200/60 dark:bg-blue-500/20 dark:text-blue-300 dark:border-transparent",
          )}
        >
          {item.badge}
        </span>
      )}
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
          "sticky top-0 hidden h-[100dvh] shrink-0 flex-col bg-white dark:bg-[#071026] text-slate-800 dark:text-slate-200 transition-all duration-200 md:flex border-r border-slate-200/80 dark:border-[#142346]",
          collapsed ? "w-16 p-3" : "w-60 p-4",
        )}
      >
        <div className="pb-3 border-b border-slate-200/80 dark:border-white/10">
          <Brand collapsed={collapsed} />
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 pr-1.5 sidebar-scrollbar space-y-5">
          {NAV_GROUPS.map( ( group ) => (
            <div key={group.title} className="space-y-1">
              {!collapsed && (
                <div className="px-3 pb-1 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-400/80 uppercase">
                  {group.title}
                </div>
              )}
              {group.items.map( ( item ) => (
                <NavItem
                  key={item.label}
                  item={item}
                  collapsed={collapsed}
                />
              ) )}
            </div>
          ) )}
        </div>

        <div className="pt-2 border-t border-slate-200/80 dark:border-white/10">
          <button
            aria-label="Toggle sidebar"
            onClick={() => setCollapsed( !collapsed )}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-100/80 hover:bg-slate-200/70 text-slate-600 hover:text-slate-900 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white py-2 text-xs transition-colors"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={() => setMobileOpen( false )}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white dark:bg-[#071026] text-slate-800 dark:text-slate-200 p-4 transition-transform duration-200 md:hidden border-r border-slate-200/80 dark:border-[#142346]",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-white/10">
          <Brand />
          <button
            aria-label="Close sidebar"
            onClick={() => setMobileOpen( false )}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-3 pr-1.5 sidebar-scrollbar space-y-5">
          {NAV_GROUPS.map( ( group ) => (
            <div key={group.title} className="space-y-1">
              <div className="px-3 pb-1 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-400/80 uppercase">
                {group.title}
              </div>
              {group.items.map( ( item ) => (
                <NavItem
                  key={item.label}
                  item={item}
                  collapsed={false}
                  onNavigate={() => setMobileOpen( false )}
                />
              ) )}
            </div>
          ) )}
        </div>
      </aside>
    </>
  );
}
