import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { createReview, getReviewsForCourse, updateReview, deleteReview } from "../controllers/review.controller.js";

const router = express.Router();

router.route("/create").post(isAuthenticated, createReview);
router.route("/:courseId").get(getReviewsForCourse);
router.route("/:reviewId").put(isAuthenticated, updateReview);
router.route("/:reviewId").delete(isAuthenticated, deleteReview);

export default router;
