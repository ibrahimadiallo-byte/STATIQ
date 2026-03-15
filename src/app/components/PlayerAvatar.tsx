import { useState, useEffect } from "react";

type Props = {
  src: string | null | undefined;
  alt?: string;
  className?: string;
  name?: string;
};

/** Player avatar: real photo when available; initials fallback when missing or on load error. */
export function PlayerAvatar({ src, alt = "", className = "h-12 w-12 rounded-2xl", name }: Props) {
  const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'P')}&background=1520A6&color=fff&size=128&bold=true`;
  const [effectiveSrc, setEffectiveSrc] = useState(() => src || fallback);

  useEffect(() => {
    setEffectiveSrc(src || fallback);
  }, [src]);

  const handleError = () => setEffectiveSrc(fallback);

  return (
    <img
      src={effectiveSrc}
      alt={alt || name || "Player"}
      className={`${className} object-cover bg-[#1520A6]`}
      onError={handleError}
    />
  );
}
