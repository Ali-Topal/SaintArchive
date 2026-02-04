import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type ReorderBody = {
  productIds?: string[];
};

export async function POST(request: Request) {
  let body: ReorderBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const productIds = body.productIds;

  if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
    return NextResponse.json(
      { error: "productIds array is required." },
      { status: 400 }
    );
  }

  const supabase = supabaseAdmin();

  // Update each product's sort_priority based on its position in the array
  const updates = productIds.map((id, index) => ({
    id,
    sort_priority: index + 1,
  }));

  // Batch update using multiple single updates (Supabase doesn't support bulk upsert well)
  const errors: string[] = [];

  for (const update of updates) {
    const { error } = await supabase
      .from("products")
      .update({ sort_priority: update.sort_priority })
      .eq("id", update.id);

    if (error) {
      errors.push(`Failed to update ${update.id}: ${error.message}`);
    }
  }

  if (errors.length > 0) {
    console.error("[reorder-products] Errors:", errors);
    return NextResponse.json(
      { error: "Some products failed to update.", details: errors },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, count: updates.length });
}
