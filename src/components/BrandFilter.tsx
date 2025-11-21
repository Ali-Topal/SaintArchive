"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

type BrandFilterProps = {
  brands: string[];
  activeBrand?: string;
};

export default function BrandFilter({ brands, activeBrand }: BrandFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (!brands.length) {
    return null;
  }

  const handleSelect = (brand?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!brand) {
      params.delete("brand");
    } else {
      params.set("brand", brand);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const buttonBase =
    "rounded-full border px-4 py-2 text-xs uppercase tracking-[0.3em] transition";

  return (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-[0.3em] text-white/60">
        Filter by brand
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => handleSelect()}
          className={`${buttonBase} ${
            !activeBrand
              ? "border-white bg-white text-black"
              : "border-white/30 text-white hover:border-white/60"
          }`}
        >
          All
        </button>

        {brands.map((brand) => {
          const isActive =
            activeBrand?.toLowerCase() === brand.toLowerCase();
          return (
            <button
              key={brand}
              type="button"
              onClick={() => handleSelect(brand)}
              className={`${buttonBase} ${
                isActive
                  ? "border-white bg-white text-black"
                  : "border-white/30 text-white hover:border-white/60"
              }`}
            >
              {brand}
            </button>
          );
        })}
      </div>
    </div>
  );
}

