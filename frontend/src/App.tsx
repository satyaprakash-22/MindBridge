import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SafetyButton from "@/components/SafetyButton";
import Landing from "./pages/Landing";
import About from "./pages/About";
import GetSupport from "./pages/GetSupport";
import YouthDashboard from "./pages/YouthDashboard";
import MentorLogin from "./pages/MentorLogin";
import MentorPortal from "./pages/MentorPortal";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import Chat from "./pages/Chat";
import FindMentor from "./pages/FindMentor";
import Resources from "./pages/Resources";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

type StoredUser = {
  role?: "youth" | "mentor" | "admin";
  token?: string;
};

const getStoredSession = (): { token: string | null; role: StoredUser["role"] } => {
  const fallbackToken = localStorage.getItem("mindbridge_token");
  const rawUser = localStorage.getItem("mindbridge_user");

  if (!rawUser) {
    return {
      token: fallbackToken && fallbackToken.trim().length > 0 ? fallbackToken : null,
      role: undefined,
    };
  }

  try {
    const parsed = JSON.parse(rawUser) as StoredUser;
    const parsedToken = typeof parsed?.token === "string" ? parsed.token : null;

    return {
      token: parsedToken || (fallbackToken && fallbackToken.trim().length > 0 ? fallbackToken : null),
      role: parsed?.role,
    };
  } catch (_) {
    localStorage.removeItem("mindbridge_user");
    localStorage.removeItem("mindbridge_token");
    return { token: null, role: undefined };
  }
};

const ProtectedRoute = ({
  children,
  allowedRoles,
}: {
  children: JSX.Element;
  allowedRoles?: Array<"youth" | "mentor" | "admin">;
}) => {
  const session = getStoredSession();

  if (!session.token) {
    return <Navigate to="/get-support" replace />;
  }

  if (allowedRoles && (!session.role || !allowedRoles.includes(session.role))) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter>
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/about" element={<About />} />
              <Route path="/get-support" element={<GetSupport />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={["youth"]}>
                    <YouthDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/resources"
                element={
                  <ProtectedRoute allowedRoles={["youth"]}>
                    <Resources />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/find-mentor"
                element={
                  <ProtectedRoute allowedRoles={["youth"]}>
                    <FindMentor />
                  </ProtectedRoute>
                }
              />
              <Route path="/mentor-login" element={<MentorLogin />} />
              <Route
                path="/mentor-portal"
                element={
                  <ProtectedRoute allowedRoles={["mentor"]}>
                    <MentorPortal />
                  </ProtectedRoute>
                }
              />
              <Route path="/admin-login" element={<AdminLogin />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chat/:chatId"
                element={
                  <ProtectedRoute>
                    <Chat />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
        <SafetyButton />
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
