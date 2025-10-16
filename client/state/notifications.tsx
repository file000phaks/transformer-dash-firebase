import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type AlertItem = {
  id: string;
  key: string;
  label: string;
  value: number | boolean;
  severity: "warn" | "crit";
  ts: number;
  transformerId?: string;
  transformerName?: string;
  lat?: number;
  lng?: number;
  message?: string;
};

const STORAGE_KEY = "guard.alerts";

function loadAlerts(): AlertItem[] {

  try {
    const raw = localStorage.getItem( STORAGE_KEY );
    return raw ? ( JSON.parse( raw ) as AlertItem[] ) : [];
  } catch {
    return [];
  }

}

function saveAlerts( list: AlertItem[] ) {

  localStorage.setItem( STORAGE_KEY, JSON.stringify( list ) );

}

export type NotificationsCtx = {

  alerts: AlertItem[];
  addAlert: (
    a: Omit<AlertItem, "id" | "ts"> & Partial<Pick<AlertItem, "id" | "ts">>,
  ) => void;
  clearAlert: ( id: string ) => void;
  clearAll: () => void;

};

const Ctx = createContext<NotificationsCtx | null>( null );

export function NotificationsProvider( { children }: { children: React.ReactNode } ) {

  const [ alerts, setAlerts ] = useState<AlertItem[]>( [] );

  useEffect( () => {

    setAlerts( loadAlerts() );

  }, [] );

  useEffect( () => {

    saveAlerts( alerts );

  }, [ alerts ] );

  const api = useMemo<NotificationsCtx>(

    () => ( {

      alerts,

      addAlert: ( a ) => {
        const item: AlertItem = {
          id: a.id ?? `${a.key}-${Date.now()}`,
          ts: a.ts ?? Date.now(),
          key: a.key,
          label: a.label,
          value: a.value,
          severity: a.severity,
          transformerId: ( a as any ).transformerId,
          transformerName: ( a as any ).transformerName,
          lat: ( a as any ).lat,
          lng: ( a as any ).lng,
          message: ( a as any ).message,
        };
        setAlerts( ( prev ) => [ item, ...prev ].slice( 0, 200 ) );

      },

      clearAlert: ( id ) => setAlerts( ( prev ) => prev.filter( ( x ) => x.id !== id ) ),

      clearAll: () => setAlerts( [] ),

    } ),

    [ alerts ],

  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;

}

export function useNotifications() {

  const ctx = useContext( Ctx );

  if ( !ctx ) throw new Error( "useNotifications must be used within NotificationsProvider" );

  return ctx;

}
