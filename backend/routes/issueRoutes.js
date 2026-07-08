const express = require('express');
const Issue = require('../models/Issue');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/issues
// @desc    Create a new issue
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        const { title, type, priority, description, address, landmark, location, photo } = req.body;

        // Validate required fields
        if (!title || !type || !priority || !description || !address || !location) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Validate location coordinates
        const lat = parseFloat(location.lat);
        const lng = parseFloat(location.lng || location.lon);

        if (isNaN(lat) || isNaN(lng)) {
            return res.status(400).json({ 
                message: 'Invalid location coordinates. Please select a valid location on the map.' 
            });
        }

        // Create new issue
        const newIssue = new Issue({
            title,
            type,
            priority,
            description,
            address,
            landmark,
            location: {
                type: 'Point',
                coordinates: [lng, lat]
            },
            photo,
            reportedBy: req.user.id
        });

        const issue = await newIssue.save();

        // Populate the reportedBy field with user details
        const populatedIssue = await Issue.findById(issue._id)
            .populate('reportedBy', 'name email username profilePhoto');

        res.status(201).json(populatedIssue);
    } catch (err) {
        console.error('Error creating issue:', err.message);
        res.status(500).json({ message: 'Server error while creating issue' });
    }
});

// @route   GET /api/issues
// @desc    Get all issues (with optional filters)
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { status, type, priority, page = 1, limit = 10 } = req.query;
        
        // Build filter object
        const filter = {};
        if (status) filter.status = status;
        if (type) filter.type = type;
        if (priority) filter.priority = priority;

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Get total count for pagination
        const total = await Issue.countDocuments(filter);

        // Get issues with pagination and populate user details
        const issues = await Issue.find(filter)
            .populate('reportedBy', 'name email username profilePhoto role')
            .populate('comments.user', 'name username profilePhoto role')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        res.json({
            issues,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit))
        });
    } catch (err) {
        console.error('Error fetching issues:', err.message);
        res.status(500).json({ message: 'Server error while fetching issues' });
    }
});

// @route   GET /api/issues/my-issues
// @desc    Get current user's issues
// @access  Private
router.get('/my-issues', auth, async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        
        const filter = { reportedBy: req.user.id };
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const total = await Issue.countDocuments(filter);

        const issues = await Issue.find(filter)
            .populate('reportedBy', 'name email username profilePhoto role')
            .populate('comments.user', 'name username profilePhoto role')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        res.json({
            issues,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit))
        });
    } catch (err) {
        console.error('Error fetching user issues:', err.message);
        res.status(500).json({ message: 'Server error while fetching your issues' });
    }
});

// @route   GET /api/issues/:id
// @desc    Get single issue by ID
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const issue = await Issue.findById(req.params.id)
            .populate('reportedBy', 'name email username profilePhoto role')
            .populate('comments.user', 'name username profilePhoto role');

        if (!issue) {
            return res.status(404).json({ message: 'Issue not found' });
        }

        res.json(issue);
    } catch (err) {
        console.error('Error fetching issue:', err.message);
        
        // Handle invalid ObjectId
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Issue not found' });
        }
        
        res.status(500).json({ message: 'Server error while fetching issue' });
    }
});

// @route   PUT /api/issues/:id
// @desc    Update issue status (Admin only - for now, any authenticated user)
// @access  Private
router.put('/:id', auth, async (req, res) => {
    try {
        const { status } = req.body;

        if (!status || !['pending', 'in-progress', 'resolved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }

        const issue = await Issue.findById(req.params.id);

        if (!issue) {
            return res.status(404).json({ message: 'Issue not found' });
        }

        // Update status
        issue.status = status;
        const updatedIssue = await issue.save();

        const populatedIssue = await Issue.findById(updatedIssue._id)
            .populate('reportedBy', 'name email username profilePhoto');

        res.json(populatedIssue);
    } catch (err) {
        console.error('Error updating issue:', err.message);
        res.status(500).json({ message: 'Server error while updating issue' });
    }
});

// @route   DELETE /api/issues/:id
// @desc    Delete an issue (only by the user who reported it)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const issue = await Issue.findById(req.params.id);

        if (!issue) {
            return res.status(404).json({ message: 'Issue not found' });
        }

        // Check if the user is the one who reported the issue
        if (issue.reportedBy.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to delete this issue' });
        }

        await issue.deleteOne();

        res.json({ message: 'Issue deleted successfully' });
    } catch (err) {
        console.error('Error deleting issue:', err.message);
        res.status(500).json({ message: 'Server error while deleting issue' });
    }
});

