import { Sensor, SensorData, Transformer } from "@shared/api";

// const BASE_URL = `https://powertel-transformer-backend.onrender.com/api`

const BASE_URL = `http://localhost:5005/api`;

const getTransformers = async (): Promise<Transformer[]> => {

    const res = await fetch( `${BASE_URL}/transformers` );

    const json = await res.json();

    return json.data;

}

const getTransformer = async ( id: number ): Promise<Transformer> => {

    const res = await fetch( `${BASE_URL}/transformers/${id}` );

    const json = await res.json();

    return json.data;

}

const getTransformerByName = async ( name: string ): Promise<Transformer> => {

    const res = await fetch( `${BASE_URL}/transformers/${name}` );

    const json = await res.json();

    return json.data;

}

const getSensors = async (): Promise<Sensor[]> => {

    const res = await fetch( `${BASE_URL}/sensors/instruments` );

    const json = await res.json();

    return json.data;

}

const getSensorData = async (): Promise<SensorData[]> => {

    const res = await fetch( `${BASE_URL}/sensors/data` );

    const json = await res.json();

    console.log("Getting sensor data")

    return json.data;

}

export const db = {
    getTransformer,
    getTransformerByName,
    getTransformers,
    getSensors,
    getSensorData,
}