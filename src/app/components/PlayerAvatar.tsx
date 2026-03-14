type Props = {
  src: string | null | undefined;
  alt?: string;
  className?: string;
  name?: string;
};

/** Player avatar - just render the image */
export function PlayerAvatar({ src, alt = "", className = "h-12 w-12 rounded-2xl", name }: Props) {
  const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'P')}&background=1520A6&color=fff&size=128&bold=true`;
  
  return (
    <img
      src={src || fallback}
      alt={alt || name || "Player"}
      className={`${className} object-cover bg-[#1520A6]`}
    />
  );
}
