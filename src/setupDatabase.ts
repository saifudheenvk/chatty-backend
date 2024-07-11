import mongoose from "mongoose";
import { config } from "./config";


export default () => {
    const connect = () => {
        mongoose.connect(config.DATABASE_URL!).then(()=>{
            console.log("Successfully connected to database")
        }).catch((err)=>{
                console.log("Failed to connect DB with error" + err)
                return process.exit()
        })
    }
    connect();

    mongoose.connection.on("disconnected", connect)
}