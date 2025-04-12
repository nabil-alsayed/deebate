const User = require('./user');
const bcrypt = require('bcryptjs');

// This function creates a ChatGPT user if it doesn't already exist
async function createChatGPTUser() {
    try {
        const existingUser = await User.findOne({ username: 'chatgpt' });
        console.log('Existing ChatGPT user:', existingUser);

        if (!existingUser) {
            // Hash password for ChatGPT user
            const hashedPassword = await bcrypt.hash('chatgpt', 12);

            // Create a new ChatGPT user
            const chatGPTUser = new User({
                emailAddress: 'chatgpt@email.com',
                username: 'chatgpt',
                password: hashedPassword,
                firstName: 'Chat',
                lastName: 'GPT',
                role: 'user',
                profileImg: 'http://localhost:3001/uploads/1729394021188.webp',
            });

            // Save the new user to the database
            await chatGPTUser.save();
            console.log('ChatGPT user created successfully');
        } else {
            console.log('ChatGPT user already exists');
        }
    } catch (error) {
        console.error('Error creating ChatGPT user:', error);
        throw error; // Propagate error to be handled by the caller
    }
}

module.exports = createChatGPTUser;
