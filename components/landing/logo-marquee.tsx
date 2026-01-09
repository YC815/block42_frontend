const logos = [
  "Open Code Lab",
  "STEM Studio",
  "Playful Ed",
  "Logic Camp",
  "Future School",
  "GameCraft",
  "Block Makers",
];

export function LogoMarquee() {
  const items = [...logos, ...logos];

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/70 bg-white/75 px-6 py-5 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.5)] backdrop-blur">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white/90 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white/90 to-transparent" />
      <div className="flex w-max gap-6 whitespace-nowrap landing-marquee">
        {items.map((logo, index) => (
          <div
            key={`${logo}-${index}`}
            className="flex items-center gap-2 rounded-full border border-slate-200/70 bg-slate-50/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"
            aria-hidden={index >= logos.length}
          >
            {logo}
          </div>
        ))}
      </div>
    </div>
  );
}
