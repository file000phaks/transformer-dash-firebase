import { useEffect, useMemo, useState } from "react";
import Map, { MapMarker } from "@/components/site/Map";
import { Button } from "@/components/ui/button";
import { Transformer } from "@/types/transformer";
import { loadTransformers, saveTransformers } from "@/lib/storage";

import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import useTransformers from "@/hooks/useTransformers";

export default function TransformersPage() {

  const { transformer, transformers } = useTransformers( 1 );

  const [ open, setOpen ] = useState( false );

  const [ draft, setDraft ] = useState<Transformer>( {

    id: ( Math.random() * 1000000 ) % 3,
    name: "",
    lat: -17.8292,
    lng: 31.0522,

  } );

  const navigate = useNavigate();

  const markers: MapMarker[] = useMemo(

    () => [ { id: "draft", lat: draft.lat, lng: draft.lng, label: draft.name } ],
    [ draft ],

  );

  function addTransformer() {

    if ( !draft.name.trim() ) return;

    const next = [ ...transformers, draft ];

    // setTransformers( next );
    saveTransformers( next );
    setDraft( { ...draft, id: ( Math.random() * 1000000 ) % 3, name: "" } );
    setOpen( false );

  }

  if ( !transformers ) return (

    <div>Loading transformers...</div>

  )

  return (

    <main className="container mx-auto py-8">

      <div className="flex items-center justify-between">

        <h1 className="text-2xl font-bold tracking-tight">Transformers</h1>

        <Dialog open={open} onOpenChange={setOpen}>

          <DialogTrigger asChild>
            <Button>Register Transformer</Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-2xl">

            <DialogHeader>
              <DialogTitle>Register Transformer</DialogTitle>
            </DialogHeader>

            <div className="mt-2 grid gap-3">

              <label className="grid gap-1 text-sm">

                <span>Name</span>

                <input
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                  placeholder="e.g. ZESA TX-102"
                  value={draft.name}
                  onChange={( e ) => setDraft( { ...draft, name: e.target.value } )}
                />

              </label>

              <div className="grid grid-cols-2 gap-3">

                <label className="grid gap-1 text-sm">

                  <span>Latitude</span>
                  <input
                    className="h-10 rounded-md border bg-background px-3 text-sm"
                    value={draft.lat}
                    readOnly
                  />
                </label>
                <label className="grid gap-1 text-sm">
                  <span>Longitude</span>
                  <input
                    className="h-10 rounded-md border bg-background px-3 text-sm"
                    value={draft.lng}
                    readOnly
                  />
                </label>
              </div>

              <div className="h-56 overflow-hidden rounded-xl border">
                <Map
                  center={{ lat: draft.lat, lng: draft.lng }}
                  markers={markers}
                  onSelect={( lat, lng ) => setDraft( { ...draft, lat, lng } )}
                  className="h-56"
                />
              </div>

              <div className="mt-1 text-right">
                <Button onClick={addTransformer}>Save Transformer</Button>
              </div>

            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Name</th>
              <th className="px-3 py-2 text-left font-medium">Lat</th>
              <th className="px-3 py-2 text-left font-medium">Lng</th>
              <th className="px-3 py-2 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>

            {
              transformers.map( ( t ) => {

                return (

                  <tr
                    key={t.id}
                    className="odd:bg-muted/20 cursor-pointer hover:bg-accent"
                    onClick={() => navigate( `/transformers/${t.id}` )}
                    role="button"
                    tabIndex={0}
                    onKeyDown={( e ) => {
                      if ( e.key === "Enter" ) navigate( `/transformers/${t.id}` );
                    }}
                  >
                    <td className="px-3 py-2 text-primary underline">{t.name}</td>
                    <td className="px-3 py-2">{t.lat.toFixed( 5 )}</td>
                    <td className="px-3 py-2">{t.lng.toFixed( 5 )}</td>
                    <td className="px-3 py-2">

                      <span className="text-xs text-muted-foreground">
                        View
                      </span>

                    </td>

                  </tr>
                )
              } )
            }

          </tbody>

        </table>

      </div>

    </main>

  );

}
