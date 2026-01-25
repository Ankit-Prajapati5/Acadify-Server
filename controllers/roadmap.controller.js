import { Roadmap } from "../models/Roadmap.js";

// 1. Suggest Idea (With owner & initial vote)
export const suggestIdea = async (req, res) => {
    try {
        const { title, tag } = req.body;
        const userId = req.id; // Auth middleware se mil rahi hai

        const idea = await Roadmap.create({ 
            title, 
            tag, 
            creator: userId,     // Malik ki ID save ki
            upvotes: [userId]    // Malik ka vote pehle se add kar diya (Count = 1)
        });

        return res.status(201).json({ success: true, idea });
    } catch (error) {
        return res.status(500).json({ message: "Failed to suggest idea" });
    }
};

// 2. Toggle Upvote
export const toggleUpvote = async (req, res) => {
    try {
        const { ideaId } = req.params;
        const userId = req.id;

        const idea = await Roadmap.findById(ideaId);
        if (!idea) return res.status(404).json({ message: "Idea not found" });

        const hasVoted = idea.upvotes.includes(userId);

        if (hasVoted) {
            idea.upvotes = idea.upvotes.filter((id) => id.toString() !== userId);
        } else {
            idea.upvotes.push(userId);
        }

        await idea.save();
        return res.status(200).json({ success: true, idea });
    } catch (error) {
        return res.status(500).json({ message: "Upvote failed" });
    }
};

// 3. Edit Idea (Only Owner)
export const editIdea = async (req, res) => {
    try {
        const { ideaId } = req.params;
        const { title, tag } = req.body;
        const userId = req.id; 

        const idea = await Roadmap.findById(ideaId);
        if (!idea) return res.status(404).json({ message: "Idea not found" });

        // Normalizing IDs to Strings for exact match
        if (String(idea.creator).trim() !== String(userId).trim()) {
            return res.status(403).json({ 
                success: false, 
                message: "Aap sirf apni banayi hui ideas edit kar sakte hain." 
            });
        }

        idea.title = title || idea.title;
        idea.tag = tag || idea.tag;
        await idea.save();

        return res.status(200).json({ success: true, idea });
    } catch (error) {
        return res.status(500).json({ message: "Edit failed", error: error.message });
    }
};

// 4. Delete Idea (Fixed 403)
export const deleteIdea = async (req, res) => {
    try {
        const { ideaId } = req.params;
        const userId = req.id;

        const idea = await Roadmap.findById(ideaId);
        if (!idea) return res.status(404).json({ message: "Idea not found" });

        // Normalizing IDs
        if (String(idea.creator).trim() !== String(userId).trim()) {
            return res.status(403).json({ 
                success: false, 
                message: "Aap sirf apni banayi hui ideas delete kar sakte hain." 
            });
        }

        await Roadmap.findByIdAndDelete(ideaId);
        return res.status(200).json({ success: true, message: "Deleted successfully" });
    } catch (error) {
        return res.status(500).json({ message: "Delete failed", error: error.message });
    }
};

// 5. Get All (Sorted by Votes)
export const getAllIdeas = async (req, res) => {
    try {
        const ideas = await Roadmap.find().sort({ createdAt: -1 });
        const sortedIdeas = ideas.sort((a, b) => b.upvotes.length - a.upvotes.length);
        return res.status(200).json({ success: true, ideas: sortedIdeas });
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch ideas" });
    }
};