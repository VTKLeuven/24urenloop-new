'use client'
import { useState, useEffect } from 'react';

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

interface StatisticsData {
    currentRunner: Runner;
    last7Laps: Lap[];
    currentQueue: QueueEntry[];
}

export default function LiveRunners() {
    const [data, setData] = useState<StatisticsData>({
        currentRunner: { name: '', startTime: null, time: 0 },
        last7Laps: [],
        currentQueue: []
    });

    useEffect(() => {
        async function fetchData() {
            const response = await fetch('/api/statistics');
            const result = await response.json();
            setData(result);
        }

        fetchData();

        const timer = setInterval(() => {
            setData(prev => ({
                ...prev,
                currentRunner: { ...prev.currentRunner, time: prev.currentRunner.startTime ? Date.now() - new Date(prev.currentRunner.startTime).getTime() : 0 }
            }));
        }, 10);

        return () => clearInterval(timer);
    }, []);

    const previousRunner = data.last7Laps.length > 0 ? data.last7Laps[0] : { name: 'none', time: 0 };
    const nextRunner = data.currentQueue.length > 0 ? data.currentQueue[0] : { name: 'none' };

    return (
        <div className="h-full w-full flex flex-col gap-6">
            {/* Previous Runner */}
            <div className="flex-grow bg-white rounded-lg shadow-md p-6 border-t-4 border-blue-500 flex flex-col items-center justify-center">
                <h2 className="text-xl font-semibold text-blue-600 mb-2">Previous Runner</h2>
                <p className="text-gray-700 text-lg">
                    <span className="font-medium">Name:</span> {previousRunner.name}
                </p>
                <p className="text-gray-700 text-lg">
                    <span className="font-medium">Time:</span>{" "}
                    {isNaN(previousRunner.time)
                        ? "—"
                        : (previousRunner.time / 100).toFixed(2) + "s"}
                </p>
            </div>

            {/* Current Runner */}
            <div className="flex-grow bg-white rounded-lg shadow-md p-6 border-t-4 border-blue-600 flex flex-col items-center justify-center">
                <h2 className="text-xl font-semibold text-blue-600 mb-2">Current Runner</h2>
                <p className="text-gray-700 text-lg">
                    <span className="font-medium">Name:</span>{" "}
                    {data.currentRunner.name || "none"}
                </p>
                <p className="text-gray-700 text-lg">
                    <span className="font-medium">Time:</span>{" "}
                    {(data.currentRunner.time! / 1000).toFixed(2)}s
                </p>
            </div>

            {/* Next Runner */}
            <div className="flex-grow bg-white rounded-lg shadow-md p-6 border-t-4 border-blue-500 flex flex-col items-center justify-center">
                <h2 className="text-xl font-semibold text-blue-600 mb-2">Next Runner</h2>
                <p className="text-gray-700 text-lg">
                    <span className="font-medium">Name:</span> {nextRunner.name}
                </p>
            </div>
        </div>
    );
}