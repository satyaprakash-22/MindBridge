import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { chatAPI } from "@/services/api";
import { ArrowLeft, Send } from "lucide-react";

const quickEmojis = ["😊", "😞", "😰", "💙", "🫂", "🙏", "✨", "👍", "😤", "📚", "💔", "🏠"];

type ChatMessage = {
  id: string;
  sender: string;
  content: string;
  createdAt: string;
};

const Chat = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const user = useMemo(() => {
    const raw = localStorage.getItem("mindbridge_user");
    if (!raw) return { role: "youth" };
    try {
      const parsed = JSON.parse(raw);
      return { role: parsed.role || "youth" };
    } catch {
      return { role: "youth" };
    }
  }, []);

  const userRole = user.role;

  useEffect(() => {
    if (!chatId) {
      return;
    }

    const loadChat = async () => {
      try {
        const result = await chatAPI.getChatHistory(chatId);
        setMessages(result.chat?.messages || []);
      } catch (error) {
        toast({
          title: "Unable to load chat",
          description: error instanceof Error ? error.message : "Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadChat();

    const intervalId = window.setInterval(loadChat, 3000);
    return () => window.clearInterval(intervalId);
  }, [chatId, toast]);

  const send = async () => {
    if (!chatId || !input.trim() || isSending) {
      return;
    }

    setIsSending(true);
    try {
      const payload = input.trim();
      setInput("");
      const result = await chatAPI.sendMessage(chatId, payload, userRole);

      if (result.aiResponse) {
        setMessages((prev) => [
          ...prev,
          result.message,
          {
            id: `${Date.now()}`,
            sender: result.aiResponse.sender,
            content: result.aiResponse.content,
            createdAt: new Date().toISOString(),
          },
        ]);
      } else {
        setMessages((prev) => [...prev, result.message]);
      }

      if (result.crisisAlert?.detected) {
        toast({
          title: "Crisis support triggered",
          description: "We detected urgent language and flagged support immediately.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Message failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const addEmoji = (emoji: string) => {
    setInput((prev) => `${prev}${emoji}`);
  };

  const backPath = userRole === "mentor" ? "/mentor-portal" : "/dashboard";

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate(backPath)} className="rounded-full">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <p className="text-sm text-muted-foreground">Private Mentor Chat</p>
      </div>

      <div className="flex h-[60vh] flex-col rounded-2xl border border-border bg-card">
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading messages...</p>
          ) : messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">No messages yet. Start the conversation.</p>
          ) : (
            messages.map((m) => {
              const isSelf = m.sender === userRole;
              return (
                <div key={m.id} className={`flex ${isSelf ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                      isSelf ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                    }`}
                  >
                    <p>{m.content}</p>
                    <p className="mt-1 text-[10px] opacity-70">{new Date(m.createdAt).toLocaleTimeString()}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="border-t border-border p-3">
          <div className="mb-2 flex flex-wrap gap-1">
            {quickEmojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => addEmoji(emoji)}
                className="rounded-full border border-border px-2 py-0.5 text-sm hover:bg-muted"
              >
                {emoji}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <Button onClick={send} disabled={!input.trim() || isSending} className="rounded-full">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
