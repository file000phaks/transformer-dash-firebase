import { useNotifications } from "@/state/notifications";
import { Link } from "react-router-dom";

export default function AlertsPage() {

  const { alerts, clearAlert, clearAll } = useNotifications();

  return (

    <main className="container mx-auto py-10">

      <div className="flex items-center justify-between">

        <h1 className="text-2xl font-bold tracking-tight">Alerts</h1>

        {alerts.length > 0 && (
          <button
            onClick={clearAll}
            className="rounded-md border px-3 py-1 text-sm hover:bg-accent"
          >
            Clear all
          </button>
        )}

      </div>
      
      <div className="mt-6">

        {alerts.length === 0 ? (

          <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
            No alerts yet.
          </div>

        ) : (

          <ul className="divide-y rounded-xl border bg-card text-sm">

            {alerts.map( ( a ) => (

              <li
                key={a.id}
                className="flex items-center justify-between px-3 py-2"
              >

                <div>

                  <button
                    className="font-medium underline"
                    onClick={() => ( window.location.href = `/alerts/${a.id}` )}
                  >
                    {a.label}
                  </button>

                  <p className="text-xs text-muted-foreground">

                    {a.transformerName ? (
                      <>
                        <Link
                          to={`/transformers/${a.transformerId}`}
                          className="underline"
                        >
                          {a.transformerName}
                        </Link>{" "}
                        •{" "}
                      </>
                    ) : null}

                    {new Date( a.ts ).toLocaleString()}

                  </p>

                </div>

                <div className="flex items-center gap-2">

                  <span
                    className={`rounded-full px-2 py-1 text-xs ${a.severity === "crit" ? "bg-red-500/10 text-red-600" : "bg-amber-500/10 text-amber-600"}`}
                  >
                    {a.severity}
                  </span>

                  <button
                    onClick={() => clearAlert( a.id )}
                    className="text-xs underline"
                  >
                    Dismiss
                  </button>

                </div>

              </li>

            ) )}
          </ul>
        )}

      </div>

    </main>

  );

}
