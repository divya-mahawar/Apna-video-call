import express from "express";

import {
    transcribeAudio,
    analyzeMeeting
} from "../controllers/aiController.js";

import upload from "../middleware/upload.js";

const router = express.Router();

router.post(
    "/transcribe",
    upload.single("audio"),
    transcribeAudio
);

router.post(
    "/analyze-meeting",
    analyzeMeeting
);

export default router;