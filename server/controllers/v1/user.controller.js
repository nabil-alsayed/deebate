/* This controller is for managing the User Endpoints */

const User = require('../../models/user');
const mongoose = require('mongoose');
const { authenticateRole, hashPassword } = require("../../utils/utils");
const { uploadImageToS3 } = require('../../utils/s3'); // Import the S3 utility

const uploadProfileImage = async (req, res) => {
  const { id } = req.user;

  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Upload to S3 and get the URL
    const profileImgUrl = await uploadImageToS3(req.file, user.id);

    // Update the user's profileImg field with the S3 image URL
    user.profileImg = profileImgUrl;
    await user.save();

    res.status(200).json({ message: 'Profile image updated successfully.', profileImg: user.profileImg });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error uploading profile image', error: error.message });
  }
};

// Search for user

const searchUsers = async (req, res) => {
  const { search, limit } = req.query;

  if (!search) {
    return res.status(400).json({ error: 'Please provide a search query' });
  }

  try {
    const users = await User.find({
      $or: [
        { username: { $regex: search, $options: 'i' } },
        { emailAddress: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        {
          $expr: {
            $regexMatch: {
              input: { $concat: ['$firstName', ' ', '$lastName'] },
              regex: search,
              options: 'i'
            }
          }
        }
      ]
    }).limit(Number(limit) || 5);


    if (users.length === 0) {
      return res.status(404).json({ error: 'No users found.' });
    }

    // Make a copy of the users array and remove the sensitive fields from each user
    const editedUsers = users.map((user) => {
      const { password, __v, createdAt, updatedAt, role, emailAddress, invitationCode, verificationToken, verificationTokenExpires, ...editedUser } = user.toObject();
      return editedUser;
    });

    console.log(editedUsers);

    return res.status(200).json({ message: 'Users found', users: editedUsers });
  } catch (error) {
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};


// Get all users

const getAllUsers = async (req, res) => {

  try {
    const users = await User.find();

    if (users.length < 1) {
      res.status(401).json({ error: 'No registred users found.' });
    }

    // Make a copy of the users array and remove the sensitive fields from each user
    const editedUsers = users.map((user) => {
      const { password, __v, createdAt, updatedAt, role, emailAddress, invitationCode, verificationToken, verificationTokenExpires, ...editedUser } = user.toObject();
      return editedUser;
    });

    // Return a 200 response with list of users
    res.status(200).json({ message: 'Registred users were found: ', users : editedUsers });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Internal Server Error.', error: error.message });
  }
};

// Get a specific user

const getUser = async (req, res) => {
  const { userId } = req.params;
  const isChatGPT = userId === 'chatgpt';

  try {
    // Check if the ID provided is a valid mongoose ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId) && !isChatGPT) {
      console.log('Invalid ID format');
      return res
          .status(400)
          .json({ message: `ID format provided is invalid: ${userId}` });
    }

    // Find the user by ID
    let user;
    if(isChatGPT) {
      user = await User.findOne({ username: 'chatgpt' });
    } else {
      user = await User.findById(userId);
    }

    // If the user is not found, return a 404 response
    if (!user) {
      return res
          .status(404)
          .json({ message: `User with ID: ${userId} cannot be found.` });
    }
    if (user.profileImg && !user.profileImg.startsWith('http')) {
      user.profileImg = `${req.protocol}://${req.get('host')}/${user.profileImg}`;
    }

    // Remove sensitive fields from the user object
    const { password, __v, createdAt, updatedAt, emailAddress, role, invitationCode, verificationToken, verificationTokenExpires, ...editedUser } = user.toObject();

    // Return a 200 response with the user data
    return res
        .status(200)
        .json({ message: `Successfully found user with ID ${userId}`, user: editedUser });
  } catch (error) {
    res
        .status(500)
        .json({ message: 'Internal Server Error.', error: error.message });
  }
};

const editUser = async (req, res) => {
  const updates = req.body;
  const { userId } = req.params;

  const allowedAttributes = ['emailAddress', 'username', 'password', 'firstName', 'lastName'];
  const isValidRequest = Object.keys(updates).every((key) => allowedAttributes.includes(key));

  if (!isValidRequest) {
    return res.status(400).json({ message: 'Invalid update request. Some attributes are not allowed.' });
  }

  if (updates.password) {
    updates.password = await hashPassword(updates.password);
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const existingUser = await User.findOne({
      _id: { $ne: userId },
      $or: [{ emailAddress: updates.emailAddress }, { username: updates.username }],
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Email or username already in use' });
    }

    // Handle profile image upload
    if (req.file) {
      const profileImgUrl = await uploadImageToS3(req.file, user.id); 
      updates.profileImg = profileImgUrl; 
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updates, { new: true, runValidators: true }).lean();
    delete updatedUser.password;

    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

// Delete a user
const deleteUser = async (req, res) => {
  const { userId } = req.params;
  const { id } = req.user;

  const requestedUserId = userId;
  const requestingUserId = id;

  try {

    // if the user is not the owner or an admin, return a 403 response
    if (requestedUserId !== requestingUserId) {
      try {
        await authenticateRole('admin');
      } catch (error) {
        return res.status(403).json({ message: error.message });
      }
    }

    // Find the user by its ID
    const user = await User.findById(requestedUserId);

    // check if the user exist
    if (!user) {
      return res.status(404).json({ message: 'User was not found.' });
    }
    // find the user and update the informations as per the request
    const deletedUser = await User.findByIdAndDelete(userId);

    res
      .status(204)
      .json({
        message: `${user.username}'s was deleted sucessfully!`,
        deletedUser,
      });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Internal Server Error.', error: error.message });
  }
};

const deleteAllUsers = async (req, res) => {
  try {
    if (process.env.NODE_ENV !== 'test') {
      return res.status(400).json({ message: 'This endpoint is only available in test environment' });
    }

    await User.deleteMany();
    res.status(204).json({ message: 'All users deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  uploadProfileImage,
  searchUsers,
  getAllUsers,
  getUser,
  editUser,
  deleteUser,
  deleteAllUsers,
};
