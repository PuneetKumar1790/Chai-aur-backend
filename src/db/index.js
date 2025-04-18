import mongoose from "mongoose";
// import {DB_NAME} from"../constants.js"
//async await ata hi ata hai because it takes time 
const connectDB=async()=>{
    try { //using variable instance because moongose return object
        const connectionInstance=await mongoose.connect(`${process.env.MONGODB_URI}`)
        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("MONGODB connection error ",error);
        process.exit(1)
    }
}

export default connectDB