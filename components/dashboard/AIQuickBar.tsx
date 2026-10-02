"use client";

import { useState } from "react";
import { Sparkles, ArrowRight } from "lucide-react";

interface AIQuickBarProps {
  onOpenQuickAddWithPrompt: (prompt: string) => void;
}

export function AIQuickBar({ onOpenQuickAddWithPrompt }: AIQuickBarProps) {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    onOpenQuickAddWithPrompt(prompt.trim());
    setPrompt("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative flex items-center w-full rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-1.5 focus-within:ring-2 focus-within:ring-sky-500 transition-all"
    >
      <div className="pl-3 pr-2 text-sky-500 flex items-center">
        <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
      </div>
      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Catat kilat bahasa natural: 'Makan siang 28rb Gopay' atau 'Beli bensin 50rb BCA'..."
        className="w-full text-xs md:text-sm bg-transparent border-none text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none py-2"
      />
      <button
        type="submit"
        disabled={!prompt.trim()}
        className="px-3 md:px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-40 text-white font-medium text-xs flex items-center gap-1.5 transition-colors shrink-0 shadow-sm shadow-sky-500/20"
      >
        <span>Catat AI</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </form>
  );
}
