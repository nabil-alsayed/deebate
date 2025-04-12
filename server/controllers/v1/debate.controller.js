/* This controller is for managing the Debate Endpoints */

const mongoose = require('mongoose');
const Debate = require('../../models/debate');
const User = require('../../models/user');
const Argument = require('../../models/argument');
const { generateResponse } = require('../../services/chatgpt.service');
const { generatePrompt } = require("../../utils/utils");

// Vote on a debate 
const voteDebate = async (req, res) => {
  const { debateId } = req.params;
  const { userId, voteType } = req.body;

  const allowedVotes = ['with', 'against', 'remove'];

  try {
    const debate = await Debate.findById(debateId);
    if (!debate) {
      return res.status(404).json({ message: 'Debate not found' });
    }

    const userAlreadyVotedWith = debate.votesWith.includes(userId);
    const userAlreadyVotedAgainst = debate.votesAgainst.includes(userId);

    // If voteType is 'remove', the user wants to cancel their vote
    if (voteType === 'remove') {
      if (userAlreadyVotedWith) {
        debate.votesWith = debate.votesWith.filter(id => id.toString() !== userId);
      } else if (userAlreadyVotedAgainst) {
        debate.votesAgainst = debate.votesAgainst.filter(id => id.toString() !== userId);
      }
      await debate.save();
      return res.status(200).json({
        message: 'Vote removed successfully',
        debate: {
          votesWith: debate.votesWith,
          votesAgainst: debate.votesAgainst,
        },
      });
    }

    // Validate the vote type
    if (!allowedVotes.includes(voteType)) {
      return res.status(400).json({ message: 'Invalid vote type. Must be "with" or "against"' });
    }

    // Prevent users from voting twice
    if (userAlreadyVotedWith || userAlreadyVotedAgainst) {
      return res.status(400).json({ message: 'User has already voted' });
    }

    // Add user to the correct vote list
    if (voteType === 'with') {
      debate.votesWith.push(userId);
    } else if (voteType === 'against') {
      debate.votesAgainst.push(userId);
    }

    await debate.save();

    res.status(200).json({
      message: 'Vote cast successfully',
      debate: {
        votesWith: debate.votesWith,
        votesAgainst: debate.votesAgainst,
      },
    });
  } catch (error) {
    console.error('Error voting on debate:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};



const postDebate = async (req, res, next) => {
  const { topic, category, endTime, owner, maxParticipants } =
    req.body;

  // Basic validation
  if (!topic) {
    return res.status(400).json({ message: 'Seems like you forgot the Topic!' });
  }
  if (!category) {
    return res.status(400).json({ message: 'Seems like you forgot the Category!' });
  }
  if (!endTime) {
    return res.status(400).json({ message: 'Seems like you forgot the End Time!' });
  }
  if (!owner) {
    return res.status(400).json({ message: 'Seems like you forgot the Owner!' });
  }

  // Check that endTime is in the future
  if (new Date(endTime) <= new Date()) {
    return res.status(400).json({ message: 'End time must be in the future' });
  }

  if( mongoose.Types.ObjectId.isValid(owner) === false){
    return res.status(400).json({ message: 'Invalid owner ID format' });
  }

  try {

    // Create a new debate
    const debate = new Debate({
      topic,
      category,
      endTime,
      owner,
      maxParticipants,
    });

    await debate.save();
    res.status(201).json(debate);
  } catch (err) {
    return next(err);
  }
};

const getDebates = async (req, res, next) => {
  try {
    const { user, category, status, sort } = req.query;
    const allowedCategories = Debate.schema.path('category').enumValues;
    const allowedStatus = Debate.schema.path('status').enumValues;

    let filter = {};

    // Filter by user if provided
    if (user) {
      if (!mongoose.Types.ObjectId.isValid(user)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      filter.owner = user;
    }

    // Filter by category if provided
    if (category) {
      if (!allowedCategories.includes(category)) {
        return res.status(400).json({ message: 'Invalid category' });
      }
      filter.category = category;
    }

    // Filter by status if provided
    if (status) {
      if (!allowedStatus.includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      filter.status = status;
    }

    // Prepare the query with filters and sorting
    let query = Debate.find(filter).populate('owner', 'username');
    if (sort) {
      const sortOrder = sort === 'asc' ? 1 : -1;
      query = query.sort({ endTime: sortOrder });
    }

    // Fetch debates from the database
    const debates = await query;

    // Iterate through the debates to check for expired ones and update them
    for (let debate of debates) {
      const isDebateExpired = debate.endTime < new Date();
      const isDebateOpen = debate.status === 'open';
      const debateTotalVotes = debate.votesWith.length + debate.votesAgainst.length;
      const hasVotes = debateTotalVotes > 0;
      const hasSufficientParticipants = debate.participants.length > 1;

      // Close expired debates
      if (isDebateExpired && isDebateOpen) {
        debate.status = 'closed';
      }

      // Generate analysis and winner if the debate is closed and doesn't have analysis already
      if (isDebateExpired && !debate.analysis && hasSufficientParticipants) {
        try {
          const analysisPrompt = await generatePrompt('analysis', debate);
          debate.analysis = await generateResponse(analysisPrompt);
        } catch (error) {
          console.error('Error generating analysis:', error);
        }
      }

      // Generate winner if there are at least two participants
      if (isDebateExpired && hasSufficientParticipants && !debate.winnerByAI) {
        try {
          const winnerPrompt = await generatePrompt('winner', debate);
          debate.winnerByAI = await generateResponse(winnerPrompt);
        } catch (error) {
          console.error('Error generating winner:', error);
        }
      }

      if (debate.status === 'closed' && hasVotes && !debate.winnerByAudience) {
        debate.winnerByAudience = debate.votesWith.length > debate.votesAgainst.length ? 'with' : 'against';
      }

      await debate.save();
    }

    // Send the debates with HATEOAS links
    res.status(200).json({
      debates: debates.map(debate => ({
        ...debate.toObject(),
        links: {
          self: `${req.protocol}://${req.get('host')}${req.baseUrl}/${debate._id}`,
          arguments: `${req.protocol}://${req.get('host')}${req.baseUrl}/${debate._id}/arguments`,
          update: `${req.protocol}://${req.get('host')}${req.baseUrl}/${debate._id}`,
          delete: `${req.protocol}://${req.get('host')}${req.baseUrl}/${debate._id}`
        }
      })),
    });

  } catch (err) {
    return next(err);
  }
};


const deleteAllDebates = async (req, res, next) => {

  try {
    const result = await Debate.deleteMany();

    // Check if any debates were deleted
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'No debates found to delete' });
    }

    // Respond with the number of debates deleted
    res
      .status(200)
      .json({ message: `${result.deletedCount} debates deleted successfully` });
  } catch (err) {
    return next(err);
  }
};

const deleteDebateByID = async (req, res, next) => {
  const { debateId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(debateId)) {
    return res.status(404).json({ message: 'Invalid ID format' });
  }

  try {
    const debate = await Debate.findByIdAndDelete(debateId);
    if (!debate) {
      return res.status(404).json({ message: 'Debate not found' });
    }
    res.status(204).json({ message: 'Debate deleted successfully', debate });
  } catch (err) {
    return next(err);
  }
};

const generateAndSaveAnalysis = async (debate) => {
  if (debate.status !== 'closed' && !debate.analysis) {
    return;
  }

  try {
    const analysisPrompt = await generatePrompt("analysis",debate);
    const analysis = await generateResponse(analysisPrompt);

    const winnerPrompt = await generatePrompt("winner",debate);
    const winner = await generateResponse(winnerPrompt);

    debate.analysis = analysis;
    debate.winnerByAi = winner;

    // Create ChatGPT's argument as if it's a participant
    const chatgpt = await User.findOne({ username: 'chatgpt' });

    const chatGPTArgument = new Argument({
      content: analysis,
      owner: chatgpt._id,
      debate: debate._id,
      side: winner,
    });

    await chatGPTArgument.save();

    await debate.save();
  } catch (error) {
    console.error('Error in generateAndSaveAnalysis:', error);
  }
};

const getDebateByID = async (req, res, next) => {
  const { debateId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(debateId)) {
    return res.status(400).json({ message: 'Invalid ID format' });
  }

  try {
    const debate = await Debate.findById(debateId).populate('arguments');
    if (!debate) {
      return res.status(404).json({ message: 'Debate not found' });
    }

    // Check if the debate has expired and close it
    if (new Date(debate.endTime).getTime() < new Date().getTime() && debate.status === 'open') {
      debate.status = 'closed';
      await debate.save();
    }

    const isDebateExpired = debate.endTime < new Date();
    const isDebateOpen = debate.status === 'open';
    const debateTotalVotes = debate.votesWith.length + debate.votesAgainst.length;
    const hasVotes = debateTotalVotes > 0;
    const hasSufficientParticipants = debate.participants.length > 1;

    // Close expired debates
    if (isDebateExpired && isDebateOpen) {
      debate.status = 'closed';
    }

    // Generate analysis and winner if the debate is closed and doesn't have analysis already
    if (isDebateExpired && !debate.analysis && hasSufficientParticipants) {
      try {
        const analysisPrompt = await generatePrompt('analysis', debate);
        debate.analysis = await generateResponse(analysisPrompt);
      } catch (error) {
        console.error('Error generating analysis:', error);
      }
    }

    // Generate winner if there are at least two participants
    if (isDebateExpired && hasSufficientParticipants && !debate.winnerByAI) {
      try {
        const winnerPrompt = await generatePrompt('winner', debate);
        debate.winnerByAI = await generateResponse(winnerPrompt);
      } catch (error) {
        console.error('Error generating winner:', error);
      }
    }

    if (debate.status === 'closed' && hasVotes && !debate.winnerByAudience) {
      debate.winnerByAudience = debate.votesWith.length > debate.votesAgainst.length ? 'with' : 'against';
    }

    await debate.save();

    res.status(200).json({ debate });
  } catch (err) {
    return next(err);
  }
};

const updateDebate = async (req, res, next) => {
  const { debateId } = req.params; 
  const updatedFields = req.body;

  // Validate that id 
  if (!mongoose.Types.ObjectId.isValid(debateId)) {
    return res.status(400).json({ message: 'Invalid ID format' });
  }

  try {
    // Find the debate and update it
    const updatedDebate = await Debate.findOneAndUpdate(
      {
        _id: debateId,
        endTime: { $gt: new Date() }, // Only update if debate hasn't ended
      },
      updatedFields,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedDebate) {
      return res.status(404).json({ message: 'Debate not found or already ended' });
    }

    res.status(200).json(updatedDebate);
  } catch (err) {
    return next(err);
  }
};

const deleteAllUserDebates = async (req, res, next) => {
  const { userId } = req.params;

  try {
    // Check if the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete all debates owned by the user
    const results = await Debate.deleteMany({ owner: userId });

    // Check if any debates were deleted
    if (results.deletedCount === 0) {
      return res.status(404).json({ message: 'No debates found for this user' });
    }

    return res.status(200).json({ message: `${results.deletedCount} debates deleted successfully` });
  } catch (err) {
    return next(err);
  }
};

const deleteSpecificUserDebate = async (req, res, next) => {
  const { userId, debateId } = req.params;

  try {
    // Check if the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete specific debate owned by the user
    const result = await Debate.findOneAndDelete({ owner: userId, _id: debateId });

    // Check if a debate was deleted
    if (!result) {
      return res.status(404).json({ message: 'No debate found for this user with the specified ID' });
    }

    return res.status(200).json({ message: `Debate --> ${result.topic} <-- deleted successfully` });
  } catch (err) {
    return next(err);
  }
};
    

module.exports = {
  voteDebate,
  postDebate,
  getDebates,
  deleteAllDebates,
  deleteDebateByID,
  deleteAllUserDebates,
  deleteSpecificUserDebate,
  getDebateByID,
  updateDebate
};
