'use client'
import { useState, useEffect } from 'react';
import Image from "next/image";

interface Runner {
    name: string;
    startTime: string | null;
    time?: number;
    facultyId: number;
}

interface Lap {
    name: string;
    time: number;
    facultyId: number;
}

interface QueueEntry {
    name: string;
    facultyId: number;
}

interface StatisticsData {
    currentRunner: Runner;
    last7Laps: Lap[];
    quickest7Runners: QueueEntry[];
    top7Runners: QueueEntry[];
    currentQueue: QueueEntry[];
}

interface PREvent {
    type: 'pr';
    runnerId: number;
    runnerName: string;
    oldBest: string;
    newBest: string;
}

interface Toast {
    id: number;
    title: string;
    message: string;
}

export default function LiveRunners() {
    const [data, setData] = useState<StatisticsData>({
        currentRunner: { name: '', startTime: null, time: 0, facultyId: 0},
        last7Laps: [],
        quickest7Runners: [],
        top7Runners: [],
        currentQueue: []
    });
    const [toasts, setToasts] = useState<Toast[]>([]);

    useEffect(() => {
        async function fetchData() {
            const response = await fetch('/api/statistics');
            const result = await response.json();
            // Preserve the locally calculated time to avoid flickering
            setData((prev) => ({
                ...result,
                currentRunner: {
                    ...result.currentRunner,
                    time: prev.currentRunner.startTime === result.currentRunner.startTime
                        ? prev.currentRunner.time
                        : (result.currentRunner.startTime
                            ? Date.now() - new Date(result.currentRunner.startTime).getTime()
                            : 0),
                },
            }));
        }

        // Initial fetch
        fetchData();

        // Poll for updates every 2 seconds
        const pollInterval = setInterval(() => {
            fetchData();
        }, 2000);

        // Timer for current runner time (10ms)
        const timer = setInterval(() => {
            setData(prev => ({
                ...prev,
                currentRunner: { ...prev.currentRunner, time: prev.currentRunner.startTime ? Date.now() - new Date(prev.currentRunner.startTime).getTime() : 0 }
            }));
        }, 10);

        return () => {
            clearInterval(pollInterval);
            clearInterval(timer);
        };
    }, []);

    // Subscribe to SSE for PR events
    useEffect(() => {
        const es = new EventSource('/api/events');
        const onPR = (e: MessageEvent) => {
            try {
                const evt = JSON.parse(e.data) as PREvent;
                if (evt && evt.type === 'pr') {
                    const id = Date.now() + Math.random();
                    setToasts((list) => [
                        ...list,
                        {
                            id,
                            title: 'Personal Record!',
                            message: `${evt.runnerName} beat their time: ${evt.oldBest} → ${evt.newBest}`,
                        },
                    ]);
                    // Auto-dismiss after 6 seconds
                    setTimeout(() => {
                        setToasts((list) => list.filter((t) => t.id !== id));
                    }, 6000);
                }
            } catch {}
        };
        es.addEventListener('pr', onPR as EventListener);
        es.onerror = () => {
            // Let browser reconnect; optionally we could close and reopen
        };
        return () => {
            es.removeEventListener('pr', onPR as EventListener);
            es.close();
        };
    }, []);

    const previousRunner = data.last7Laps.length > 0 ? data.last7Laps[0] : { name: 'none', time: 0, facultyId: 0 };
    const nextRunner = data.currentQueue.length > 0 ? data.currentQueue[0] : { name: 'none', facultyId: 0 };

    const currentRunnerTotalSeconds = Math.floor(data.currentRunner.time! / 1000);
    const currentRunnerMinutes = Math.floor(currentRunnerTotalSeconds / 60);
    const currentRunnerSeconds = currentRunnerTotalSeconds % 60;

    //TODO add other jerseys (now only green and yellow jersey and Gent)
    let nextRunnerInfo = "";
    if (nextRunner.name == data.quickest7Runners[0]?.name){
        nextRunnerInfo = "quickestRunner";
    } else if (nextRunner.name == data.top7Runners[0]?.name){
        nextRunnerInfo = "topRunner";
    } else if (nextRunner.facultyId == 3){
        nextRunnerInfo = "GentRunner";
    } else {
        nextRunnerInfo = "";
    }

    //TODO add other jerseys (now only green and yellow jersey and Gent)
    let currentRunnerInfo = "";
    if (data.currentRunner.name == data.quickest7Runners[0]?.name){
        currentRunnerInfo = "quickestRunner";
    } else if (data.currentRunner.name == data.top7Runners[0]?.name){
        currentRunnerInfo = "topRunner";
    } else if (data.currentRunner.facultyId == 3){
        currentRunnerInfo = "GentRunner";
    } else {
        currentRunnerInfo = "";
    }

    //TODO add other jerseys (now only green and yellow jersey and Gent)
    let previousRunnerInfo = "";
    if (previousRunner.name == data.quickest7Runners[0]?.name){
        previousRunnerInfo = "quickestRunner";
    } else if (previousRunner.name == data.top7Runners[0]?.name){
        previousRunnerInfo = "topRunner";
    } else if (previousRunner.facultyId == 3){
        previousRunnerInfo = "GentRunner";
    } else {
        previousRunnerInfo = "";
    }

    const previousRunnerTotal = previousRunner.time;

    return (
        <div className="h-full w-full flex flex-col items-center gap-4">
            {/* Toast container top-right */}
            <div className="fixed top-4 right-4 z-50 space-y-3">
                {toasts.map((t) => (
                    <div key={t.id} className="w-80 bg-red-600 text-white rounded-md shadow-lg p-4 border-2 border-red-800">
                        <div className="font-semibold mb-1">{t.title}</div>
                        <div className="text-sm leading-snug">{t.message}</div>
                    </div>
                ))}
            </div>

            {/* Previous Runner */}
            <div className="w-2/5 bg-white rounded-lg shadow-md p-8 border-t-4 border-blue-500 flex items-center gap-4">
                {/* Runner Image */}
                {previousRunnerInfo === "topRunner" && (
                    <Image
                        src="/images/YellowShirt.png"
                        alt="Yellow jersey"
                        width={128}
                        height={128}
                        className="rounded-full object-cover"
                    />
                )}

                {previousRunnerInfo === "quickestRunner" && (
                    <Image
                        src="/images/GreenShirt.png"
                        alt="Green jersey"
                        width={128}
                        height={128}
                        className="rounded-full object-cover"
                    />
                )}

                {previousRunnerInfo === "GentRunner" && (
                    <Image
                        src="/images/GentShirt.png"
                        alt="VTK jersey"
                        width={128}
                        height={128}
                        className="rounded-full object-cover"
                    />
                )}

                {previousRunnerInfo === "" && (
                    <Image
                        src="/images/VTKShirt.png"
                        alt="VTK jersey"
                        width={128}
                        height={128}
                        className="rounded-full object-cover"
                    />
                )}

                {/* Runner Name */}
                <div className="flex flex-col flex-grow">
                    <h2 className="text-lg font-semibold text-blue-600">Previous Runner</h2>
                    <p className="text-gray-700 text-base">{previousRunner.name || "none"}</p>
                </div>

                {/* Runner Time */}
                <div className="text-gray-700 text-3xl font-semibold">
                    {`${previousRunnerTotal.toString().padStart(2, "0")}`}
                </div>
            </div>

            {/* Current Runner */}
            <div className="w-3/4 bg-white rounded-lg shadow-lg p-16 border-t-4 border-blue-600 flex flex-col items-center">
                <h1 className="text-3xl font-bold text-blue-600 mb-4">Current Runner</h1>
                <p className="text-gray-700 text-8xl font-semibold">
                    {data.currentRunner.name || "none"}
                </p>
                <p className="text-gray-700 text-5xl font-semibold">
                    {`${currentRunnerMinutes.toString().padStart(2, "0")}:${currentRunnerSeconds.toString().padStart(2, "0")}`}
                </p>
                <p className="text-gray-700 text-base mb-4">
                    {currentRunnerInfo === "topRunner" && (
                        <Image
                            src="/images/YellowShirt.png"
                            alt="Yellow jersey"
                            width={256}
                            height={256}
                            className="rounded-full object-cover"
                        />
                    )}

                    {currentRunnerInfo === "quickestRunner" && (
                        <Image
                            src="/images/GreenShirt.png"
                            alt="Green jersey"
                            width={256}
                            height={256}
                            className="rounded-full object-cover"
                        />
                    )}

                    {currentRunnerInfo === "GentRunner" && (
                        <Image
                            src="/images/GentShirt.png"
                            alt="VTK jersey"
                            width={256}
                            height={256}
                            className="rounded-full object-cover"
                        />
                    )}

                    {currentRunnerInfo === "" && (
                        <Image
                            src="/images/VTKShirt.png"
                            alt="VTK jersey"
                            width={256}
                            height={256}
                            className="rounded-full object-cover"
                        />
                    )}
                </p>
            </div>

            {/* Next Runner */}
            <div className="w-2/5 bg-white rounded-lg shadow-md p-8 border-t-4 border-blue-500 flex items-center gap-4">
                {/* Runner Image */}
                {nextRunnerInfo === "topRunner" && (
                    <Image
                        src="/images/YellowShirt.png"
                        alt="Yellow jersey"
                        width={128}
                        height={128}
                        className="rounded-full object-cover"
                    />
                )}

                {nextRunnerInfo === "quickestRunner" && (
                    <Image
                        src="/images/GreenShirt.png"
                        alt="Green jersey"
                        width={128}
                        height={128}
                        className="rounded-full object-cover"
                    />
                )}

                {nextRunnerInfo === "GentRunner" && (
                    <Image
                        src="/images/GentShirt.png"
                        alt="VTK jersey"
                        width={128}
                        height={128}
                        className="rounded-full object-cover"
                    />
                )}

                {nextRunnerInfo === "" && (
                    <Image
                        src="/images/VTKShirt.png"
                        alt="VTK jersey"
                        width={128}
                        height={128}
                        className="rounded-full object-cover"
                    />
                )}

                {/* Runner Name */}
                <div className="flex flex-col">
                    <h2 className="text-lg font-semibold text-blue-600">Next Runner</h2>
                    <p className="text-gray-700 text-base">{nextRunner.name || "none"}</p>
                </div>
            </div>
        </div>

    );
}