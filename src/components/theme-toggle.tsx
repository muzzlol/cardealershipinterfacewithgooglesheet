"use client"
import { useTheme } from "next-themes"
import { Switch } from "@radix-ui/react-switch"
import { Moon, Sun } from "lucide-react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex items-center gap-2">
      <Sun className="h-4 w-4 text-slate-500 dark:text-slate-400" />
      <Switch
        checked={theme === "dark"}
        onCheckedChange={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="relative inline-flex h-[24px] w-[44px] cursor-pointer items-center rounded-full border border-transparent bg-slate-200 px-[2px] transition-colors hover:bg-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 dark:data-[state=checked]:bg-slate-800"
      >
        <span
          className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${
            theme === "dark" ? "translate-x-[20px]" : "translate-x-0"
          }`}
        />
      </Switch>
      <Moon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
    </div>
  )
}
