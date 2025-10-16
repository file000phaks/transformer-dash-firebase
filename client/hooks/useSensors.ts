import { db } from "@/backend/db"
import { Sensor, SensorData } from "@shared/api";
import { useEffect, useState } from "react";
import { sensors, sensorSchema } from "@/lib/sensors";
import { database } from "../lib/firebase.js"
import { ref, query, limitToLast, onValue } from "firebase/database";

export const useSensors = () => {

    const [ sensorData, setSensorData ] = useState();

    const [ latestPacket, setLatestPacket ] = useState();

    useEffect( () => {

        // getSensorData();

    }, [] )

    useEffect( () => {

        const dataRef = query( ref( database, "loriotData" ), limitToLast( 1 ) );

        const unsubscribe = onValue( dataRef, ( snapshot ) => {

            if ( snapshot.exists() ) {

                const data = snapshot.val();

                // Firebase returns an object { id: packet }

                const packet = Object.values( data )[ 0 ];

                setLatestPacket( packet );

                setSensorData( packet?.decoded || null );

            }

        } );

        return () => unsubscribe();

    }, [] );

    const getSensorData = () => latestPacket?.decoded || null;


    return {

        getSensorData,
        sensors,
        sensorSchema,
        sensorData,

    }

}

export default useSensors;