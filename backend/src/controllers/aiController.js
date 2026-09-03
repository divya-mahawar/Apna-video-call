import Groq from "groq-sdk";
import fs from "fs";
import LiveMeeting from "../models/Meeting.js";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});


// =====================================================
// TRANSCRIBE AUDIO
// =====================================================

const transcribeAudio = async (req, res) => {
    try {

        if (!req.file) {
            return res.status(400).json({
                message: "Audio file is required"
            });
        }

        const transcription =
            await groq.audio.transcriptions.create({
                file: fs.createReadStream(req.file.path),
                model: "whisper-large-v3-turbo",
                language: "en",
                response_format: "json"
            });

        // Delete temporary audio file
        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        return res.status(200).json({
            transcript: transcription.text
        });

    } catch (error) {

        console.log(
            "AI transcription error:",
            error
        );

        if (
            req.file?.path &&
            fs.existsSync(req.file.path)
        ) {
            fs.unlinkSync(req.file.path);
        }

        return res.status(500).json({
            message: "Transcription failed",
            error: error.message
        });
    }
};


// =====================================================
// ANALYZE MEETING
// =====================================================

const analyzeMeeting = async (req, res) => {

    try {

        const {
            transcript,
            meetingId,
            username
        } = req.body;


        console.log(
            "========== ANALYZE MEETING =========="
        );

        console.log(
            "Meeting ID:",
            meetingId
        );

        console.log(
            "Username:",
            username
        );

        console.log(
            "Transcript:",
            transcript
        );


        // =================================================
        // VALIDATION
        // =================================================

        if (
            !transcript ||
            !transcript.trim()
        ) {
            return res.status(400).json({
                message: "Transcript is required"
            });
        }


        if (
            !meetingId ||
            !meetingId.trim()
        ) {
            return res.status(400).json({
                message: "Meeting ID is required"
            });
        }


        if (
            !username ||
            !username.trim()
        ) {
            return res.status(400).json({
                message: "Username is required"
            });
        }


        const cleanMeetingId =
            meetingId.trim();

        const cleanUsername =
            username.trim();

        const cleanTranscript =
            transcript.trim();


        // =================================================
        // GROQ AI REQUEST
        // =================================================

        const response = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization":
                        `Bearer ${process.env.GROQ_API_KEY}`
                },

                body: JSON.stringify({

                    model: "openai/gpt-oss-20b",

                    messages: [

                        // ================================
                        // SYSTEM PROMPT
                        // ================================

                        {
                            role: "system",

                            content: `
You are an AI meeting assistant.

Analyze the ENTIRE meeting transcript carefully.

The current user's username is:

${cleanUsername}

Return ONLY a valid JSON object.

Do NOT use markdown.
Do NOT use code fences.
Do NOT add any explanation before or after JSON.

Use EXACTLY this structure:

{
    "summary": "short summary of the entire meeting",
    "keyPoints": [
        "important discussion point"
    ],
    "actionItems": [
        "general action item discussed in the meeting"
    ],
    "myTasks": [
        "task specifically assigned to the current user"
    ]
}

IMPORTANT RULES:

1. summary must describe the ENTIRE meeting.

2. keyPoints must contain important points from the ENTIRE meeting.

3. actionItems must contain GENERAL action items discussed in the meeting, including tasks assigned to different employees.

4. myTasks must contain ONLY tasks assigned specifically to the current user.

5. Do NOT put another employee's task inside myTasks.

6. If the current user was not assigned any task, return an empty array for myTasks.

7. If the manager gives the current user a task, identify that task clearly in myTasks.

8. If the current user is asked to complete something, include that responsibility in myTasks.

9. Do not invent tasks that were not discussed.

10. Keep myTasks concise and actionable.

11. The username provided above represents the current user.

12. If the transcript says things like:

"Divya will..."
"Divya, please..."
"Divya has to..."
"Divya is responsible for..."
"You need to..."
"Please handle..."

and the current username is Divya, treat that as a possible personal task.

13. Do not assume that a task belongs to the current user just because the current user is mentioned.

14. Only add a task to myTasks when the meeting discussion indicates that the current user is responsible for it.

15. Return valid JSON only.
`
                        },


                        // ================================
                        // MEETING TRANSCRIPT
                        // ================================

                        {
                            role: "user",

                            content:
                                cleanTranscript
                        }

                    ],

                    temperature: 0.2
                })
            }
        );


        // =================================================
        // GROQ RESPONSE
        // =================================================

        const data =
            await response.json();

        console.log(
            "GROQ RESPONSE:",
            data
        );


        if (!response.ok) {

            console.log(
                "AI API ERROR:",
                data
            );

            return res.status(500).json({
                message: "AI API failed",
                error: data
            });
        }


        // =================================================
        // GET AI CONTENT
        // =================================================

        let result =
            data.choices?.[0]?.message?.content;


        if (!result) {

            return res.status(500).json({
                message: "AI returned empty response"
            });
        }


        // Remove markdown if AI accidentally adds it
        result = result
            .replace(/```json/gi, "")
            .replace(/```/g, "")
            .trim();


        console.log(
            "AI RESULT:",
            result
        );


        // =================================================
        // PARSE JSON
        // =================================================

        let parsedResult;

        try {

            parsedResult =
                JSON.parse(result);

        } catch (error) {

            console.log(
                "JSON parsing error:",
                error
            );

            return res.status(500).json({
                message: "AI returned invalid JSON",
                rawResult: result
            });
        }


        // =================================================
        // SAFETY DEFAULTS
        // =================================================

        parsedResult.summary =
            typeof parsedResult.summary === "string"
                ? parsedResult.summary
                : "";


        parsedResult.keyPoints =
            Array.isArray(parsedResult.keyPoints)
                ? parsedResult.keyPoints
                : [];


        parsedResult.actionItems =
            Array.isArray(parsedResult.actionItems)
                ? parsedResult.actionItems
                : [];


        parsedResult.myTasks =
            Array.isArray(parsedResult.myTasks)
                ? parsedResult.myTasks
                : [];


        // =================================================
        // SAVE AI NOTES + TRANSCRIPT TO MONGODB
        // =================================================

        const meeting =
            await LiveMeeting.findOneAndUpdate(

                {
                    meetingId: cleanMeetingId
                },

                {
                    username: cleanUsername,

                    transcript:
                        cleanTranscript,

                    summary:
                        parsedResult.summary,

                    keyPoints:
                        parsedResult.keyPoints,

                    actionItems:
                        parsedResult.actionItems,

                    myTasks:
                        parsedResult.myTasks
                },

                {
                    returnDocument: "after"
                }
            );


        // =================================================
        // MEETING NOT FOUND
        // =================================================

        if (!meeting) {

            console.log(
                "MEETING NOT FOUND:",
                cleanMeetingId
            );

            return res.status(404).json({
                message:
                    "Meeting not found"
            });
        }


        // =================================================
        // SUCCESS LOGS
        // =================================================

        console.log(
            "================================"
        );

        console.log(
            "AI NOTES SAVED SUCCESSFULLY"
        );

        console.log(
            "MEETING ID:",
            meeting.meetingId
        );

        console.log(
            "SUMMARY:",
            meeting.summary
        );

        console.log(
            "KEY POINTS:",
            meeting.keyPoints
        );

        console.log(
            "ACTION ITEMS:",
            meeting.actionItems
        );

        console.log(
            "MY TASKS:",
            meeting.myTasks
        );

        console.log(
            "================================"
        );


        // =================================================
        // RESPONSE TO FRONTEND
        // =================================================

        return res.status(200).json({

            message:
                "Meeting analyzed successfully",

            analysis: {

                summary:
                    parsedResult.summary,

                keyPoints:
                    parsedResult.keyPoints,

                actionItems:
                    parsedResult.actionItems,

                myTasks:
                    parsedResult.myTasks
            },

            meeting

        });


    } catch (error) {

        console.log(
            "AI Controller Error:",
            error
        );

        return res.status(500).json({
            message:
                "Something went wrong",
            error:
                error.message
        });
    }
};


// =====================================================
// EXPORT
// =====================================================

export {
    transcribeAudio,
    analyzeMeeting
};