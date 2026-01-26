import { Course } from "../models/course.model.js";
import { Lecture } from "../models/lecture.model.js";
import { uploadMedia, uploadImage, deleteMediaFromCloudinary } from "../utils/cloudinary.js";
import { getCloudinaryPublicId } from "../utils/getCloudinaryPublicId.js";
import CoursePurchase from "../models/coursePurchase.model.js";

/* =====================================================
    👨‍🏫 COURSE MANAGEMENT
===================================================== */

export const createCourse = async (req, res) => {
  try {
    const { courseTitle, category, coursePrice } = req.body;
    if (!courseTitle || !category || coursePrice === undefined) {
      return res.status(400).json({ message: "Title, category & price required" });
    }
    const course = await Course.create({
      courseTitle,
      category,
      coursePrice,
      creator: req.user._id,
    });
    res.status(201).json({ success: true, course });
  } catch (err) {
    res.status(500).json({ message: "Create course failed" });
  }
};

export const getCreatorCourses = async (req, res) => {
  try {
    const courses = await Course.find({ creator: req.user._id }).populate("lectures");
    res.json({ success: true, courses });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch courses" });
  }
};

export const editCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (course.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not allowed" });
    }
    if (req.body?.courseLevel) {
      req.body.courseLevel = req.body.courseLevel.charAt(0).toUpperCase() + req.body.courseLevel.slice(1).toLowerCase();
    }
    Object.assign(course, req.body || {});
    await course.save();
    res.json({ success: true, course });
  } catch (error) {
    res.status(500).json({ message: "Failed to update course" });
  }
};

/* =====================================================
    ☁️ MEDIA (THUMBNAIL & VIDEO)
===================================================== */

export const uploadCourseThumbnail = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (course.creator.toString() !== req.user._id.toString()) return res.status(403).json({ message: "Not allowed" });
    if (!req.file) return res.status(400).json({ message: "No thumbnail provided" });

    if (course.courseThumbnail) {
      const oldPublicId = getCloudinaryPublicId(course.courseThumbnail);
      if (oldPublicId) await deleteMediaFromCloudinary(oldPublicId, "image");
    }

    const result = await uploadImage(req.file.buffer, "course-thumbnails");
    course.courseThumbnail = result.secure_url;
    await course.save();
    res.json({ success: true, thumbnail: result.secure_url });
  } catch (error) {
    res.status(500).json({ message: "Thumbnail upload failed" });
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate("lectures");
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (course.creator.toString() !== req.user._id.toString()) return res.status(403).json({ message: "Not allowed" });

    if (course.courseThumbnail) {
      const thumbId = getCloudinaryPublicId(course.courseThumbnail);
      if (thumbId) await deleteMediaFromCloudinary(thumbId, "image");
    }

    for (const lecture of course.lectures) {
      if (lecture.publicId) await deleteMediaFromCloudinary(lecture.publicId, "video");
      await Lecture.findByIdAndDelete(lecture._id);
    }

    await CoursePurchase.updateMany({ course: course._id }, { $set: { isCourseDeleted: true } });
    await Course.findByIdAndDelete(course._id);
    res.json({ success: true, message: "Course deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete course" });
  }
};

/* =====================================================
    📖 LECTURES (Added missing exports)
===================================================== */

// export const createLecture = async (req, res) => {
//   try {
//     const course = await Course.findById(req.params.id);
//     if (!course) return res.status(404).json({ message: "Course not found" });
//     const lecture = await Lecture.create({ lectureTitle: req.body.lectureTitle, course: course._id });
//     course.lectures.push(lecture._id);
//     await course.save();
//     res.status(201).json({ success: true, lecture });
//   } catch (err) {
//     res.status(500).json({ message: "Failed to create lecture" });
//   }
// };

