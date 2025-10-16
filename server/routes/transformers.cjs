import express from "express";
import { getAllTransformers, getTransformerById, getTransformerByName } from "../controllers/transformerController.cjs";

const router = express.Router();

router.get( "/", getAllTransformers );

router.get( "/:id", getTransformerById );

router.get( "/:name", getTransformerByName );

module.exports = { router };