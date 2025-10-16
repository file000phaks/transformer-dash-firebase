// import "dotenv/config";
const express = require("express")
const cors = require("cors")

const { getAllTransformers, getTransformerById, getTransformerByName } = require("./controllers/transformerController.cjs");
const {
  getSensorData,
  getSensorsUsed,
  getSensorDataFor
} = require("./controllers/sensorController.cjs")

function createServer() {

  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Gets all sensor data
  app.get("/api/sensors/instruments", getSensorsUsed);
  app.get("/api/sensors/data", getSensorData);
  app.get("/api/sensors/data/:id", getSensorDataFor);

  // Gets all transformer data
  app.get("/api/transformers/", getAllTransformers);
  app.get("/api/transformers/:id", getTransformerById);
  app.get("/api/transformers/:name", getTransformerByName);

  // Gets all alerts
  // app.get("/api/alerts", handleAlerts);

  return app;

}

module.exports = { createServer }
