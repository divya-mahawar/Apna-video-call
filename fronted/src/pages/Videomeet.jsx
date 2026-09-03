import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

import {
    Badge,
    IconButton,
    TextField,
    Button
} from "@mui/material";

import {
    startSpeechRecognition,
    stopSpeechRecognition
} from "../utils/speechRecognition";

import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import CallEndIcon from "@mui/icons-material/CallEnd";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
import ChatIcon from "@mui/icons-material/Chat";

import styles from "../styles/videoComponent.module.css";
import server from "../environment";


// =====================================================
// SERVER
// =====================================================

const server_url = server;



// =====================================================
// WEBRTC
// =====================================================

var connections = {};

const peerConfigConnections = {
    iceServers: [
        {
            urls: "stun:stun.l.google.com:19302"
        }
    ]
};


// =====================================================
// COMPONENT
// =====================================================

export default function VideoMeetComponent() {

    // =================================================
    // REFS
    // =================================================

    const socketRef = useRef();
    const socketIdRef = useRef();

    const recognitionRef = useRef(null);
   const transcriptRef = useRef([]);
   const meetingIdRef = useRef(null);

    const localVideoref = useRef();

    const videoRef = useRef([]);


    
    // AI STATES
 

    const [transcript, setTranscript] = useState("");

    const [isListening, setIsListening] =
        useState(false);

    const [summary, setSummary] =
        useState("");

    const [keyPoints, setKeyPoints] =
        useState([]);

    const [actionItems, setActionItems] =
        useState([]);
        const [myTasks, setMyTasks] = useState([]);


    // =================================================
    // MEDIA STATES
    // =================================================

    const [videoAvailable, setVideoAvailable] =
        useState(true);

    const [audioAvailable, setAudioAvailable] =
        useState(true);

    const [video, setVideo] =
        useState(true);

    const [audio, setAudio] =
        useState(true);

    const [screen, setScreen] =
        useState(false);

    const [screenAvailable, setScreenAvailable] =
        useState(false);


    // =================================================
    // CHAT STATES
    // =================================================

    const [showModal, setModal] =
        useState(false);

    const [messages, setMessages] =
        useState([]);

    const [message, setMessage] =
        useState("");

    const [newMessages, setNewMessages] =
        useState(0);


    // =================================================
    // USER STATES
    // =================================================

    const [askForUsername, setAskForUsername] =
        useState(true);

    const [username, setUsername] =
        useState("");

    const [videos, setVideos] =
        useState([]);


    // =================================================
    // GET PERMISSIONS
    // =================================================

    useEffect(() => {

        getPermissions();

        return () => {

            try {

                if (window.localStream) {

                    window.localStream
                        .getTracks()
                        .forEach(track =>
                            track.stop()
                        );
                }

                if (socketRef.current) {

                    socketRef.current.disconnect();
                }

            } catch (error) {

                console.log(error);
            }
        };

    }, []);


    const getPermissions = async () => {

        // VIDEO

        try {

            const videoPermission =
                await navigator.mediaDevices
                    .getUserMedia({
                        video: true
                    });

            if (videoPermission) {

                setVideoAvailable(true);

                videoPermission
                    .getTracks()
                    .forEach(track =>
                        track.stop()
                    );

                console.log(
                    "Video permission granted"
                );
            }

        } catch (error) {

            console.log(
                "Video permission denied"
            );

            setVideoAvailable(false);
        }


        // AUDIO

        try {

            const audioPermission =
                await navigator.mediaDevices
                    .getUserMedia({
                        audio: true
                    });

            if (audioPermission) {

                setAudioAvailable(true);

                audioPermission
                    .getTracks()
                    .forEach(track =>
                        track.stop()
                    );

                console.log(
                    "Audio permission granted"
                );
            }

        } catch (error) {

            console.log(
                "Audio permission denied"
            );

            setAudioAvailable(false);
        }


        // SCREEN

        if (
            navigator.mediaDevices
                .getDisplayMedia
        ) {

            setScreenAvailable(true);

        } else {

            setScreenAvailable(false);
        }
    };


    // =================================================
    // GET USER MEDIA
    // =================================================

    useEffect(() => {

        if (!askForUsername) {

            getUserMedia();
        }

    }, [
        video,
        audio,
        askForUsername
    ]);

    useEffect(() => {

    if (!askForUsername) {

        const timer = setTimeout(() => {

            if (!recognitionRef.current) {
                startListening();
            }

        }, 1500);

        return () => {
            clearTimeout(timer);
        };
    }

}, [askForUsername]);


    const getUserMedia = () => {

        if (
            (video && videoAvailable) ||
            (audio && audioAvailable)
        ) {

            navigator.mediaDevices
                .getUserMedia({

                    video:
                        video &&
                        videoAvailable,

                    audio:
                        audio &&
                        audioAvailable

                })

                .then(
                    getUserMediaSuccess
                )

                .catch(error => {

                    console.log(
                        "getUserMedia error:",
                        error
                    );
                });

        } else {

            try {

                if (
                    localVideoref.current
                        ?.srcObject
                ) {

                    localVideoref.current
                        .srcObject
                        .getTracks()
                        .forEach(track =>
                            track.stop()
                        );
                }

            } catch (error) {

                console.log(error);
            }
        }
    };


    // =================================================
    // USER MEDIA SUCCESS
    // =================================================

    const getUserMediaSuccess =
        (stream) => {

            try {

                if (window.localStream) {

                    window.localStream
                        .getTracks()
                        .forEach(track =>
                            track.stop()
                        );
                }

            } catch (error) {

                console.log(error);
            }


            window.localStream =
                stream;


            if (localVideoref.current) {

                localVideoref.current
                    .srcObject = stream;
            }


            for (
                let id in connections
            ) {

                if (
                    id ===
                    socketIdRef.current
                ) {

                    continue;
                }


                try {

                    connections[id]
                        .addStream(stream);


                    connections[id]
                        .createOffer()

                        .then(description => {

                            return connections[id]
                                .setLocalDescription(
                                    description
                                );

                        })

                        .then(() => {

                            socketRef.current
                                .emit(
                                    "signal",
                                    id,
                                    JSON.stringify({
                                        sdp:
                                            connections[id]
                                                .localDescription
                                    })
                                );

                        })

                        .catch(error => {

                            console.log(error);
                        });

                } catch (error) {

                    console.log(error);
                }
            }
        };


    // =================================================
    // SCREEN SHARE
    // =================================================

    useEffect(() => {

        if (screen) {

            getDisplayMedia();
        }

    }, [screen]);


    const getDisplayMedia = () => {

        if (
            !navigator.mediaDevices
                .getDisplayMedia
        ) {

            return;
        }


        navigator.mediaDevices
            .getDisplayMedia({

                video: true,
                audio: true

            })

            .then(
                getDisplayMediaSuccess
            )

            .catch(error => {

                console.log(
                    "Screen share error:",
                    error
                );

                setScreen(false);
            });
    };


    const getDisplayMediaSuccess =
        (stream) => {

            try {

                if (window.localStream) {

                    window.localStream
                        .getTracks()
                        .forEach(track =>
                            track.stop()
                        );
                }

            } catch (error) {

                console.log(error);
            }


            window.localStream =
                stream;


            if (localVideoref.current) {

                localVideoref.current
                    .srcObject = stream;
            }


            for (
                let id in connections
            ) {

                if (
                    id ===
                    socketIdRef.current
                ) {

                    continue;
                }


                try {

                    connections[id]
                        .addStream(stream);


                    connections[id]
                        .createOffer()

                        .then(description => {

                            return connections[id]
                                .setLocalDescription(
                                    description
                                );

                        })

                        .then(() => {

                            socketRef.current
                                .emit(
                                    "signal",
                                    id,
                                    JSON.stringify({
                                        sdp:
                                            connections[id]
                                                .localDescription
                                    })
                                );

                        });

                } catch (error) {

                    console.log(error);
                }
            }


            stream
                .getVideoTracks()[0]
                .onended = () => {

                    setScreen(false);

                    getUserMedia();
                };
        };


    // =================================================
    // SOCKET CONNECTION
    // =================================================

    const connectToSocketServer = () => {

        socketRef.current =
            io.connect(
                server_url,
                {
                    secure: false
                }
            );


        socketRef.current.on(
            "signal",
            gotMessageFromServer
        );


        socketRef.current.on(
            "connect",
            () => {

                console.log(
                    "Socket connected"
                );

             console.log(
            "JOINING SOCKET ROOM:",
            meetingIdRef.current
        ); 
         
                socketRef.current.emit(
                    "join-call",
                      meetingIdRef.current
                );


                socketIdRef.current =
                    socketRef.current.id;


                socketRef.current.on(
                    "chat-message",
                    addMessage
                );


                socketRef.current.on(
                    "user-left",
                    id => {

                        setVideos(prev =>
                            prev.filter(
                                video =>
                                    video.socketId !==
                                    id
                            )
                        );


                        delete connections[id];
                    }
                );


                socketRef.current.on(
                    "user-joined",
                    (id, clients) => {

                        clients.forEach(
                            socketListId => {

                                if (
                                    socketListId ===
                                    socketIdRef.current
                                ) {

                                    return;
                                }


                                connections[
                                    socketListId
                                ] =
                                    new RTCPeerConnection(
                                        peerConfigConnections
                                    );


                                // ICE

                                connections[
                                    socketListId
                                ]
                                    .onicecandidate =
                                    event => {

                                        if (
                                            event.candidate
                                        ) {

                                            socketRef.current
                                                .emit(
                                                    "signal",
                                                    socketListId,
                                                    JSON.stringify({
                                                        ice:
                                                            event.candidate
                                                    })
                                                );
                                        }
                                    };


                                // REMOTE VIDEO

                                connections[
                                    socketListId
                                ]
                                    .onaddstream =
                                    event => {

                                        const existingVideo =
                                            videoRef.current
                                                .find(
                                                    video =>
                                                        video.socketId ===
                                                        socketListId
                                                );


                                        if (
                                            existingVideo
                                        ) {

                                            setVideos(
                                                prev => {

                                                    const updated =
                                                        prev.map(
                                                            video =>
                                                                video.socketId ===
                                                                socketListId
                                                                    ? {
                                                                        ...video,
                                                                        stream:
                                                                            event.stream
                                                                    }
                                                                    : video
                                                        );


                                                    videoRef.current =
                                                        updated;


                                                    return updated;
                                                }
                                            );

                                        } else {

                                            const newVideo = {

                                                socketId:
                                                    socketListId,

                                                stream:
                                                    event.stream,

                                                autoplay:
                                                    true,

                                                playsinline:
                                                    true
                                            };


                                            setVideos(
                                                prev => {

                                                    const updated =
                                                        [
                                                            ...prev,
                                                            newVideo
                                                        ];


                                                    videoRef.current =
                                                        updated;


                                                    return updated;
                                                }
                                            );
                                        }
                                    };


                                // ADD LOCAL STREAM

                                if (
                                    window.localStream
                                ) {

                                    connections[
                                        socketListId
                                    ]
                                        .addStream(
                                            window.localStream
                                        );

                                } else {

                                    const blackSilence =
                                        new MediaStream([
                                            black(),
                                            silence()
                                        ]);


                                    window.localStream =
                                        blackSilence;


                                    connections[
                                        socketListId
                                    ]
                                        .addStream(
                                            blackSilence
                                        );
                                }
                            }
                        );


                        // CREATE OFFER

                        if (
                            id ===
                            socketIdRef.current
                        ) {

                            for (
                                let id2 in connections
                            ) {

                                if (
                                    id2 ===
                                    socketIdRef.current
                                ) {

                                    continue;
                                }


                                try {

                                    connections[id2]
                                        .createOffer()

                                        .then(
                                            description => {

                                                return connections[
                                                    id2
                                                ]
                                                    .setLocalDescription(
                                                        description
                                                    );
                                            }
                                        )

                                        .then(() => {

                                            socketRef.current
                                                .emit(
                                                    "signal",
                                                    id2,
                                                    JSON.stringify({
                                                        sdp:
                                                            connections[
                                                                id2
                                                            ]
                                                                .localDescription
                                                    })
                                                );
                                        });

                                } catch (error) {

                                    console.log(error);
                                }
                            }
                        }
                    }
                );
            }
        );
    };


    // =================================================
    // SIGNALING
    // =================================================

    const gotMessageFromServer = (
        fromId,
        message
    ) => {

        const signal =
            JSON.parse(message);


        if (
            fromId ===
            socketIdRef.current
        ) {

            return;
        }


        if (signal.sdp) {

            connections[fromId]
                ?.setRemoteDescription(
                    new RTCSessionDescription(
                        signal.sdp
                    )
                )

                .then(() => {

                    if (
                        signal.sdp.type ===
                        "offer"
                    ) {

                        return connections[
                            fromId
                        ]
                            ?.createAnswer();
                    }

                })

                .then(description => {

                    if (!description) {

                        return;
                    }


                    return connections[
                        fromId
                    ]
                        ?.setLocalDescription(
                            description
                        );

                })

                .then(() => {

                    if (
                        connections[fromId]
                            ?.localDescription
                    ) {

                        socketRef.current.emit(
                            "signal",
                            fromId,
                            JSON.stringify({
                                sdp:
                                    connections[
                                        fromId
                                    ]
                                        .localDescription
                            })
                        );
                    }

                })

                .catch(error => {

                    console.log(
                        "Signal error:",
                        error
                    );
                });
        }


        if (signal.ice) {

            connections[fromId]
                ?.addIceCandidate(
                    new RTCIceCandidate(
                        signal.ice
                    )
                )

                .catch(error => {

                    console.log(error);
                });
        }
    };


    // =================================================
    // SILENCE
    // =================================================

    const silence = () => {

        const ctx =
            new AudioContext();

        const oscillator =
            ctx.createOscillator();

        const dst =
            oscillator.connect(
                ctx.createMediaStreamDestination()
            );


        oscillator.start();

        ctx.resume();


        return Object.assign(
            dst.stream.getAudioTracks()[0],
            {
                enabled: false
            }
        );
    };


    // =================================================
    // BLACK SCREEN
    // =================================================

    const black = ({
        width = 640,
        height = 480
    } = {}) => {

        const canvas =
            Object.assign(
                document.createElement("canvas"),
                {
                    width,
                    height
                }
            );


        canvas
            .getContext("2d")
            .fillRect(
                0,
                0,
                width,
                height
            );


        const stream =
            canvas.captureStream();


        return Object.assign(
            stream.getVideoTracks()[0],
            {
                enabled: false
            }
        );
    };


    // =================================================
    // START AI LISTENING
    // =================================================

   const startListening = () => {

    console.log(
        "START LISTENING FUNCTION CALLED"
    );

    if (recognitionRef.current) {
        console.log(
            "Recognition already running"
        );
        return;
    }

   recognitionRef.current =
    startSpeechRecognition({

        onStart: () => {

            console.log("AI STARTED");

            setIsListening(true);
        },

       onResult: text => {

    console.log("AI TEXT:", text);
    console.log("SPEAKER:", username);

    const transcriptEntry = {
        speaker: username,
        text: text
    };

    // Store speaker-wise transcript locally
    transcriptRef.current = [
        ...transcriptRef.current,
        transcriptEntry
    ];

    // Send speaker-wise transcript to backend
    if (socketRef.current) {

        socketRef.current.emit(
            "meeting-transcript",
            transcriptEntry
        );
    }

    // Display transcript in UI
    setTranscript(prev =>
        prev
            ? `${prev}\n${username}: ${text}`
            : `${username}: ${text}`
    );
},

        onError: error => {

            console.log(
                "AI ERROR:",
                error
            );

            setIsListening(false);
        },

        onEnd: () => {

            console.log(
                "AI ENDED"
            );
            setIsListening(false);
    recognitionRef.current = null;
        }
    });
};

    // ANALYZE MEETING

const analyzeMeeting = async (transcriptToAnalyze) => {
    try {

        console.log("========== AI ANALYSIS ==========");
        console.log("MEETING ID:", meetingIdRef.current);
        console.log("USERNAME:", username);
        console.log(
            "TRANSCRIPT SENT TO AI:",
            transcriptToAnalyze
        );

        if (!transcriptToAnalyze?.trim()) {
            console.log("No transcript to analyze");
            return;
        }

        const response = await fetch(
            `${server_url}/api/v1/ai/analyze-meeting`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    meetingId: meetingIdRef.current,
                    username: username,
                    transcript: transcriptToAnalyze
                })
            }
        );

        console.log(
            "AI RESPONSE STATUS:",
            response.status
        );

        const data = await response.json();

        console.log(
            "AI NOTES:",
            data
        );

        if (!response.ok) {

            console.log(
                "AI analysis failed:",
                data
            );

            return;
        }

        // =========================================
        // AI ANALYSIS RESULT
        // =========================================

        const analysis = data.analysis;

        if (!analysis) {

            console.log(
                "AI analysis object missing"
            );

            return;
        }

        console.log(
            "SUMMARY:",
            analysis.summary
        );

        console.log(
            "KEY POINTS:",
            analysis.keyPoints
        );

        console.log(
            "ACTION ITEMS:",
            analysis.actionItems
        );

        console.log(
            "MY TASKS:",
            analysis.myTasks
        );


        // =========================================
        // SHOW AI RESULT IN MEETING UI
        // =========================================

        setSummary(
            analysis.summary || ""
        );

        setKeyPoints(
            Array.isArray(analysis.keyPoints)
                ? analysis.keyPoints
                : []
        );

        setActionItems(
            Array.isArray(analysis.actionItems)
                ? analysis.actionItems
                : []
        );

        setMyTasks(
            Array.isArray(analysis.myTasks)
                ? analysis.myTasks
                : []
        );


        console.log(
            "AI RESULT DISPLAYED SUCCESSFULLY"
        );

    } catch (error) {

        console.log(
            "Analyze meeting error:",
            error
        );
    }
};
   
    // VIDEO BUTTON
  

    const handleVideo = () => {

        setVideo(
            prev => !prev
        );
    };


    // =================================================
    // AUDIO BUTTON
    // =================================================

    const handleAudio = () => {

        setAudio(
            prev => !prev
        );
    };


    // =================================================
    // SCREEN BUTTON
    // =================================================

    const handleScreen = () => {

        setScreen(
            prev => !prev
        );
    };


