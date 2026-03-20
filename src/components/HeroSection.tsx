import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";

interface SliderItem {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  link: string;
}

interface HeroProps {
  onShopNow: () => void;
}

const HeroSection: React.FC<HeroProps> = ({ onShopNow }) => {
  const [sliders, setSliders] = useState<SliderItem[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const sliderRef = ref(db, "sliders");
    const unsub = onValue(sliderRef, (snap) => {
      const data = snap.val();
      if (data) {
        setSliders(Object.entries(data).map(([id, val]: any) => ({ id, ...val })));
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (sliders.length <= 1) return;
    const timer = setInterval(() => setCurrent((c) => (c + 1) % sliders.length), 4000);
    return () => clearInterval(timer);
  }, [sliders.length]);

  const hasSliders = sliders.length > 0;

  return (
    <section className="relative overflow-hidden">
      {hasSliders ? (
        /* Dynamic slider from admin */
        <div className="relative">
          <div className="relative aspect-[16/10] sm:aspect-[16/7] overflow-hidden">
            {sliders.map((slide, i) => (
              <div key={slide.id}
                className={`absolute inset-0 transition-opacity duration-700 ${i === current ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
                <img src={slide.imageUrl} alt={slide.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/50 to-transparent flex flex-col items-center justify-end p-6 text-center">
                  <h2 className="text-xl sm:text-3xl font-bold text-primary-foreground">{slide.title}</h2>
                  {slide.subtitle && <p className="text-sm text-primary-foreground/80 mt-1">{slide.subtitle}</p>}
                </div>
              </div>
            ))}
          </div>
          {sliders.length > 1 && (
            <>
              <button onClick={() => setCurrent((c) => (c - 1 + sliders.length) % sliders.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center text-foreground">
                <ChevronLeft size={18} />
              </button>
              <button onClick={() => setCurrent((c) => (c + 1) % sliders.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center text-foreground">
                <ChevronRight size={18} />
              </button>
              <div className="flex gap-2 justify-center mt-3 pb-2">
                {sliders.map((_, i) => (
                  <button key={i} onClick={() => setCurrent(i)}
                    className={`w-2 h-2 rounded-full transition-colors ${i === current ? "bg-foreground" : "bg-border"}`} />
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        /* Default hero */
        <div className="relative bg-gradient-to-br from-pink-100 via-purple-50 to-blue-50 px-4 py-12 sm:py-20 text-center">
          <div className="flex justify-center mb-8">
            <div className="relative w-48 h-80 sm:w-56 sm:h-96 animate-float">
              <div className="absolute inset-0 rounded-[2rem] bg-foreground shadow-2xl p-2">
                <div className="w-full h-full rounded-[1.5rem] bg-gradient-to-b from-pink-50 to-background flex flex-col items-center justify-center gap-2 p-3">
                  <p className="text-xs font-semibold text-foreground">Happy Anniversary,</p>
                  <p className="text-xs font-semibold text-foreground">Sarah & Michael</p>
                  <p className="text-[8px] text-muted-foreground text-center leading-tight mt-1">
                    To the love of my life, every moment with you is a gift. Here are some of our most cherished memories.
                  </p>
                  <div className="grid grid-cols-2 gap-1 mt-2 w-full">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="aspect-square rounded-md bg-gradient-to-br from-pink-200 to-orange-100" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <h1 className="text-2xl sm:text-4xl font-bold text-foreground leading-tight max-w-lg mx-auto">
            A Personal Website, Made Just for Them
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-3 max-w-md mx-auto">
            One <strong className="text-foreground">beautiful link</strong> that holds memories, emotions, and moments.
          </p>
          <div className="flex gap-2 justify-center mt-4">
            <span className="w-2 h-2 rounded-full bg-foreground" />
            <span className="w-2 h-2 rounded-full bg-border" />
            <span className="w-2 h-2 rounded-full bg-border" />
          </div>
        </div>
      )}

      {/* CTA section */}
      <div className="px-4 py-10 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
          Fully Customisable Links<br />For Your Favourite Person
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground mt-4 max-w-md mx-auto">
          Turn photos, messages, and emotions into a beautiful personal link. Get Something cool, browse through our collections!
        </p>
        <button onClick={onShopNow}
          className="mt-6 px-10 py-3.5 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:opacity-90 transition-opacity">
          Shop Now
        </button>
      </div>
    </section>
  );
};

export default HeroSection;
