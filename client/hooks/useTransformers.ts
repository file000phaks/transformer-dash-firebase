import { ref, onValue, push } from "firebase/database";
import { database } from "@/lib/firebase.js";
import { Transformer } from "@/types/transformer";
import { useEffect, useMemo, useState } from "react";

/**
 * Live Firebase-backed transformer registry. Reads the `transformers` RTDB
 * node via `onValue` (not a one-time fetch), so a newly added transformer
 * appears in every subscribed list immediately. Each RTDB entry's own push
 * key is used as `Transformer.id` throughout the app (route params, alert
 * links, etc.) — there is no separate numeric id scheme.
 */
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

            const list: Transformer[] = Object.entries( snap.val() as Record<string, Omit<Transformer, "id">> )
                .map( ( [ key, value ] ) => ( { id: key, name: value.name, lat: value.lat, lng: value.lng } ) );

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

    const addTransformer = async ( data: { name: string; lat: number; lng: number } ) => {

        const transformersRef = ref( database, "transformers" );
        await push( transformersRef, data );

    }

    return {
        transformers,
        transformer,
        loading,
        getTransformerById,
        addTransformer,
    }

}

export default useTransformers;
