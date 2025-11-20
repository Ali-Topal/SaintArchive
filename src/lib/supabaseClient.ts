import {
  createBrowserClient,
  createServerClient,
  type CookieOptions,
} from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables."
  );
}

let browserClient: SupabaseClient | null = null;

export const getSupabaseBrowserClient = (): SupabaseClient => {
  if (!browserClient) {
    browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }

  return browserClient;
};

type CookieStore = Awaited<ReturnType<typeof cookies>>;

const adaptSetAll =
  (store: CookieStore) =>
  (items: { name: string; value: string; options: CookieOptions }[]) => {
    const mutableStore = store as unknown as {
      set?: (name: string, value: string, options?: CookieOptions) => void;
    };

    if (!mutableStore.set) {
      return;
    }

    items.forEach(({ name, value, options }) => {
      mutableStore.set?.(name, value, options);
    });
  };

export const createSupabaseServerClient = async (
  cookieStore?: CookieStore
) => {
  const store = cookieStore ?? (await cookies());

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return store.getAll().map(({ name, value }) => ({ name, value }));
      },
      setAll: adaptSetAll(store),
    },
  });
};

