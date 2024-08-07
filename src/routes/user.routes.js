import { Router } from "express";  //through express
import { registerUser } from "../controllers/user.controller.js";
const router = Router()
router.route("/register").post(registerUser)
export default router
