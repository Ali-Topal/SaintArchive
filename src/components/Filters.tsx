"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type FilterOption = {
  label: string;
  value: string;
};

type FilterGroup = {
  key: string;
  label: string;
  options: FilterOption[];
};

type SelectedFilters = Record<string, string[]>;

type FiltersProps = {
  groups: FilterGroup[];
  selected: SelectedFilters;
};

export default function Filters({ groups, selected }: FiltersProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const menuRef = useRef<HTMLDivElement>(null);

  const hasFilterOptions = groups.some((group) => group.options.length > 0);
  const selectedLookup = useMemo(() => {
    const lookup = new Map<string, Set<string>>();
    groups.forEach((group) => {
      lookup.set(
        group.key,
        new Set(selected[group.key]?.map((value) => value.toLowerCase()) ?? [])
      );
    });
    return lookup;
  }, [groups, selected]);

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

  if (!hasFilterOptions) {
    return null;
  }

  const updateQuery = (key: string, values: string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    values.forEach((value) => params.append(key, value));

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const toggleValue = (groupKey: string, value: string) => {
    const normalized = value.toLowerCase();
    const currentValues = selected[groupKey] ?? [];
    const lookup = selectedLookup.get(groupKey) ?? new Set();

    const next = lookup.has(normalized)
      ? currentValues.filter((item) => item.toLowerCase() !== normalized)
      : [...currentValues, value];

    updateQuery(groupKey, next);
  };

  const handleClearAll = () => {
    const params = new URLSearchParams(searchParams.toString());
    groups.forEach((group) => params.delete(group.key));
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const chips = groups.flatMap((group) =>
    (selected[group.key] ?? []).map((value) => ({
      key: group.key,
      value,
      label: `${group.label}: ${value}`,
    }))
  );

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
              {groups.map((group) => (
                <div key={group.key} className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.5em] text-white/60">{group.label}</p>
                  <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                    {group.options.map((option) => {
                      const normalized = option.value.toLowerCase();
                      const checked = selectedLookup.get(group.key)?.has(normalized) ?? false;
                      return (
                        <label
                          key={`${group.key}-${option.value}`}
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
                            onChange={() => toggleValue(group.key, option.value)}
                          />
                          <span className="text-xs uppercase tracking-[0.3em]">
                            {option.label ?? option.value}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
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

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <button
              key={`${chip.key}-${chip.value}`}
              type="button"
              onClick={() => toggleValue(chip.key, chip.value)}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-white/90 transition hover:border-white/60"
            >
              {chip.label}
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

