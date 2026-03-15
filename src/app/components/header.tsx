import { User } from "lucide-react";

type HeaderProps = { title?: string };

export function Header({ title = "Home" }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 py-4">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <img 
          src="/logo.png" 
          alt="STATIQ" 
          className="w-11 h-11 rounded-2xl object-cover shadow-lg shadow-[#1520A6]/30"
        />
      </div>

      {/* Title */}
      <h1 className="text-xl md:text-2xl font-bold tracking-tight">{title}</h1>

      {/* User icon */}
      <button className="w-11 h-11 rounded-full border border-white/10 bg-white/5 flex items-center justify-center">
        <User className="w-5 h-5 text-white" />
      </button>
    </header>
  );
}
