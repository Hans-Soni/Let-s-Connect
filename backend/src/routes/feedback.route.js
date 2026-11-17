import express from "express";
import { submitFeedback } from "../controllers/feedback.controller.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";

const router = express.Router();

router.post("/", arcjetProtection, submitFeedback);

export default router;

