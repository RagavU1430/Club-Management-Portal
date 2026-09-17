import { Router } from "express";
import { asyncHandler } from "../utils/http.js";
import * as authCtrl from "../controllers/auth.js";

const router = Router();

router.post("/login", asyncHandler(authCtrl.login));
router.get("/me", asyncHandler(authCtrl.me));
router.post("/change-password", asyncHandler(authCtrl.changePassword));
router.post("/logout", asyncHandler(authCtrl.logout));

export default router;
