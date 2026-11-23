import { ref, onValue, push, remove, update } from "firebase/database";
import { database } from "@/lib/firebase.js";
import { Transformer } from "@/types/transformer";
import { useEffect, useMemo, useState } from "react";

export const useTransformers = ( id?: string ) => {

    const [ transformers, setTransformers ] = useState<Transformer[]>( [] );
    const [ loading, setLoading ] = useState( true );

    useEffect( () => {

        const transformersRef = ref( database, "transformers" );

        const unsubscribe = onValue( transformersRef, ( snap ) => {

            if ( !snap.exists() ) {
                setTransformers( [] );
                setLoading( false );
                return;
            }

            const list: Transformer[] = Object.entries( snap.val() as Record<string, any> )
                .map( ( [ key, value ] ) => ( {
                    id: key,
                    name: value.name || `Transformer ${key.slice(-4)}`,
                    city: value.city || "Bulawayo",
                    suburb: value.suburb || "CBD",
                    eui: value.eui || ( value.name === "Local" ? "wwwwwwwwwwwwwww" : `eui-${key.slice(-8)}` ),
                    type: value.type || "GMT",
                    lat: typeof value.lat === "number" ? value.lat : Number( value.lat ) || -20.1626,
                    lng: typeof value.lng === "number" ? value.lng : Number( value.lng ) || 28.6417,
                    armed: typeof value.armed === "boolean" ? value.armed : true,
                    mode: value.mode === "maintenance" ? "maintenance" : "normal",
                } ) );

            setTransformers( list );
            setLoading( false );

        } );

        return () => unsubscribe();

    }, [] );

    const transformer = useMemo(
        () => ( id ? transformers.find( ( t ) => t.id === id ) : undefined ),
        [ transformers, id ],
    );

    const getTransformerById = ( lookupId: string ) => transformers.find( ( t ) => t.id === lookupId );

    const addTransformer = async ( data: {
        name: string;
        lat: number;
        lng: number;
        city?: string;
        suburb?: string;
        eui?: string;
        type?: string;
        armed?: boolean;
        mode?: "normal" | "maintenance";
    } ) => {
        const transformersRef = ref( database, "transformers" );
        await push( transformersRef, {
            name: data.name.trim(),
            city: ( data.city || "Bulawayo" ).trim(),
            suburb: ( data.suburb || "CBD" ).trim(),
            eui: ( data.eui || "wwwwwwwwwwwwwww" ).trim(),
            type: ( data.type || "GMT" ).trim(),
            lat: data.lat,
            lng: data.lng,
            armed: data.armed !== undefined ? data.armed : true,
            mode: data.mode === "maintenance" ? "maintenance" : "normal",
        } );
    };

    const updateTransformer = async ( transformerId: string, updates: Partial<Transformer> ) => {
        const itemRef = ref( database, `transformers/${transformerId}` );
        await update( itemRef, updates );
    };

    const toggleArmed = async ( transformerId: string, currentArmed: boolean ) => {
        const itemRef = ref( database, `transformers/${transformerId}` );
        await update( itemRef, { armed: !currentArmed } );
    };

    const toggleMode = async ( transformerId: string, currentMode: "normal" | "maintenance" ) => {
        const itemRef = ref( database, `transformers/${transformerId}` );
        const nextMode = currentMode === "maintenance" ? "normal" : "maintenance";
        await update( itemRef, { mode: nextMode } );
    };

    const deleteTransformer = async ( transformerId: string ) => {
        const itemRef = ref( database, `transformers/${transformerId}` );
        await remove( itemRef );
    };

    return {
        transformers,
        transformer,
        loading,
        getTransformerById,
        addTransformer,
        updateTransformer,
        toggleArmed,
        toggleMode,
        deleteTransformer,
    };

};

export default useTransformers;
