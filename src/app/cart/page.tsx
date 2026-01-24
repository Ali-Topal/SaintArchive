"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";

const priceFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

export default function CartPage() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, subtotalCents, itemCount } = useCart();

  if (items.length === 0) {
    return (
      <section className="flex flex-col items-center justify-center py-20 text-center">
        <ShoppingBag className="h-16 w-16 text-white/20 mb-6" strokeWidth={1} />
        <h1 className="text-2xl font-light tracking-widest text-white mb-4">
          Your cart is empty
        </h1>
        <p className="text-white/60 mb-8">
          Add some items to get started
        </p>
        <Link
          href="/"
          className="rounded-full border border-white px-8 py-3 text-sm uppercase tracking-[0.2em] text-white transition hover:bg-white hover:text-black"
        >
          Continue Shopping
        </Link>
      </section>
    );
  }

  const handleCheckout = () => {
    // Navigate to checkout with cart items
    router.push("/checkout?from=cart");
  };

  return (
    <section className="space-y-8 py-8">
      <div>
        <h1 className="text-3xl font-light tracking-widest text-white">
          Your Cart
        </h1>
        <p className="text-sm text-white/60 mt-1">
          {itemCount} {itemCount === 1 ? "item" : "items"}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={`${item.productId}-${item.size ?? "no-size"}`}
              className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-4"
            >
              {/* Product Image */}
              {item.imageUrl ? (
                <Link href={`/products/${item.slug}`} className="flex-shrink-0">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="h-24 w-24 rounded-xl object-cover sm:h-32 sm:w-32"
                  />
                </Link>
              ) : (
                <div className="h-24 w-24 flex-shrink-0 rounded-xl bg-white/10 sm:h-32 sm:w-32" />
              )}

              {/* Product Details */}
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <Link
                    href={`/products/${item.slug}`}
                    className="text-lg font-semibold text-white hover:underline"
                  >
                    {item.title}
                  </Link>
                  {item.size && (
                    <p className="text-sm text-white/60 mt-1">Size: {item.size}</p>
                  )}
                  <p className="text-white/80 mt-1">
                    {priceFormatter.format(item.priceCents / 100)}
                  </p>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateQuantity(item.productId, item.size, item.quantity - 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-white/60 transition hover:border-white/40 hover:text-white"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center text-white">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.size, item.quantity + 1)}
                      disabled={item.quantity >= item.maxStock}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-white/60 transition hover:border-white/40 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeItem(item.productId, item.size)}
                    className="flex items-center gap-2 text-sm text-red-400 transition hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Remove</span>
                  </button>
                </div>
              </div>

              {/* Line Total */}
              <div className="hidden sm:flex flex-col items-end justify-center">
                <p className="text-lg font-semibold text-white">
                  {priceFormatter.format((item.priceCents * item.quantity) / 100)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 sticky top-6">
            <h2 className="text-lg font-semibold text-white mb-4">Order Summary</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-white/70">
                <span>Subtotal</span>
                <span>{priceFormatter.format(subtotalCents / 100)}</span>
              </div>
              <div className="flex justify-between text-white/70">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
              {subtotalCents < 5000 && (
                <p className="text-xs text-white/50">
                  Add {priceFormatter.format((5000 - subtotalCents) / 100)} more for free shipping
                </p>
              )}
              {subtotalCents >= 5000 && (
                <p className="text-xs text-green-400">
                  ✓ You qualify for free standard shipping!
                </p>
              )}
            </div>

            <div className="border-t border-white/10 mt-4 pt-4">
              <div className="flex justify-between text-lg font-semibold text-white">
                <span>Total</span>
                <span>{priceFormatter.format(subtotalCents / 100)}</span>
              </div>
              <p className="text-xs text-white/50 mt-1">Shipping calculated at checkout</p>
            </div>

            <button
              onClick={handleCheckout}
              className="mt-6 w-full rounded-full bg-white py-4 text-sm font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-white/90"
            >
              Checkout
            </button>

            <Link
              href="/"
              className="mt-3 block text-center text-sm text-white/60 hover:text-white"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
