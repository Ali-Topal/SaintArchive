"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, Check } from "lucide-react";
import { useCart } from "@/context/CartContext";

type ProductActionsProps = {
  productId: string;
  title: string;
  slug: string;
  priceCents: number;
  stockQuantity: number;
  isActive: boolean;
  options: string[];
  imageUrl?: string;
};

export default function ProductActions({
  productId,
  title,
  slug,
  priceCents,
  stockQuantity,
  isActive,
  options,
  imageUrl,
}: ProductActionsProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const [selectedSize, setSelectedSize] = useState<string>(options[0] ?? "");
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  const isOutOfStock = stockQuantity === 0;
  const isInactive = !isActive;
  const hasOptions = options.length > 0;

  const handleAddToCart = () => {
    if (hasOptions && !selectedSize) {
      return;
    }

    addItem({
      productId,
      title,
      slug,
      priceCents,
      quantity,
      size: hasOptions ? selectedSize : undefined,
      imageUrl,
      maxStock: stockQuantity,
    });

    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleBuyNow = () => {
    // Add to cart and go to checkout
    if (hasOptions && !selectedSize) {
      return;
    }

    addItem({
      productId,
      title,
      slug,
      priceCents,
      quantity,
      size: hasOptions ? selectedSize : undefined,
      imageUrl,
      maxStock: stockQuantity,
    });

    router.push("/checkout?from=cart");
  };

  if (isInactive || isOutOfStock) {
    return (
      <span className="inline-flex w-full items-center justify-center rounded-full border border-white/20 px-6 py-4 text-sm font-semibold uppercase tracking-[0.3em] text-white/50">
        {isInactive ? "Unavailable" : "Out of Stock"}
      </span>
    );
  }

  return (
    <div className="space-y-4">
      {/* Size Selection */}
      {hasOptions && (
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.3em] text-white/60">
            Select Size
          </label>
          <div className="flex flex-wrap gap-2">
            {options.map((option) => (
              <button
                key={option}
                onClick={() => setSelectedSize(option)}
                className={`rounded-lg border px-4 py-2 text-sm transition ${
                  selectedSize === option
                    ? "border-white bg-white text-black"
                    : "border-white/20 text-white/80 hover:border-white/40"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity */}
      <div className="space-y-2">
        <label className="text-xs uppercase tracking-[0.3em] text-white/60">
          Quantity
        </label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white transition hover:border-white/40"
          >
            −
          </button>
          <span className="w-12 text-center text-lg text-white">{quantity}</span>
          <button
            onClick={() => setQuantity(Math.min(stockQuantity, quantity + 1))}
            disabled={quantity >= stockQuantity}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white transition hover:border-white/40 disabled:opacity-30"
          >
            +
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 pt-2 sm:flex-row">
        <button
          onClick={handleAddToCart}
          disabled={hasOptions && !selectedSize}
          className={`flex flex-1 items-center justify-center gap-2 rounded-full border px-6 py-4 text-sm font-semibold uppercase tracking-[0.2em] transition ${
            addedToCart
              ? "border-green-500 bg-green-500/10 text-green-400"
              : "border-white text-white hover:bg-white hover:text-black"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {addedToCart ? (
            <>
              <Check className="h-4 w-4" />
              Added!
            </>
          ) : (
            <>
              <ShoppingBag className="h-4 w-4" />
              Add to Cart
            </>
          )}
        </button>
        <button
          onClick={handleBuyNow}
          disabled={hasOptions && !selectedSize}
          className="flex flex-1 items-center justify-center rounded-full bg-white px-6 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Buy Now
        </button>
      </div>

      {hasOptions && !selectedSize && (
        <p className="text-xs text-amber-400">Please select a size</p>
      )}
    </div>
  );
}
