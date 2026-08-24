import express from "express";

import {
    startMeeting,
    endMeeting,
    getMeetingHistory,
    getMeetingById
} from "../controllers/meetingController.js";

const router = express.Router();

router.post("/start", startMeeting);
router.post("/end", endMeeting);

// History
router.get("/history", getMeetingHistory);
router.get("/:meetingId", getMeetingById);

export default router;              