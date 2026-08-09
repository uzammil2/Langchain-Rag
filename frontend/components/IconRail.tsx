"use client";

import { Bot, MessageSquare, Sparkles } from "lucide-react";
import { useTheme } from "@/components/ThemeContext";

export default function IconRail() {
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="relative flex h-full w-[72px] shrink-0 flex-col items-center gap-3 py-4 surface-metal texture-metal"
      style={{
        borderRight: '2px solid var(--color-metal-dark)',
        boxShadow: 'inset -1px 0 0 rgba(255,255,255,0.08), 2px 0 8px rgba(0,0,0,0.3)',
      }}
    >
      {/* Rivet top-left */}
      <div className="absolute top-3 left-3 rivet" />
      <div className="absolute top-3 right-3 rivet" />

      {/* Bot Medallion */}
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full bezel-brass"
        style={{
          background: 'radial-gradient(circle at 40% 35%, var(--color-brass-light), var(--color-brass-dark))',
        }}
      >
        <Bot size={22} style={{ color: '#2a1f14' }} />
      </div>

      {/* Chat Button — active brass */}
      <div className="mt-2 flex flex-col gap-2">
        <button
          aria-current="page"
          className="flex h-12 w-12 items-center justify-center rounded-full btn-brass"
          title="Chat (Active)"
        >
          <MessageSquare size={19} style={{ color: '#fff', filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.3))' }} />
        </button>
      </div>

      {/* Bottom area */}
      <div className="mt-auto flex flex-col items-center gap-3">
        {/* Physical Toggle Switch */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          className={`toggle-switch ${theme === "light" ? "active" : ""}`}
          aria-label="Theme toggle"
        >
          <div className="toggle-knob" />
        </button>

        <span className="text-label1" style={{ color: 'var(--color-brass)', fontFamily: "'Merriweather', serif", fontSize: '8px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          {theme === "dark" ? "Night" : "Day"}
        </span>

        {/* Rivet bottom */}
        <div className="rivet" />
      </div>

      {/* Rivets at bottom corners */}
      <div className="absolute bottom-3 left-3 rivet" />
      <div className="absolute bottom-3 right-3 rivet" />
    </aside>
  );
}