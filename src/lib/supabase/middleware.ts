import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/types/database";
import { ROLE_HOME_PATH } from "@/lib/types/domain";
import { getSupabaseAnonKey, getSupabaseUrl } from "./env";

const PUBLIC_PATHS = ["/login", "/join", "/auth", "/dev-disclaimer"];

function isPublicPath(pathname: string) {
  if (pathname === "/") return true;
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function sectionForPath(pathname: string): "patient" | "doctor" | "admin" | null {
  if (pathname.startsWith("/patient")) return "patient";
  if (pathname.startsWith("/doctor")) return "doctor";
  if (pathname.startsWith("/admin")) return "admin";
  return null;
}

/**
 * Refreshes the Supabase auth session on every request and enforces
 * coarse role-based section access (/patient, /doctor, /admin). Fine-grained
 * per-resource authorization still happens via Postgres RLS.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (!user) {
    if (!isPublicPath(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return response;
  }

  const section = sectionForPath(pathname);
  if (section) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("auth_user_id", user.id)
      .single();

    const role = profile?.role;
    const allowed =
      (section === "patient" && role === "patient_family") ||
      (section === "doctor" && role === "doctor") ||
      (section === "admin" && (role === "super_admin" || role === "clinic_admin"));

    if (!allowed) {
      const url = request.nextUrl.clone();
      url.pathname = role ? ROLE_HOME_PATH[role] ?? "/login" : "/login";
      return NextResponse.redirect(url);
    }
  }

  if (pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/redirect";
    return NextResponse.redirect(url);
  }

  return response;
}
