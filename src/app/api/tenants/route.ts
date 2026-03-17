import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE = "https://triad.my.id/api/v1/tenants";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const headers: Record<string, string> = {
      "Content-Type": "text/plain",
      "Authorization": `Bearer ${token}`
    };

    const tenantId = cookieStore.get("user_tenant")?.value;
    const role = cookieStore.get("user_role")?.value;

    console.log('DEBUG [API/tenants]:', { role, tenantId });

    if (role === "user" && tenantId) {
      headers["X-Tenant-ID"] = tenantId;
      console.log('DEBUG [API/tenants]: Added X-Tenant-ID header');
    }

    const res = await fetch(API_BASE, {
      headers: headers,
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.text();
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
        "Authorization": `Bearer ${token}`
      },
      body,
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to create" },
      { status: 500 }
    );
  }
}
