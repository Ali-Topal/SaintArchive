import { NextResponse } from "next/server";

export function middleware(req: Request) {
  const basicAuth = req.headers.get("authorization");

  const USER = process.env.ADMIN_USER;
  const PASS = process.env.ADMIN_PASS;

  if (!basicAuth) {
    return new NextResponse("Authentication required", {
      status: 401,
      headers: { "WWW-Authenticate": "Basic realm='Secure Area'" },
    });
  }

  const authValue = basicAuth.split(" ")[1];
  const [user, pass] = Buffer.from(authValue, "base64").toString().split(":");

  if (user === USER && pass === PASS) {
    return NextResponse.next();
  }

  return new NextResponse("Unauthorized", {
    status: 401,
    headers: { "WWW-Authenticate": "Basic realm='Secure Area'" },
  });
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};

