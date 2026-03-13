import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { StoreProvider } from "@/context/StoreContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { BottomNav } from "@/components/BottomNav";
import LandingPage from "@/pages/LandingPage";
import InventoryPage from "@/pages/InventoryPage";
import POSPage from "@/pages/POSPage";
import MovementsPage from "@/pages/MovementsPage";
import DashboardPage from "@/pages/DashboardPage";
import AuthPage from "@/pages/AuthPage";
import VerificationPage from "@/pages/VerificationPage";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user, loading, isApproved } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // Not logged in: show landing + auth
  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // Logged in but not approved: verification gate
  if (!isApproved) {
    return (
      <Routes>
        <Route path="/verification" element={<VerificationPage />} />
        <Route path="*" element={<Navigate to="/verification" replace />} />
      </Routes>
    );
  }

  // Approved: full dashboard access
  return (
    <>
      <Routes>
        <Route path="/dashboard" element={<InventoryPage />} />
        <Route path="/dashboard/sell" element={<POSPage />} />
        <Route path="/dashboard/movements" element={<MovementsPage />} />
        <Route path="/dashboard/report" element={<DashboardPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <BottomNav />
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <AuthProvider>
          <StoreProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </StoreProvider>
        </AuthProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
