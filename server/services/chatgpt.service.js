const OpenAI = require('openai');

// Initialize OpenAI client with your API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateResponse(prompt) {
  // For testing routing without making API calls
  // console.log("Mock generateResponse called with prompt:", prompt);
  // return "This is a mock response from the ChatGPT service.";
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.7,
    });
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw error;
  }
}
// This function is used to generate a response from the OpenAI API
module.exports = {
  generateResponse,
};