export const createLecture = async (req, res) => {
  try {
    const { lectureTitle, videoId, isPreviewFree } = req.body;
    const { id } = req.params;

    const course = await Course.findById(id);
    if (!course)
      return res.status(404).json({ message: "Course not found" });

    const lecture = await Lecture.create({
      lectureTitle,
      videoId,
      isPreviewFree,
      course: id,
    });

    course.lectures.push(lecture._id);
    await course.save();

    res.status(201).json({
      success: true,
      lecture,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
};


// 🔥 YEH WAPAS ADD KIYA (Fixes your SyntaxError)
export const getCourseLecture = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate("lectures");
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json({ success: true, lectures: course.lectures });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch lectures" });
  }
};

// 🔥 YEH BHI IMPORTANT HAI
export const getLectureById = async (req, res) => {
  try {
    const lecture = await Lecture.findById(req.params.lectureId);
    if (!lecture) return res.status(404).json({ message: "Lecture not found" });
    res.json({ success: true, lecture });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch lecture" });
  }
};

export const editLecture = async (req, res) => {
  try {
    const { lectureTitle, isPreviewFree, videoId } = req.body;
    const { lectureId } = req.params;

    const lecture = await Lecture.findById(lectureId);

    if (!lecture)
      return res.status(404).json({
        success: false,
        message: "Lecture not found",
      });

    lecture.lectureTitle = lectureTitle || lecture.lectureTitle;
    lecture.isPreviewFree =
      isPreviewFree ?? lecture.isPreviewFree;
    lecture.videoId = videoId || lecture.videoId;

    await lecture.save();

    res.status(200).json({
      success: true,
      message: "Lecture updated successfully",
      lecture,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};



// export const removeLecture = async (req, res) => {
//   try {
//     const { lectureId, id: courseId } = req.params;
//     const lecture = await Lecture.findById(lectureId);
//     if (lecture?.publicId) await deleteMediaFromCloudinary(lecture.publicId, "video");
//     await Lecture.findByIdAndDelete(lectureId);
//     await Course.findByIdAndUpdate(courseId, { $pull: { lectures: lectureId } });
//     res.json({ success: true, message: "Lecture removed" });
//   } catch (err) {
//     res.status(500).json({ message: "Removal failed" });
//   }
// };

export const removeLecture = async (req, res) => {
  try {
    const { lectureId, id: courseId } = req.params;

    await Lecture.findByIdAndDelete(lectureId);
    await Course.findByIdAndUpdate(courseId, {
      $pull: { lectures: lectureId },
    });

    res.json({ success: true, message: "Lecture removed" });
  } catch (err) {
    res.status(500).json({ message: "Removal failed" });
  }
};


/* =====================================================
    🎓 PUBLIC ACCESS
===================================================== */

export const getPublishedCourse = async (_, res) => {
  try {
    const courses = await Course.find({ isPublished: true }).populate("creator", "name photoUrl");
    res.json({ success: true, courses });
  } catch (err) {
    res.status(500).json({ message: "Fetch failed" });
  }
};

export const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate("creator", "name photoUrl").populate("lectures");
    if (!course) return res.status(404).json({ message: "Not found" });
    let isPurchased = false;
    if (req.user) {
      const p = await CoursePurchase.findOne({ user: req.user._id, course: course._id, paymentStatus: "success" });
      isPurchased = !!p;
    }
    res.json({ success: true, course: { ...course.toObject(), isPurchased } });
  } catch (error) {
    res.status(500).json({ message: "Fetch failed" });
  }
};

export const togglePublishCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    course.isPublished = !course.isPublished;
    await course.save();
    res.json({ success: true, isPublished: course.isPublished });
  } catch (err) {
    res.status(500).json({ message: "Toggle failed" });
  }
};

export const getCreatorCourseById = async (req, res) => {
  try {
    const course = await Course.findOne({ _id: req.params.id, creator: req.user._id }).populate("lectures");
    res.json({ success: true, course });
  } catch (err) {
    res.status(500).json({ message: "Fetch failed" });
  }
};

// export const getCourseDetailWithLessons = async (req, res) => {
//   try {
//     const course = await Course.findById(req.params.courseId).populate("lectures");
//     res.json({ success: true, course });
//   } catch (err) {
//     res.status(500).json({ message: "Fetch failed" });
//   }
// };

export const getCourseDetailWithLessons = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId)
      .populate("lectures");

    let isPurchased = false;

    if (req.user) {
      const purchase = await CoursePurchase.findOne({
        user: req.user._id,
        course: course._id,
        paymentStatus: "success",
      });

      isPurchased = !!purchase;
    }

    res.json({
      success: true,
      course: {
        ...course.toObject(),
        isPurchased,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Fetch failed" });
  }
};
