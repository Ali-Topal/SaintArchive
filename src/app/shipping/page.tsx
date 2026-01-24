export default function ShippingPage() {
  return (
    <section className="mx-auto max-w-3xl space-y-8 px-4 py-12 text-white/90">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-white/50">Support</p>
        <h1 className="text-3xl font-semibold text-white">Shipping &amp; Returns</h1>
      </header>

      <article className="space-y-5 text-sm leading-relaxed text-white/80">
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-white">Shipping Areas</h2>
          <p>
            We currently ship within the United Kingdom only. We're working on expanding 
            to international shipping in the future.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-white">Shipping Options</h2>
          <div className="space-y-3">
            <div className="rounded-lg border border-white/10 p-4">
              <p className="font-semibold text-white">Standard Delivery — FREE</p>
              <p className="text-white/60">3-5 business days</p>
            </div>
            <div className="rounded-lg border border-white/10 p-4">
              <p className="font-semibold text-white">Next Day Delivery — £5.99</p>
              <p className="text-white/60">Order before 2pm for next working day delivery</p>
            </div>
          </div>
          <p className="mt-2">
            Free standard shipping on all orders over £50.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-white">Order Processing</h2>
          <p>
            Orders are processed once payment is confirmed. We aim to dispatch orders within 
            1-2 business days. You'll receive a tracking number via email once your order ships.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-white">Tracking Your Order</h2>
          <p>
            Every order includes tracked shipping. We'll email your tracking number as soon as 
            the courier collects your parcel. If you haven't received tracking within 3 business 
            days of placing your order, please contact us.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-white">Packaging</h2>
          <p>
            All items are carefully packed to ensure they arrive in perfect condition. 
            High-value items may be double-boxed for extra protection.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-white">Returns Policy</h2>
          <p>
            We accept returns within 14 days of delivery. Items must be:
          </p>
          <ul className="list-disc space-y-1 pl-5 mt-2">
            <li>Unworn and in original condition</li>
            <li>With all tags attached</li>
            <li>In original packaging</li>
          </ul>
          <p className="mt-2">
            To initiate a return, please contact us via Instagram @saintarchive88 with your 
            order number and reason for return.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-white">Return Shipping</h2>
          <p>
            Return shipping costs are the responsibility of the customer, unless the item 
            is faulty or we made an error. We recommend using a tracked service for returns.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-white">Refunds</h2>
          <p>
            Once we receive and inspect your return, we'll process your refund within 5-7 
            business days. Refunds will be issued to your original payment method (PayPal).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-white">Damaged or Lost Parcels</h2>
          <p>
            If your parcel arrives damaged or appears to be lost in transit, please contact 
            us immediately with photos (for damage) or the last tracking update. We'll work 
            with the courier to resolve the issue and arrange a replacement or refund.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-white">Contact</h2>
          <p>
            For shipping enquiries, please contact us via Instagram @saintarchive88. Include 
            your order number so we can help you quickly.
          </p>
        </section>
      </article>
    </section>
  );
}
