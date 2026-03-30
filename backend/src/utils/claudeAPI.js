const axios = require('axios');

const GROQ_API_URL = process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

const DOMAIN_RESTRICTED_REPLY = 'AI Bridge is limited to emotional wellbeing, stress, relationships, study pressure, and safety support. Please share what you are feeling in those areas so I can help.';

const SUPPORT_DOMAIN_KEYWORDS = [
  'stress', 'stressed', 'anxiety', 'anxious', 'panic', 'sad', 'depressed', 'depression',
  'lonely', 'loneliness', 'grief', 'loss', 'trauma', 'fear', 'worried', 'worry', 'overthinking',
  'emotion', 'mental', 'health', 'self harm', 'self-harm', 'suicide', 'hurt myself',
  'family', 'friend', 'relationship', 'breakup', 'bully', 'bullying',
  'study', 'school', 'college', 'exam', 'academic', 'career',
  'sleep', 'burnout', 'tired', 'wellbeing', 'well-being', 'support', 'mentor',
  'home safety', 'unsafe', 'abuse', 'violence'
];

const extractLatestYouthMessage = (messages) => {
  if (!Array.isArray(messages)) {
    return '';
  }

  const latest = [...messages].reverse().find((msg) => msg?.sender === 'youth');
  return typeof latest?.content === 'string' ? latest.content : '';
};

const isWithinSupportDomain = (content) => {
  const normalized = (content || '').trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  return SUPPORT_DOMAIN_KEYWORDS.some((keyword) => normalized.includes(keyword));
};

const normalizeMessages = (messages) => (
  Array.isArray(messages)
    ? messages.map((msg) => ({
        role: msg.sender === 'youth' ? 'user' : 'assistant',
        content: String(msg.content || ''),
      }))
    : []
);

const isGroqConfigured = () => (
  Boolean(process.env.GROQ_API_KEY) && process.env.GROQ_API_KEY !== 'replace-with-your-groq-key'
);

const callGroq = async ({ systemPrompt, messages, maxTokens }) => {
  const response = await axios.post(
    GROQ_API_URL,
    {
      model: GROQ_MODEL,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      temperature: 0.4,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return response?.data?.choices?.[0]?.message?.content?.trim() || null;
};

// Groq API integration for AI Bridge responses
const getAIResponse = async (messages, userContext = '') => {
  try {
    if (!isGroqConfigured()) {
      return 'AI Bridge is not configured yet. Please ask the admin to set GROQ_API_KEY on the server.';
    }

    const latestYouthMessage = extractLatestYouthMessage(messages);
    if (!isWithinSupportDomain(latestYouthMessage)) {
      return DOMAIN_RESTRICTED_REPLY;
    }

    const aiText = await callGroq({
      maxTokens: 700,
      systemPrompt: `You are MindBridge AI Bridge, a compassionate and calm assistant for youth mental wellbeing.
You are domain-restricted.
Allowed topics: emotional wellbeing, anxiety, stress, relationships, grief, academic pressure, loneliness, safety support, coping strategies, and helpline guidance.
Do not provide responses for unrelated domains like coding, business, politics, sports betting, legal strategy, or hacking.
If the user asks outside scope, respond with this exact sentence: ${DOMAIN_RESTRICTED_REPLY}
Never claim to be human, doctor, therapist, or emergency service.
If the user expresses crisis or self-harm intent, respond empathetically and urge immediate helpline or trusted-adult contact.
User context: ${userContext || 'Not provided'}`,
      messages: normalizeMessages(messages),
    });

    return aiText || 'I understand this is difficult. If you want, we can take one small step together right now.';
  } catch (error) {
    console.error('Error calling Groq API:', error?.response?.data || error.message);
    return 'I understand this is difficult. Please reach out to a mentor or helpline for immediate support.';
  }
};

const generateCaseSummary = async (chatHistory, youthIssues) => {
  try {
    if (!isGroqConfigured()) {
      return 'Summary generation skipped because GROQ_API_KEY is not configured.';
    }

    const issues = Array.isArray(youthIssues) ? youthIssues : [];
    const summary = await callGroq({
      maxTokens: 500,
      systemPrompt: 'You are a clinical support summarizer. Produce a brief, objective handover note with key themes, risk cues, and next-step suggestions. Keep it non-judgmental.',
      messages: [{
        role: 'user',
        content: `Chat history:\n${chatHistory}\n\nMain issues: ${issues.join(', ') || 'Not provided'}\n\nGenerate a concise case summary for mentor handover.`,
      }],
    });

    return summary || 'Summary generation failed. Please review chat history manually.';
  } catch (error) {
    console.error('Error generating summary:', error);
    return 'Summary generation failed. Please review chat history manually.';
  }
};

module.exports = { getAIResponse, generateCaseSummary, isGroqConfigured };
