import mongoose from "mongoose";

export const connectDB = async () => {
    try{
        console.log("Connecting to MongoDB");
        const MONGODB_URI = process.env.MONGODB_URI;
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB");
        
    } catch (error){
        console.log("Error While Connecting to MongoDB");
        
    }
};