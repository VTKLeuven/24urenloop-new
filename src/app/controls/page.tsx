'use client'
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Runner } from '@prisma/client';

interface RunnerWithLaps extends Runner {
    laps: { startTime: string, time: number }[];
}

export default function ControlsPage() {
    const [previousRunner, setPreviousRunner] = useState<RunnerWithLaps & { lapTime?: number } | null>(null);
    const [currentRunner, setCurrentRunner] = useState<RunnerWithLaps | null>(null);
    const [nextRunner, setNextRunner] = useState<RunnerWithLaps | null>(null);
    const [timer, setTimer] = useState(0);
    const [cooldownActive, setCooldownActive] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    async function fetchData() {
        try {
            console.log('Fetching data...');

            const response = await fetch('/api/controls-data', {
                method: 'GET',
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            if (data.previousRunner) {
                data.previousRunner.lapTime = data.previousRunner.laps[data.previousRunner.laps.length - 1]?.time;
            }
            console.log(data)
            setPreviousRunner(data.previousRunner);
            setCurrentRunner(data.currentRunner || null);
            setNextRunner(data.nextRunner);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        }
    }

    useEffect(() => {
        fetchData();

        return () => {
            if (timerRef.current !== null) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (currentRunner && currentRunner.laps && currentRunner.laps.length > 0) {
            const mostRecentLap = currentRunner.laps[currentRunner.laps.length - 1];
            timerRef.current = setInterval(() => {
                setTimer(Date.now() - new Date(mostRecentLap.startTime).getTime());
            }, 10);
        }

        return () => {
            if (timerRef.current !== null) {
                clearInterval(timerRef.current);
            }
        };
    }, [currentRunner]);

    const handleStartNextRunner = async () => {
        setCooldownActive(true);

        await fetch('/api/start-next-runner', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });

        await fetchData();
        setTimer(0);

        setTimeout(() => {
            setCooldownActive(false);
        }, 3000);
    };

    const handleUndo = async () => {
        await fetch('/api/undo-start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });

        await fetchData();
        if (currentRunner && currentRunner.laps && currentRunner.laps.length > 0) {
            const mostRecentLap = currentRunner.laps[0];
            setTimer(Date.now() - new Date(mostRecentLap.startTime).getTime());
        }
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60000);
        const seconds = Math.floor((time % 60000) / 1000);
        const hundredths = Math.floor((time % 1000) / 10);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}.${hundredths < 10 ? '0' : ''}${hundredths}`;
    };

    return (
        <div className="flex flex-col justify-center items-center w-full h-full">
            <div className="bg-white rounded-lg shadow-md p-6 mx-auto max-w-lg w-full">
                <h1 className="text-2xl font-bold mb-6">Controls</h1>

                {/* Previous Runner */}
                <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-1">Previous Runner</h2>
                    {previousRunner ? (
                        <div className="text-gray-800 text-sm space-y-1">
                            <p><span className="font-medium">Name:</span> {previousRunner.firstName} {previousRunner.lastName}</p>
                            <p><span className="font-medium">Lap Time:</span> {previousRunner.lapTime}</p>
                        </div>
                    ) : (
                        <p className="text-gray-500 italic">No previous runner</p>
                    )}
                </div>

                {/* Current Runner */}
                <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-1">Current Runner</h2>
                    {currentRunner ? (
                        <div className="text-gray-800 text-sm space-y-1">
                            <p><span className="font-medium">Name:</span> {currentRunner.firstName} {currentRunner.lastName}</p>
                            <p><span className="font-medium">Timer:</span> {formatTime(timer)}</p>
                        </div>
                    ) : (
                        <p className="text-gray-500 italic">No current runner</p>
                    )}
                </div>

                {/* Next Runner */}
                <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-1">Next Runner</h2>
                    {nextRunner ? (
                        <div className="text-gray-800 text-sm space-y-1">
                            <p><span className="font-medium">Name:</span> {nextRunner.firstName} {nextRunner.lastName}</p>
                        </div>
                    ) : (
                        <p className="text-gray-500 italic">No next runner</p>
                    )}
                </div>

                {/* Action buttons (stacked) */}
                <div className="flex items-stretch gap-3">
                    <Button
                        onClick={handleStartNextRunner}
                        disabled={!nextRunner || cooldownActive}
                        variant="default"
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {cooldownActive ? "Processing..." : "Start Next Runner"}
                    </Button>

                    <Button
                        onClick={handleUndo}
                        disabled={!previousRunner || !currentRunner}
                        // outlined secondary (no black)
                        variant="outline"
                        className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Undo
                    </Button>
                </div>
            </div>
        </div>
    );
}