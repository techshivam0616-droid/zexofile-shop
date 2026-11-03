// Demo data for ZexoFile Shop.
// Everything here lives in code only: nothing is written to Firebase.
// Set DEMO_MODE = false to turn ALL demo data off (products, admin stats, recent purchases).
import type { Product } from "@/components/ProductGrid";

export const DEMO_MODE = true;

export const DEMO_PRODUCT_COUNT = 614;

// Admin "Stats" targets. Real values are added on top of the offsets, so with
// today's real data (Rs. 3 revenue, 3 purchases, 3 custom requests) the panel reads
// exactly 87,237 / 2,893 / 347, and keeps growing with real sales.
export const DEMO_REVENUE_OFFSET = 87234;
export const DEMO_PURCHASES_OFFSET = 2890;
export const DEMO_CUSTOM_REQUESTS_OFFSET = 344;

export type DemoProduct = Product & { isDemo: true };

export const isDemoProduct = (p: { isDemo?: boolean; id?: string } | null | undefined): boolean =>
  !!p && (p.isDemo === true || (typeof p.id === "string" && p.id.startsWith("demo-")));

// Small deterministic PRNG (mulberry32) so the demo catalogue is identical on every load.
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T,>(r: () => number, arr: readonly T[]): T => arr[Math.floor(r() * arr.length)];

type Group = {
  category: string;
  type: "course" | "website";
  subjects: readonly string[];
  kinds: readonly string[];
  tech: readonly string[];
  price: [number, number];
};

const GROUPS: readonly Group[] = [
  {
    category: "Website", type: "website",
    subjects: ["Restaurant", "Cafe", "Gym & Fitness", "Salon", "Real Estate", "Hotel Booking", "Travel Agency", "Wedding Planner", "Coaching Institute", "School", "Hospital", "Dental Clinic", "Photography", "Interior Design", "Event Management", "NGO", "Law Firm", "CA Firm", "Bakery", "Yoga Studio", "Car Rental", "Tiffin Service", "Jewellery Store", "Boutique", "Mobile Repair", "Pet Shop", "Construction", "Digital Agency", "Startup", "Portfolio"],
    kinds: ["Website", "Website Template", "Landing Page", "Business Website", "Responsive Website", "Premium Website"],
    tech: ["React, Tailwind CSS", "HTML, CSS, JavaScript", "Next.js, Tailwind", "React, Vite, Firebase", "WordPress, Elementor", "Bootstrap 5, jQuery"],
    price: [199, 2499],
  },
  {
    category: "E-commerce", type: "website",
    subjects: ["Fashion", "Grocery", "Electronics", "Shoes", "Cosmetics", "Handicraft", "Organic Food", "Book Store", "Toy Store", "Furniture", "Saree", "Kurti", "Spices", "Sweets", "Gift Shop", "Watch Store", "Perfume", "Digital Products", "Mobile Accessories", "Home Decor"],
    kinds: ["E-commerce Website", "Online Store", "Shop Website", "Store with Admin Panel", "Shopping Website"],
    tech: ["React, Firebase, Razorpay", "Next.js, Stripe, MongoDB", "MERN Stack", "React, Supabase", "PHP, MySQL"],
    price: [499, 3999],
  },
  {
    category: "Web App", type: "website",
    subjects: ["Expense Tracker", "Attendance", "Inventory", "Billing & GST", "School Management", "Hostel Management", "Library Management", "Hospital Management", "CRM", "HR & Payroll", "Task Manager", "Quiz", "Blog", "Job Portal", "Food Delivery", "Chat", "URL Shortener", "Resume Builder", "Invoice Generator", "Booking System", "Online Exam", "Notes Sharing", "Movie Ticket Booking", "Gym Management"],
    kinds: ["Web App", "Management System", "App with Admin Panel", "Full Stack Project", "System (Source Code)"],
    tech: ["React, Node.js, MongoDB", "MERN Stack", "PHP, MySQL", "Python, Django", "React, Firebase", "Java, Spring Boot", "Next.js, Prisma, PostgreSQL"],
    price: [299, 2999],
  },
  {
    category: "Portfolio", type: "website",
    subjects: ["Developer", "Designer", "Photographer", "Student", "Freelancer", "Video Editor", "Artist", "Writer", "Doctor", "Musician", "Influencer", "Personal"],
    kinds: ["Portfolio Website", "Portfolio Template", "Resume Website", "Personal Website", "Animated Portfolio"],
    tech: ["HTML, CSS, JS", "React, Framer Motion", "Next.js, Tailwind", "Three.js, React", "GSAP, HTML"],
    price: [99, 999],
  },
  {
    category: "Course", type: "course",
    subjects: ["Web Development", "React JS", "JavaScript", "Python", "Java", "C++ DSA", "Node.js", "Full Stack", "Next.js", "Tailwind CSS", "Flutter", "Android Development", "Data Science", "Machine Learning", "Excel", "Digital Marketing", "Graphic Design", "Video Editing", "UI/UX Design", "Ethical Hacking", "SQL", "Firebase", "Freelancing", "Instagram Growth", "YouTube Growth", "Stock Market", "Spoken English", "AI Tools", "Canva", "ChatGPT Prompting"],
    kinds: ["Complete Course", "Masterclass", "Bootcamp", "Zero to Hero", "Crash Course", "Course (Hindi)", "Pro Course"],
    tech: ["Video lessons + notes", "Recorded lectures + projects", "HD videos + certificate", "Hindi videos + source code"],
    price: [49, 1499],
  },
  {
    category: "Templates", type: "website",
    subjects: ["Admin Dashboard", "SaaS Landing", "Agency", "Blog", "App Landing", "Coming Soon", "Login & Signup", "Pricing Page", "Email", "Resume", "Invitation", "Business Card", "Instagram Post", "YouTube Thumbnail", "Presentation", "Notion"],
    kinds: ["Template", "UI Kit", "Template Pack", "Bundle", "Kit"],
    tech: ["HTML, Tailwind", "React, shadcn/ui", "Figma", "Canva", "Bootstrap"],
    price: [29, 799],
  },
];

