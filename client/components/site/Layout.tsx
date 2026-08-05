import { useState } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

export default function Layout( { children }: { children: React.ReactNode } ) {

  const [ collapsed, setCollapsed ] = useState( false );
  const [ mobileOpen, setMobileOpen ] = useState( false );

  return (
    <div className="flex min-h-[100dvh] bg-background">
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <div className="flex min-h-[100dvh] min-w-0 flex-1 flex-col">

        <TopBar onOpenMobileMenu={() => setMobileOpen( true )} />

        <div className="flex-1 p-4 md:p-6">{children}</div>

      </div>

    </div>

  );

}
