import { Shield, User } from "lucide-react";

export function Header() {
  return (
    <header className="flex items-center justify-between px-4 py-4">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-11 h-11 bg-[#1520A6] rounded-2xl flex items-center justify-center shadow-lg shadow-[#1520A6]/30">
          <Shield className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Title */}
      <h1 className="text-lg font-semibold tracking-wide">Home</h1>

      {/* User icon */}
      <button className="w-11 h-11 rounded-full border border-white/10 bg-white/5 flex items-center justify-center">
        <User className="w-5 h-5 text-white" />
      </button>
    </header>
  );
}
