import { useState, useEffect } from "react";
import { Twitter, Linkedin, Github } from "lucide-react";

interface WelcomeMessageProps {
  isVisible: boolean;
}

const WELCOME_LINES = [
  { text: "Hi, this is ", highlight: false },
  { text: "Hazem Methenni", highlight: true },
  { text: " (aka ", highlight: false },
  { text: "DENGRi ", highlight: true },
  { text: "), ", highlight: false },
  { text: "creator of ", highlight: false },
  { text: "RATEL.DECK", highlight: true },
  { text: " and founder of", highlight: false },
  { text: " Cyber.Marine.Deck ", highlight: true },
  { text: "the company that maintains it.", highlight: false },
  { text: "This is an ethical, ", highlight: false },
  { text: "community-driven", highlight: true },
  { text: " project, ", highlight: false },
  { text: "built from", highlight: false },
  { text: " Tunisia", highlight: true },
  { text: " to the world", highlight: false },
  { text: ".", highlight: false },
  { text: "\n\n", highlight: false },
  { text: "					─────────── why ?? ───────────", highlight: false },
  { text: "\n\n", highlight: false },
  { text: "Success in ", highlight: false },
  { text: "CTFs", highlight: true },
  { text: " and exams like ", highlight: false },
  { text: "OSCP, CPTS ... ", highlight: true },
  { text: "is not about tools, but ", highlight: false },
  { text: "discipline, structure, ", highlight: false },
  { text: "and ", highlight: false },
  { text: "mastery of time", highlight: true },
  { text: ".", highlight: false },
  { text: "The Platform", highlight: false },
  { text: " is designed to ", highlight: false },
  { text: "bring order into chaos", highlight: true },
  { text: ",", highlight: false },
  { text: "helping you stay ", highlight: false },
  { text: "focused, organized, and efficient ", highlight: true },
  { text: "when pressure is high and ", highlight: false },
  { text: "every minute counts", highlight: true },
  { text: ".", highlight: false },
  { text: "\n\n", highlight: false },
  { text: "I openly welcome ", highlight: false },
  { text: "developers and security professionals ", highlight: true },
  { text: "to review the platform, report bugs, challenge ideas, ", highlight: false },
  { text: "and help push it forward.", highlight: false },
  { text: "\n\n", highlight: false },
  { text: "					─────────── Find me ─────────── ", highlight: false },

];

// Flatten to single string for typing animation
const FULL_TEXT = WELCOME_LINES.map((l) => l.text).join("");

export function WelcomeMessage({ isVisible }: WelcomeMessageProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    if (!isVisible) {
      setCurrentIndex(0);
      return;
    }

    if (currentIndex < FULL_TEXT.length) {
      const timeout = setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
      }, 22);

      return () => clearTimeout(timeout);
    }
  }, [isVisible, currentIndex]);

  // Cursor blink effect
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 530);

    return () => clearInterval(interval);
  }, []);

  if (!isVisible) return null;

  // Render text with highlighted segments up to currentIndex
  const renderText = () => {
    let charCount = 0;
    const elements: JSX.Element[] = [];

    for (let i = 0; i < WELCOME_LINES.length; i++) {
      const segment = WELCOME_LINES[i];
      const segmentStart = charCount;
      const segmentEnd = charCount + segment.text.length;

      if (segmentStart >= currentIndex) break;

      const visibleLength = Math.min(currentIndex - segmentStart, segment.text.length);
      const visibleText = segment.text.slice(0, visibleLength);

      if (visibleText) {
        elements.push(
          <span 
            key={i} 
            className={segment.highlight 
              ? "font-semibold text-primary drop-shadow-[0_0_10px_hsl(var(--primary)/0.6)]" 
              : "text-foreground/90"
            }
          >
            {visibleText}
          </span>
        );
      }

      charCount = segmentEnd;
    }

    return elements;
  };

  return (
    <div className="flex items-start justify-center p-4 flex-1 w-full">
      <div className="w-full">
        <div className="relative">
          {/* Subtle glow effect background */}
          <div className="absolute inset-0 bg-gradient-radial from-primary/5 to-transparent rounded-lg blur-xl" />

          {/* Terminal-style container */}
          <div className="relative border border-primary/20 rounded-lg p-8 bg-card/30 backdrop-blur-sm">
            {/* Terminal header */}
            <div className="flex items-center gap-2 mb-6 pb-3 border-b border-border/30">
              <div className="w-3 h-3 rounded-full bg-destructive/70" />
              <div className="w-3 h-3 rounded-full bg-warning/70" />
              <div className="w-3 h-3 rounded-full bg-success/70" />
              <span className="ml-2 text-xs text-muted-foreground font-mono">welcome.sh</span>
            </div>

            {/* Typing text */}
            <div className="font-mono text-sm md:text-base leading-relaxed text-left whitespace-pre-wrap">
              <span className="text-primary mr-2">$</span>
              {renderText()}
              {currentIndex < FULL_TEXT.length && (
                <span
                  className={`inline-block w-2 h-4 ml-1 bg-primary align-middle transition-opacity ${
                    showCursor ? "opacity-100" : "opacity-0"
                  }`}
                />
              )}
            </div>

            {/* Social media icons - appear after typing finishes */}
            {currentIndex >= FULL_TEXT.length && (
              <div className="flex items-center gap-4 mt-4 animate-fade-in">
                <a
                  href="https://twitter.com/yourusername"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-secondary/50 hover:bg-primary/20 transition-colors group"
                  title="Twitter"
                >
                  <Twitter className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </a>
                <a
                  href="https://linkedin.com/in/yourusername"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-secondary/50 hover:bg-primary/20 transition-colors group"
                  title="LinkedIn"
                >
                  <Linkedin className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </a>
                <a
                  href="https://github.com/yourusername"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-secondary/50 hover:bg-primary/20 transition-colors group"
                  title="GitHub"
                >
                  <Github className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Hint text */}
        {currentIndex >= FULL_TEXT.length && (
          <p className="mt-6 text-sm text-muted-foreground animate-fade-in">
            Expand the blocks above to start your session
          </p>
        )}
      </div>
    </div>
  );
}
