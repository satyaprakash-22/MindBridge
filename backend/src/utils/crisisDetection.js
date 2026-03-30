// Crisis detection logic
const crisisKeywords = [
  'suicide', 'kill myself', 'die', 'self-harm', 'cutting', 'overdose',
  'suicide plan', 'no reason to live', 'better off dead', 'want to hurt myself',
  'harm', 'hang myself', 'jump', 'poison', 'knife', 'rope'
];

const detectCrisis = (content) => {
  const lowerContent = content.toLowerCase();
  const detectedKeywords = crisisKeywords.filter(keyword => lowerContent.includes(keyword));
  return {
    isCrisis: detectedKeywords.length > 0,
    keywords: detectedKeywords,
    score: detectedKeywords.length > 2 ? 'critical' : detectedKeywords.length > 0 ? 'high' : 'none'
  };
};

const HELPLINE_LINKS = {
  INDIA: 'https://aasra.info/',
  CRISIS_TEXT: 'https://www.crisistextline.org/',
  NATIONAL_SUICIDE_HOTLINE: '1-800-273-8255'
};

module.exports = { detectCrisis, HELPLINE_LINKS };
