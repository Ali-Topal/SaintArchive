"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type FiltersProps = {
  availableBrands: string[];
  selectedBrands: string[];
};

export default function Filters({ availableBrands, selectedBrands }: FiltersProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const menuRef = useRef<HTMLDivElement>(null);

  const selectedLookup = useMemo(() => {
    return new Set(selectedBrands.map((brand) => brand.toLowerCase()));
  }, [selectedBrands]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEsc);

    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [open]);

  if (!availableBrands.length) {
    return null;
  }

  const updateQuery = (brands: string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("brand");
    brands.forEach((brand) => params.append("brand", brand));

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const toggleBrand = (brand: string) => {
    const normalized = brand.toLowerCase();

    const next = selectedLookup.has(normalized)
      ? selectedBrands.filter((item) => item.toLowerCase() !== normalized)
      : [...selectedBrands, brand];

    updateQuery(next);
  };

  const handleClearAll = () => updateQuery([]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:border-white/60"
            aria-haspopup="true"
            aria-expanded={open}
          >
            Filters
            <ChevronDown
              className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
              strokeWidth={1.75}
            />
          </button>

          {open && (
            <div className="absolute right-0 z-20 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-white/10 bg-[#050505] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.65)] sm:w-80">
              <p className="text-xs uppercase tracking-[0.5em] text-white/60">Brands</p>
              <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
                {availableBrands.map((brand) => {
                  const normalized = brand.toLowerCase();
                  const checked = selectedLookup.has(normalized);
                  return (
                    <label
                      key={brand}
                      className={`flex items-center gap-3 rounded-2xl border px-3 py-2 text-sm transition ${
                        checked
                          ? "border-white bg-white text-black"
                          : "border-white/10 bg-white/5 text-white/80 hover:border-white/40"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-white/30 bg-transparent text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                        checked={checked}
                        onChange={() => toggleBrand(brand)}
                      />
                      <span className="text-xs uppercase tracking-[0.3em]">{brand}</span>
                    </label>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => {
                  handleClearAll();
                  setOpen(false);
                }}
                className="mt-3 text-xs uppercase tracking-[0.3em] text-white/60 transition hover:text-white"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>

      {selectedBrands.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {selectedBrands.map((brand) => (
            <button
              key={brand}
              type="button"
              onClick={() => toggleBrand(brand)}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-white/90 transition hover:border-white/60"
            >
              {brand}
              <X className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
          ))}
          <button
            type="button"
            onClick={handleClearAll}
            className="text-xs uppercase tracking-[0.3em] text-white/50 transition hover:text-white"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}

