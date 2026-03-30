const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Get token from localStorage
const getAuthToken = () => {
  const user = localStorage.getItem('mindbridge_user');
  return user ? JSON.parse(user).token : null;
};

// Set token in localStorage
const setAuthToken = (token, user) => {
  localStorage.setItem('mindbridge_token', token);
  localStorage.setItem('mindbridge_user', JSON.stringify({ ...user, token }));
};

// API call helper
const apiCall = async (endpoint, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (options.headers) {
    Object.assign(headers, options.headers as Record<string, string>);
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API call failed');
  }

  return response.json();
};

// Auth APIs
export const authAPI = {
  youthLogin: async (data) => {
    const result = await apiCall('/auth/youth-login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setAuthToken(result.token, result.user);
    return result;
  },

  mentorLogin: async (email, password, name, expertise) => {
    const result = await apiCall('/auth/mentor-login', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, expertise }),
    });
    setAuthToken(result.token, result.user);
    return result;
  },

  mentorGoogleLogin: async (data) => {
    const result = await apiCall('/auth/mentor-google-login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setAuthToken(result.token, result.user);
    return result;
  },

  adminLogin: async (email, password, adminKey) => {
    const result = await apiCall('/auth/admin-login', {
      method: 'POST',
      body: JSON.stringify({ email, password, adminKey }),
    });
    setAuthToken(result.token, result.user);
    return result;
  },

  guestLogin: async () => {
    const result = await apiCall('/auth/guest-login', {
      method: 'POST',
    });
    setAuthToken(result.token, result.user);
    return result;
  },

  googleLogin: async (data) => {
    const result = await apiCall('/auth/google-login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setAuthToken(result.token, result.user);
    return result;
  },

  verify: async () => {
    return apiCall('/auth/verify');
  },
};

// Youth APIs
export const youthAPI = {
  getDashboard: async () => {
    return apiCall('/youth/dashboard');
  },

  requestMentor: async () => {
    return apiCall('/youth/request-mentor', {
      method: 'POST',
    });
  },

  getMatchedMentors: async () => {
    return apiCall('/youth/matched-mentors');
  },

  assignMentor: async (mentorId) => {
    return apiCall('/youth/assign-mentor', {
      method: 'POST',
      body: JSON.stringify({ mentorId }),
    });
  },

  getAssignedMentor: async () => {
    return apiCall('/youth/assigned-mentor');
  },

  trackResourceExplore: async () => {
    return apiCall('/youth/activity/resource-explore', {
      method: 'POST',
    });
  },
};

// Mentor APIs
export const mentorAPI = {
  getDashboard: async () => {
    return apiCall('/mentor/dashboard');
  },

  toggleAvailability: async () => {
    return apiCall('/mentor/toggle-availability', {
      method: 'POST',
    });
  },

  getYouthDetails: async (youthId) => {
    return apiCall(`/mentor/youth/${youthId}`);
  },

  updateSessionNotes: async (assignmentId, sessionNotes) => {
    return apiCall(`/mentor/session-notes/${assignmentId}`, {
      method: 'POST',
      body: JSON.stringify({ sessionNotes }),
    });
  },

  startChatWithYouth: async (youthUserId) => {
    return apiCall('/mentor/chat/start', {
      method: 'POST',
      body: JSON.stringify({ youthUserId }),
    });
  },
};

// Admin APIs
export const adminAPI = {
  getDashboard: async () => {
    return apiCall('/admin/dashboard');
  },

  getVolunteers: async () => {
    return apiCall('/admin/volunteers');
  },

  updateVolunteerApproval: async (mentorUserId, status) => {
    return apiCall(`/admin/volunteers/${mentorUserId}/approval`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  },

  getCases: async () => {
    return apiCall('/admin/cases');
  },

  getCaseDetails: async (youthUserId) => {
    return apiCall(`/admin/cases/${youthUserId}`);
  },

  updateCaseStatus: async (youthUserId, status) => {
    return apiCall(`/admin/cases/${youthUserId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  },

  reassignCaseMentor: async (youthUserId, mentorUserId) => {
    return apiCall(`/admin/cases/${youthUserId}/reassign`, {
      method: 'POST',
      body: JSON.stringify({ mentorUserId }),
    });
  },

  exportReport: async (format = 'csv') => {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/admin/reports/export?format=${format}`, {
      method: 'GET',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      let errorMessage = 'Export failed';
      try {
        const error = await response.json();
        errorMessage = error.error || errorMessage;
      } catch (_) {
        // Keep fallback message when response is not JSON.
      }
      throw new Error(errorMessage);
    }

    return response.blob();
  },

  publishBlogPost: async (data) => {
    return apiCall('/admin/blog/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getBlogPosts: async () => {
    return apiCall('/admin/blog/posts');
  },

  getCrisisFlags: async () => {
    return apiCall('/admin/crisis-flags');
  },

  updateCrisisFlagStatus: async (flagId, status) => {
    return apiCall(`/admin/crisis-flags/${flagId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  },

  getAnalytics: async () => {
    return apiCall('/admin/analytics');
  },

  getMentors: async () => {
    return apiCall('/admin/mentors');
  },
};

// Chat APIs
export const chatAPI = {
  startChat: async (mentorId) => {
    return apiCall('/chat/start', {
      method: 'POST',
      body: JSON.stringify({ mentorId }),
    });
  },

  sendMessage: async (chatId, content, sender) => {
    return apiCall('/chat/message', {
      method: 'POST',
      body: JSON.stringify({ chatId, content, sender }),
    });
  },

  getChatHistory: async (chatId) => {
    return apiCall(`/chat/${chatId}`);
  },

  endChat: async (chatId, sessionNotes) => {
    return apiCall(`/chat/${chatId}/end`, {
      method: 'POST',
      body: JSON.stringify({ sessionNotes }),
    });
  },

  getUserChats: async () => {
    return apiCall('/chat/user/chats');
  },
};

// Mood APIs
export const moodAPI = {
  logMood: async (mood, journal) => {
    return apiCall('/mood/log', {
      method: 'POST',
      body: JSON.stringify({ mood, journal }),
    });
  },

  getMoodHistory: async (days = 30) => {
    return apiCall(`/mood/history?days=${days}`);
  },

  getMoodStats: async (days = 30) => {
    return apiCall(`/mood/stats?days=${days}`);
  },
};
