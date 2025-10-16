import express from "express";
import { getAlerts } from "../controllers/alertController.cjs";

const router = express.Router();

router.get("/", getAlerts);

module.exports = { router };
