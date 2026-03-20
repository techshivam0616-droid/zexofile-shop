import React from "react";
import { Star, MessageCircle, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Aditi",
    text: "Absolutely love this product! The quality exceeded my expectations and the customer service was outstanding.",
    rating: 5,
  },
  {
    name: "Rahul",
    text: "It was honestly so creative and hearttouching, felt really special. Thank you so much for putting your effort into making it so adorable.",
    rating: 5,
  },
  {
    name: "Priya",
    text: "Everything worked, finally!! I can't thank you enough for this. You're literally doing a great job. Just can't thank you enough. I will buy once again if I get a chance.",
    rating: 5,
  },
];

const TestimonialsSection: React.FC = () => {
  return (
    <section className="px-4 py-10">
      <h2 className="text-2xl sm:text-3xl font-bold text-foreground text-center flex items-center justify-center gap-2">
        <MessageCircle size={24} /> Customer Testimonials
      </h2>
      <p className="text-muted-foreground text-center mt-1 mb-8">Some reviews from our recent customers</p>

      <div className="space-y-6 max-w-lg mx-auto">
        {testimonials.map((t, i) => (
          <div key={i} className="text-center">
            <div className="bg-foreground rounded-xl p-4 mx-auto max-w-sm mb-4 relative">
              <Quote size={16} className="text-muted-foreground absolute top-2 left-3 opacity-30" />
              <p className="text-primary-foreground text-sm text-left leading-relaxed pl-4">"{t.text}"</p>
            </div>

            <div className="flex justify-center gap-1 mb-2">
              {Array.from({ length: t.rating }).map((_, j) => (
                <Star key={j} size={20} fill="hsl(var(--rating))" stroke="hsl(var(--rating))" />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">{t.text.slice(0, 80)}...</p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <div className="w-8 h-8 rounded-full bg-rating flex items-center justify-center text-sm font-bold text-accent-foreground">
                {t.name[0]}
              </div>
              <span className="text-sm font-medium text-foreground">{t.name}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 text-center">
        <h3 className="text-xl font-semibold text-foreground">Some more feedbacks... and counting..</h3>
      </div>
    </section>
  );
};

export default TestimonialsSection;
