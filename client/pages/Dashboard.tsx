import { useEffect, useMemo, useState } from "react";
import { useNotifications } from "@/state/notifications";
import { loadTransformers } from "@/lib/storage";
import { Transformer } from "@/types/transformer";
import { useNavigate } from "react-router-dom";
import useTransformers from "@/hooks/useTransformers";

export default function Dashboard() {

  const { alerts } = useNotifications();

  const { transformers } = useTransformers();

  const navigate = useNavigate();

  const summary = useMemo(
    () => ( {
      transformers: transformers.length,
      alerts: alerts.length,
    } ),
    [ transformers.length, alerts.length ],
  );

  return (

    <main className="container mx-auto grid gap-6 py-6 xl:grid-cols-2">

      <section className="xl:col-span-3 grid grid-cols-2 gap-3 md:grid-cols-2">

        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Transformers</p>
          <p className="mt-1 text-2xl font-semibold">{summary.transformers}</p>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Alerts</p>
          <p className="mt-1 text-2xl font-semibold">{summary.alerts}</p>
        </div>

        {/* <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Coverage</p>
          <p className="mt-1 text-2xl font-semibold">12 km</p>
        </div>
   
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Nodes/Gateway</p>
          <p className="mt-1 text-2xl font-semibold">1,000+</p>
        </div> */}

      </section>

      {/* Dashboard Transformer List */}

      <section className="xl:col-span-2">

        <div className="rounded-xl border bg-card">

          <div className="border-b p-3 text-sm font-medium">Transformers</div>
          <div className="max-h-80 overflow-auto p-2">

            {
              transformers.length === 0 ?
                (
                  <p className="p-2 text-sm text-muted-foreground">
                    No transformers registered. Use the Transformers page to add
                    one.
                  </p>
                ) : (

                  <ul className="grid gap-1">

                    {

                      transformers.map( ( t ) => (

                        <li key={t.id}>

                          <button
                            className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
                            onClick={() => navigate( `/transformers/${t.id}` )}
                          >

                            <span className="truncate">{t.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {t.lat.toFixed( 3 )}, {t.lng.toFixed( 3 )}
                            </span>

                          </button>

                        </li>

                      ) )
                    }

                  </ul>

                )}

          </div>

        </div>

      </section>


      {/* Important Alerts */}

      {/* <section className="xl:col-span-2">

        <div className="rounded-xl border bg-card">

          <div className="border-b p-3 text-sm font-medium">
            Important Alerts
          </div>

          <div className="max-h-64 overflow-auto p-2">

            {
              alerts.length === 0 ? (
                <p className="p-2 text-sm text-muted-foreground">
                  No alerts yet.
                </p>
              ) : (
                <ul className="divide-y">

                  {
                    alerts.slice( 0, 5 ).map( ( a ) => (
                      <li
                        key={a.id}
                        className="flex items-center justify-between px-3 py-2 text-sm"
                      >
                        <div>

                          <button
                            className="font-medium underline"
                            onClick={() => navigate( `/alerts/${a.id}` )}
                          >
                            {a.label}
                          </button>

                          <p className="text-xs text-muted-foreground">

                            {a.transformerName ? (
                              <button
                                className="underline"
                                onClick={() =>
                                  navigate( `/transformers/${a.transformerId}` )
                                }
                              >
                                {a.transformerName}
                              </button>
                            ) : null}
                            {a.transformerName ? " • " : ""}

                            {new Date( a.ts ).toLocaleTimeString()}
                          </p>

                        </div>

                        <span
                          className={`rounded-full px-2 py-1 text-xs ${a.severity === "crit" ? "bg-red-500/10 text-red-600" : "bg-amber-500/10 text-amber-600"}`}
                        >
                          {a.severity}
                        </span>

                      </li>
                    ) )}

                </ul>

              )}

          </div>

        </div>

      </section> */}

    </main>

  );

}
