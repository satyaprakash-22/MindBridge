import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/about" element={<About />} />
              <Route path="/get-support" element={<GetSupport />} />
              <Route path="/dashboard" element={<YouthDashboard />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/find-mentor" element={<FindMentor />} />
              <Route path="/mentor-login" element={<MentorLogin />} />
              <Route path="/mentor-portal" element={<MentorPortal />} />
              <Route path="/admin-login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/chat/:chatId" element={<Chat />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
        <SafetyButton />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
