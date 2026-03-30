const getAllowedGoogleDomains = () => {
  const rawDomains = process.env.GOOGLE_ALLOWED_DOMAINS || 'gmail.com';
  return rawDomains
    .split(',')
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean);
};

const isAllowedGoogleEmail = (email) => {
  if (typeof email !== 'string') {
    return false;
  }

  const normalized = email.trim().toLowerCase();
  const atIndex = normalized.lastIndexOf('@');
  if (atIndex <= 0 || atIndex === normalized.length - 1) {
    return false;
  }

  const domain = normalized.slice(atIndex + 1);
  return getAllowedGoogleDomains().includes(domain);
};

module.exports = {
  getAllowedGoogleDomains,
  isAllowedGoogleEmail,
};