// =================================================
// END CALL
// =================================================

const handleEndCall = async () => {

    console.log("END CALL CLICKED");

    try {

        console.log(
            "========== END CALL =========="
        );


        // =========================================
        // 1. STOP AI LISTENING FIRST
        // =========================================

        if (recognitionRef.current) {

            console.log(
                "Stopping speech recognition..."
            );

            stopSpeechRecognition(
                recognitionRef.current
            );

            recognitionRef.current = null;
        }

        setIsListening(false);


        // =========================================
        // 2. GET COMPLETE TRANSCRIPT
        // =========================================

        const finalTranscript =
            transcriptRef.current
                .filter(
                    entry =>
                        entry &&
                        entry.text &&
                        entry.text.trim()
                )
                .map(
                    entry =>
                        `${entry.speaker}: ${entry.text.trim()}`
                )
                .join("\n")
                .trim();


        console.log(
            "========== FINAL TRANSCRIPT =========="
        );

        console.log(finalTranscript);


        // =========================================
        // 3. SAVE TRANSCRIPT + END MEETING
        // =========================================

        console.log(
            "Ending meeting in database..."
        );

        const endResponse =
            await fetch(
                `${server_url}/api/v1/meetings/end`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        meetingId:
                            meetingIdRef.current,

                        username:
                            username,

                        transcript:
                            finalTranscript

                    })
                }
            );


        const endData =
            await endResponse.json();


        console.log(
            "MEETING END RESPONSE:",
            endData
        );


        if (!endResponse.ok) {

            console.log(
                "Meeting end failed:",
                endData
            );

            // Meeting end fail ho jaye
            // tab bhi local cleanup karenge

        }


        // =========================================
        // 4. AI ANALYSIS
        // =========================================

        if (finalTranscript) {

            console.log(
                "========== SENDING TO AI =========="
            );

            await analyzeMeeting(
                finalTranscript
            );

        } else {

            console.log(
                "No transcript available for AI"
            );
        }


        // =========================================
        // 5. STOP LOCAL VIDEO
        // =========================================

        if (
            localVideoref.current?.srcObject
        ) {

            localVideoref.current
                .srcObject
                .getTracks()
                .forEach(track => {
                    track.stop();
                });

            localVideoref.current.srcObject =
                null;
        }


        // =========================================
        // 6. STOP LOCAL STREAM
        // =========================================

        if (window.localStream) {

            window.localStream
                .getTracks()
                .forEach(track => {
                    track.stop();
                });

            window.localStream = null;
        }


        // =========================================
        // 7. CLOSE PEER CONNECTIONS
        // =========================================

        for (const id in connections) {

            try {

                connections[id].close();

            } catch (error) {

                console.log(
                    "Peer close error:",
                    error
                );
            }
        }

        connections = {};


        // =========================================
        // 8. DISCONNECT SOCKET
        // =========================================

        if (socketRef.current) {

            socketRef.current.disconnect();

            socketRef.current = null;
        }


        // =========================================
        // 9. FINAL LOG
        // =========================================

        console.log(
            "========== MEETING END COMPLETE =========="
        );

        console.log(
            "Meeting ended successfully."
        );


        // =========================================
        // 10. GO HOME
        // =========================================

        console.log(
            "Going to home..."
        );

        window.location.href =
            "/home";


    } catch (error) {

        console.log(
            "END CALL ERROR:",
            error
        );

        // Even if something fails,
        // stop local resources

        try {

            if (window.localStream) {

                window.localStream
                    .getTracks()
                    .forEach(track => {
                        track.stop();
                    });

                window.localStream = null;
            }

            if (socketRef.current) {

                socketRef.current.disconnect();

                socketRef.current = null;
            }

        } catch (cleanupError) {

            console.log(
                "Cleanup error:",
                cleanupError
            );
        }


        // User ko home bhejo

        window.location.href =
            "/home";
    }
};


  

    // =================================================
    // CHAT
    // =================================================

    const addMessage = (
        data,
        sender,
        socketIdSender
    ) => {

        setMessages(prev => [

            ...prev,

            {
                sender,
                data
            }

        ]);


        if (
            socketIdSender !==
            socketIdRef.current
        ) {

            setNewMessages(
                prev => prev + 1
            );
        }
    };


    const sendMessage = () => {

        if (
            !message.trim() ||
            !socketRef.current
        ) {

            return;
        }


        socketRef.current.emit(
            "chat-message",
            message,
            username
        );


        setMessage("");
    };


    const toggleChat = () => {

        setModal(
            prev => !prev
        );


        setNewMessages(0);
    };


    // =================================================
    // CONNECT
    // =================================================

 const connect = async () => {

    console.log("========== CONNECT CALLED ==========");


    const currentMeetingId = window.location.pathname
        .split("/")
        .filter(Boolean)
        .pop()
        ?.trim();
   meetingIdRef.current = currentMeetingId;

console.log(
    "ACTIVE MEETING ID:",
    meetingIdRef.current
);

    console.log("CURRENT URL:", window.location.href);
    console.log("CURRENT MEETING ID:", currentMeetingId);
    console.log("USERNAME:", username);

    if (!currentMeetingId) {
        alert("Meeting ID not found in URL");
        return;
    }

    if (!username.trim()) {
        alert("Please enter username");
        return;
    }

    try {

        const startUrl =
            `${server_url}/api/v1/meetings/start`;

        console.log("FINAL START URL:", startUrl);

        const response = await fetch(
            startUrl,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    meetingId: currentMeetingId,
                    username: username.trim()
                })
            }
        );

        console.log("RESPONSE STATUS:", response.status);

        const data = await response.json();

        console.log("MEETING START RESPONSE:", data);

        if (!response.ok) {
            alert(data.message || "Meeting start failed");
            return;
        }

        console.log("MEETING STARTED SUCCESSFULLY");

        setAskForUsername(false);

        connectToSocketServer();

    } catch (error) {

        console.log(
            "Start meeting API error:",
            error
        );

        alert("Failed to start meeting");
    }
};

    // =================================================
    // UI
    // =================================================

    return (

        <div
            className={
                styles.mainContainer
            }
        >

            {askForUsername ? (

                // =====================================
                // LOBBY
                // =====================================

                <div
                    className={
                        styles.lobbyContainer
                    }
                >

                    <h2>
                        Enter into Lobby
                    </h2>


                    <TextField
                        label="Username"
                        value={username}
                        onChange={e =>
                            setUsername(
                                e.target.value
                            )
                        }
                    />


                    <Button
                        variant="contained"
                        onClick={connect}
                    >
                        Connect
                    </Button>


                    <video
                        ref={localVideoref}
                        autoPlay
                        muted
                        className={
                            styles.lobbyVideo
                        }
                    />

                </div>

            ) : (

                // =====================================
                // MEETING
                // =====================================

                <div
                    className={
                        styles.meetVideoContainer
                    }
                >

                    {/* =================================
                        AI ASSISTANT
                    ================================= */}

                    <div
                        className={
                            styles.aiAssistant
                        }
                    >

                        <div
                            className={
                                styles.aiHeader
                            }
                        >

                            <h2>
                                🤖 AI Assistant
                            </h2>


                            <span
                                className={
                                    styles.aiStatus
                                }
                            >
                                ● Ready
                            </span>

                        </div>


                        {/* LISTENING */}

                        <div
                            className={
                                styles.aiSection
                            }
                        >

                            <h3>
                                🎙️ Listening
                            </h3>


                            <p>

                                {isListening

                                    ? "🟢 AI is listening..."

                                    : "🔴 AI is not listening"}

                            </p>

                        </div>


                        {/* TRANSCRIPT */}

                        <div
                            className={
                                styles.aiSection
                            }
                        >

                            <h3>
                                📝 Transcript
                            </h3>


                            <div
                                className={
                                    styles.aiBox
                                }
                            >

                                {transcript ||
                                    "AI is listening..."}

                            </div>

                        </div>


                        {/* SUMMARY */}

                        <div
                            className={
                                styles.aiSection
                            }
                        >

                            <h3>
                                📋 Summary
                            </h3>


                            <div
                                className={
                                    styles.aiBox
                                }
                            >

                                {summary ||
                                    "No summary yet..."}

                            </div>

                        </div>


                        {/* KEY POINTS */}

                        <div
                            className={
                                styles.aiSection
                            }
                        >

                            <h3>
                                🔑 Key Points
                            </h3>


                            <div
                                className={
                                    styles.aiBox
                                }
                            >

                                {keyPoints.length >
                                0 ? (

                                    <ul>

                                        {keyPoints.map(
                                            (
                                                point,
                                                index
                                            ) => (

                                                <li
                                                    key={
                                                        index
                                                    }
                                                >
                                                    {point}
                                                </li>

                                            )
                                        )}

                                    </ul>

                                ) : (

                                    "No key points yet..."

                                )}

                            </div>

                        </div>


                        {/* ACTION ITEMS */}

                        <div
                            className={
                                styles.aiSection
                            }
                        >

                            <h3>
                                ✅ Action Items
                            </h3>


                            <div
                                className={
                                    styles.aiBox
                                }
                            >

                                {actionItems.length >
                                0 ? (

                                    <ul>

                                        {actionItems.map(
                                            (
                                                item,
                                                index
                                            ) => (

                                                <li
                                                    key={
                                                        index
                                                    }
                                                >
                                                    {item}
                                                </li>

                                            )
                                        )}

                                    </ul>

                                ) : (

                                    "No action items yet..."

                                )}

                            </div>

                        </div>
                        {/* MY TASKS */}

<div className={styles.aiSection}>

    <h3>
        🎯 My Tasks
    </h3>

    <div className={styles.aiBox}>

        {myTasks.length > 0 ? (

            <ul>

                {myTasks.map(
                    (task, index) => (

                        <li key={index}>
                            {task}
                        </li>

                    )
                )}

            </ul>

        ) : (

            "No personal tasks assigned..."

        )}

    </div>

</div>

                    </div>


                    {/* =================================
                        MAIN VIDEO
                    ================================= */}

                    <div
                        className={
                            styles.meetingArea
                        }
                    >

                        {/* LOCAL VIDEO */}

                        <video
                            className={
                                styles.meetUserVideo
                            }
                            ref={
                                localVideoref
                            }
                            autoPlay
                            muted
                        />


                        {/* REMOTE VIDEOS */}

                        <div
                            className={
                                styles.conferenceView
                            }
                        >

                            {videos.map(
                                video => (

                                    <div
                                        key={
                                            video.socketId
                                        }
                                        className={
                                            styles.remoteVideo
                                        }
                                    >

                                        <video
                                            data-socket={
                                                video.socketId
                                            }

                                            ref={ref => {

                                                if (
                                                    ref &&
                                                    video.stream
                                                ) {

                                                    ref.srcObject =
                                                        video.stream;
                                                }

                                            }}

                                            autoPlay
                                            playsInline
                                        />

                                    </div>

                                )
                            )}

                        </div>

                    </div>


                    {/* =================================
                        CHAT
                    ================================= */}

                    {showModal && (

                        <div
                            className={
                                styles.chatRoom
                            }
                        >

                            <div
                                className={
                                    styles.chatContainer
                                }
                            >

                                <div
                                    className={
                                        styles.chatHeader
                                    }
                                >

                                    <h2>
                                        Chat
                                    </h2>


                                    <button
                                        onClick={
                                            toggleChat
                                        }
                                    >
                                        ✕
                                    </button>

                                </div>


                                <div
                                    className={
                                        styles.chattingDisplay
                                    }
                                >

                                    {messages.length ===
                                    0 ? (

                                        <p>
                                            No Messages Yet
                                        </p>

                                    ) : (

                                        messages.map(
                                            (
                                                item,
                                                index
                                            ) => (

                                                <div
                                                    key={
                                                        index
                                                    }
                                                    className={
                                                        styles.chatMessage
                                                    }
                                                >

                                                    <strong>
                                                        {
                                                            item.sender
                                                        }
                                                    </strong>


                                                    <p>
                                                        {
                                                            item.data
                                                        }
                                                    </p>

                                                </div>

                                            )
                                        )

                                    )}

                                </div>


                                <div
                                    className={
                                        styles.chattingArea
                                    }
                                >

                                    <TextField
                                        fullWidth
                                        value={
                                            message
                                        }
                                        onChange={e =>
                                            setMessage(
                                                e.target.value
                                            )
                                        }
                                        label="Enter Your chat"

                                        onKeyDown={e => {

                                            if (
                                                e.key ===
                                                "Enter"
                                            ) {

                                                sendMessage();
                                            }

                                        }}
                                    />


                                    <Button
                                        variant="contained"
                                        onClick={
                                            sendMessage
                                        }
                                    >
                                        SEND
                                    </Button>

                                </div>

                            </div>

                        </div>

                    )}


                    {/* =================================
                        BOTTOM CONTROLS
                    ================================= */}

                    <div
                        className={
                            styles.buttonContainers
                        }
                    >

                        {/* VIDEO */}

                        <IconButton
                            onClick={
                                handleVideo
                            }
                            className={
                                styles.controlButton
                            }
                        >

                            {video ? (

                                <VideocamIcon />

                            ) : (

                                <VideocamOffIcon />

                            )}

                        </IconButton>


                        {/* END CALL */}

                        <IconButton
                            onClick={
                                handleEndCall
                            }
                            className={
                                styles.endCallButton
                            }
                        >

                            <CallEndIcon />

                        </IconButton>


                        {/* AUDIO */}

                        <IconButton
                            onClick={
                                handleAudio
                            }
                            className={
                                styles.controlButton
                            }
                        >

                            {audio ? (

                                <MicIcon />

                            ) : (

                                <MicOffIcon />

                            )}

                        </IconButton>


                        {/* SCREEN SHARE */}

                        {screenAvailable && (

                            <IconButton
                                onClick={
                                    handleScreen
                                }
                                className={
                                    styles.controlButton
                                }
                            >

                                {screen ? (

                                    <StopScreenShareIcon />

                                ) : (

                                    <ScreenShareIcon />

                                )}

                            </IconButton>

                        )}


                        {/* CHAT */}

                        <Badge
                            badgeContent={
                                newMessages
                            }
                            color="error"
                        >

                            <IconButton
                                onClick={
                                    toggleChat
                                }
                                className={
                                    styles.controlButton
                                }
                            >

                                <ChatIcon />

                            </IconButton>

                        </Badge>

                    </div>

                </div>

            )}

        </div>
    );
}