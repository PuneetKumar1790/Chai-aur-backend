import mongoose,{Schema} from "mongoose";   
import jwt from "jsonwebtoken" 
import bcrypt from "bcrypt" 
const userSchema=new Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true //help in searching
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
    },
    fullname:{
        type:String,
        required:true,
        index:true,
        trim:true,
    },
    avatar:{
        type:String,//url from cloudanary
        required:true,

    },
    coverImage:{
        type:String,// url from cloudanary
    },
    watchHistory:[
        {
            type:Schema.Types.ObjectId,
            ref:"Video"
        },
    ],
    password:{
        type:String,
        required:[true,"Password is required"],//custom message

    },
    refreshToken:{
        type:String,

    }
},{timestamps:true})
//PRE HOOK
userSchema.pre("save",async function (next){
    if(!this.isModified("password")) return next //paswrd only modified when user will chage or set 
    this.password=await bcrypt.hash(this.password,10)//hashing through bcrypt for paswrd takes time
    next()
})//not use arrow function here 
userSchema.methods.isPasswordCorrect=async function(password){ //setting user defined method
    return await bcrypt.compare(password,this.password) // true or false 

}
userSchema.methods.generateAccessToken=function(){
    return jwt.sign({     //using payload
        _id:this._id,
        email:this.email,
        username:this.username,
        fullname:this.fullname // key : coming from database 
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn:process.env.ACCESS_TOKEN_EXPIRY
    }
)
}
//JWT TOKEN used for encrypt paswrd through algorithms
userSchema.methods.generateRefreshToken=function(){
    return jwt.sign({     //using payload
        _id:this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    }
)
}
export const User =mongoose.model("User",userSchema)