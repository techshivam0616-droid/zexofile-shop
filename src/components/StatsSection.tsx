import React from "react";
import { Package, Truck, Star } from "lucide-react";

const StatsSection: React.FC = () => {
  return (
    <section className="px-4 py-10">
      <div className="bg-stats rounded-2xl p-8 text-center space-y-6 max-w-lg mx-auto">
        <div className="flex flex-col items-center gap-1">
          <Package size={28} className="text-foreground mb-1" />
          <p className="text-2xl font-bold text-foreground">6000+</p>
          <p className="text-sm font-semibold text-foreground">Fulfilled Orders</p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Truck size={28} className="text-foreground mb-1" />
          <p className="text-lg font-semibold text-foreground">Fast</p>
          <p className="text-sm font-semibold text-foreground">Delivery</p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Star size={28} className="text-foreground mb-1" />
          <p className="text-lg font-semibold text-foreground">Overall Rating</p>
          <p className="text-2xl font-bold text-rating">4.95</p>
          <p className="text-xs text-muted-foreground">Rated by 150+ customers</p>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
