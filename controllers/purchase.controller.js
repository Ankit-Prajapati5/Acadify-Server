import CoursePurchase from "../models/coursePurchase.model.js"; // Sahi path check kar lena
import { Course } from "../models/course.model.js";

export const getDashboardStats = async (req, res) => {
    try {
        // 1. Saari successful purchases fetch karo
        // Aapke model mein field 'paymentStatus' hai aur value 'success'
        const purchases = await CoursePurchase.find({ paymentStatus: 'success' })
            .populate('course') // Model mein field 'course' hai
            .populate('user');   // Model mein field 'user' hai

        console.log("Real Purchases Found:", purchases.length);

        // 2. Total Revenue
        const totalRevenue = purchases.reduce((acc, curr) => acc + curr.amount, 0);

        // 3. Total Unique Students
        // Model mein field 'user' hai
        const totalStudents = new Set(purchases.map(p => p.user?._id?.toString())).size;

        // 4. Active Courses (Jo published hain aur deleted nahi)
        const activeCourses = await Course.countDocuments({ 
            isPublished: true, 
            isDeleted: false 
        });

        // 5. Total Sales Count
        const totalSales = purchases.length;

        // 6. Recent Enrolments (Top 5)
        const recentEnrolments = purchases.slice(-5).reverse().map(p => ({
            _id: p._id,
            studentName: p.user?.name || "Unknown Student",
            courseTitle: p.course?.courseTitle || "Course Deleted",
            amount: p.amount,
            email:p.user.email,
            photoUrl:p.user.photoUrl
        }));

        return res.status(200).json({
            totalRevenue,
            totalStudents,
            activeCourses,
            totalSales,
            recentEnrolments
        });
    } catch (error) {
        console.error("Dashboard Error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Internal Server Error" 
        });
    }
};