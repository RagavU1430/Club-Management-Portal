import { Router } from "express";
import { asyncHandler } from "../utils/http.js";
import * as teamCtrl from "../controllers/team.js";

const router = Router();

router.get("/", asyncHandler(teamCtrl.list));
router.get("/roles", asyncHandler(teamCtrl.roles));
router.post("/", asyncHandler(teamCtrl.create));
router.put("/:id", asyncHandler(teamCtrl.update));
router.delete("/:id", asyncHandler(teamCtrl.remove));

export default router;
