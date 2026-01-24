export default function FaqPage() {
  const faqs = [
    {
      question: "What is Saint Archive?",
      answer:
        "We curate and sell authentic luxury streetwear, sneakers, and accessories. Every item is verified for authenticity before listing.",
    },
    {
      question: "How do I place an order?",
      answer:
        "Browse our collection, select your size, and click 'Buy Now'. Fill in your shipping details and you'll receive an order number. Then complete payment via PayPal using your order number as the reference.",
    },
    {
      question: "What payment methods do you accept?",
      answer:
        "We accept PayPal payments only. This provides buyer protection and secure transactions for both parties.",
    },
    {
      question: "How does the payment process work?",
      answer:
        "After placing your order, you'll receive an order number. Send payment to our PayPal (@CenchSaint) with your order number as the reference. Once we confirm payment, we'll process your order.",
    },
    {
      question: "How long does shipping take?",
      answer:
        "Standard delivery takes 3-5 business days within the UK. Next day delivery is available at checkout for an additional fee.",
    },
    {
      question: "Do you ship internationally?",
      answer:
        "We currently only ship within the UK. We're working on expanding to international shipping in the future.",
    },
    {
      question: "Are all items authentic?",
      answer:
        "Yes, every item is 100% authentic. We source from trusted suppliers and verify each piece before listing. If you have any concerns about authenticity, please contact us.",
    },
    {
      question: "Can I return or exchange an item?",
      answer:
        "We accept returns within 14 days of delivery for unworn items in original condition with tags attached. Please contact us to arrange a return.",
    },
    {
      question: "What if my item arrives damaged?",
      answer:
        "Please contact us immediately with photos of the damage. We'll arrange a replacement or refund as quickly as possible.",
    },
    {
      question: "How can I track my order?",
      answer:
        "Once your order ships, you'll receive a tracking number via email. You can use this to track your package with the courier.",
    },
  ];

  return (
    <section className="mx-auto max-w-3xl space-y-8 px-4 py-12 text-white/90">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-white/50">Support</p>
        <h1 className="text-3xl font-semibold text-white">Frequently Asked Questions</h1>
      </header>
      <div className="space-y-6 text-sm leading-relaxed text-white/80">
        {faqs.map((item) => (
          <div key={item.question} className="space-y-2">
            <h2 className="text-base font-semibold text-white">{item.question}</h2>
            <p>{item.answer}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
