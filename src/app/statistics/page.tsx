'use client'
import React, { useState, useEffect } from 'react';

interface Runner {
    name: string;
    startTime: string | null;
    time?: number;
}

interface Lap {
    name: string;
    time: number;
}

interface QueueEntry {
    name: string;
}

interface Group {
    name: string;
    laps: number;
}

interface StatisticsData {
    currentRunner: Runner;
    last7Laps: Lap[];
    quickest7Runners: Lap[];
    currentQueue: QueueEntry[];
    groupLapRanking: Group[];
    top7Runners: Group[];
}

// --- Countdown helpers ---
function getNextDayTarget(): Date {
    const now = new Date();
    const target = new Date(now);
    target.setDate(now.getDate() + 1); // tomorrow
    target.setHours(20, 0, 0, 0); // 20:00 local time
    return target;
}

function formatDuration(ms: number): string {
    const total = Math.max(0, Math.floor(ms / 1000));
    const h = String(Math.floor(total / 3600)).padStart(2, '0');
    const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
    const s = String(total % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
}

// Slimmer row item
function RowItem({
                     left,
                     right,
                     highlight = false,
                     subtitle,
                 }: {
    left: React.ReactNode;
    right?: React.ReactNode;
    highlight?: boolean;
    subtitle?: React.ReactNode;
}) {
    return (
        <div
            className={`flex items-center p-2 rounded-md ${highlight ? 'bg-blue-50' : 'bg-gray-50'}`}
        >
            <div className="flex-1 min-w-0">
                <div className="text-base font-medium truncate">{left}</div>
                {subtitle && <div className="text-xs text-gray-600 truncate">{subtitle}</div>}
            </div>
            {right && (
                <div className="text-base font-bold text-blue-600 ml-2 shrink-0">{right}</div>
            )}
        </div>
    );
}

// Slimmer row with leading index (for queue)
function IndexedRow({
                        index,
                        name,
                        highlight = false,
                        subtitle,
                    }: {
    index: number;
    name: string;
    highlight?: boolean;
    subtitle?: React.ReactNode;
}) {
    return (
        <div
            className={`flex items-center p-2 rounded-md ${highlight ? 'bg-blue-50' : 'bg-gray-50'}`}
        >
            <div className="mr-2 font-semibold text-gray-700 w-5 text-right text-sm">{index}.</div>
            <div className="flex-1 min-w-0">
                <div className="text-base font-medium truncate">{name}</div>
                {subtitle && <div className="text-xs text-gray-600 truncate">{subtitle}</div>}
            </div>
        </div>
    );
}

export default function Statistics() {
    const [data, setData] = useState<StatisticsData>({
        currentRunner: { name: '', startTime: null, time: 0 },
        last7Laps: [],
        quickest7Runners: [],
        currentQueue: [],
        groupLapRanking: [],
        top7Runners: [],
    });

    // Countdown state
    const [target, setTarget] = useState<Date>(() => getNextDayTarget());
    const [countdown, setCountdown] = useState<string>('');

    useEffect(() => {
        async function fetchData() {
            const response = await fetch('/api/statistics');
            const result = await response.json();
            setData(result);
        }

        fetchData();

        // Timer for current runner time (10ms)
        const timer = setInterval(() => {
            setData((prev) => ({
                ...prev,
                currentRunner: {
                    ...prev.currentRunner,
                    time: prev.currentRunner.startTime
                        ? Date.now() - new Date(prev.currentRunner.startTime).getTime()
                        : 0,
                },
            }));
        }, 10);

        // Timer for countdown (1s)
        const cd = setInterval(() => {
            const now = new Date();
            let diff = target.getTime() - now.getTime();
            if (diff <= 0) {
                const next = getNextDayTarget();
                setTarget(next);
                diff = next.getTime() - now.getTime();
            }
            setCountdown(formatDuration(diff));
        }, 1000);

        return () => {
            clearInterval(timer);
            clearInterval(cd);
        };
    }, [target]);

    const currentName = data.currentRunner?.name || 'none';
    const currentTimeDisplay =
        typeof data.currentRunner?.time === 'number'
            ? `${(data.currentRunner.time / 1000).toFixed(2)}s`
            : '';

    return (
        <div className="bg-gray-50 text-gray-900 h-screen w-screen">
            <div className="container mx-auto px-6 py-4 h-full flex flex-col max-w-screen-2xl">
                {/* Header */}
                <div className="flex justify-between items-end mb-6">
                    <h1 className="text-4xl font-bold">Runners Dashboard</h1>
                    <div className="text-5xl font-bold text-blue-600 tabular-nums">{countdown}</div>
                </div>

                {/* Grid 2x3 */}
                <div className="grid grid-cols-3 grid-rows-2 gap-6 flex-1 overflow-hidden">
                    {/* Current Runner */}
                    <div className="bg-white rounded-lg shadow-md p-6 flex flex-col min-h-0">
                        <h2 className="text-2xl font-bold mb-4">Current Runner</h2>
                        <div className="space-y-2 overflow-auto">
                            <RowItem left={currentName} right={<span>{currentTimeDisplay}</span>} highlight />
                        </div>
                    </div>

                    {/* Last Laps */}
                    <div className="bg-white rounded-lg shadow-md p-6 flex flex-col min-h-0">
                        <h2 className="text-2xl font-bold mb-4">Last Laps</h2>
                        <div className="space-y-2 overflow-auto">
                            {data.last7Laps.map((lap, index) => (
                                <RowItem
                                    key={index}
                                    left={lap.name}
                                    right={<span>{lap.time}s</span>}
                                    highlight={index === 0}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Quickest Runners */}
                    <div className="bg-white rounded-lg shadow-md p-6 flex flex-col min-h-0">
                        <h2 className="text-2xl font-bold mb-4">Quickest Runners</h2>
                        <div className="space-y-2 overflow-auto">
                            {data.quickest7Runners.map((runner, index) => (
                                <RowItem
                                    key={index}
                                    left={runner.name}
                                    right={<span>{runner.time}s</span>}
                                    highlight={index === 0}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Current Queue */}
                    <div className="bg-white rounded-lg shadow-md p-6 flex flex-col min-h-0">
                        <h2 className="text-2xl font-bold mb-4">Current Queue</h2>
                        <div className="space-y-2 overflow-auto">
                            {data.currentQueue.slice(0, 7).map((runner, index) => (
                                <IndexedRow
                                    key={index}
                                    index={index + 1}
                                    name={runner.name}
                                    highlight={index === 0}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Group Lap Ranking */}
                    <div className="bg-white rounded-lg shadow-md p-6 flex flex-col min-h-0">
                        <h2 className="text-2xl font-bold mb-4">Group Lap Ranking</h2>
                        <div className="space-y-2 overflow-auto">
                            {data.groupLapRanking.map((group, index) => (
                                <RowItem
                                    key={index}
                                    left={group.name}
                                    right={<span>{group.laps} laps</span>}
                                    highlight={index === 0}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Most Laps */}
                    <div className="bg-white rounded-lg shadow-md p-6 flex flex-col min-h-0">
                        <h2 className="text-2xl font-bold mb-4">Most Laps</h2>
                        <div className="space-y-2 overflow-auto">
                            {data.top7Runners.map((runner, index) => (
                                <RowItem
                                    key={index}
                                    left={runner.name}
                                    right={<span>{runner.laps}</span>}
                                    highlight={index === 0}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}