const PALETTES: readonly [string, string][] = [
  ["#111827", "#4b5563"], ["#1e3a8a", "#3b82f6"], ["#7c2d12", "#f97316"], ["#14532d", "#22c55e"],
  ["#581c87", "#a855f7"], ["#831843", "#ec4899"], ["#0f766e", "#2dd4bf"], ["#78350f", "#f59e0b"],
  ["#1f2937", "#06b6d4"], ["#3f3f46", "#a1a1aa"], ["#312e81", "#818cf8"], ["#7f1d1d", "#ef4444"],
];

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Lightweight inline SVG cover (no network request, renders instantly on phones).
function coverSvg(title: string, category: string, type: "course" | "website", pal: [string, string], n: number): string {
  const words = title.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > 18 && cur) { lines.push(cur); cur = w; } else { cur = (cur + " " + w).trim(); }
  }
  if (cur) lines.push(cur);
  const shown = lines.slice(0, 3);
  const text = shown
    .map((l, i) => `<text x="40" y="${200 + i * 44 - (shown.length - 1) * 22}" font-size="36" font-weight="700" fill="#fff" font-family="Inter,Arial,sans-serif">${esc(l)}</text>`)
    .join("");
  const chrome = type === "website"
    ? `<rect x="24" y="24" width="552" height="402" rx="18" fill="#ffffff" fill-opacity="0.08"/><circle cx="52" cy="50" r="7" fill="#ff5f57"/><circle cx="74" cy="50" r="7" fill="#febc2e"/><circle cx="96" cy="50" r="7" fill="#28c840"/><rect x="120" y="41" width="300" height="18" rx="9" fill="#ffffff" fill-opacity="0.18"/>`
    : `<circle cx="520" cy="80" r="34" fill="#ffffff" fill-opacity="0.18"/><path d="M509 62 L539 80 L509 98 Z" fill="#fff"/>`;
  const deco = `<circle cx="${480 + (n % 5) * 10}" cy="${360 - (n % 7) * 6}" r="${90 + (n % 4) * 15}" fill="#ffffff" fill-opacity="0.07"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${pal[0]}"/><stop offset="1" stop-color="${pal[1]}"/></linearGradient></defs><rect width="600" height="450" fill="url(#g)"/>${deco}${chrome}${text}<text x="40" y="390" font-size="20" fill="#fff" fill-opacity="0.8" font-family="Inter,Arial,sans-serif" letter-spacing="3">${esc(category.toUpperCase())} · ZEXOFILE</text></svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

function roundPrice(r: () => number, [lo, hi]: [number, number]): number {
  const raw = lo + r() * (hi - lo);
  // Indian-style price endings: 99, 49, 199, 299 ...
  const base = Math.floor(raw / 50) * 50;
  return Math.max(lo, base + (r() < 0.6 ? 49 : -1));
}

function buildDemoProducts(): DemoProduct[] {
  const r = rng(614087237);
  const out: DemoProduct[] = [];
  const used = new Set<string>();
  let n = 0;
  let guard = 0;
  while (out.length < DEMO_PRODUCT_COUNT && guard < 20000) {
    guard++;
    const g = GROUPS[n % GROUPS.length];
    const subject = pick(r, g.subjects);
    const kind = pick(r, g.kinds);
    let title = `${subject} ${kind}`;
    if (used.has(title)) title = `${title} ${pick(r, ["Pro", "V2", "Plus", "Lite", "2026", "Premium", "Advanced"])}`;
    if (used.has(title)) continue;
    used.add(title);
    n++;
    const idx = out.length + 1;
    const price = roundPrice(r, g.price);
    const onSale = r() < 0.55;
    const originalPrice = onSale ? Math.round((price * (1.4 + r() * 1.2)) / 10) * 10 - 1 : undefined;
    const tech = pick(r, g.tech);
    const description = g.type === "course"
      ? `${title} by ZexoFile. Learn step by step with practical examples.\n\nWhat you get:\n- ${tech}\n- Lifetime access\n- Beginner friendly, Hindi + English\n- Doubt support on email`
      : `${title}, ready to use and fully customisable.\n\nIncludes:\n- Full source code\n- Mobile responsive design\n- Easy setup guide\n- Built with ${tech}`;
    out.push({
      id: `demo-${String(idx).padStart(3, "0")}`,
      title,
      type: g.type,
      price,
      originalPrice,
      imageUrl: coverSvg(title, g.category, g.type, PALETTES[Math.floor(r() * PALETTES.length)], idx),
      description,
      razorpayLink: "",
      bestSelling: false,
      category: g.category,
      features: g.type === "course" ? "Lifetime access, Notes, Certificate" : "Responsive, Source code, Setup guide",
      techStack: tech,
      isDemo: true,
    });
  }
  return out;
}

export const DEMO_PRODUCTS: DemoProduct[] = DEMO_MODE ? buildDemoProducts() : [];

const FIRST = ["Rahul", "Priya", "Amit", "Sneha", "Rohit", "Anjali", "Vikas", "Pooja", "Arjun", "Neha", "Saurabh", "Kajal", "Aditya", "Ritika", "Manish", "Simran", "Deepak", "Nisha", "Harsh", "Shreya", "Ankit", "Megha", "Gaurav", "Komal", "Abhishek", "Riya", "Suraj", "Tanvi", "Nikhil", "Payal", "Karan", "Divya", "Aman", "Muskan", "Yash", "Sakshi"];
const LAST = ["Sharma", "Verma", "Singh", "Kumar", "Gupta", "Yadav", "Patel", "Mishra", "Jha", "Chauhan", "Agarwal", "Pandey", "Tiwari", "Mehta", "Reddy", "Nair", "Das", "Rawat", "Thakur", "Saxena"];

export type DemoPurchase = {
  productTitle: string;
  price: number;
  purchasedAt: number;
  buyerName: string;
  isDemo: true;
};

// Recent demo purchases spread over the last ~3 months (newest first).
// Dates are relative to page load so the list always looks recent.
export function getDemoPurchases(count = 25): DemoPurchase[] {
  if (!DEMO_MODE || DEMO_PRODUCTS.length === 0) return [];
  const r = rng(2893);
  const now = Date.now();
  const list: DemoPurchase[] = [];
  let t = now - 2 * 3600 * 1000;
  for (let i = 0; i < count; i++) {
    const p = DEMO_PRODUCTS[Math.floor(r() * DEMO_PRODUCTS.length)];
    t -= Math.floor((6 + r() * 160) * 3600 * 1000);
    list.push({
      productTitle: p.title,
      price: p.price,
      purchasedAt: t,
      buyerName: `${pick(r, FIRST)} ${pick(r, LAST)}`,
      isDemo: true,
    });
  }
  return list;
}

export const formatINR = (n: number) => Math.round(n).toLocaleString("en-IN");
