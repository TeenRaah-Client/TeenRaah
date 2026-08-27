import express from "express";
import { protect, attachUserIfPresent } from "../middleware/auth.js";
import { chatLimiter, imageGenLimiter } from "../middleware/rateLimiter.js";
import { streamChat, generateConceptImage } from "../controllers/chatController.js";

const router = express.Router();

// Guests can chat (product Q&A, general help) — attachUserIfPresent only
// unlocks the order-tracking tool and never blocks an anonymous visitor.
router.post("/stream", chatLimiter, attachUserIfPresent, streamChat);

// Costs real money per call (see chatController.js) — logged-in only, and
// rate-limited on top of the persistent per-user daily cap.
router.post("/generate-image", imageGenLimiter, protect, generateConceptImage);

export default router;