// @route   POST /api/issues/:id/upvote
// @desc    Upvote an issue
// @access  Private
router.post('/:id/upvote', auth, async (req, res) => {
    try {
        const issue = await Issue.findById(req.params.id);

        if (!issue) {
            return res.status(404).json({ message: 'Issue not found' });
        }

        // Remove from downvotes if exists
        issue.votes.downvotes = issue.votes.downvotes.filter(
            userId => userId.toString() !== req.user.id
        );

        // Toggle upvote
        const alreadyUpvoted = issue.votes.upvotes.some(
            userId => userId.toString() === req.user.id
        );

        if (alreadyUpvoted) {
            issue.votes.upvotes = issue.votes.upvotes.filter(
                userId => userId.toString() !== req.user.id
            );
        } else {
            issue.votes.upvotes.push(req.user.id);
        }

        await issue.save();

        const updatedIssue = await Issue.findById(issue._id)
            .populate('reportedBy', 'name email username profilePhoto')
            .populate('comments.user', 'name username profilePhoto');

        res.json(updatedIssue);
    } catch (err) {
        console.error('Error upvoting issue:', err.message);
        res.status(500).json({ message: 'Server error while upvoting issue' });
    }
});

// @route   POST /api/issues/:id/downvote
// @desc    Downvote an issue
// @access  Private
router.post('/:id/downvote', auth, async (req, res) => {
    try {
        const issue = await Issue.findById(req.params.id);

        if (!issue) {
            return res.status(404).json({ message: 'Issue not found' });
        }

        // Remove from upvotes if exists
        issue.votes.upvotes = issue.votes.upvotes.filter(
            userId => userId.toString() !== req.user.id
        );

        // Toggle downvote
        const alreadyDownvoted = issue.votes.downvotes.some(
            userId => userId.toString() === req.user.id
        );

        if (alreadyDownvoted) {
            issue.votes.downvotes = issue.votes.downvotes.filter(
                userId => userId.toString() !== req.user.id
            );
        } else {
            issue.votes.downvotes.push(req.user.id);
        }

        await issue.save();

        const updatedIssue = await Issue.findById(issue._id)
            .populate('reportedBy', 'name email username profilePhoto')
            .populate('comments.user', 'name username profilePhoto');

        res.json(updatedIssue);
    } catch (err) {
        console.error('Error downvoting issue:', err.message);
        res.status(500).json({ message: 'Server error while downvoting issue' });
    }
});

// @route   POST /api/issues/:id/comments
// @desc    Add a comment to an issue
// @access  Private
router.post('/:id/comments', auth, async (req, res) => {
    try {
        const { text, parentCommentId } = req.body;

        if (!text || text.trim() === '') {
            return res.status(400).json({ message: 'Comment text is required' });
        }

        const issue = await Issue.findById(req.params.id);

        if (!issue) {
            return res.status(404).json({ message: 'Issue not found' });
        }

        const newComment = {
            user: req.user.id,
            text: text.trim()
        };

        // If this is a reply to another comment
        if (parentCommentId) {
            newComment.parentComment = parentCommentId;
        }

        issue.comments.push(newComment);
        await issue.save();

        const updatedIssue = await Issue.findById(issue._id)
            .populate('reportedBy', 'name email username profilePhoto')
            .populate('comments.user', 'name username profilePhoto');

        res.status(201).json(updatedIssue);
    } catch (err) {
        console.error('Error adding comment:', err.message);
        res.status(500).json({ message: 'Server error while adding comment' });
    }
});

// @route   DELETE /api/issues/:issueId/comments/:commentId
// @desc    Delete a comment from an issue
// @access  Private
router.delete('/:issueId/comments/:commentId', auth, async (req, res) => {
    try {
        const issue = await Issue.findById(req.params.issueId);

        if (!issue) {
            return res.status(404).json({ message: 'Issue not found' });
        }

        // Find the comment
        const comment = issue.comments.id(req.params.commentId);

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Check if user is the comment author or admin
        if (comment.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to delete this comment' });
        }

        comment.deleteOne();
        await issue.save();

        const updatedIssue = await Issue.findById(issue._id)
            .populate('reportedBy', 'name email username profilePhoto role')
            .populate('comments.user', 'name username profilePhoto role');

        res.json(updatedIssue);
    } catch (err) {
        console.error('Error deleting comment:', err.message);
        res.status(500).json({ message: 'Server error while deleting comment' });
    }
});

// @route   PUT /api/issues/:issueId/comments/:commentId
// @desc    Edit a comment from an issue
// @access  Private
router.put('/:issueId/comments/:commentId', auth, async (req, res) => {
    try {
        const { text } = req.body;

        if (!text || text.trim() === '') {
            return res.status(400).json({ message: 'Comment text is required' });
        }

        const issue = await Issue.findById(req.params.issueId);

        if (!issue) {
            return res.status(404).json({ message: 'Issue not found' });
        }

        // Find the comment
        const comment = issue.comments.id(req.params.commentId);

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Check if user is the comment author
        if (comment.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to edit this comment' });
        }

        // Update comment text
        comment.text = text.trim();
        await issue.save();

        const updatedIssue = await Issue.findById(issue._id)
            .populate('reportedBy', 'name email username profilePhoto role')
            .populate('comments.user', 'name username profilePhoto role');

        res.json(updatedIssue);
    } catch (err) {
        console.error('Error editing comment:', err.message);
        res.status(500).json({ message: 'Server error while editing comment' });
    }
});

module.exports = router;
