import React, { useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ref, push } from "firebase/database";
import { db } from "@/lib/firebase";

interface CustomProjectModalProps {
  open: boolean;
  onClose: () => void;
}

const CustomProjectModal: React.FC<CustomProjectModalProps> = ({ open, onClose }) => {
  const { user } = useAuth();
  const [form, setForm] = useState({ title: "", type: "website", description: "", budget: "", contact: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    await push(ref(db, "customProjects"), {
      ...form,
      userId: user.uid,
      userEmail: user.email,
      status: "pending",
      createdAt: Date.now(),
    });
    setSubmitted(true);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-foreground/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-background rounded-2xl w-full max-w-md p-6 relative animate-fade-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground"><X size={20} /></button>

        <h2 className="text-xl font-bold text-foreground mb-2">Custom Project Request</h2>
        <p className="text-sm text-muted-foreground mb-6">Tell us about your dream project</p>

        {submitted ? (
          <div className="text-center py-8">
            <p className="text-4xl mb-3">✅</p>
            <p className="text-lg font-semibold text-foreground">Request Submitted!</p>
            <p className="text-sm text-muted-foreground mt-2">We'll get back to you soon.</p>
            <button onClick={onClose} className="mt-6 px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm">Close</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input placeholder="Project Title" required value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-3 border border-border rounded-lg text-sm bg-background text-foreground outline-none" />
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full px-4 py-3 border border-border rounded-lg text-sm bg-background text-foreground outline-none">
              <option value="website">Website</option>
              <option value="app">App</option>
              <option value="other">Other</option>
            </select>
            <textarea placeholder="Describe your project..." required value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-3 border border-border rounded-lg text-sm bg-background text-foreground outline-none min-h-[100px]" />
            <input placeholder="Budget Range (e.g., ₹5000 - ₹10000)" required value={form.budget}
              onChange={(e) => setForm({ ...form, budget: e.target.value })}
              className="w-full px-4 py-3 border border-border rounded-lg text-sm bg-background text-foreground outline-none" />
            <input placeholder="Contact (Phone/Email)" required value={form.contact}
              onChange={(e) => setForm({ ...form, contact: e.target.value })}
              className="w-full px-4 py-3 border border-border rounded-lg text-sm bg-background text-foreground outline-none" />
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium text-sm disabled:opacity-50">
              {loading ? "Submitting..." : "Submit Request"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default CustomProjectModal;
