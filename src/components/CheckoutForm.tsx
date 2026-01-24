"use client";

import Image from "next/image";
import { useState, useMemo } from "react";

type CheckoutFormProps = {
  productId: string;
  productTitle: string;
  productColor: string | null;
  productPriceCents: number;
  productImageUrl: string | null;
  productOptions: string[];
  maxQuantity: number;
  preselectedSize?: string;
  preselectedQuantity?: number;
};

// Shipping prices in pence
const SHIPPING_OPTIONS = {
  standard: { label: "Free Standard Delivery (3-5 days)", price: 0 },
  next_day: { label: "Next Day Delivery", price: 599 },
} as const;

const FREE_SHIPPING_THRESHOLD = 5000; // £50

const currencyFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

export default function CheckoutForm({
  productId,
  productTitle,
  productColor,
  productPriceCents,
  productImageUrl,
  productOptions,
  maxQuantity,
  preselectedSize,
  preselectedQuantity = 1,
}: CheckoutFormProps) {
  // Form state
  const [quantity, setQuantity] = useState(Math.max(1, Math.min(preselectedQuantity, maxQuantity)));
  const [size, setSize] = useState(preselectedSize ?? (productOptions[0] || ""));
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [shippingName, setShippingName] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingPostcode, setShippingPostcode] = useState("");
  const [shippingMethod, setShippingMethod] = useState<"standard" | "next_day">("standard");

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate totals
  const subtotal = useMemo(() => productPriceCents * quantity, [productPriceCents, quantity]);
  const shippingCost = useMemo(() => {
    if (shippingMethod === "standard" && subtotal >= FREE_SHIPPING_THRESHOLD) {
      return 0;
    }
    return SHIPPING_OPTIONS[shippingMethod].price;
  }, [shippingMethod, subtotal]);
  const total = subtotal + shippingCost;

  const qualifiesForFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          quantity,
          size: productOptions.length > 0 ? size : undefined,
          email,
          phone: phone || undefined,
          shippingName,
          shippingAddress,
          shippingCity,
          shippingPostcode,
          shippingMethod,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to create order.");
      }

      // Redirect to thank you page
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1fr_400px]">
      {/* Left Column - Form */}
      <div className="space-y-8">
        {/* Contact Information */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Contact Information</h2>
          <div className="space-y-4">
            <label className="block space-y-2">
              <span className="text-xs uppercase tracking-[0.2em] text-white/60">
                Email <span className="text-red-400">*</span>
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-white/40 focus:border-white focus:outline-none disabled:opacity-50"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-xs uppercase tracking-[0.2em] text-white/60">
                Phone (optional)
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isSubmitting}
                placeholder="07XXX XXXXXX"
                className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-white/40 focus:border-white focus:outline-none disabled:opacity-50"
              />
            </label>
          </div>
        </section>

        {/* Shipping Address */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Shipping Address</h2>
          <p className="text-xs text-white/50">We currently ship to UK addresses only.</p>
          <div className="space-y-4">
            <label className="block space-y-2">
              <span className="text-xs uppercase tracking-[0.2em] text-white/60">
                Full Name <span className="text-red-400">*</span>
              </span>
              <input
                type="text"
                value={shippingName}
                onChange={(e) => setShippingName(e.target.value)}
                required
                disabled={isSubmitting}
                placeholder="John Smith"
                className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-white/40 focus:border-white focus:outline-none disabled:opacity-50"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-xs uppercase tracking-[0.2em] text-white/60">
                Address <span className="text-red-400">*</span>
              </span>
              <input
                type="text"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                required
                disabled={isSubmitting}
                placeholder="123 Example Street"
                className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-white/40 focus:border-white focus:outline-none disabled:opacity-50"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-xs uppercase tracking-[0.2em] text-white/60">
                  City <span className="text-red-400">*</span>
                </span>
                <input
                  type="text"
                  value={shippingCity}
                  onChange={(e) => setShippingCity(e.target.value)}
                  required
                  disabled={isSubmitting}
                  placeholder="London"
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-white/40 focus:border-white focus:outline-none disabled:opacity-50"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-xs uppercase tracking-[0.2em] text-white/60">
                  Postcode <span className="text-red-400">*</span>
                </span>
                <input
                  type="text"
                  value={shippingPostcode}
                  onChange={(e) => setShippingPostcode(e.target.value.toUpperCase())}
                  required
                  disabled={isSubmitting}
                  placeholder="SW1A 1AA"
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-white/40 focus:border-white focus:outline-none disabled:opacity-50"
                />
              </label>
            </div>
          </div>
        </section>

        {/* Shipping Method */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Shipping Method</h2>
          <div className="space-y-3">
            <label
              className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 transition ${
                shippingMethod === "standard"
                  ? "border-white bg-white/10"
                  : "border-white/20 hover:border-white/40"
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="shipping"
                  value="standard"
                  checked={shippingMethod === "standard"}
                  onChange={() => setShippingMethod("standard")}
                  disabled={isSubmitting}
                  className="h-4 w-4 accent-white"
                />
                <span className="text-white">
                  {SHIPPING_OPTIONS.standard.label}
                </span>
              </div>
              <span className="font-semibold text-white">
                {qualifiesForFreeShipping || SHIPPING_OPTIONS.standard.price === 0
                  ? "FREE"
                  : currencyFormatter.format(SHIPPING_OPTIONS.standard.price / 100)}
              </span>
            </label>
            <label
              className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 transition ${
                shippingMethod === "next_day"
                  ? "border-white bg-white/10"
                  : "border-white/20 hover:border-white/40"
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="shipping"
                  value="next_day"
                  checked={shippingMethod === "next_day"}
                  onChange={() => setShippingMethod("next_day")}
                  disabled={isSubmitting}
                  className="h-4 w-4 accent-white"
                />
                <span className="text-white">{SHIPPING_OPTIONS.next_day.label}</span>
              </div>
              <span className="font-semibold text-white">
                {currencyFormatter.format(SHIPPING_OPTIONS.next_day.price / 100)}
              </span>
            </label>
          </div>
          {!qualifiesForFreeShipping && (
            <p className="text-xs text-white/50">
              Free standard shipping on orders over {currencyFormatter.format(FREE_SHIPPING_THRESHOLD / 100)}
            </p>
          )}
        </section>
      </div>

      {/* Right Column - Order Summary */}
      <div className="lg:sticky lg:top-8 lg:self-start">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-white">Order Summary</h2>

          {/* Product */}
          <div className="flex gap-4">
            {productImageUrl ? (
              <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg border border-white/10">
                <Image
                  src={productImageUrl}
                  alt={productTitle}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </div>
            ) : (
              <div className="h-24 w-24 flex-shrink-0 rounded-lg border border-white/10 bg-white/5" />
            )}
            <div className="flex-1 space-y-1">
              <h3 className="font-semibold text-white">{productTitle}</h3>
              {productColor && (
                <p className="text-xs text-white/60">{productColor}</p>
              )}
              <p className="text-sm text-white/80">
                {currencyFormatter.format(productPriceCents / 100)}
              </p>
            </div>
          </div>

          {/* Size Selection */}
          {productOptions.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs uppercase tracking-[0.2em] text-white/60">Size</span>
              <div className="flex flex-wrap gap-2">
                {productOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setSize(option)}
                    disabled={isSubmitting}
                    className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                      size === option
                        ? "border-white bg-white text-black"
                        : "border-white/30 text-white hover:border-white/60"
                    } disabled:opacity-50`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="space-y-2">
            <span className="text-xs uppercase tracking-[0.2em] text-white/60">Quantity</span>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1 || isSubmitting}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 text-lg text-white transition hover:border-white disabled:opacity-40"
              >
                −
              </button>
              <span className="w-8 text-center text-xl font-semibold text-white">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                disabled={quantity >= maxQuantity || isSubmitting}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 text-lg text-white transition hover:border-white disabled:opacity-40"
              >
                +
              </button>
            </div>
            {maxQuantity < 10 && (
              <p className="text-xs text-white/50">Max {maxQuantity} available</p>
            )}
          </div>

          {/* Totals */}
          <div className="space-y-2 border-t border-white/10 pt-4">
            <div className="flex justify-between text-sm text-white/80">
              <span>Subtotal</span>
              <span>{currencyFormatter.format(subtotal / 100)}</span>
            </div>
            <div className="flex justify-between text-sm text-white/80">
              <span>Shipping</span>
              <span>{shippingCost === 0 ? "FREE" : currencyFormatter.format(shippingCost / 100)}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold text-white pt-2 border-t border-white/10">
              <span>Total</span>
              <span>{currencyFormatter.format(total / 100)}</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || (productOptions.length > 0 && !size)}
            className="w-full rounded-full bg-white px-6 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Processing..." : "Place Order"}
          </button>

          <p className="text-xs text-white/50 text-center">
            You'll complete payment via PayPal after placing your order.
          </p>
        </div>
      </div>
    </form>
  );
}
