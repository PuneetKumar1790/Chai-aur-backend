import { asyncHandler } from "../utils/asyncHandler.js";
//higher order function
const registerUser=asyncHandler( async(req,res)=>{
    res.status(200).json({
        message:"ok"
    })
})

export{registerUser}