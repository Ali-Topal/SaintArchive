"use client";

import { useState } from "react";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import CopyButton from "./CopyButton";

type Product = {
  id: string;
  title: string;
  slug: string | null;
  brand: string | null;
  price_cents: number;
  stock_quantity: number;
  is_active: boolean;
  image_url: string | null;
  image_urls: string[] | null;
  sort_priority: number | null;
};

type DraggableProductListProps = {
  initialProducts: Product[];
  onToggleActive: (productId: string, currentActive: boolean) => Promise<void>;
};

const priceFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

function SortableProductItem({
  product,
  position,
  onToggleActive,
}: {
  product: Product;
  position: number;
  onToggleActive: (productId: string, currentActive: boolean) => Promise<void>;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const thumbnail = product.image_urls?.[0] ?? product.image_url ?? null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-2xl border p-5 ${
        product.is_active
          ? "border-white/10 bg-white/5"
          : "border-red-500/30 bg-red-500/5"
      } ${isDragging ? "shadow-2xl shadow-white/10" : ""}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab touch-none rounded-lg p-2 text-white/40 transition hover:bg-white/10 hover:text-white/70 active:cursor-grabbing"
            title="Drag to reorder"
          >
            <GripVertical className="h-5 w-5" />
          </button>

          {/* Position Number */}
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white/60">
            {position}
          </div>

          {thumbnail ? (
            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-white/10">
              <img
                src={thumbnail}
                alt={product.title}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="h-16 w-16 flex-shrink-0 rounded-xl border border-white/10 bg-white/5" />
          )}
          <div>
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold text-white">{product.title}</p>
              {!product.is_active && (
                <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-400">
                  Inactive
                </span>
              )}
            </div>
            {product.brand && (
              <p className="text-xs text-white/50">{product.brand}</p>
            )}
            <p className="text-sm text-white/70">
              {priceFormatter.format(product.price_cents / 100)} · Stock:{" "}
              {product.stock_quantity}
            </p>
            <div className="flex items-center gap-2 text-xs text-white/40">
              <span>ID: {product.id.slice(0, 8)}...</span>
              <CopyButton text={product.id} small />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/products/${product.slug ?? product.id}`}
            className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70 transition hover:border-white/40 hover:text-white"
          >
            View
          </Link>
          <Link
            href={`/admin/products/${product.id}`}
            className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70 transition hover:border-white/40 hover:text-white"
          >
            Edit
          </Link>
          <button
            type="button"
            onClick={() => onToggleActive(product.id, product.is_active)}
            className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.2em] transition ${
              product.is_active
                ? "border-red-500/30 text-red-400 hover:border-red-500/50"
                : "border-green-500/30 text-green-400 hover:border-green-500/50"
            }`}
          >
            {product.is_active ? "Deactivate" : "Activate"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DraggableProductList({
  initialProducts,
  onToggleActive,
}: DraggableProductListProps) {
  const [products, setProducts] = useState(initialProducts);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = products.findIndex((p) => p.id === active.id);
      const newIndex = products.findIndex((p) => p.id === over.id);

      const newProducts = arrayMove(products, oldIndex, newIndex);
      setProducts(newProducts);

      // Save new order to database
      setIsSaving(true);
      setSaveStatus("saving");

      try {
        const response = await fetch("/api/admin/reorder-products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productIds: newProducts.map((p) => p.id),
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to save order");
        }

        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } catch (error) {
        console.error("Failed to save order:", error);
        setSaveStatus("error");
        setTimeout(() => setSaveStatus("idle"), 3000);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleToggleActive = async (productId: string, currentActive: boolean) => {
    await onToggleActive(productId, currentActive);
    // Update local state
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId ? { ...p, is_active: !currentActive } : p
      )
    );
  };

  return (
    <div className="space-y-4">
      {/* Save Status Indicator */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-white/50">
          Drag items to reorder. Changes save automatically.
        </p>
        <div className="h-6">
          {saveStatus === "saving" && (
            <span className="text-xs text-amber-400">Saving...</span>
          )}
          {saveStatus === "saved" && (
            <span className="text-xs text-green-400">✓ Order saved</span>
          )}
          {saveStatus === "error" && (
            <span className="text-xs text-red-400">Failed to save</span>
          )}
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={products.map((p) => p.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {products.map((product, index) => (
              <SortableProductItem
                key={product.id}
                product={product}
                position={index + 1}
                onToggleActive={handleToggleActive}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
