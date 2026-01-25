import mongoose from "mongoose";

const roadmapSchema = new mongoose.Schema({
    title: { type: String, required: true },
    tag: { type: String, enum: ["Course", "Feature", "Workshop"], default: "Course" },
    // ✅ Ye field zaroori hai Edit/Delete buttons dikhane ke liye
    creator: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
    },
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], 
}, { timestamps: true });

export const Roadmap = mongoose.model("Roadmap", roadmapSchema);