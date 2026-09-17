import { Router } from "express";
import { asyncHandler } from "../utils/http.js";
import * as eventsCtrl from "../controllers/events.js";

const router = Router();

router.get("/", asyncHandler(eventsCtrl.list));
router.get("/stats", asyncHandler(eventsCtrl.stats));
router.get("/export.csv", asyncHandler(eventsCtrl.exportCSV));
router.get("/:idOrSlug", asyncHandler(eventsCtrl.getOne));
router.post("/", asyncHandler(eventsCtrl.create));
router.put("/:id", asyncHandler(eventsCtrl.update));
router.delete("/:id", asyncHandler(eventsCtrl.remove));

export default router;
