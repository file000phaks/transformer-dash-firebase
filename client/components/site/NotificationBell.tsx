import { Bell } from "lucide-react";
import { useNotifications } from "@/state/notifications";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function NotificationBell() {

  const { alerts, clearAll } = useNotifications();

  const count = alerts.length;

  return (

    <DropdownMenu>

      <DropdownMenuTrigger className="relative rounded-md p-2 hover:bg-accent">

        <Bell className="h-4 w-4" />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
            {Math.min( 9, count )}
          </span>
        )}

      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-72">

        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {alerts.length === 0 ? (
          <div className="p-3 text-sm text-muted-foreground">
            No notifications
          </div>
        ) : (
          //   alerts.slice( 0, 8 ).map( ( a ) => (
          //     <DropdownMenuItem
          //       key={a.id}
          //       className="flex items-center justify-between gap-2"
          //     >
          //       <div>
          //         <p className="text-sm font-medium">{a.label}</p>
          //         <p className="text-xs text-muted-foreground">
          //           {a.transformerName ? `${a.transformerName} • ` : ""}
          //           {new Date( a.ts ).toLocaleTimeString()}
          //         </p>
          //       </div>
          //       <span
          //         className={`rounded-full px-2 py-0.5 text-xs ${a.severity === "crit" ? "bg-red-500/10 text-red-600" : "bg-amber-500/10 text-amber-600"}`}
          //       >
          //         {a.severity}
          //       </span>
          //     </DropdownMenuItem>
          //   ) )
          // )'
          <div className="p-3 text-sm text-muted-foreground">
            No notifications
          </div> )
        }
        {alerts.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <button
              onClick={clearAll}
              className="mx-2 mb-2 rounded-md border px-2 py-1 text-xs hover:bg-accent"
            >
              Clear all
            </button>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
