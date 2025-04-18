import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "/workspaces/Chai-aur-backend/src/utils/ApiError.js"
import { User } from "/workspaces/Chai-aur-backend/src/models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { Apiresponse } from "../utils/Apiresponse.js";
import jwt from "jsonwebtoken"
//higher order function

const generateAccessAndRefereshTokens = async (userId) => {  // no need of use async handler because there is no use of web request (for internal use )
    try {
        const user = await User.findById(userId)  // giving key & value pair thats why user is objet 
        const accessToken = user.generateAccessToken() //generating access 
        const refreshToken = user.generateRefreshToken()  // and refresh token // refresh token saves in DB 

        user.refreshToken = refreshToken  // adding value in object user 
        await user.save({ validateBeforeSave: false }) // validateBeforeSave : use no validation direct save it 
        // because when we use save () it kickin moongoose  paswrd must be true 
        return { accessToken, refreshToken }


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}


const registerUser = asyncHandler(async (req, res) => {
    //get user details from frontend
    //validation--not empty
    //check if already exists :username,email
    //check for images,check for avator
    //upload them to cloudinary
    //create user object -create entry in db
    //remove paswrd and refresh token field from response 
    //check for user creation 
    //return response


    const { fullname, email, username, password } = req.body
    console.log("email: ", email);      //user detail from frontend 
    // for data coming from json and form use req.body
    // if (fullname===""){throw new ApiError(400),"FUll name is required";}  
    if ([fullname, email, username, password].some((field) =>     //checking on more than one
        field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required");

    }
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })        //checking multiple things
    if (existedUser) {
        throw new ApiError(409, "user with email or username already exists");

    }
    const avatarLocalpath = req.files?.avatar[0]?.path  //receving file from multer // AT server not from clodi.
    // const coverImageLocalPath=req.files?.coverImage[0]?.path
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    if (!avatarLocalpath) {
        throw new ApiError(400, "Avatar file is required");

    }
    const avatar = await uploadOnCloudinary(avatarLocalpath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if (!avatar) {
        throw new ApiError(400, "Avatar file is required");
    }

    const user = await User.create({
        fullname,      //create entry in DB 
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()       //checking coverimage is available or not on cloudi.
    })
    const createdUser = await User.findById(user._id).select(           // Checking user is created or not by userid
        "-password -refreshToken"  //removal of password and refresh token 
    )
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");

    }
    return res.status(201).json(
        new Apiresponse(200, createdUser, "User registered successfully")
    )
})

// LOGIN 
const loginUser = asyncHandler(async (req, res) => {
    // req body -> data
    // username or email     
    //find the user
    //password check
    //generate both access and referesh token and send to user 
    //send tokens through cookie

    const { email, username, password } = req.body
    console.log(email);

    if (!username && !email) {  //Only one of them is needed
        throw new ApiError(400, "username or email is required")
    }

    // Here is an alternative of above code based on logic discussed in video:
    // if (!(username || email)) {
    //     throw new ApiError(400, "username or email is required")

    // }
    // User capital one is available through mongo db moongoose 
    const user = await User.findOne({
        $or: [{ username }, { email }]  // mongo db query 
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)  //method 

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    //for sending cookies options are designed options are just object
    const options = {
        httpOnly: true,  //Now they are modifiable through 
        secure: true // server 
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options) // setting cookies
        .cookie("refreshToken", refreshToken, options)
        .json(  // sending json rsponse because if user wants to save access and refresh token at local storage or user develop mobile application because there 
            // is no cookie set
            new Apiresponse(
                200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "User logged In Successfully"
            )
        )

})

//Log Out user 
const logoutUser = asyncHandler(async (req, res) => {    // for logout remove refresh token from DB and cookies 
    await User.findByIdAndUpdate(
        req.user._id, // req.user is accessible through verify JWT method 
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new Apiresponse(200, {}, "User logged Out"))
})


//Creating Endpoint
const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshAccessToken || req.body.refreshAccessToken // 2nd one is for app
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorizied request ");
    }
    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET
        )
        const user = await User.findById(decodedToken?._id)
        if (!user) {
            throw new ApiError(401, "Invalid refresh token ");
        }
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used");

        }
        const options = {
            httpOnly: true,
            secure: true
        }
        const { accesstoken, newRefreshToken } = await generateAccessAndRefereshTokens(user._id)
        return res
            .status(200)
            .cookie("accesstoken", accesstoken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new Apiresponse(
                    200,
                    { accesstoken, refreshToken: newRefreshToken },
                    "Access token refreshed")
            )
    } catch (error) {
        throw new ApiError(401, "Invalid refresh token ");

    }
})
const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body
    const user = await user.findById(req.user?._id)  //db process takes time 
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)  //user method is async therefore use await here 
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid Old Password ");

    }
    user.password = newPassword
    await user.save({ validateBeforeSave: false })  //this called pre hook
    return res
        .status(200)
        .json(new Apiresponse(200, {}, "password changed successfully"))
    const getCurrentUser = async(async (req, res) => {
        return res
            .status(200)
            .json(new ApiResponse(200, req.user, "Current User fetched successfully"))

    })
    const updateAccountDetails = asyncHandler(async (req, res) => {
        const { fullname, email } = req.body
        if (!fullname || !email) {
            throw new ApiError(400, "All fields are required");

        }
        const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set: {
                    fullname, //work same as fullname:fullname
                    email: email
                }
            },
            { new: true } // return value after update 
        ).select("-password")
    return res
            .status(200)
            .json(new ApiResponse(200, user, "Account details updated successfully "))
    })
    const updateUserAvatar = asyncHandler(async (req, res) => {
        const avatarLocalPath = req.file?.path// access of file through multer 
        if (!avatarLocalPath) {
            throw new ApiError(400, "Avatar file is missing");
        }
        const avatar = await uploadOnCloudinary(avatarLocalPath)
        if (!avatar.url) {
            throw new ApiError(400, "Error while uploading on Avatar");
        }
        const user = User.findByIdAndUpdate(
            req.user?._id,
            {
                $set: {
                    avatar: avatar.url
                }
            },
            { new: true } // return value after update 
        ).select("-password")
        return res
            .status(200)
            .json(
                new Apiresponse(200, user, "Avatar updated successfully")
            )
    })

    const updateUserCoverImage = asyncHandler(async (req, res) => {
        const coverImageLocalPath = req.file?.path// access of file through multer //file for single and files for multiple
        if (!coverImageLocalPath) {
            throw new ApiError(400, "CoverImage file is missing");
        }
        const coverImage = await uploadOnCloudinary(coverImageLocalPath)
        if (!coverImage.url) {
            throw new ApiError(400, "Error while uploading on Coverimage");
        }
        const user = User.findByIdAndUpdate(
            req.user?._id,
            {
                $set: {
                    coverImage: coverImage.url
                }
            },
            { new: true } // return value after update 
        ).select("-password")
        return res
            .status(200)
            .json(
                new Apiresponse(200, user, "Cover Image updated successfully")
            )
    })
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
}