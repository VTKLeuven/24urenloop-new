'use client'
import { useState, useEffect } from 'react';
import Image from "next/image";

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
    quickest7Runners: QueueEntry[];
    top7Runners: QueueEntry[];
    currentQueue: QueueEntry[];
}

export default function LiveRunners() {
    const [data, setData] = useState<StatisticsData>({
        currentRunner: { name: '', startTime: null, time: 0 },
        last7Laps: [],
        quickest7Runners: [],
        top7Runners: [],
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

    const currentRunnerTotalSeconds = Math.floor(data.currentRunner.time! / 1000);
    const currentRunnerMinutes = Math.floor(currentRunnerTotalSeconds / 60);
    const currentRunnerSeconds = currentRunnerTotalSeconds % 60;

    //TODO add other jerseys (now only green and yellow jersey)
    let nextRunnerInfo = "";
    if (data.currentQueue[0]?.name == data.quickest7Runners[0]?.name){
        nextRunnerInfo = "quickestRunner";
    } else if (data.currentQueue[0]?.name == data.top7Runners[0]?.name){
        nextRunnerInfo = "topRunner";
    } else {
        nextRunnerInfo = "";
    }

    //TODO add other jerseys (now only green and yellow jersey)
    let currentRunnerInfo = "";
    if (data.currentRunner.name == data.quickest7Runners[0]?.name){
        currentRunnerInfo = "quickestRunner";
    } else if (data.currentRunner.name == data.top7Runners[0]?.name){
        currentRunnerInfo = "topRunner";
    } else {
        currentRunnerInfo = "";
    }

    let previousRunnerInfo = "";
    if (previousRunner.name == data.quickest7Runners[0]?.name){
        previousRunnerInfo = "quickestRunner";
    } else if (previousRunner.name == data.top7Runners[0]?.name){
        previousRunnerInfo = "topRunner";
    } else {
        previousRunnerInfo = "";
    }

    const previousRunnerTotal = previousRunner.time;

    return (
        <div className="h-full w-full flex flex-col items-center gap-4">
            {/* Previous Runner */}
            <div className="w-2/5 bg-white rounded-lg shadow-md p-8 border-t-4 border-blue-500 flex flex-col items-center">
                <h2 className="text-lg font-semibold text-blue-600 mb-2">Previous Runner</h2>
                <p className="text-gray-700 text-base">{previousRunner.name}</p>
                <p className="text-gray-700 text-base">
                    {`${previousRunnerTotal.toString().padStart(2, "0")}`}
                </p>
                <p className="text-gray-700 text-base mb-4">
                    {previousRunnerInfo === "topRunner" && (
                        <Image
                            src="/images/YellowShirt.png"
                            alt="Yellow jersey"
                            width={256}
                            height={256}
                            className="rounded-full object-cover"
                        />
                    )}

                    {previousRunnerInfo === "quickestRunner" && (
                        <Image
                            src="/images/GreenShirt.png"
                            alt="Green jersey"
                            width={256}
                            height={256}
                            className="rounded-full object-cover"
                        />
                    )}

                    {previousRunnerInfo === "" && (
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

            {/* Current Runner */}
            <div className="w-3/4 bg-white rounded-lg shadow-lg p-16 border-t-4 border-blue-600 flex flex-col items-center">
                <h1 className="text-3xl font-bold text-blue-600 mb-4">Current Runner</h1>
                <p className="text-gray-700 text-2xl font-semibold">
                    {data.currentRunner.name || "none"}
                </p>
                <p className="text-gray-700 text-2xl font-semibold">
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
                        width={256}
                        height={256}
                        className="rounded-full object-cover"
                    />
                )}

                {nextRunnerInfo === "quickestRunner" && (
                    <Image
                        src="/images/GreenShirt.png"
                        alt="Green jersey"
                        width={256}
                        height={256}
                        className="rounded-full object-cover"
                    />
                )}

                {nextRunnerInfo === "" && (
                    <Image
                        src="/images/VTKShirt.png"
                        alt="VTK jersey"
                        width={256}
                        height={256}
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