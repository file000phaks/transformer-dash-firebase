import { db } from "@/backend/db";
import { Transformer } from "@shared/api";
import { useEffect, useState } from "react";

export const useTransformers = ( id?: number ) => {

    const [ transformer, setTransformer ] = useState<Transformer>();
    const [ transformers, setTransformers ] = useState<Transformer[]>( [] );

    useEffect( () => {

        getTransformers();

        // if ( id ) getTransformerById( id );

        // Create a transformer by hand. After app is scaled to manage multiple transformers will fetch from db, but for now hardcode it

        setTransformer( {
            "name": "Transformer Guard 1",
            "id": 1,
            "lat": -20.15917,
            "lng": 28.57583
        } )

    }, [] )

    const getTransformers = async () => {

        const transformers = await db.getTransformers();

        if ( !transformers ) console.error( "Failed to get transformers" );

        setTransformers( transformers );

        return transformers;

    }

    const getTransformerById = async ( id: number ) => {

        // const transformer = await db.getTransformer( id );

        // if ( !transformer ) console.error( "Failed to get transformer from database" );

        // setTransformer( transformer )

        // return transformer;

        setTransformer( {
            "name": "Transformer Guard 1",
            "id": 1,
            "lat": -20.15917,
            "lng": 28.57583
        } )

        return {
            "name": "Transformer Guard 1",
            "id": 1,
            "lat": -20.15917,
            "lng": 28.57583
        }

    }

    const getTransformerByName = async ( name: string ) => {

        const transformer = await db.getTransformerByName( name );

        if ( !transformer ) throw new Error( "Failed to get transformer" );

        setTransformer( transformer )

        return transformer;

    }

    return {
        getTransformerById,
        transformer,
        transformers
    }

}

export default useTransformers;