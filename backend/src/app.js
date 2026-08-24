import "dotenv/config";

import dns from "node:dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

import express from "express";
import { createServer } from "node:http";
import cors from "cors";
import mongoose from "mongoose";

import { connectToSocket } from "./controllers/socketManager.js";
import userRoute from "./routes/usersRoute.js";
import meetingRoute from "./routes/meetingRoute.js";
import aiRoute from "./routes/aiRoute.js";

const app = express();
const server = createServer(app);
const io = connectToSocket(server);

app.set("port", process.env.PORT || 8000);

app.use(cors());
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

app.use("/api/v1/users", userRoute);
app.use("/api/v1/meetings", meetingRoute);
app.use("/api/v1/ai", aiRoute);


app.get("/home", async (req, res) => {
    res.send("Server is running");
});

const start = async () => {
    try {
        const connectionDb = await mongoose.connect(process.env.MONGODB_URI);

        console.log(
            `MONGO connected db host: ${connectionDb.connection.host}`
        );

        server.listen(app.get("port"), () => {
            console.log(`Server listening on ${app.get("port")}`);
        });

    } catch (error) {
        console.log("MongoDB connection error:", error);
    }
};

start();