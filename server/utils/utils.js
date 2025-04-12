var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');

// This can be used to generate a verification token for email verification
// or password reset. It generates a random 6-digit number as a string.
const generateVerificationToken = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// This function generates a JWT token and sets it as a cookie in the response
const generateTokenAndSetCookie = (res, user) => {
  const token = jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  res.cookie('token', token, {
    httpOnly: true, // to prevent client side JS from reading the cookie and xss attacks
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict', // to prevent CSRF attacks
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return token;
};

// Middleware to validate token and role
const authenticateRole = (requiredRoles) => {
  return (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res
        .status(401)
        .json({ message: 'Access denied: Token not provided' });
    }

    // Ensure the token is provided in "Bearer <token>" format
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res
        .status(401)
        .json({ message: 'Access denied: Malformed authorization header' });
    }

    const token = parts[1];
    if (!token) {
      return res
        .status(401)
        .json({ message: 'Access denied: Token is missing' });
    }

    // Validate the token
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res
            .status(401)
            .json({ message: 'Access denied: Token expired' });
        }
        return res
          .status(401)
          .json({ message: 'Access denied: Invalid token' });
      }

      // Check if the user's role is allowed
      const userData = decodedToken;
      if (requiredRoles.includes(userData.role) || userData.role === 'admin') {
        req.user = userData; // Attach decoded token data to the request object
        next(); // Proceed to the next middleware or route handler
      } else {
        return res
          .status(403)
          .json({ message: 'Access forbidden: Insufficient permissions' });
      }
    });
  };
};

// Hash the password with a given salt round
const hashPassword = async (password, saltRounds = 10) => {
  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (error) {
    throw new Error('Error hashing password');
  }
};

// Compare plain password with hashed password
const comparePassword = async (plainPassword, hashedPassword) => {
  try {
    const isValid = await bcrypt.compare(plainPassword, hashedPassword);
    return isValid;
  } catch (error) {
    throw new Error('Error comparing passwords');
  }
};

// Helper function to get participant details
const getParticipantName = (participantsArr, participantId) => {
  const participantObj = {
    firstName: '',
    lastName: '',
    username: '',
  };

  participantsArr.forEach(participant => {
    // Compare the participant ID with the argument owner ID
    if (participant._id.toString() === participantId) {
      participantObj.firstName = participant.firstName || 'Unknown';
      participantObj.lastName = participant.lastName || '';
      participantObj.username = participant.username || 'Unknown';
    }
  });
  return participantObj;
};


const generatePrompt = async (type, debate) => {
  try {
    let prompt = '';
    const ask = "Analyze the following debate: ";
    const topic = `Topic: ${debate.topic}\n`;
    const votesWith = `Number of people voted with: ${debate.votesWith.length}\n`;
    const votesAgainst = `Number of people voted against: ${debate.votesAgainst.length}\n`;
    const rules = `Follow these rules: 
      1) Respectful Language: check if they use offensive, derogatory, or discriminatory language. 
      2) Fact-Checking: do participants provide reliable sources to support their claims? 
      3) Relevance: does the discussion stay on topic and avoid tangents? 
      4) Reasonableness: Discourage arguments based on personal opinions or beliefs without evidence. 
      5) Ethics: Promote ethical considerations to avoid discussions that promote harmful or unethical behaviors. 
      6) Logical Fallacies: Identify and point out logical fallacies in arguments.
      7) Structure: Check if the arguments are well-structured and easy to follow.
      8) Engagement: Evaluate the level of engagement and interaction between participants.
      9) Conclusion: Analyze the quality of the conclusion and the final statements.
      10) Remember that your answer will be displayed in the form of a string, so make sure it is formatted correctly with spaces.\n
      11) Keep your response concise and to the point, avoiding unnecessary verbosity.\n
      \n
    `;

    let request = '';

    if (type === 'analysis') {
      request = 'Analyze the debate and provide a summary of the arguments.';
    } else if (type === 'winner') {
      request = 'Based on the analysis and rules return a response with only one string no longer than the length of the side word string, which is the side of the participant/s who is/are according to your judgment won the debate. You have to return one and only one winning side, no more no less. Either "with" or "against".';
    }

    let argumentsString = '';

    // Ensure participants and arguments are populated
    await debate.populate('participants');
    await debate.populate('arguments');

    await debate.save();

    const participantsArr = debate.participants;
    const arguments = debate.arguments;

    if (!participantsArr || participantsArr.length === 0) {
      throw new Error('No participants found.');
    }

    if (!arguments || arguments.length === 0) {
      throw new Error('No arguments found.');
    }

    // Iterate through arguments to build the prompt
    arguments.forEach((argument, index) => {
      const participant = getParticipantName(participantsArr, argument.owner.toString());
      const participantDetails = `(Participant ID: ${argument.owner.toString()}) Name: ${participant.firstName} ${participant.lastName}`;
      argumentsString += `Debator: ${participantDetails || 'Unknown'} | Argument ${index + 1} | Side: ${argument.side || 'Unknown'}\nContent: ${argument.content || 'No content provided'}\n\n`;
    });

    // Combine the parts of the prompt
    prompt = ask + topic + votesWith + votesAgainst + rules + argumentsString + request;

    return prompt;
  } catch (error) {
    console.error('Failed to generate prompt:', error);
    throw new Error('Failed to generate prompt');
  }
};





module.exports = {
  generateVerificationToken,
  generateTokenAndSetCookie,
  authenticateRole,
  hashPassword,
  comparePassword,
  generatePrompt
};
