import express from "express";

import {
    startMeeting,
    endMeeting,
    getMeetingHistory,
    getMeetingById,
    deleteMeeting
} from "../controllers/meetingController.js";

const router = express.Router();

router.post("/start", startMeeting);
router.post("/end", endMeeting);

// History
router.get("/history", getMeetingHistory);
router.get("/:meetingId", getMeetingById);
router.delete("/:meetingId", (req, res, next) => {
    console.log(" DELETE ROUTE HIT:", req.params.meetingId);
    next();
}, deleteMeeting);

export default router;              