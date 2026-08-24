import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";

import HomeIcon from "@mui/icons-material/Home";

import server from "../environment";

export default function History() {

    const [meetings, setMeetings] = useState([]);
    const [selectedMeeting, setSelectedMeeting] = useState(null);

    const routeTo = useNavigate();

    useEffect(() => {

        const fetchHistory = async () => {

            try {

                const response = await fetch(
                    `${server}/api/v1/meetings/history`
                );

                const data = await response.json();

                console.log("HISTORY RESPONSE:", data);

                if (!response.ok) {
                    console.log(
                        "History fetch failed:",
                        data
                    );
                    return;
                }

                setMeetings(data.meetings || []);

            } catch (error) {

                console.log(
                    "History error:",
                    error
                );
            }
        };

        fetchHistory();

    }, []);


    const formatDate = (dateString) => {

        if (!dateString) {
            return "N/A";
        }

        const date = new Date(dateString);

        return date.toLocaleString("en-IN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };
  
const openMeeting = async (meetingId) => {

    try {

        console.log("OPENING MEETING:", meetingId);

        const response = await fetch(
            `${server}/api/v1/meetings/${meetingId}`
        );

        const data = await response.json();

        console.log(
            "SINGLE MEETING RESPONSE:",
            data
        );

        if (!response.ok) {
            console.log(
                "Failed to fetch meeting:",
                data
            );
            return;
        }

        setSelectedMeeting(data.meeting);

    } catch (error) {

        console.log(
            "Open meeting error:",
            error
        );
    }
};

    return (

        <div
            style={{
                padding: "30px",
                minHeight: "100vh"
            }}
        >

            {/* HOME BUTTON */}

            <IconButton
                onClick={() => routeTo("/home")}
            >
                <HomeIcon />
            </IconButton>


            <h1>
                Meeting History
            </h1>


            {/* =========================
                MEETING LIST
            ========================= */}

            {!selectedMeeting && (

                <>
                    {meetings.length === 0 ? (

                        <Typography>
                            No meetings found.
                        </Typography>

                    ) : (

                        meetings.map((meeting) => (

                            <Card
                                key={meeting._id}
                                variant="outlined"
                                onClick={() =>
                                   
                                   openMeeting(meeting.meetingId)
                                    
                                }
                                style={{
                                    marginBottom: "15px",
                                    cursor: "pointer"
                                }}
                            >

                                <CardContent>

                                    <Typography
                                        variant="h6"
                                    >
                                        Meeting:{" "}
                                        {meeting.meetingId}
                                    </Typography>


                                    <Typography
                                        color="text.secondary"
                                    >
                                        Username:{" "}
                                        {meeting.username || "N/A"}
                                    </Typography>


                                    <Typography
                                        color="text.secondary"
                                    >
                                        Date:{" "}
                                        {formatDate(
                                            meeting.startTime
                                        )}
                                    </Typography>

                                </CardContent>

                            </Card>

                        ))

                    )}
                </>

            )}


            {/* =========================
                FULL MEETING NOTES
            ========================= */}

            {selectedMeeting && (

                <div>

                    <Button
                        variant="outlined"
                        onClick={() =>
                            setSelectedMeeting(null)
                        }
                        style={{
                            marginBottom: "20px"
                        }}
                    >
                        ← Back to History
                    </Button>


                    <Card>

                        <CardContent>

                            <Typography
                                variant="h4"
                                gutterBottom
                            >
                                Meeting Notes
                            </Typography>


                            <Typography>
                                <b>Meeting ID:</b>{" "}
                                {selectedMeeting.meetingId}
                            </Typography>


                            <Typography>
                                <b>Username:</b>{" "}
                                {selectedMeeting.username || "N/A"}
                            </Typography>


                            <Typography
                                color="text.secondary"
                                style={{
                                    marginBottom: "25px"
                                }}
                            >
                                <b>Date:</b>{" "}
                                {formatDate(
                                    selectedMeeting.startTime
                                )}
                            </Typography>


                            {/* SUMMARY */}

                            <Typography
                                variant="h6"
                            >
                                📋 Summary
                            </Typography>

                            <Typography
                                style={{
                                    marginBottom: "25px"
                                }}
                            >
                                {selectedMeeting.summary ||
                                    "No summary available."}
                            </Typography>


                            {/* KEY POINTS */}

                            <Typography
                                variant="h6"
                            >
                                🔑 Key Points
                            </Typography>


                            {selectedMeeting.keyPoints?.length > 0 ? (

                                <ul>

                                    {selectedMeeting.keyPoints.map(
                                        (point, index) => (

                                            <li key={index}>
                                                {point}
                                            </li>

                                        )
                                    )}

                                </ul>

                            ) : (

                                <Typography>
                                    No key points available.
                                </Typography>

                            )}


                            {/* ACTION ITEMS */}

                            <Typography
                                variant="h6"
                                style={{
                                    marginTop: "25px"
                                }}
                            >
                                ✅ Action Items
                            </Typography>


                            {selectedMeeting.actionItems?.length > 0 ? (

                                <ul>

                                    {selectedMeeting.actionItems.map(
                                        (item, index) => (

                                            <li key={index}>
                                                {item}
                                            </li>

                                        )
                                    )}

                                </ul>

                            ) : (

                                <Typography>
                                    No action items available.
                                </Typography>

                            )}


                            {/* TRANSCRIPT */}

                            <Typography
                                variant="h6"
                                style={{
                                    marginTop: "25px"
                                }}
                            >
                                📝 Transcript
                            </Typography>


                            <Typography
                                style={{
                                    whiteSpace: "pre-wrap"
                                }}
                            >
                                {selectedMeeting.transcript ||
                                    "No transcript available."}
                            </Typography>

                        </CardContent>

                    </Card>

                </div>

            )}

        </div>
    );
}