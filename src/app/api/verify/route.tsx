// src/app/api/verify/route.tsx
import { NextResponse } from "next/server";

const DEFAULT_AUTH_ENDPOINT =
    "https://idp.kuleuven.be/auth/realms/kuleuven/protocol/openid-connect/token";
const DEFAULT_ID_ENDPOINT = "https://account.kuleuven.be/api/v1/idverification";

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({}));
        const scanned = typeof body.scanned === "string" ? body.scanned : "";

        if (!scanned || !scanned.includes(";")) {
            return NextResponse.json({ ok: false, error: "Missing or invalid 'scanned' field (expected serial;cardAppId)" }, { status: 400 });
        }

        const [serial, cardAppId] = scanned.split(";");

        const clientId = process.env.KUL_CLIENT_ID;
        const clientSecret = process.env.KUL_CLIENT_SECRET;
        const authEndpoint = process.env.KUL_AUTH_ENDPOINT || DEFAULT_AUTH_ENDPOINT;
        const idEndpoint = process.env.KUL_ID_ENDPOINT || DEFAULT_ID_ENDPOINT;

        if (!clientId || !clientSecret) {
            return NextResponse.json({ ok: false, error: "Server misconfiguration: missing KUL_CLIENT_ID or KUL_CLIENT_SECRET" }, { status: 500 });
        }

        // Exchange client credentials for token
        const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
        const tokenRes = await fetch(authEndpoint, {
            method: "POST",
            headers: {
                Authorization: `Basic ${basic}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({ grant_type: "client_credentials" }).toString(),
        });

        if (!tokenRes.ok) {
            const txt = await tokenRes.text().catch(() => "");
            return NextResponse.json({ ok: false, error: "Token exchange failed", details: txt }, { status: 502 });
        }

        const tokenJson = await tokenRes.json().catch(() => null);
        const accessToken = tokenJson && typeof tokenJson.access_token === "string" ? tokenJson.access_token : null;
        if (!accessToken) {
            return NextResponse.json({ ok: false, error: "Token response missing access_token", details: tokenJson }, { status: 502 });
        }

        // Call idverification endpoint
        const verifyRes = await fetch(idEndpoint, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ cardAppId, serialNr: serial }),
        });

        const verifyText = await verifyRes.text().catch(() => "");
        let verifyJson: unknown = null;
        try {
            verifyJson = JSON.parse(verifyText);
        } catch {
            verifyJson = verifyText;
        }

        if (!verifyRes.ok) {
            return NextResponse.json({ ok: false, error: `KU Leuven verification failed: ${verifyRes.status}`, details: verifyJson }, { status: verifyRes.status });
        }

        // Success: return the parsed KU Leuven response
        return NextResponse.json({ ok: true, data: verifyJson }, { status: 200 });
    } catch (err: unknown) {
        return NextResponse.json({ ok: false, error: "Server error", details: String(err) }, { status: 500 });
    }
}