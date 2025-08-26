import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const initialTheme = savedTheme || systemTheme;
    
    setTheme(initialTheme);
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={cn(
        "relative w-10 h-10 rounded-full",
        "bg-gradient-to-br from-accent/20 to-accent/10",
        "hover:from-accent/30 hover:to-accent/20",
        "transition-all duration-300 hover:scale-110"
      )}
    >
      <Sun className={cn(
        "h-5 w-5 absolute transition-all duration-500",
        theme === "dark" ? "rotate-90 scale-0" : "rotate-0 scale-100"
      )} />
      <Moon className={cn(
        "h-5 w-5 absolute transition-all duration-500",
        theme === "dark" ? "rotate-0 scale-100" : "-rotate-90 scale-0"
      )} />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}