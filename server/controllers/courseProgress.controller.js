import { generateCertificate } from "../utils/certificateGenerator.js";
import { v4 as uuidv4 } from "uuid";
import { Course } from "../models/course.model.js";
import { User } from "../models/user.model.js";
import { CourseProgress } from "../models/courseProgress.js";

export const markAsCompleted = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.id; // assumes auth middleware sets req.id

    const course = await Course.findById(courseId);
    const user = await User.findById(userId);

    if (!course || !user) {
      return res.status(404).json({ message: "User or course not found" });
    }

    const certificateId = uuidv4();
    const filePath = await generateCertificate(
      user.fullName || user.name,
      course.courseTitle || course.title,
      certificateId
    );

    const certificateUrl = `${req.protocol}://${req.get("host")}/certificates/${certificateId}.pdf`;

    // Update course progress
    let progress = await CourseProgress.findOne({ userId, courseId });
    if (!progress) {
      progress = new CourseProgress({ userId, courseId, lectureProgress: [] });
    }
    progress.completed = true;
    progress.certificate = {
      id: certificateId,
      url: certificateUrl,
    };
    await progress.save();

    return res.status(200).json({
      message: "Course marked as completed successfully!",
      certificate: {
        id: certificateId,
        url: certificateUrl,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error generating certificate" });
  }
};

export const getCourseProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.id;

    const course = await Course.findById(courseId).populate("lectures");
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const progress = await CourseProgress.findOne({ userId, courseId });

    if (!progress) {
      return res.json({
        data: {
          courseDetails: course,
          progress: [],
          completed: false,
        }
      });
    }

    res.json({
      data: {
        courseDetails: course,
        progress: progress.lectureProgress,
        completed: progress.completed,
        certificate: progress.completed ? progress.certificate : null,
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching progress" });
  }
};

export const updateLectureProgress = async (req, res) => {
  try {
    const { courseId, lectureId } = req.params;
    const userId = req.id;

    let progress = await CourseProgress.findOne({ userId, courseId });

    if (!progress) {
      progress = new CourseProgress({ userId, courseId, lectureProgress: [] });
    }

    const lecture = progress.lectureProgress.find(l => l.lectureId === lectureId);

    if (!lecture) {
      progress.lectureProgress.push({ lectureId, viewed: true });
    } else {
      lecture.viewed = true;
    }

    await progress.save();

    res.json({ message: "Progress updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating progress" });
  }
};

export const markAsInCompleted = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.id;

    const progress = await CourseProgress.findOne({ userId, courseId });

    if (!progress) {
      return res.status(404).json({ message: "Progress not found" });
    }

    progress.completed = false;

    await progress.save();

    res.json({ message: "Marked as incomplete" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error marking as incomplete" });
  }
};
