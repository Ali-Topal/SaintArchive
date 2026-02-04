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

// Free next day delivery on all orders
const SHIPPING_COST = 0;

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
  const [shippingMethod] = useState<"standard" | "next_day">("next_day");

  // Discount code state
  const [discountCode, setDiscountCode] = useState("");
  const [discountInput, setDiscountInput] = useState("");
  const [discountAmountCents, setDiscountAmountCents] = useState(0);
  const [discountMessage, setDiscountMessage] = useState<string | null>(null);
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [discountError, setDiscountError] = useState<string | null>(null);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate totals
  const subtotal = useMemo(() => productPriceCents * quantity, [productPriceCents, quantity]);
  const total = subtotal - discountAmountCents + SHIPPING_COST;

  // Validate discount code
  const handleApplyDiscount = async () => {
    if (!discountInput.trim()) return;
    
    setIsValidatingCode(true);
    setDiscountError(null);
    setDiscountMessage(null);

    try {
      const response = await fetch("/api/discount-codes/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: discountInput.trim(),
          subtotalCents: subtotal,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setDiscountError(data.error || "Invalid code");
        setDiscountCode("");
        setDiscountAmountCents(0);
      } else {
        setDiscountCode(data.code);
        setDiscountAmountCents(data.discountAmountCents);
        setDiscountMessage(data.message);
        setDiscountError(null);
      }
    } catch {
      setDiscountError("Failed to validate code");
    } finally {
      setIsValidatingCode(false);
    }
  };

  const handleRemoveDiscount = () => {
    setDiscountCode("");
    setDiscountInput("");
    setDiscountAmountCents(0);
    setDiscountMessage(null);
    setDiscountError(null);
  };

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
          discountCode: discountCode || undefined,
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
          <h2 className="text-lg font-semibold text-white">Shipping</h2>
          <div className="flex items-center justify-between rounded-lg border border-white bg-white/10 p-4">
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 rounded-full border-2 border-white flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-white" />
              </div>
              <span className="text-white">Free Next Day Delivery</span>
            </div>
            <span className="font-semibold text-white">FREE</span>
          </div>
          <p className="text-xs text-white/50">
            Order before 2pm for next working day delivery
          </p>
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

          {/* Discount Code */}
          <div className="space-y-2 border-t border-white/10 pt-4">
            <span className="text-xs uppercase tracking-[0.2em] text-white/60">Discount Code</span>
            {discountCode ? (
              <div className="flex items-center justify-between rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-green-400">{discountCode}</p>
                  <p className="text-xs text-green-400/80">{discountMessage}</p>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveDiscount}
                  disabled={isSubmitting}
                  className="text-xs text-white/60 hover:text-white"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value.toUpperCase())}
                  disabled={isSubmitting || isValidatingCode}
                  placeholder="Enter code"
                  className="flex-1 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm text-white placeholder-white/40 focus:border-white focus:outline-none disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={handleApplyDiscount}
                  disabled={isSubmitting || isValidatingCode || !discountInput.trim()}
                  className="rounded-lg border border-white/30 px-4 py-2 text-sm text-white transition hover:border-white disabled:opacity-50"
                >
                  {isValidatingCode ? "..." : "Apply"}
                </button>
              </div>
            )}
            {discountError && (
              <p className="text-xs text-red-400">{discountError}</p>
            )}
          </div>

          {/* Totals */}
          <div className="space-y-2 border-t border-white/10 pt-4">
            <div className="flex justify-between text-sm text-white/80">
              <span>Subtotal</span>
              <span>{currencyFormatter.format(subtotal / 100)}</span>
            </div>
            {discountAmountCents > 0 && (
              <div className="flex justify-between text-sm text-green-400">
                <span>Discount</span>
                <span>-{currencyFormatter.format(discountAmountCents / 100)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-white/80">
              <span>Shipping</span>
              <span>FREE</span>
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
