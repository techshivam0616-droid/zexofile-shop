import React, { useState, useEffect, useRef } from "react";
import { Star, MessageSquare, Send } from "lucide-react";
import { ref, onValue, push } from "firebase/database";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Feedback {
  id: string;
  name: string;
  text: string;
  rating: number;
  approved: boolean;
  createdAt: number;
  userId?: string;
}

const FeedbackSection: React.FC = () => {
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = onValue(ref(db, "feedbacks"), (snap) => {
      const data = snap.val();
      if (data) {
        const list: Feedback[] = Object.entries(data)
          .map(([id, val]: any) => ({ id, ...val }))
          .filter((f: Feedback) => f.approved === true)
          .sort((a, b) => b.createdAt - a.createdAt);
        setFeedbacks(list);
      } else {
        setFeedbacks([]);
      }
    });
    return () => unsub();
  }, []);

  // Auto-scroll horizontally
  useEffect(() => {
    if (feedbacks.length <= 1) return;
    const el = scrollRef.current;
    if (!el) return;
    
    let animationId: number;
    let scrollPos = 0;
    const speed = 0.5;

    const animate = () => {
      scrollPos += speed;
      if (scrollPos >= el.scrollWidth - el.clientWidth) {
        scrollPos = 0;
      }
      el.scrollLeft = scrollPos;
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    const handleMouseEnter = () => cancelAnimationFrame(animationId);
    const handleMouseLeave = () => { animationId = requestAnimationFrame(animate); };

    el.addEventListener("mouseenter", handleMouseEnter);
    el.addEventListener("mouseleave", handleMouseLeave);
    el.addEventListener("touchstart", handleMouseEnter);
    el.addEventListener("touchend", handleMouseLeave);

    return () => {
      cancelAnimationFrame(animationId);
      el.removeEventListener("mouseenter", handleMouseEnter);
      el.removeEventListener("mouseleave", handleMouseLeave);
      el.removeEventListener("touchstart", handleMouseEnter);
      el.removeEventListener("touchend", handleMouseLeave);
    };
  }, [feedbacks]);

  const handleSubmit = async () => {
    if (!name.trim() || !text.trim()) {
      toast.error("Please fill all fields");
      return;
    }
    setSubmitting(true);
    try {
      await push(ref(db, "feedbacks"), {
        name: name.trim(),
        text: text.trim(),
        rating,
        approved: false,
        createdAt: Date.now(),
        userId: user?.uid || null,
      });
      toast.success("Feedback submitted! It will appear after admin approval.");
      setName("");
      setText("");
      setRating(5);
      setShowForm(false);
    } catch (err: any) {
      toast.error("Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="py-10">
      <h2 className="text-2xl sm:text-3xl font-bold text-foreground text-center flex items-center justify-center gap-2 px-4">
        <MessageSquare size={24} /> Customer Feedback
      </h2>
      <p className="text-muted-foreground text-center mt-1 mb-6 px-4">See what our customers say</p>

      {/* Horizontal scrolling feedbacks */}
      {feedbacks.length > 0 ? (
        <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-4 px-4 scrollbar-hide" style={{ scrollBehavior: "auto" }}>
          {feedbacks.map((f) => (
            <div key={f.id} className="min-w-[280px] max-w-[300px] bg-muted rounded-xl p-5 shrink-0">
              <div className="flex gap-1 mb-3">
                {Array.from({ length: f.rating }).map((_, j) => (
                  <Star key={j} size={16} fill="hsl(var(--rating))" stroke="hsl(var(--rating))" />
                ))}
              </div>
              <p className="text-sm text-foreground leading-relaxed mb-3">"{f.text}"</p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                  {f.name[0]?.toUpperCase()}
                </div>
                <span className="text-sm font-medium text-foreground">{f.name}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4 px-4">No feedbacks yet. Be the first!</p>
      )}

      {/* Submit Feedback */}
      <div className="text-center mt-6 px-4">
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-medium inline-flex items-center gap-2"
          >
            <Send size={14} /> Give Feedback
          </button>
        ) : (
          <div className="max-w-md mx-auto bg-muted rounded-xl p-4 space-y-3">
            <input
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground outline-none"
            />
            <textarea
              placeholder="Write your feedback..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground outline-none min-h-[80px]"
            />
            <div className="flex items-center gap-2">
              <span className="text-sm text-foreground">Rating:</span>
              {[1, 2, 3, 4, 5].map((r) => (
                <button key={r} onClick={() => setRating(r)}>
                  <Star size={20} fill={r <= rating ? "hsl(var(--rating))" : "transparent"} stroke="hsl(var(--rating))" />
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Feedback"}
              </button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2.5 border border-border rounded-lg text-sm text-muted-foreground">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default FeedbackSection;
