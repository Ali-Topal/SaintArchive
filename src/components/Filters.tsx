"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronRight, SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type FilterOption = {
  label: string;
  value: string;
};

type FilterGroup = {
  key: string;
  label: string;
  options: FilterOption[];
  type?: "checkbox" | "toggle"; // toggle for single on/off options
};

type SelectedFilters = Record<string, string[]>;

type FiltersProps = {
  groups: FilterGroup[];
  selected: SelectedFilters;
  inStockOnly?: boolean;
  onInStockChange?: (value: boolean) => void;
};

export default function Filters({ groups, selected, inStockOnly = false }: FiltersProps) {
  const [open, setOpen] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
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

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    groups.forEach((group) => {
      count += selected[group.key]?.length ?? 0;
    });
    if (inStockOnly) count += 1;
    return count;
  }, [groups, selected, inStockOnly]);

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
    params.delete("page");

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

  const toggleInStock = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (inStockOnly) {
      params.delete("inStock");
    } else {
      params.set("inStock", "true");
    }
    params.delete("page");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const handleClearAll = () => {
    const params = new URLSearchParams(searchParams.toString());
    groups.forEach((group) => params.delete(group.key));
    params.delete("inStock");
    params.delete("page");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const chips = groups.flatMap((group) =>
    (selected[group.key] ?? []).map((value) => ({
      key: group.key,
      value,
      label: `${value}`,
    }))
  );

  // Add in-stock chip if active
  if (inStockOnly) {
    chips.push({ key: "inStock", value: "true", label: "In Stock" });
  }

  return (
    <div className="relative z-20 space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/5 px-3 py-1.5 text-white transition hover:border-white/60 sm:px-4 sm:py-2"
            aria-haspopup="true"
            aria-expanded={open}
            aria-label="Filters"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={1.75} />
            {activeFilterCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-black">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown
              className={`h-3 w-3 transition-transform sm:h-4 sm:w-4 ${open ? "rotate-180" : ""}`}
              strokeWidth={1.75}
            />
          </button>

          {open && (
            <div className="absolute right-0 z-40 mt-2 max-h-[70vh] w-80 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl border border-white/10 bg-[#050505] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.65)] sm:w-96">
              {/* In Stock Toggle */}
              <div className="mb-4 border-b border-white/10 pb-4">
                <label className="flex cursor-pointer items-center justify-between">
                  <span className="text-xs uppercase tracking-[0.3em] text-white/80">
                    In Stock Only
                  </span>
                  <button
                    type="button"
                    onClick={toggleInStock}
                    className={`relative h-6 w-11 rounded-full transition ${
                      inStockOnly ? "bg-white" : "bg-white/20"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full transition-all ${
                        inStockOnly
                          ? "left-[22px] bg-black"
                          : "left-0.5 bg-white/60"
                      }`}
                    />
                  </button>
                </label>
              </div>

              {/* Filter Groups - Accordion Style */}
              <div className="space-y-1">
                {groups.map((group) => {
                  const isExpanded = expandedGroup === group.key;
                  const selectedCount = selected[group.key]?.length ?? 0;

                  return (
                    <div key={group.key} className="border-b border-white/10 last:border-0">
                      {/* Accordion Header */}
                      <button
                        type="button"
                        onClick={() => setExpandedGroup(isExpanded ? null : group.key)}
                        className="flex w-full items-center justify-between py-3 text-left transition hover:text-white"
                      >
                        <span className="flex items-center gap-2 text-sm text-white/80">
                          {group.label}
                          {selectedCount > 0 && (
                            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white px-1.5 text-[10px] font-bold text-black">
                              {selectedCount}
                            </span>
                          )}
                        </span>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-white/50" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-white/50" />
                        )}
                      </button>

                      {/* Accordion Content */}
                      {isExpanded && (
                        <div className="flex max-h-48 flex-wrap gap-1.5 overflow-y-auto pb-3">
                          {group.options.map((option) => {
                            const normalized = option.value.toLowerCase();
                            const checked =
                              selectedLookup.get(group.key)?.has(normalized) ?? false;
                            return (
                              <button
                                key={`${group.key}-${option.value}`}
                                type="button"
                                onClick={() => toggleValue(group.key, option.value)}
                                className={`rounded-full border px-3 py-1.5 text-xs transition ${
                                  checked
                                    ? "border-white bg-white text-black"
                                    : "border-white/20 text-white/70 hover:border-white/40"
                                }`}
                              >
                                {option.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Clear All */}
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    handleClearAll();
                    setOpen(false);
                  }}
                  className="mt-4 w-full rounded-full border border-white/20 py-2 text-xs uppercase tracking-[0.2em] text-white/60 transition hover:border-white/40 hover:text-white"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Active Filter Chips */}
      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <button
              key={`${chip.key}-${chip.value}`}
              type="button"
              onClick={() =>
                chip.key === "inStock"
                  ? toggleInStock()
                  : toggleValue(chip.key, chip.value)
              }
              className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.15em] text-white/90 transition hover:border-white/60"
            >
              {chip.label}
              <X className="h-3 w-3" strokeWidth={1.5} />
            </button>
          ))}
          <button
            type="button"
            onClick={handleClearAll}
            className="text-xs uppercase tracking-[0.2em] text-white/50 transition hover:text-white"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
