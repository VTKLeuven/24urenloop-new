"use client"

import React, { useEffect, useMemo, useState } from "react";

type Runner = {
  id: number;
  firstName: string;
  lastName: string;
  identification: string;
  reward1Collected: boolean;
  reward2Collected: boolean;
  reward3Collected: boolean;
  completedLaps: number;
};

function getErrorMessage(err: unknown) {
  if (err instanceof Error) return err.message;
  try {
    return String(err);
  } catch {
    return 'Unknown error';
  }
}

// Tailwind styling for the checkboxes depending on availability
function checkboxClasses(available: boolean) {
  return [
    "h-4 w-4 rounded border-2 align-middle transition-colors",
    available
      ? "border-blue-500 text-blue-600 focus:ring-blue-500"
      : "border-gray-300 opacity-50 cursor-not-allowed",
  ].join(" ");
}

export default function RunnerRewardsPage() {
  const [runners, setRunners] = useState<Runner[]>([]);
  const [loadingIds, setLoadingIds] = useState<Record<number, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchRunners();
  }, []);

  async function fetchRunners() {
    try {
      const res = await fetch("/api/runner-rewards");
      if (!res.ok) throw new Error("Failed to fetch runners");
      const data = await res.json();
      // Ensure the list is sorted by lastName on the client as well
      const sorted = (data as Runner[]).slice().sort((a, b) => a.lastName.localeCompare(b.lastName));
      setRunners(sorted);
    } catch (err: unknown) {
      console.error(err);
      setError(getErrorMessage(err));
    }
  }

  const filteredRunners = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return runners;
    return runners.filter((r) =>
      r.firstName.toLowerCase().includes(q) ||
      r.lastName.toLowerCase().includes(q) ||
      r.identification.toLowerCase().includes(q)
    );
  }, [runners, search]);

  async function toggleReward(id: number, field: string, value: boolean) {
    setLoadingIds((s) => ({ ...s, [id]: true }));
    setError(null);

    try {
      const res = await fetch("/api/runner-rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, field, value }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({} as Record<string, unknown>));
        const errMsg =
          typeof json === 'object' && json !== null && 'error' in json && typeof (json as Record<string, unknown>)['error'] === 'string'
            ? (json as Record<string, unknown>)['error'] as string
            : "Failed to update reward";
        throw new Error(errMsg);
      }

      const updated = await res.json();
      setRunners((list) =>
        list.map((r) => (r.id === updated.id ? { ...r, ...updated } : r))
      );
    } catch (err: unknown) {
      console.error(err);
      setError(getErrorMessage(err));
    } finally {
      setLoadingIds((s) => ({ ...s, [id]: false }));
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Runner Rewards</h1>

      {error ? (
        <div className="mb-4 text-red-600">Error: {error}</div>
      ) : null}

      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-sm">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by first name, last name, or identification"
            className="w-full rounded-md border px-3 py-2 text-sm bg-background"
            aria-label="Search runners"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          Showing {filteredRunners.length} of {runners.length}
        </div>
      </div>

      <div className="overflow-auto bg-card border rounded-md">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="bg-muted text-left">
              <th className="px-4 py-2">Last name</th>
              <th className="px-4 py-2">First name</th>
              <th className="px-4 py-2">Identification</th>
              <th className="px-4 py-2">Reward 2 rounds</th>
              <th className="px-4 py-2">Reward 4 rounds</th>
              <th className="px-4 py-2">Reward 6 rounds</th>
            </tr>
          </thead>
          <tbody>
            {filteredRunners.map((runner) => (
              <tr key={runner.id} className="border-t">
                <td className="px-4 py-2">{runner.lastName}</td>
                <td className="px-4 py-2">{runner.firstName}</td>
                <td className="px-4 py-2">{runner.identification}</td>
                <td className="px-4 py-2">
                  {(() => {
                    const available = runner.completedLaps >= 2;
                    return (
                      <input
                        type="checkbox"
                        className={checkboxClasses(available)}
                        checked={runner.reward1Collected}
                        disabled={!available || !!loadingIds[runner.id]}
                        title={available ? undefined : "Available once 2 laps are completed"}
                        onChange={(e) =>
                          toggleReward(runner.id, "reward1Collected", e.target.checked)
                        }
                      />
                    );
                  })()}
                </td>
                <td className="px-4 py-2">
                  {(() => {
                    const available = runner.completedLaps >= 4;
                    return (
                      <input
                        type="checkbox"
                        className={checkboxClasses(available)}
                        checked={runner.reward2Collected}
                        disabled={!available || !!loadingIds[runner.id]}
                        title={available ? undefined : "Available once 4 laps are completed"}
                        onChange={(e) =>
                          toggleReward(runner.id, "reward2Collected", e.target.checked)
                        }
                      />
                    );
                  })()}
                </td>
                <td className="px-4 py-2">
                  {(() => {
                    const available = runner.completedLaps >= 6;
                    return (
                      <input
                        type="checkbox"
                        className={checkboxClasses(available)}
                        checked={runner.reward3Collected}
                        disabled={!available || !!loadingIds[runner.id]}
                        title={available ? undefined : "Available once 6 laps are completed"}
                        onChange={(e) =>
                          toggleReward(runner.id, "reward3Collected", e.target.checked)
                        }
                      />
                    );
                  })()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
