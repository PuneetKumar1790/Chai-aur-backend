import { Router } from "express";  //through express
import { loginUser } from "../controllers/user.controller.js";
import { logoutUser, registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router()
router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverimage",
            maxCount:1
        }
    ]),
    registerUser)
    
    router.route("/login").post(loginUser)


    // secured routes 
    router.route("/logout").post(verifyJWT,logoutUser) //before running logoutuser method we run VerifyJWT method
export default router
