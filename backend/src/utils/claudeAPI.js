const axios = require('axios');

// Claude API integration for chatbot responses
const getAIResponse = async (messages, userContext = '') => {
  try {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        system: `You are MindBridge, a compassionate AI assistant helping youth with mental health concerns. You are empathetic, non-judgmental, and supportive. 
        User context: ${userContext}
        If the user mentions crisis keywords (suicide, self-harm, etc.), respond with empathy and suggest they contact a helpline immediately.`,
        messages: messages.map(msg => ({
          role: msg.sender === 'youth' ? 'user' : 'assistant',
          content: msg.content
        }))
      },
      {
        headers: {
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'x-api-key': process.env.CLAUDE_API_KEY
        }
      }
    );

    return response.data.content[0].text;
  } catch (error) {
    console.error('Error calling Claude API:', error);
    return 'I understand this is difficult. Please reach out to a mentor or helpline for immediate support.';
  }
};

const generateCaseSummary = async (chatHistory, youthIssues) => {
  try {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 500,
        system: 'You are a clinical summarizer. Generate a brief, objective case summary for mentor handover.',
        messages: [{
          role: 'user',
          content: `Chat history: ${chatHistory}\n\nMain issues: ${youthIssues.join(', ')}\n\nBased on this, generate a concise case summary for the mentor.`
        }]
      },
      {
        headers: {
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'x-api-key': process.env.CLAUDE_API_KEY
        }
      }
    );

    return response.data.content[0].text;
  } catch (error) {
    console.error('Error generating summary:', error);
    return 'Summary generation failed. Please review chat history manually.';
  }
};

module.exports = { getAIResponse, generateCaseSummary };
