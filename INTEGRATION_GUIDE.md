# Frontend Backend Integration Guide

This guide shows how to connect each frontend component to the backend APIs.

## Getting Started

### 1. Update App.tsx
```typescript
import { AuthProvider } from './contexts/AuthContext';

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>  {/* Add this wrapper */}
        <Toaster />
        <Sonner />
        <BrowserRouter>
          {/* ... rest of app ... */}
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);
```

### 2. Update GetSupport.tsx (Youth Registration)

Replace the handleSubmit function:

```typescript
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const GetSupport = () => {
  const navigate = useNavigate();
  const { youthLogin } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await youthLogin({
        username,
        ageBracket,
        city,
        selectedIssues,
        language,
        supportStyle
      });
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    // ... existing JSX with loading state on submit button
  );
};
```

### 3. Update MentorLogin.tsx

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const MentorLogin = () => {
  const navigate = useNavigate();
  const { mentorLogin } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await mentorLogin(email, password);
      navigate('/mentor-portal');
    } catch (error: any) {
      toast({
        title: 'Login Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    // ... existing JSX with loading state
  );
};
```

### 4. Update AdminLogin.tsx

```typescript
import { useAuth } from '@/contexts/AuthContext';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { adminLogin } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await adminLogin(email, password, adminKey);
      navigate('/admin');
    } catch (error: any) {
      toast({
        title: 'Login Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    // ... existing JSX with loading state
  );
};
```

### 5. Update YouthDashboard.tsx

```typescript
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { youthAPI, moodAPI } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

const YouthDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [user?.id]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await youthAPI.getDashboard();
      // Update state with data.user.username, data.recentMoods
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const submitMood = async () => {
    if (!selectedMood) return;
    try {
      await moodAPI.logMood(selectedMood, journal);
      toast({ title: 'Success', description: 'Mood logged successfully' });
      setMoodSubmitted(true);
      // Refresh data
      loadDashboardData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const requestMentor = async () => {
    try {
      const result = await youthAPI.requestMentor();
      toast({
        title: 'Mentor Found!',
        description: `Matched with mentor (Score: ${result.assignment.matchScore})`
      });
      // Update mentor assignment state
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  return (
    // ... existing JSX with integrated APIs
  );
};
```

### 6. Update MentorPortal.tsx

```typescript
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { mentorAPI } from '@/services/api';

const MentorPortal = () => {
  const { user } = useAuth();
  const [youthList, setYouthList] = useState([]);
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, [user?.id]);

  const loadDashboard = async () => {
    try {
      const result = await mentorAPI.getDashboard();
      setYouthList(result.assignedYouth);
      setAvailable(result.mentor.profile.isAvailable);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  };

  const handleToggleAvailability = async () => {
    try {
      await mentorAPI.toggleAvailability();
      setAvailable(!available);
      // Show toast notification
    } catch (error) {
      console.error('Error toggling availability:', error);
    }
  };

  const handleChatClick = (youthId: string) => {
    // Navigate to chat page with youthId
    navigate(`/chat/${youthId}`);
  };

  return (
    // ... existing JSX with live data
  );
};
```

### 7. Update AdminDashboard.tsx

```typescript
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { adminAPI } from '@/services/api';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [crisisFlags, setCrisisFlags] = useState([]);

  useEffect(() => {
    loadDashboard();
    // Refresh every 30 seconds
    const interval = setInterval(loadDashboard, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const loadDashboard = async () => {
    try {
      const result = await adminAPI.getDashboard();
      setStats(result.stats);
      setCrisisFlags(result.crisisFlags);
    } catch (error) {
      console.error('Error loading admin dashboard:', error);
    }
  };

  const handleCrisisFlagStatusUpdate = async (flagId: string, newStatus: string) => {
    try {
      await adminAPI.updateCrisisFlagStatus(flagId, newStatus);
      // Update local state
      setCrisisFlags(cf => cf.map(f => f.id === flagId ? { ...f, status: newStatus } : f));
      // Show success toast
    } catch (error) {
      console.error('Error updating flag:', error);
    }
  };

  return (
    // ... existing JSX with live data and interactive updates
  );
};
```

### 8. Create New Chat.tsx Component

```typescript
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { chatAPI } from '@/services/api';
import { joinChat, sendMessage, onMessageReceived } from '@/services/socket';

const Chat = () => {
  const { chatId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChat();
    setupSocket();
  }, [chatId]);

  const loadChat = async () => {
    try {
      const result = await chatAPI.getChatHistory(chatId);
      setMessages(result.chat.messages);
    } catch (error) {
      console.error('Error loading chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupSocket = () => {
    joinChat(chatId);
    onMessageReceived((message) => {
      setMessages(prev => [...prev, message]);
    });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    try {
      const result = await chatAPI.sendMessage(
        chatId,
        input,
        user?.role === 'youth' ? 'youth' : 'mentor'
      );

      if (result.crisisAlert?.detected) {
        // Show crisis alert modal with helpline info
        showCrisisAlert(result.crisisAlert);
      }

      if (result.aiResponse) {
        setMessages(prev => [
          ...prev,
          { sender: 'ai', content: result.aiResponse.content, id: Date.now().toString() }
        ]);
      }

      setInput('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.sender === user?.role ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs p-3 rounded-lg ${
              msg.sender === user?.role
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-foreground'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 p-2 border rounded"
          disabled={loading}
        />
        <button type="submit" className="btn" disabled={loading || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
};

export default Chat;
```

### 9. Add Chat Route to App.tsx

```typescript
import Chat from './pages/Chat';

const App = () => (
  <Routes>
    {/* ... existing routes ... */}
    <Route path="/chat/:chatId" element={<Chat />} />
  </Routes>
);
```

## Crisis Alert Handling

When a crisis is detected, show a modal:

```typescript
const showCrisisAlert = (crisisAlert: any) => {
  const modal = (
    <Dialog open={true} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>We Are Here For You</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p>We've detected that you may be in crisis. Please reach out for help:</p>
          <div className="space-y-2">
            <a href={crisisAlert.flag.helplineLink} target="_blank" className="btn btn-primary block">
              📞 Contact Helpline
            </a>
            <a href="tel:1-800-273-8255" target="_blank" className="btn btn-secondary block">
              Call: 1-800-273-8255 (US)
            </a>
          </div>
          <p className="text-sm text-muted-foreground">
            Your response will be reviewed by a trained counselor immediately.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
```

## Data Flow Example: Youth Registration to Mentor Match

1. Youth fills out GetSupport form
2. Clicks "Get Started" → calls `authAPI.youthLogin()`
3. Backend creates User, YouthProfile, CaseHistory
4. Returns JWT token → stored in localStorage
5. Frontend redirects to `/dashboard`
6. YouthDashboard loads dashboard data
7. Youth clicks "Request Mentor" → calls `youthAPI.requestMentor()`
8. Backend:
   - Finds all available mentors
   - Calculates match scores
   - Creates Assignment
   - Returns assigned mentor info
9. Frontend shows "Mentor Found!" toast with match details

## State Management Recommendation

Use React Query for server state:

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';

const MentorPortal = () => {
  const { data: dashboard } = useQuery({
    queryKey: ['mentor-dashboard'],
    queryFn: () => mentorAPI.getDashboard()
  });

  const toggleAvailability = useMutation({
    mutationFn: () => mentorAPI.toggleAvailability(),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['mentor-dashboard'] });
    }
  });

  return (
    // ... JSX using dashboard data and toggleAvailability mutation
  );
};
```

## Build & Deploy

### Frontend Build
```bash
cd the-foundry-forge-main
npm run build
# Creates dist/ folder for deployment
```

### Backend Start for Production
```bash
cd backend
npm start
# Runs with Node (not nodemon)
```

## Debugging Tips

1. **Check Network Tab**: See actual API calls and responses
2. **Browser Console**: Look for JavaScript errors
3. **Backend Logs**: `npm run dev` shows request logs
4. **Database**: `npx prisma studio` to inspect data directly
5. **Token Issues**: Check localStorage for valid token

## Next Steps

1. ✅ Backend & Database setup
2. ✅ API integration code provided
3. ✅ Real-time chat with Socket.IO ready
4. ✅ Crisis detection implemented
5. 📝 TODO: Update all components with API calls
6. 📝 TODO: Add error handling & loading states
7. 📝 TODO: Test all user flows
8. 📝 TODO: Deploy to production

---

For complete backend documentation, see [Backend SETUP.md](../backend/SETUP.md)
