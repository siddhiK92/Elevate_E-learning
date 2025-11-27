import { Review } from "../models/review.model.js";
import { Course } from "../models/course.model.js";
import { CoursePurchase } from "../models/coursePurchase.model.js";

export const createReview = async (req, res) => {
  try {
    const { courseId, rating, comment } = req.body;
    const userId = req.id;

    // Check if user has purchased the course
    const purchase = await CoursePurchase.findOne({ userId, courseId, status: 'completed' });
    if (!purchase) {
      return res.status(403).json({
        success: false,
        message: "You must purchase the course to leave a review."
      });
    }

    // Check if user already reviewed
    const existingReview = await Review.findOne({ userId, courseId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this course."
      });
    }

    const review = await Review.create({
      userId,
      courseId,
      rating,
      comment
    });

    // Update average rating for course
    await updateAverageRating(courseId);

    return res.status(201).json({
      success: true,
      message: "Review submitted successfully.",
      review
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit review"
    });
  }
};

export const getReviewsForCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const reviews = await Review.find({ courseId }).populate('userId', 'name photoUrl').sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      reviews
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch reviews"
    });
  }
};

export const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.id;

    const review = await Review.findOneAndUpdate(
      { _id: reviewId, userId },
      { rating, comment },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found or not authorized"
      });
    }

    // Update average rating
    await updateAverageRating(review.courseId);

    return res.status(200).json({
      success: true,
      message: "Review updated successfully.",
      review
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to update review"
    });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.id;

    const review = await Review.findOneAndDelete({ _id: reviewId, userId });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found or not authorized"
      });
    }

    // Update average rating
    await updateAverageRating(review.courseId);

    return res.status(200).json({
      success: true,
      message: "Review deleted successfully."
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete review"
    });
  }
};

// Helper function to update average rating
const updateAverageRating = async (courseId) => {
  const reviews = await Review.find({ courseId });
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

  await Course.findByIdAndUpdate(courseId, { averageRating });
};
