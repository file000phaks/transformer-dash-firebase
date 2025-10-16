import express from "express";
import { getSensorData, getSensorDataFor, getSensorsUsed } from "../controllers/sensorController.cjs";

const router = express.Router();

router.get( "/data", getSensorData );

router.get( "/data/:id", getSensorDataFor );

router.get( "/instruments", getSensorsUsed );

module.exports = { router };
