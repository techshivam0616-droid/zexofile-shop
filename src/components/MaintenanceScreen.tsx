import React, { useState } from "react";
import { Wrench, Lock, AlertTriangle, Mail } from "lucide-react";
import AuthModal from "@/components/AuthModal";

interface MaintenanceScreenProps {
  onAdminLogin: () => void;
  authOpen: boolean;
  onAuthClose: () => void;
}

const MaintenanceScreen: React.FC<MaintenanceScreenProps> = ({ onAdminLogin, authOpen, onAuthClose }) => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md mx-auto">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
          <Wrench size={36} className="text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-3">Under Maintenance</h1>
        <p className="text-muted-foreground mb-2">
          We're currently performing some updates to serve you better.
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          Please check back shortly. For urgent queries, reach us at{" "}
          <a href="mailto:ZexoFile@gmail.com" className="underline text-foreground">ZexoFile@gmail.com</a>
        </p>

        <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center mb-6">
          <AlertTriangle size={14} />
          <span>Expected to be back online soon</span>
        </div>

        {/* Admin login below maintenance */}
        <div className="border-t pt-6 mt-6">
          <button
            onClick={onAdminLogin}
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
          >
            <Lock size={14} /> Admin Login
          </button>
        </div>
      </div>

      <AuthModal open={authOpen} onClose={onAuthClose} />
    </div>
  );
};

export default MaintenanceScreen;
