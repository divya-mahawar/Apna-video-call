import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Box from "@mui/material/Box";

import HomeIcon from "@mui/icons-material/Home";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import EventNoteIcon from "@mui/icons-material/EventNote";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import DeleteIcon from "@mui/icons-material/Delete";

import server from "../environment";

export default function History() {

    const [meetings, setMeetings] = useState([]);
    const [selectedMeeting, setSelectedMeeting] = useState(null);

    const routeTo = useNavigate();

    // =====================================================
    // GET MEETING HISTORY
    // =====================================================

    useEffect(() => {

        const fetchHistory = async () => {

            try {

                console.log("HISTORY API CALLING...");

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


    // =====================================================
    // FORMAT DATE
    // =====================================================

    const formatDate = (dateString) => {

        if (!dateString) {
            return "N/A";
        }

        const date = new Date(dateString);

        return date.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };


    // =====================================================
    // OPEN SINGLE MEETING
    // =====================================================

    const openMeeting = async (meetingId) => {

        try {

            console.log(
                "OPENING MEETING:",
                meetingId
            );

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


    // =====================================================
// DELETE MEETING
// =====================================================

const deleteMeeting = async (meetingId) => {

    const confirmDelete = window.confirm(
        `Are you sure you want to delete "${meetingId}"?`
    );

    if (!confirmDelete) {
        return;
    }

    try {

        console.log("DELETING MEETING:", meetingId);

        const response = await fetch(
            `${server}/api/v1/meetings/${meetingId}`,
            {
                method: "DELETE"
            }
        );

        const data = await response.json();

        console.log("DELETE RESPONSE:", data);

        if (!response.ok) {
            alert(data.message || "Failed to delete meeting");
            return;
        }

        setMeetings((prevMeetings) =>
            prevMeetings.filter(
                (meeting) =>
                    meeting.meetingId !== meetingId
            )
        );

        alert("Meeting deleted successfully");

    } catch (error) {

        console.log("Delete meeting error:", error);

        alert("Failed to delete meeting");
    }
};



    // =====================================================
    // MEETING LIST
    // =====================================================

    if (!selectedMeeting) {

        return (

            <div
                style={{
                    minHeight: "100vh",
                    background:
                        "linear-gradient(135deg, #f5f7ff 0%, #eef2ff 50%, #f8faff 100%)",
                    padding: "30px 20px"
                }}
            >

                {/* HEADER */}

                <div
                    style={{
                        maxWidth: "1000px",
                        margin: "0 auto"
                    }}
                >

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            marginBottom: "30px"
                        }}
                    >

                        <IconButton
                            onClick={() => routeTo("/home")}
                            style={{
                                background: "white",
                                boxShadow:
                                    "0 4px 15px rgba(0,0,0,0.08)",
                                marginRight: "15px"
                            }}
                        >
                            <HomeIcon />
                        </IconButton>


                        <div>

                            <Typography
                                variant="h4"
                                style={{
                                    fontWeight: "700"
                                }}
                            >
                                Meeting History
                            </Typography>

                            <Typography
                                color="text.secondary"
                            >
                                Review your previous AI-powered meetings
                            </Typography>

                        </div>

                    </div>


                    {/* MEETING COUNT */}

                    <div
                        style={{
                            marginBottom: "20px"
                        }}
                    >

                        <Chip
                            icon={<EventNoteIcon />}
                            label={`${meetings.length} Meeting${meetings.length !== 1 ? "s" : ""}`}
                            variant="outlined"
                        />

                    </div>


                    {/* EMPTY STATE */}

                    {meetings.length === 0 ? (

                        <Card
                            style={{
                                borderRadius: "20px",
                                textAlign: "center",
                                padding: "50px 20px",
                                boxShadow:
                                    "0 8px 30px rgba(0,0,0,0.06)"
                            }}
                        >

                            <EventNoteIcon
                                style={{
                                    fontSize: "60px",
                                    opacity: 0.4,
                                    marginBottom: "15px"
                                }}
                            />

                            <Typography
                                variant="h6"
                                style={{
                                    fontWeight: "600"
                                }}
                            >
                                No meetings found
                            </Typography>

                            <Typography
                                color="text.secondary"
                            >
                                Your completed meetings will appear here.
                            </Typography>

                        </Card>

                    ) : (

                        <div>

                            {meetings.map((meeting) => (

                               <Card
    key={meeting._id}
    style={{
        marginBottom: "16px",
        borderRadius: "18px",
        border: "1px solid rgba(0,0,0,0.06)",
        boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
        transition: "all 0.25s ease"
    }}
    onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow =
            "0 12px 30px rgba(0,0,0,0.12)";
    }}
    onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow =
            "0 6px 20px rgba(0,0,0,0.06)";
    }}
>
    <CardContent>

        <div
            style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
            }}
        >

            {/* MEETING INFO */}
            <div
                onClick={() =>
                    openMeeting(meeting.meetingId)
                }
                style={{
                    flex: 1,
                    cursor: "pointer"
                }}
            >

                <Typography
                    variant="h6"
                    style={{
                        fontWeight: "700",
                        marginBottom: "8px"
                    }}
                >
                    🎥 {meeting.meetingId}
                </Typography>

                <Typography
                    color="text.secondary"
                    style={{
                        marginBottom: "5px"
                    }}
                >
                    👤 {meeting.username || "Unknown user"}
                </Typography>

                <Typography
                    color="text.secondary"
                    variant="body2"
                >
                    📅 {formatDate(meeting.startTime)}
                </Typography>

            </div>


            {/* RIGHT SIDE */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px"
                }}
            >

                {/* DELETE BUTTON */}
                <IconButton
                    onClick={(e) => {
                        e.stopPropagation();

                        deleteMeeting(
                            meeting.meetingId
                        );
                    }}
                    title="Delete meeting"
                >
                    <DeleteIcon />
                </IconButton>


                {/* OPEN ARROW */}
                <ArrowForwardIosIcon
                    style={{
                        opacity: 0.5
                    }}
                />

            </div>

        </div>

    </CardContent>
</Card>
                            ))}

                        </div>

                    )}

                </div>

            </div>
        );
    }


    // =====================================================
    // SINGLE MEETING NOTES
    // =====================================================

    return (

        <div
            style={{
                minHeight: "100vh",
                background:
                    "linear-gradient(135deg, #f5f7ff 0%, #eef2ff 50%, #f8faff 100%)",
                padding: "30px 20px"
            }}
        >

            <div
                style={{
                    maxWidth: "1000px",
                    margin: "0 auto"
                }}
            >

                {/* TOP BAR */}

                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "25px"
                    }}
                >

                    <Button
                        variant="outlined"
                        startIcon={<HomeIcon />}
                        onClick={() =>
                            routeTo("/home")
                        }
                    >
                        Home
                    </Button>


                    <Button
                        variant="outlined"
                        onClick={() =>
                            setSelectedMeeting(null)
                        }
                    >
                        ← Back to History
                    </Button>

                </div>


                {/* MAIN HEADER */}

                <Card
                    style={{
                        borderRadius: "22px",
                        marginBottom: "20px",
                        background:
                            "linear-gradient(135deg, #667eea, #764ba2)",
                        color: "white",
                        boxShadow:
                            "0 12px 35px rgba(102,126,234,0.3)"
                    }}
                >

                    <CardContent
                        style={{
                            padding: "28px"
                        }}
                    >

                        <Typography
                            variant="h4"
                            style={{
                                fontWeight: "700",
                                marginBottom: "15px"
                            }}
                        >
                            📝 Meeting Notes
                        </Typography>


                        <Typography
                            style={{
                                marginBottom: "7px"
                            }}
                        >
                            <b>Meeting ID:</b>{" "}
                            {selectedMeeting.meetingId}
                        </Typography>


                        <Typography
                            style={{
                                marginBottom: "7px"
                            }}
                        >
                            <b>Username:</b>{" "}
                            {selectedMeeting.username ||
                                "N/A"}
                        </Typography>


                        <Typography>
                            <b>📅 Date:</b>{" "}
                            {formatDate(
                                selectedMeeting.startTime
                            )}
                        </Typography>

                    </CardContent>

                </Card>


                {/* =================================================
                    MY TASKS
                ================================================= */}

                <Card
                    style={{
                        borderRadius: "20px",
                        marginBottom: "20px",
                        border:
                            "2px solid #e8eaff",
                        boxShadow:
                            "0 8px 25px rgba(0,0,0,0.06)"
                    }}
                >

                    <CardContent>

                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                marginBottom: "15px"
                            }}
                        >

                            <AssignmentTurnedInIcon />

                            <Typography
                                variant="h6"
                                style={{
                                    fontWeight: "700"
                                }}
                            >
                                My Tasks
                            </Typography>

                        </div>


                        {selectedMeeting.myTasks?.length > 0 ? (

                            selectedMeeting.myTasks.map(
                                (task, index) => (

                                    <div
                                        key={index}
                                        style={{
                                            display: "flex",
                                            alignItems: "flex-start",
                                            gap: "10px",
                                            padding: "12px",
                                            marginBottom: "8px",
                                            borderRadius: "10px",
                                            background:
                                                "#f7f8ff"
                                        }}
                                    >

                                        <TaskAltIcon
                                            fontSize="small"
                                        />

                                        <Typography>
                                            {task}
                                        </Typography>

                                    </div>

                                )
                            )

                        ) : (

                            <Typography
                                color="text.secondary"
                            >
                                No personal tasks assigned.
                            </Typography>

                        )}

                    </CardContent>

                </Card>


                {/* =================================================
                    SUMMARY
                ================================================= */}

                <Card
                    style={{
                        borderRadius: "20px",
                        marginBottom: "20px",
                        boxShadow:
                            "0 8px 25px rgba(0,0,0,0.06)"
                    }}
                >

                    <CardContent>

                        <Typography
                            variant="h6"
                            style={{
                                fontWeight: "700",
                                marginBottom: "12px"
                            }}
                        >
                            📋 Summary
                        </Typography>

                        <Divider
                            style={{
                                marginBottom: "15px"
                            }}
                        />

                        <Typography
                            style={{
                                lineHeight: "1.8"
                            }}
                        >
                            {selectedMeeting.summary ||
                                "No summary available."}
                        </Typography>

                    </CardContent>

                </Card>


                {/* =================================================
                    KEY POINTS
                ================================================= */}

                <Card
                    style={{
                        borderRadius: "20px",
                        marginBottom: "20px",
                        boxShadow:
                            "0 8px 25px rgba(0,0,0,0.06)"
                    }}
                >

                    <CardContent>

                        <Typography
                            variant="h6"
                            style={{
                                fontWeight: "700",
                                marginBottom: "12px"
                            }}
                        >
                            💡 Key Points
                        </Typography>

                        <Divider
                            style={{
                                marginBottom: "15px"
                            }}
                        />


                        {selectedMeeting.keyPoints?.length > 0 ? (

                            selectedMeeting.keyPoints.map(
                                (point, index) => (

                                    <div
                                        key={index}
                                        style={{
                                            display: "flex",
                                            gap: "10px",
                                            marginBottom: "12px"
                                        }}
                                    >

                                        <LightbulbIcon
                                            fontSize="small"
                                        />

                                        <Typography>
                                            {point}
                                        </Typography>

                                    </div>

                                )
                            )

                        ) : (

                            <Typography
                                color="text.secondary"
                            >
                                No key points available.
                            </Typography>

                        )}

                    </CardContent>

                </Card>


                {/* =================================================
                    ACTION ITEMS
                ================================================= */}

                <Card
                    style={{
                        borderRadius: "20px",
                        marginBottom: "20px",
                        boxShadow:
                            "0 8px 25px rgba(0,0,0,0.06)"
                    }}
                >

                    <CardContent>

                        <Typography
                            variant="h6"
                            style={{
                                fontWeight: "700",
                                marginBottom: "12px"
                            }}
                        >
                            ✅ Action Items
                        </Typography>

                        <Divider
                            style={{
                                marginBottom: "15px"
                            }}
                        />


                        {selectedMeeting.actionItems?.length > 0 ? (

                            selectedMeeting.actionItems.map(
                                (item, index) => (

                                    <div
                                        key={index}
                                        style={{
                                            display: "flex",
                                            gap: "10px",
                                            marginBottom: "12px"
                                        }}
                                    >

                                        <TaskAltIcon
                                            fontSize="small"
                                        />

                                        <Typography>
                                            {item}
                                        </Typography>

                                    </div>

                                )
                            )

                        ) : (

                            <Typography
                                color="text.secondary"
                            >
                                No action items available.
                            </Typography>

                        )}

                    </CardContent>

                </Card>

            </div>

        </div>
    );
}