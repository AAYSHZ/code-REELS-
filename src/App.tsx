import { useState, useEffect } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import BlobCursor from "@/components/effects/BlobCursor";
import SplashScreen from "@/components/SplashScreen";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Profile from "@/pages/Profile";
import Leaderboard from "@/pages/Leaderboard";
import Challenges from "@/pages/Challenges";
import Rewards from "@/pages/Rewards";
import SearchPage from "@/pages/Search";
import ReelDetail from "@/pages/ReelDetail";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const checkAuthAndRoute = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      timer = setTimeout(() => {
        setIsLoading(false);

        // If user is at root, login, or register, handle routing based on session
        const publicPaths = ['/login', '/register', '/'];
        const isPublicPath = publicPaths.includes(location.pathname);

        if (session && isPublicPath) {
          navigate('/home', { replace: true });
        } else if (!session && location.pathname !== '/login' && location.pathname !== '/register') {
          navigate('/login', { replace: true });
        }
      }, 2500);
    };

    checkAuthAndRoute();

    return () => clearTimeout(timer);
  }, []); // Run once on mount

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <SplashScreen key="splash" />
      ) : (
        <div className="dark">
          <BlobCursor color="#6c63ff" />
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile/:userId" element={<Profile />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/challenges" element={<Challenges />} />
            <Route path="/rewards" element={<Rewards />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/reel/:reelId" element={<ReelDetail />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      )}
    </AnimatePresence>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
