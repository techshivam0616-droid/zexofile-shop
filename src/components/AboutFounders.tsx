import React from "react";
import { Award, Code, Globe, Smartphone, Sparkles, Users, Rocket, Star } from "lucide-react";
import niteshImg from "@/assets/nitesh.png";
import shivamImg from "@/assets/shivam.png";

const founders = [
  { name: "Nitesh Prakash", role: "Co-Founder & CEO", expertise: "Full-Stack Web Developer", image: niteshImg },
  { name: "Shivam Kumar", role: "Co-Founder & CEO", expertise: "App & Web Developer", image: shivamImg },
];

const skills = [
  { icon: <Globe size={20} />, label: "Website Development" },
  { icon: <Smartphone size={20} />, label: "App Development" },
  { icon: <Code size={20} />, label: "Full-Stack Solutions" },
  { icon: <Sparkles size={20} />, label: "UI/UX Design" },
];

const AboutFounders: React.FC = () => {
  return (
    <section className="px-4 py-12">
      <h2 className="text-2xl font-bold text-foreground text-center mb-2 flex items-center justify-center gap-2">
        <Users size={22} /> Meet Our Founders
      </h2>
      <p className="text-sm text-muted-foreground text-center mb-8">The minds behind ZexoFile Shop</p>

      {/* Founder Cards with Photos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto mb-8">
        {founders.map((f, i) => (
          <div
            key={f.name}
            className="bg-muted rounded-xl overflow-hidden border border-border hover:shadow-md transition-all duration-300 hover:-translate-y-1 animate-fade-in"
            style={{ animationDelay: `${i * 150}ms` }}
          >
            <div className="relative aspect-[3/4] overflow-hidden">
              <img src={f.image} alt={f.name} className="w-full h-full object-cover" loading="lazy" />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-foreground/70 to-transparent p-4">
                <p className="text-sm font-bold text-white text-center">{f.name}</p>
                <p className="text-xs text-white/80 text-center">{f.role}</p>
              </div>
            </div>
            <div className="p-4 text-center">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <Award size={20} className="text-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">{f.expertise}</p>
            </div>
          </div>
        ))}
      </div>

      {/* About Section */}
      <div className="max-w-lg mx-auto bg-muted rounded-xl p-6 border border-border mb-8 animate-fade-in" style={{ animationDelay: "300ms" }}>
        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <Rocket size={16} /> About ZexoFile
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          ZexoFile Shop is a premium digital products store founded by <strong className="text-foreground">Nitesh Prakash</strong> and <strong className="text-foreground">Shivam Kumar</strong> — two passionate developers who specialize in building modern websites, mobile apps, and custom digital solutions.
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed mt-2">
          With years of experience in full-stack development, we create pixel-perfect, production-ready digital products that help businesses and individuals stand out online. From ready-made website templates to custom-built applications, we deliver quality that speaks for itself.
        </p>
      </div>

      {/* Expertise Grid */}
      <div className="max-w-lg mx-auto">
        <h3 className="text-sm font-bold text-foreground mb-4 text-center flex items-center justify-center gap-2">
          <Star size={16} /> Our Expertise
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {skills.map((s, i) => (
            <div
              key={s.label}
              className="bg-muted rounded-xl p-4 flex flex-col items-center text-center border border-border hover:shadow-md transition-all duration-300 hover:-translate-y-1 animate-fade-in"
              style={{ animationDelay: `${(i + 4) * 100}ms` }}
            >
              <div className="mb-2 text-foreground">{s.icon}</div>
              <p className="text-xs font-medium text-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutFounders;
