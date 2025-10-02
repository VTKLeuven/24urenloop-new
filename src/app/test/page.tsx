// src/app/test/page.tsx
import React from "react";

type VerifyOk = { ok: true; status: number; body: unknown };
type VerifyErr = { ok: false; error: string; details?: string };
type VerifyResult = VerifyOk | VerifyErr;

function safeParseJson(text: string): unknown {
    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

function isRecord(x: unknown): x is Record<string, unknown> {
    return typeof x === "object" && x !== null;
}

async function exchangeToken(
    clientId: string,
    clientSecret: string,
    authEndpoint: string
): Promise<{ ok: true; accessToken: string } | { ok: false; message: string }> {
    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    try {
        const res = await fetch(authEndpoint, {
            method: "POST",
            headers: {
                Authorization: `Basic ${basic}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({ grant_type: "client_credentials" }),
        });

        if (!res.ok) {
            const txt = await res.text().catch(() => "");
            return { ok: false, message: `token endpoint returned ${res.status}: ${txt}` };
        }

        const json = await res.json().catch(() => null);
        if (isRecord(json) && typeof json["access_token"] === "string") {
            return { ok: true, accessToken: json["access_token"] as string };
        }
        return { ok: false, message: "token response missing access_token" };
    } catch (err: unknown) {
        return { ok: false, message: String(err) };
    }
}

async function verifyWithKUL(
    accessToken: string,
    idEndpoint: string,
    cardAppId: string,
    serial: string
): Promise<{ ok: true; status: number; body: unknown } | { ok: false; message: string }> {
    try {
        const res = await fetch(idEndpoint, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ cardAppId, serialNr: serial }),
        });
        const text = await res.text().catch(() => "");
        const body = safeParseJson(text);
        return { ok: true, status: res.status, body };
    } catch (err: unknown) {
        return { ok: false, message: String(err) };
    }
}

/**
 * Page component (App Router).
 * Reads scanned from searchParams: /test?scanned=serial;cardAppId
 * IMPORTANT: await searchParams before using it (Next.js requirement).
 */
export default async function Page({
                                       searchParams,
                                   }: {
    searchParams?: { scanned?: string | string[] } | Promise<{ scanned?: string | string[] }>;
}) {
    // **CRITICAL FIX**: await searchParams before reading properties
    const params = (await searchParams) ?? {};
    const scannedParam = Array.isArray(params.scanned) ? params.scanned[0] : params.scanned;

    let result: VerifyResult | undefined = undefined;

    if (scannedParam) {
        const scanned = scannedParam;
        if (!scanned.includes(";")) {
            result = { ok: false, error: "Invalid format. Expected serial;cardAppId" };
        } else {
            const [serial, cardAppId] = scanned.split(";");
            if (!serial || !cardAppId) {
                result = { ok: false, error: "Invalid scanned values" };
            } else {
                const clientId = process.env.KUL_CLIENT_ID;
                const clientSecret = process.env.KUL_CLIENT_SECRET;
                const authEndpoint =
                    process.env.KUL_AUTH_ENDPOINT ||
                    "https://idp.kuleuven.be/auth/realms/kuleuven/protocol/openid-connect/token";
                const idEndpoint =
                    process.env.KUL_ID_ENDPOINT || "https://account.kuleuven.be/api/v1/idverification";

                if (!clientId || !clientSecret) {
                    result = {
                        ok: false,
                        error: "Server misconfiguration: missing KUL_CLIENT_ID or KUL_CLIENT_SECRET",
                    };
                } else {
                    const tokenRes = await exchangeToken(clientId, clientSecret, authEndpoint);
                    if (!tokenRes.ok) {
                        result = { ok: false, error: "Token exchange failed", details: tokenRes.message };
                    } else {
                        const verifyRes = await verifyWithKUL(tokenRes.accessToken, idEndpoint, cardAppId, serial);
                        if (!verifyRes.ok) {
                            result = { ok: false, error: "KU Leuven verification failed", details: verifyRes.message };
                        } else {
                            result = { ok: true, status: verifyRes.status, body: verifyRes.body };
                        }
                    }
                }
            }
        }
    }

    return (
        <div style={{ fontFamily: "system-ui, sans-serif", padding: 24 }}>
            <h1>KU Leuven Check-in — App Router single-file</h1>

            <form method="get" action="/test" style={{ marginBottom: 16 }}>
                <label htmlFor="scanned">Scanned string (serial;cardAppId)</label>
                <br />
                <input
                    id="scanned"
                    name="scanned"
                    defaultValue={scannedParam ?? ""}
                    placeholder="123456789;0123456789"
                    style={{ width: "100%", padding: 8, marginTop: 8 }}
                />
                <br />
                <button type="submit" style={{ marginTop: 12 }}>
                    Verify
                </button>
            </form>

            {typeof result !== "undefined" && (
                <section>
                    <h2>Result</h2>
                    {result.ok ? (
                        <div>
                            <strong>HTTP status:</strong> {result.status}
                            <pre style={{ background: "#f7f7f7", padding: 12, borderRadius: 6, overflowX: "auto" }}>
                {JSON.stringify(result.body, null, 2)}
              </pre>
                        </div>
                    ) : (
                        <div style={{ color: "crimson" }}>
                            <strong>Error:</strong> {result.error}
                            {result.details && (
                                <div style={{ marginTop: 8 }}>
                                    <strong>Details:</strong>
                                    <pre style={{ background: "#fff6f6", padding: 12, borderRadius: 6, overflowX: "auto" }}>
                    {result.details}
                  </pre>
                                </div>
                            )}
                        </div>
                    )}
                </section>
            )}

            <hr style={{ margin: "24px 0" }} />
            <p style={{ color: "#666" }}>
                Use query string: <code>/test?scanned=serial;cardAppId</code>. Secrets are read from <code>process.env</code>.
            </p>
        </div>
    );
}