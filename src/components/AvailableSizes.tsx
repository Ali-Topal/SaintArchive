const sizes = [
  { label: "S", name: "Small" },
  { label: "M", name: "Medium" },
  { label: "L", name: "Large" },
  { label: "XL", name: "Extra Large" },
] as const;

export default function AvailableSizes() {
  return (
    <section className="space-y-3 rounded-md border border-[#333] px-5 py-4">
      <p className="text-xs uppercase tracking-[0.3em] text-white/60">
        Available Sizes
      </p>
      <div className="flex flex-wrap gap-3">
        {sizes.map((size) => (
          <div
            key={size.label}
            className="flex flex-col items-center rounded-md border border-white/20 px-4 py-2 text-white"
          >
            <span className="text-base font-semibold tracking-[0.2em]">
              {size.label}
            </span>
            <span className="text-xs text-white/60">{size.name}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

