import LiveMeeting from "../models/Meeting.js";

console.log("USING NEW LIVE MEETING MODEL");


// =====================================================
// START MEETING
// =====================================================

export const startMeeting = async (req, res) => {
    try {

        const {
            meetingId,
            host,
            username
        } = req.body;

        console.log("START MEETING BODY:", req.body);

        if (!meetingId || !meetingId.trim()) {
            return res.status(400).json({
                message: "Meeting ID is required"
            });
        }

        // Check existing meeting
        const existingMeeting = await LiveMeeting.findOne({
            meetingId: meetingId.trim()
        });

        if (existingMeeting) {

            console.log(
                "MEETING ALREADY EXISTS:",
                existingMeeting.meetingId
            );

            return res.status(200).json({
                message: "Meeting already exists",
                meeting: existingMeeting
            });
        }

        // Create new meeting
        const meeting = await LiveMeeting.create({
            meetingId: meetingId.trim(),
            username: username || "",
            host: host || null,
            startTime: new Date()
        });

        console.log(
            "NEW MEETING CREATED:",
            meeting.meetingId
        );

        return res.status(201).json({
            message: "Meeting started",
            meeting
        });

    } catch (error) {

        console.log("Start meeting error:", error);

        return res.status(500).json({
            message: "Failed to start meeting",
            error: error.message
        });
    }
};

// =====================================================
// END MEETING
// =====================================================

export const endMeeting = async (req, res) => {
    try {

        const {
            meetingId,
            username,
            transcript
        } = req.body;

        console.log("========== END MEETING ==========");
        console.log("MEETING ID:", meetingId);
        console.log("USERNAME:", username);
        console.log("TRANSCRIPT:", transcript);

        if (!meetingId || !meetingId.trim()) {
            return res.status(400).json({
                message: "Meeting ID is required"
            });
        }

        const updateData = {
            endTime: new Date()
        };

        if (username) {
            updateData.username = username;
        }

        if (transcript && transcript.trim()) {
            updateData.transcript = transcript.trim();
        }

        const meeting = await LiveMeeting.findOneAndUpdate(
            {
                meetingId: meetingId.trim()
            },
            updateData,
            {
                 returnDocument: "after"
            }
        );

        if (!meeting) {
            console.log("MEETING NOT FOUND:", meetingId);

            return res.status(404).json({
                message: "Meeting not found"
            });
        }

        console.log("MEETING UPDATED SUCCESSFULLY:");
        console.log("ID:", meeting._id);
        console.log("TRANSCRIPT:", meeting.transcript);

        return res.status(200).json({
            message: "Meeting ended",
            meeting
        });

    } catch (error) {

        console.log("End meeting error:", error);

        return res.status(500).json({
            message: "Failed to end meeting",
            error: error.message
        });
    }
};
// =====================================================
// GET SINGLE MEETING
// =====================================================

export const getMeetingById = async (req, res) => {
    try {

        const { meetingId } = req.params;

        if (!meetingId) {
            return res.status(400).json({
                message: "Meeting ID is required"
            });
        }

        const meeting = await LiveMeeting.findOne({
            meetingId
        });

        if (!meeting) {
            return res.status(404).json({
                message: "Meeting not found"
            });
        }

        return res.status(200).json({
            meeting
        });

    } catch (error) {

        console.log(
            "Get single meeting error:",
            error
        );

        return res.status(500).json({
            message: "Failed to get meeting",
            error: error.message
        });
    }
};
// =====================================================
// GET MEETING HISTORY
// =====================================================

export const getMeetingHistory = async (req, res) => {
    try {

        console.log("HISTORY API CALLING...");

        const meetings = await LiveMeeting
            .find()
            .sort({
                createdAt: -1
            });

        return res.status(200).json({
            meetings
        });

    } catch (error) {

        console.log(
            "Get meeting history error:",
            error
        );

        return res.status(500).json({
            message: "Failed to get meeting history",
            error: error.message
        });
    }
};

// =====================================================
// DELETE MEETING
// =====================================================

export const deleteMeeting = async (req, res) => {
    try {

        const { meetingId } = req.params;

        console.log("DELETE MEETING:", meetingId);

        if (!meetingId) {
            return res.status(400).json({
                message: "Meeting ID is required"
            });
        }

        const meeting = await LiveMeeting.findOneAndDelete({
            meetingId: meetingId.trim()
        });

        if (!meeting) {
            return res.status(404).json({
                message: "Meeting not found"
            });
        }

        console.log(
            "MEETING DELETED:",
            meeting.meetingId
        );

        return res.status(200).json({
            message: "Meeting deleted successfully"
        });

    } catch (error) {

        console.log(
            "Delete meeting error:",
            error
        );

        return res.status(500).json({
            message: "Failed to delete meeting",
            error: error.message
        });
    }
};