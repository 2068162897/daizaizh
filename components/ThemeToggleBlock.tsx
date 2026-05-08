"use client";

import { useTheme } from "./ThemeProvider";

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-9 h-9 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M22 12h-2M4 12H2M19.07 4.93l-1.41 1.41M6.34 17.66l-1.41 1.41M19.07 19.07l-1.41-1.41M6.34 6.34L4.93 4.93" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-9 h-9 text-indigo-200" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}

export default function ThemeToggleBlock() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div
      onClick={toggleTheme}
      className={`h-full w-full rounded-3xl backdrop-blur-md border shadow-xl p-6 flex flex-col justify-center items-center transition-all duration-500 hover:scale-[1.05] cursor-pointer group relative overflow-hidden ${
        isDark ? "bg-slate-800/40 border-slate-600/50" : "bg-white/40 border-white/60"
      }`}
    >
      <div className="relative w-20 h-20 rounded-full overflow-hidden mb-3 shadow-inner flex-shrink-0">
        <div
          className={`absolute inset-0 transition-transform duration-700 ${
            isDark ? "-translate-y-full" : "translate-y-0"
          } bg-gradient-to-tr from-sky-300 to-yellow-200`}
        />
        <div
          className={`absolute inset-0 transition-transform duration-700 ${
            isDark ? "translate-y-0" : "translate-y-full"
          } bg-gradient-to-tr from-indigo-900 to-slate-800`}
        />

        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-700 ${
            isDark ? "opacity-0 rotate-90 scale-50" : "opacity-100 rotate-0 scale-100"
          } drop-shadow-md`}
        >
          <SunIcon />
        </div>
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-700 ${
            isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-50"
          } drop-shadow-md`}
        >
          <MoonIcon />
        </div>
      </div>

      <div className="text-center z-10 mt-auto">
        <h3 className={`text-xl font-bold transition-colors duration-500 ${isDark ? "text-white" : "text-slate-800"}`}>
          {isDark ? "夜间模式" : "日间模式"}
        </h3>
        <p className={`text-sm font-medium mt-1 transition-colors duration-500 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
          {isDark ? "流萤飞舞的深空" : "落樱漫舞的清晨"}
        </p>
      </div>
    </div>
  );
}
