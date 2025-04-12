const Debate = require('../../models/debate');
const Argument = require('../../models/argument');
const Comment = require('../../models/comment');

// Add a comment to a specific argument
const addComment = async (req, res) => {
  const { debateId, argumentId } = req.params;
  const { content } = req.body;
  const { id: userId } = req.user;

  // Validate the request body
  if (!content) {
    return res.status(400).json({ error: 'Missing Required Fields' });
  }

  try {
    const debate = await Debate.findById(debateId);
    if (!debate) {
      return res.status(404).json({ error: 'Debate not found' });
    }

    const argument = await Argument.findById(argumentId);
    if (!argument) {
      return res.status(404).json({ error: 'Argument not found' });
    }

    // Create and save the comment with the authenticated user's ID as the owner
    const newComment = new Comment({ content, owner: userId, argument: argumentId });
    const savedComment = await newComment.save();

    // Add the comment to the argument's comments array
    argument.comments.push(savedComment._id);
    await argument.save();

    res.status(201).json(savedComment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all comments for a specific argument
const getCommentsForArgument = async (req, res) => {
  const { argumentId } = req.params;

  try {
    const argument = await Argument.findById(argumentId).populate('comments');
    if (!argument) {
      return res.status(404).json({ error: 'Argument not found' });
    }
    res.status(200).json(argument.comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get specific comment by ID
const getCommentById = async (req, res) => {
  const { commentId } = req.params;
  try {
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    res.status(200).json(comment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a specific comment by ID
const deleteComment = async (req, res) => {
  const { commentId } = req.params;
  const { id: userId } = req.user;

  try {
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Check if the user is the owner of the comment
    if (comment.owner.toString() !== userId) {
      return res.status(403).json({ error: 'You are not authorized to delete this comment' });
    }

    // Remove the comment from the argument's comments array
    await Argument.updateMany({ comments: commentId }, { $pull: { comments: commentId } });

    // Delete the comment
    await comment.deleteOne();
    res.status(204).json({ message: 'Comment deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete all comments of a specific argument
const deleteAllComments = async (req, res) => {
  const { argumentId } = req.params;
  const { id: userId } = req.user;

  try {
    const argument = await Argument.findById(argumentId);
    if (!argument) {
      return res.status(404).json({ error: 'Argument not found' });
    }

    // Check if the user is the owner of the argument
    if (argument.owner.toString() !== userId) {
      return res.status(403).json({ error: 'You are not authorized to delete comments for this argument' });
    }

    // Delete all comments
    await Comment.deleteMany({ _id: { $in: argument.comments } });

    // Clear the comments array in the argument
    argument.comments = [];
    await argument.save();

    res.status(204).json({ message: 'All comments deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a specific comment
const updateComment = async (req, res) => {
  const { commentId } = req.params;
  const updates = req.body;
  const { id: userId } = req.user;

  const allowedAttributes = ['content'];

  const isValidRequest = Object.keys(updates).every((key) => allowedAttributes.includes(key));

  if (!isValidRequest) {
    return res.status(400).json({ message: 'Invalid update request. One or more attributes are not allowed.' });
  }

  try {
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment was not found.' });
    }

    // Check if the user is the owner of the comment
    if (comment.owner.toString() !== userId) {
      return res.status(403).json({ message: 'You are not authorized to update this comment.' });
    }

    // Update only allowed fields
    const updatedComment = await Comment.findByIdAndUpdate(commentId, updates, { new: true });

    res.status(200).json({ message: "Comment updated successfully", updatedComment });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error.', error: error.message });
  }
};

// Add like to a comment
const addLikeToComment = async (req, res) => {
  const { commentId } = req.params;

  try {
    const comment = await Comment.findByIdAndUpdate(
        commentId,
        { $addToSet: { likes: req.user._id } },
        { new: true }
    );
    res.status(200).json(comment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Remove like from a comment
const removeLikeFromComment = async (req, res) => {
  const { commentId } = req.params;

  try {
    const comment = await Comment.findByIdAndUpdate(
        commentId,
        { $pull: { likes: req.user._id } },
        { new: true }
    );
    res.status(200).json(comment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  addComment,
  getCommentsForArgument,
  getCommentById,
  deleteComment,
  deleteAllComments,
  updateComment,
  addLikeToComment,
  removeLikeFromComment,
};
