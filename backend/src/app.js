import dns from "node:dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

import express from 'express';
import {createServer} from "node:http";
import {Server} from "socket.io";
import cors from "cors";
import mongoose from "mongoose"
import { connectToSocket } from "./controllers/socketManager.js";
import userRoute from "./routes/usersRoute.js"
const app = express();
const server = createServer(app);
const io = connectToSocket(server)

app.set("port", process.env.PORT || 8000)
app.use(cors())
app.use(express.json({limit: "40kb"}))
app.use(express.urlencoded({limit: "40kb", extended: true}))

app.use("/api/v1/users", userRoute)

app.get("/home", async(req, res)=>{
   console.log("hello")
})

const start = async() =>{

    app.set("mongo_user")
    const connectionDb = await mongoose.connect("mongodb+srv://divya123:zoomclone@apnavideocall.duek6pz.mongodb.net/")
    console.log(`MONGO connectes db host : ${connectionDb.connection.host}`)
    server.listen(app.get("port"), ()=>{
        console.log("listen on 8000")
    })
    
}

start()