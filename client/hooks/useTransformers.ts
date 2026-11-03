import { ref, onValue, push, remove } from "firebase/database";
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
                    lat: typeof value.lat === "number" ? value.lat : Number( value.lat ) || -20.1626,
                    lng: typeof value.lng === "number" ? value.lng : Number( value.lng ) || 28.6417,
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

    const addTransformer = async ( data: { name: string; lat: number; lng: number } ) => {
        const transformersRef = ref( database, "transformers" );
        await push( transformersRef, data );
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
        deleteTransformer,
    };

};

export default useTransformers;
