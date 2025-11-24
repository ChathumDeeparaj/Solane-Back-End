import mongoose from "mongoose";

export const connectDB = async () => {
    try{
        console.log("Connecting to MongoDB")

        await mongoose.connect("mongodb+srv://deeparajchathum_db_user:DTEUcglERJZ5J6kT@cluster0.0krm1a4.mongodb.net/?appName=Cluster0");
        console.log("Connected to MongoDB");
        
    } catch (error){
        console.log("Error While Connecting to MongoDB");
        
    }
};