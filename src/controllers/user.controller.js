import { asyncHandler } from "../utils/asyncHandler.js";
import{ApiError} from "/workspaces/Chai-aur-backend/src/utils/ApiError.js"
import {User} from "..models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { Apiresponse } from "../utils/Apiresponse.js";
//higher order function
const registerUser=asyncHandler( async(req,res)=>{
    //get user details from frontend
    //validation--not empty
    //check if already exists :username,email
    //check for images,check for avator
    //upload them to cloudinary
    //create user object -create entry in db
    //remove paswrd and refresh token field from response 
    //check for user creation 
    //return response
    
    
    const {fullname,email,username,password} =req.body
    console.log("email: ",email);      //user detail from frontend 
               // for data coming from json and form use req.body
    // if (fullname===""){throw new ApiError(400),"FUll name is required";}  
    if ([fullname,email,username,password].some((field)=>     //checking on more than one
        field?.trim()==="")
    ) {
        throw new ApiError(400,"All fields are required");
        
    } 
    const existedUser=User.findOne({
        $or:[{username},{email}]
    })        //checking multiple things
    if (existedUser){
        throw new ApiError(409,"user with email or username already exists");
        
    }
    const avatarLocalpath=req.files?.avatar[0]?.path  //receving file from multer // AT server not from clodi.
    const coverImageLocalPath=req.files?.coverImage[0]?.path
    if (!avatarLocalpath) {
        throw new ApiError(400,"Avatar file is required");
        
    }
    const avatar = await uploadOnCloudinary(avatarLocalpath)
    const coverImage=await uploadOnCloudinary(coverImageLocalPath)
    if (!avatar) {
        throw new ApiError(400,"Avatar file is required");
    }

    const user = await User.create({fullname,      //create entry in DB 
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username:username.toLowwerCase()       //checking coverimage is available or not on cloudi.
    })
    const createdUser= await user.findById(user._id).select(           // Checking user is created or not by userid
            "-password -refreshToken"  //removal of password and refresh token 
    )
    if (createdUser) {
        throw new ApiError(500,"Something went wrong while registering the user");
        
    }
    return res.ststus(201).json(
        new Apiresponse(200,createdUser,"User registered successfully")
    )
})

export{registerUser}