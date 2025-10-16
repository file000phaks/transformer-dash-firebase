import { useState } from "react";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";
import ThemeToggle from "./ThemeToggle";
import NotificationBell from "./NotificationBell";

export default function Layout( { children }: { children: React.ReactNode } ) {

  const [ collapsed, setCollapsed ] = useState( false );
  const [ mobileOpen, setMobileOpen ] = useState( false );

  return (
    <div className="flex">
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <div className="min-h-[100dvh] flex-1">

        {/* Mobile top bar */}
        <div className="flex items-center justify-between border-b bg-background px-3 py-2 md:hidden">

          <button
            aria-label="Open menu"
            onClick={() => setMobileOpen( true )}
            className="rounded-md p-2 hover:bg-accent"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-gradient-to-br from-primary to-cyan-500" />
            <span className="text-sm font-semibold">Transformer Guard</span>
          </div>

          <div className="flex items-center gap-1">
            <NotificationBell />
            <ThemeToggle />
          </div>

        </div>

        <div className="p-4 md:p-6">{children}</div>

      </div>

    </div>

  );

}
