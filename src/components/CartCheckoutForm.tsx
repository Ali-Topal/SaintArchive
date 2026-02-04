"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/context/CartContext";

const priceFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

// Free next day delivery on all orders
const SHIPPING_COST = 0;

type ShippingMethod = "next_day";

export default function CartCheckoutForm() {
  const router = useRouter();
  const { items, subtotalCents, clearCart } = useCart();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Contact
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Shipping
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postcode, setPostcode] = useState("");
  const [shippingMethod] = useState<ShippingMethod>("next_day");

  // Discount code
  const [discountCode, setDiscountCode] = useState("");
  const [discountInput, setDiscountInput] = useState("");
  const [discountAmountCents, setDiscountAmountCents] = useState(0);
  const [discountMessage, setDiscountMessage] = useState<string | null>(null);
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [discountError, setDiscountError] = useState<string | null>(null);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-white/60">Loading cart...</div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-light text-white mb-4">Your cart is empty</h2>
        <Link
          href="/"
          className="inline-block rounded-full border border-white px-8 py-3 text-sm uppercase tracking-[0.2em] text-white hover:bg-white hover:text-black transition"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  const totalCents = subtotalCents - discountAmountCents + SHIPPING_COST;

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
          subtotalCents,
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
      // Create orders for each cart item (only first item gets discount)
      const orderPromises = items.map((item, index) =>
        fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: item.productId,
            quantity: item.quantity,
            size: item.size,
            email,
            phone,
            shippingName: name,
            shippingAddress: address,
            shippingCity: city,
            shippingPostcode: postcode,
            shippingMethod,
            discountCode: index === 0 ? discountCode || undefined : undefined,
          }),
        }).then(async (res) => {
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || `Failed to create order for ${item.title}`);
          }
          return data;
        })
      );

      const results = await Promise.all(orderPromises);
      
      // Collect all order numbers
      const orderNumbers = results.map((r) => r.orderNumber).join(",");
      
      // Clear cart after successful orders
      clearCart();

      // Redirect to thank you page with all order numbers
      router.push(`/thank-you?orders=${orderNumbers}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process order");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Left: Form Fields */}
        <div className="space-y-8">
          {/* Contact Info */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Contact Information</h2>
            <div className="space-y-4">
              <label className="block">
                <span className="text-xs uppercase tracking-[0.2em] text-white/60">
                  Full Name <span className="text-red-400">*</span>
                </span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-transparent px-4 py-3 text-white focus:border-white focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-[0.2em] text-white/60">
                  Email <span className="text-red-400">*</span>
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-transparent px-4 py-3 text-white focus:border-white focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-[0.2em] text-white/60">
                  Phone (optional)
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-transparent px-4 py-3 text-white focus:border-white focus:outline-none"
                />
              </label>
            </div>
          </section>

          {/* Shipping Address */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Shipping Address</h2>
            <div className="space-y-4">
              <label className="block">
                <span className="text-xs uppercase tracking-[0.2em] text-white/60">
                  Address <span className="text-red-400">*</span>
                </span>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street address"
                  className="mt-1 w-full rounded-xl border border-white/15 bg-transparent px-4 py-3 text-white focus:border-white focus:outline-none"
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs uppercase tracking-[0.2em] text-white/60">
                    City <span className="text-red-400">*</span>
                  </span>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-transparent px-4 py-3 text-white focus:border-white focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-xs uppercase tracking-[0.2em] text-white/60">
                    Postcode <span className="text-red-400">*</span>
                  </span>
                  <input
                    type="text"
                    required
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value.toUpperCase())}
                    placeholder="e.g. SW1A 1AA"
                    className="mt-1 w-full rounded-xl border border-white/15 bg-transparent px-4 py-3 text-white focus:border-white focus:outline-none"
                  />
                </label>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/60">
                🇬🇧 UK shipping only
              </div>
            </div>
          </section>

          {/* Shipping */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Shipping</h2>
            <div className="flex items-center justify-between rounded-xl border border-white bg-white/10 p-4">
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 rounded-full border-2 border-white flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-white" />
                </div>
                <div>
                  <p className="font-medium text-white">Free Next Day Delivery</p>
                  <p className="text-sm text-white/60">Order by 2pm for next day</p>
                </div>
              </div>
              <span className="font-semibold text-white">FREE</span>
            </div>
          </section>
        </div>

        {/* Right: Order Summary */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Order Summary</h2>
            
            {/* Cart Items */}
            <div className="space-y-4 border-b border-white/10 pb-4">
              {items.map((item) => (
                <div key={`${item.productId}-${item.size}`} className="flex gap-3">
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-white">{item.title}</p>
                    {item.size && (
                      <p className="text-xs text-white/60">Size: {item.size}</p>
                    )}
                    <p className="text-xs text-white/60">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-white">
                    {priceFormatter.format((item.priceCents * item.quantity) / 100)}
                  </p>
                </div>
              ))}
            </div>

            {/* Discount Code */}
            <div className="space-y-2 border-b border-white/10 pb-4">
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
            <div className="space-y-2 pt-4 text-sm">
              <div className="flex justify-between text-white/70">
                <span>Subtotal</span>
                <span>{priceFormatter.format(subtotalCents / 100)}</span>
              </div>
              {discountAmountCents > 0 && (
                <div className="flex justify-between text-green-400">
                  <span>Discount</span>
                  <span>-{priceFormatter.format(discountAmountCents / 100)}</span>
                </div>
              )}
              <div className="flex justify-between text-white/70">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-2 text-lg font-semibold text-white">
                <span>Total</span>
                <span>{priceFormatter.format(totalCents / 100)}</span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 w-full rounded-full bg-white py-4 text-sm font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-white/90 disabled:opacity-50"
            >
              {isSubmitting ? "Processing..." : "Place Order"}
            </button>

            <p className="mt-4 text-center text-xs text-white/50">
              You'll receive PayPal payment instructions after placing your order
            </p>

            <Link
              href="/cart"
              className="mt-3 block text-center text-sm text-white/60 hover:text-white"
            >
              ← Back to Cart
            </Link>
          </div>
        </div>
      </div>
    </form>
  );
}
