import mongoose from "mongoose";

const meetingSchema = new mongoose.Schema(
    {
        meetingId: {
            type: String,
            required: true,
           
        },

         username: {
            type: String,
            default: ""
        },

        host: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        participants: [
            {
                username: String,
                userId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User"
                }
            }
        ],

        startTime: {
            type: Date,
              default: Date.now
        },

        endTime: {
            type: Date
        },

        transcript: {
            type: String,
            default: ""
        },

        summary: {
            type: String,
            default: ""
        },

        keyPoints: [
            {
                type: String
            }
        ],

        decisions: [
            {
                type: String
            }
        ],

        actionItems: [
            {
                type: String
            }
        ],
         
        myTasks: {
    type: [String],
    default: []
},

        aiChat: [
            {
                question: String,
                answer: String,
                createdAt: {
                    type: Date,
                    default: Date.now
                }
            }
        ]
    },
    {
        timestamps: true
    }
);

const LiveMeeting =
    mongoose.models.LiveMeeting ||
    mongoose.model("LiveMeeting", meetingSchema);

export default LiveMeeting;