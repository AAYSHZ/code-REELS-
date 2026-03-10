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
import Auth from "@/pages/Auth";
import Profile from "@/pages/Profile";
import Leaderboard from "@/pages/Leaderboard";
import Challenges from "@/pages/Challenges";
import Rewards from "@/pages/Rewards";
import SearchPage from "@/pages/Search";
import ReelDetail from "@/pages/ReelDetail";
import Admin from "@/pages/Admin";
import Messages from "@/pages/Messages";
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

        const authPaths = ['/auth', '/login', '/register'];
        const isAuthPath = authPaths.includes(location.pathname);

        if (session) {
          // Logged in: redirect away from auth pages to /home
          if (isAuthPath || location.pathname === '/') {
            navigate('/home', { replace: true });
          }
        } else {
          // Not logged in: redirect everything except /auth to /auth
          if (!isAuthPath) {
            navigate('/auth', { replace: true });
          }
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
            <Route path="/auth" element={<Auth />} />
            {/* Keep old routes as fallbacks that redirect via the useEffect above */}
            <Route path="/login" element={<Auth />} />
            <Route path="/register" element={<Auth />} />
            <Route path="/profile/:userId" element={<Profile />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/challenges" element={<Challenges />} />
            <Route path="/rewards" element={<Rewards />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/reel/:reelId" element={<ReelDetail />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/messages" element={<Messages />} />
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
