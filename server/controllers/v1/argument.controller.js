/* This controller is for managing the Arguments Endpoints */

const mongoose = require('mongoose');
const Debate = require('../../models/debate');
const Argument = require('../../models/argument');
const Comment = require('../../models/comment');
const User = require('../../models/user');

// Create a new argument for a debate
const createArgument = async (req, res, next) => {
  const { debateId } = req.params;
  const { content, userId, side } = req.body; // Ensure `side` is passed

  try {
    const debate = await Debate.findById(debateId);
    if (!debate) {
      return res.status(404).json({ message: 'Debate not found' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Ensure debate is open
    if (debate.status !== 'open') {
      return res.status(403).json({ message: 'Debate is closed' });
    }

    // Convert userId to ObjectId for comparison
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Check if debate is full but the user is not already a participant
    const isParticipant = debate.participants.some(participantId => participantId.equals(userObjectId));

    if (debate.participants.length >= debate.maxParticipants && !isParticipant) {
      return res.status(400).json({ message: 'Debate is full' });
    }

    // Create the argument with the side information
    const argument = new Argument({
      content,
      owner: user._id,
      debate: debateId,
      side, // Record which side the user voted for
    });

    await argument.save();

    // Add the argument to the debate
    debate.arguments.push(argument);

    // Check if the user is not already a participant, then add them
    if (!isParticipant) {
      debate.participants.push(user._id);
    }

    await debate.save();

    res.status(201).json(argument);
  } catch (err) {
    console.error(err);
    return next(err);
  }
};



// Get all arguments for a specific debate
const getAllArguments = async (req, res) => {
  const { debateId } = req.params;
  try {
    const debate = await Debate.findById(debateId).populate('arguments');

    if (!debate) {
      return res.status(404).json({ message: 'Debate not found' });
    }


    if (debate.arguments.length === 0) {
      return res.status(404).json({ message: 'No arguments found for this debate' });
    }

    res.status(200).json(debate.arguments);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Get specific argument by ID
const getArgumentById = async (req, res) => {
  const { debateId, argumentId } = req.params;
  try {
    const argument = await Argument.findById(argumentId).populate('comments');
    if (!argument) {
      return res.status(404).json({ error: 'Argument not found' });
    }
    res.status(200).json(argument);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete specific argument by ID
const deleteArgument = async (req, res) => {
  const { debateId, argumentId } = req.params;
  try {

    const debate = await Debate.findById(debateId);
    if (!debate) {
        return res.status(401).json({ error: 'Debate not found' });
    }

    if(debate.status !== 'open') {
        return res.status(403).json({ error: 'Debate is closed' });
    }

    const argument = await Argument.findById(argumentId);
    if (!argument) {
      return res.status(401).json({ error: 'Argument not found' });
    }

    if (!debate.arguments.includes(argumentId)) {
      return res.status(404).json({ error: 'Argument not found in debate' });
    }

    // Remove the argument from the debate's arguments array
    debate.arguments = debate.arguments.filter(arg => arg.toString() !== argumentId);
    await debate.save();

    // Delete associated comments
    await Comment.deleteMany({ _id: { $in: argument.comments } });

    // Delete the argument
    await argument.deleteOne();
    res
      .status(204)
      .json({ message: 'Argument and associated comments deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete all arguments of a specific debate
const deleteAllArgumentsOfDebate = async (req, res) => {
  const { debateId } = req.params;

  try {
    // Find the debate by ID
    const debate = await Debate.findById(debateId);

    if (!debate) {
      return res.status(404).json({ message: 'Debate not found' });
    }

    // Delete all arguments associated with the debate
    await Argument.deleteMany({ _id: { $in: debate.arguments } });

    // Clear the arguments array in the debate document
    debate.arguments = [];
    await debate.save();

    res.status(204).json({ message: 'All arguments deleted successfully for the debate' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


const editArgument = async (req, res) => {
  const { debateId, argumentId } = req.params; 
  const updates = req.body; 
  const allowedUpdates = ['content'];
  const requestedUpdates = Object.keys(updates);

  try {
    if (!mongoose.Types.ObjectId.isValid(debateId)) {
      console.log("Invalid debate ID");
      return res.status(400).json({ message: 'Invalid debate ID' });
    }

    if (!mongoose.Types.ObjectId.isValid(argumentId)) {
      console.log("Invalid argument ID");
      return res.status(400).json({ message: 'Invalid argument ID' });
    }
  
     // Validate that all required fields are present for PUT
 
     const isValidUpdate = requestedUpdates.every(key => allowedUpdates.includes(key));
     if (!isValidUpdate || requestedUpdates.length !== allowedUpdates.length) {
       return res.status(400).json({ message: 'Invalid or incomplete updates' });
     }

    const updatedArgument = await Argument.findByIdAndUpdate(argumentId, updates, { new: true, runValidators: true });

    res.status(200).json({ message: 'Argument updated successfully', argument: updatedArgument });
  } catch (error) {
    // Catch any errors and send a 500 Internal Server Error response
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}

module.exports = {
  createArgument,
  getAllArguments,
  getArgumentById,
  deleteArgument,
  deleteAllArgumentsOfDebate,
  editArgument
};
