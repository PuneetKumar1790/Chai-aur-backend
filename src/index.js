// require('dotenv').config({path:'./env'})
import dotenv from 'dotenv'
import connectDB from "./db/index.js";
dotenv.config({
    path:'./env'
})

connectDB()//async(asynchronas) return promise
.then(()=>{
    app.listen(process.env.PORT||8000,()=>{
        console.log(`Server is running at PORT :${process.env.PORT}`)

    })
})
.catch(err=>{
    console.log("MonGO db connection failed!!!!",err)
})







/*
import express from "express"
const app=express()
// using IIFE using function imediately
(async ()=>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error",()=>{
            console.log("ERR",error);
            throw error
        })
        app.listen(process.env.PORT,()=>{
            console.log(`App is listening on port ${process.env.PORT}`);
        })
    } catch (error) {
        console.log("ERROR",error);
        throw err
    }
})()      */