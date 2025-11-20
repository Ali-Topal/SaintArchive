import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseClient";

export async function POST(request: Request) {
  let payload: { email?: string };

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const email = payload.email?.trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("waitlist")
    .insert({ email })
    .select("id")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ message: "Already on the list." }, { status: 200 });
    }
    console.error("[waitlist] insert failed:", error.message);
    return NextResponse.json({ error: "Failed to save email." }, { status: 500 });
  }

  return NextResponse.json({ message: "Added to waitlist.", id: data?.id }, { status: 200 });
}

