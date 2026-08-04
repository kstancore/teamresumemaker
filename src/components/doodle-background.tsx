import {
  Coffee,
  PenLine,
  Pencil,
  Laptop,
  BookOpen,
  Smartphone,
  StickyNote,
  Paperclip,
  Ruler,
  Highlighter,
  Eraser,
  Lightbulb,
  Star,
  Heart,
  Sparkles,
  Cloud,
  Rocket,
  Compass,
  Scissors,
  Calculator,
} from "lucide-react";

type Doodle = {
  Icon: typeof Coffee;
  top: string;
  left: string;
  size: number;
  rotate: number;
};

const DOODLES: Doodle[] = [
  { Icon: Coffee, top: "4%", left: "6%", size: 56, rotate: -12 },
  { Icon: PenLine, top: "10%", left: "82%", size: 64, rotate: 18 },
  { Icon: Laptop, top: "22%", left: "3%", size: 72, rotate: 8 },
  { Icon: BookOpen, top: "30%", left: "90%", size: 60, rotate: -14 },
  { Icon: Smartphone, top: "44%", left: "8%", size: 48, rotate: -6 },
  { Icon: StickyNote, top: "38%", left: "76%", size: 52, rotate: 12 },
  { Icon: Paperclip, top: "54%", left: "92%", size: 44, rotate: 26 },
  { Icon: Pencil, top: "62%", left: "4%", size: 58, rotate: -20 },
  { Icon: Ruler, top: "70%", left: "84%", size: 62, rotate: 14 },
  { Icon: Highlighter, top: "78%", left: "12%", size: 50, rotate: 10 },
  { Icon: Eraser, top: "86%", left: "70%", size: 46, rotate: -8 },
  { Icon: Lightbulb, top: "16%", left: "46%", size: 44, rotate: 6 },
  { Icon: Star, top: "50%", left: "40%", size: 36, rotate: -10 },
  { Icon: Heart, top: "92%", left: "34%", size: 40, rotate: 16 },
  { Icon: Sparkles, top: "68%", left: "52%", size: 42, rotate: -16 },
  { Icon: Cloud, top: "6%", left: "62%", size: 54, rotate: 4 },
  { Icon: Rocket, top: "34%", left: "58%", size: 46, rotate: 22 },
  { Icon: Compass, top: "88%", left: "88%", size: 48, rotate: -18 },
  { Icon: Scissors, top: "24%", left: "70%", size: 42, rotate: -24 },
  { Icon: Calculator, top: "58%", left: "24%", size: 44, rotate: 12 },
];

/**
 * Decorative hand-drawn-feeling doodle layer for notepad pages.
 * Renders behind page content (negative z-index) and never captures pointers.
 */
export function DoodleBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      {/* soft ink blooms for depth */}
      <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-accent/25 blur-3xl" />
      <div className="absolute -right-24 top-1/3 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-accent/25 blur-3xl" />

      {DOODLES.map(({ Icon, top, left, size, rotate }, i) => (
        <Icon
          key={i}
          className="absolute text-primary/25"
          strokeWidth={1.25}
          style={{
            top,
            left,
            width: size,
            height: size,
            transform: `rotate(${rotate}deg)`,
          }}
        />
      ))}

      {/* scribbled arrows & underlines */}
      <svg
        className="absolute inset-0 h-full w-full text-accent/50"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
        fill="none"
      >
        <path
          d="M6 26 C14 21, 22 31, 30 25"
          stroke="currentColor"
          strokeWidth="0.45"
          strokeLinecap="round"
        />
        <path
          d="M70 60 C78 55, 86 65, 94 58"
          stroke="currentColor"
          strokeWidth="0.45"
          strokeLinecap="round"
        />
        <path
          d="M20 82 C30 78, 40 86, 50 80"
          stroke="currentColor"
          strokeWidth="0.45"
          strokeLinecap="round"
        />
        <circle cx="58" cy="14" r="3.2" stroke="currentColor" strokeWidth="0.3" />
        <circle cx="35" cy="66" r="2.4" stroke="currentColor" strokeWidth="0.3" />
      </svg>
    </div>
  );
}

export default DoodleBackground;
