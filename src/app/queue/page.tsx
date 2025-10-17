'use client'
import { useState, useEffect } from "react";
import { Queue, Runner, Lap} from '@prisma/client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

interface RunnerWithLaps extends Runner {
    laps: Lap[];
}

interface QueueWithRunner extends Queue {
    runner: RunnerWithLaps;
}

export default function QueuePage() {
    const [queue, setQueue] = useState<QueueWithRunner[]>([]);
    const [isClient, setIsClient] = useState(false);
    const [showExtra, setShowExtra] = useState(false);

    useEffect(() => {
        setIsClient(true)
    }, [])

    useEffect(() => {
        async function fetchQueue() {
            const response = await fetch("/api/queue");
            const data = await response.json();
            if (Array.isArray(data)) {
                setQueue(data);
            } else {
                setQueue([]);
                console.error("API response is not an array or is empty:", data);
            }
        }

        fetchQueue();
    }, []);

    useEffect(() => {
        async function fetchQueueData() {
            const response = await fetch("/api/queue");
            const data = await response.json();

            if (Array.isArray(data)) {
                setQueue((prevQueue) => {
                    // For each runner, compute the "time since last lap start"
                    return data.map((entry) => {
                        const lastLapStart = entry.runner.laps?.[0]?.startTime;
                        const timeSinceMs = lastLapStart ? Date.now() - new Date(lastLapStart).getTime() : 0;

                        // Preserve previous "timeSince" when startTime hasn’t changed
                        const prevEntry = prevQueue.find((p) => p.id === entry.id);
                        const prevLapStart = prevEntry?.runner.laps?.[0]?.startTime;

                        return {
                            ...entry,
                            runner: {
                                ...entry.runner,
                                timeSince: prevLapStart === lastLapStart
                                    ? prevEntry?.runner.laps?.[0]?.startTime.toString() ?? timeSinceMs
                                    : timeSinceMs,
                            },
                        };
                    });
                });
            } else {
                console.error("API response is not an array or is empty:", data);
                setQueue([]);
            }
        }

        // Fetch initially
        fetchQueueData();

        // Poll server every 3 seconds
        const pollInterval = setInterval(fetchQueueData, 3000);

        // Update “since” timers every 1 second locally
        const timer = setInterval(() => {
            setQueue((prevQueue) =>
                prevQueue.map((entry) => {
                    const lastLapStart = entry.runner.laps?.[0]?.startTime;
                    if (!lastLapStart) return entry;
                    return {
                        ...entry,
                        runner: {
                            ...entry.runner,
                            timeSince: Date.now() - new Date(lastLapStart).getTime(),
                        },
                    };
                })
            );
        }, 1000);

        return () => {
            clearInterval(pollInterval);
            clearInterval(timer);
        };
    }, []);


    const handleDelete = async (id: number) => {
        try {
            const response = await fetch(`/api/queue?id=${id}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                setQueue(queue.filter(entry => entry.id !== id));
            } else {
                console.error("Failed to delete runner from queue");
            }
        } catch (error) {
            console.error("Error deleting runner from queue:", error);
        }
    };

    const handleDragEnd = async (result: DropResult) => {
        if (!result.destination) return;

        const updatedQueue = Array.from(queue);
        const [movedItem] = updatedQueue.splice(result.source.index, 1);
        updatedQueue.splice(result.destination.index, 0, movedItem);

        setQueue(updatedQueue);

        try {
            await fetch('/api/queue/updateOrder', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedQueue.map((item, index) => ({
                    id: item.id,
                    queuePlace: index + 1,
                }))),
            });
        } catch (error) {
            console.error("Error updating queue order:", error);
        }
    };

    // Helper function to print "??" when no shoe size is found.
    function rightShoeSize(shoeSize: string): string {
        if (shoeSize === "0") return "....";
        return shoeSize;
    }

    /*
     * Helper function to:
     * return "00:00" when no time is found.
     * format the time in the format "MM:SS".
     *
     * this function doesn't format times that are longer than 1 hour (just '.' -> ':').
     */
    function rightTime(time: string | null): string {
        if (time === null) return "... : ...";
        let res = time;
        res = res.replace('.', ':');
        while (res[res.length - 3] !== ':') {
            res = res + '0';
        }
        res = res.padStart(5, '0');
        return res;
    }

    /*
     * Helper function to:
     * return "00:00" when no time is found or the runner is currently running for the first time.
     * remove milliseconds from the time.
     *
     * This function just removes the last 3 characters from the string.
     */
    function noMilliSeconds(time: string): string {
        if (time === "??" || time === "null") return "... : ...";
        const my_time = time.slice(0, -3);
        return rightTime(my_time);
    }

    /*
     * Helper function to:
     * convert the given time in MM:SS.ss to milliseconds.
     */
    function timeToMS(time: string): number {
        const match = time.match(/^(\d+):(\d+(?:\.\d+)?)$/);
        if (!match) return 0;

        const minutes = parseInt(match[1], 10);
        const seconds = parseFloat(match[2]);
        return Math.round((minutes * 60 + seconds) * 1000);
    }

    /*
     * Helper function to:
     * return "....h...." when no date or duration is found.
     * calculate the time between the given date plus the duration and now.
     * format the time in the format "HHhMM".
     */
    function formatTimeSince(date: string, duration: string): string {
        if (date === "??" || date === "null") return "....h....";
        if (duration === "??" || duration === "null") return "....h....";

        const then = new Date(date);
        const elapsedMS = timeToMS(duration);
        const now = new Date();

        const diffMs = now.getTime() - (then.getTime() + elapsedMS);
        if (diffMs < 0) return "??h??"; // Prevent negative times

        const totalSeconds = Math.floor(diffMs / 1000);
        const totalMinutes = Math.floor(totalSeconds / 60);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        return `${hours.toString().padStart(2, '0')}h${minutes
            .toString()
            .padStart(2, '0')}`;
    }


    return (
        <div className="p-4 mx-auto w-auto">
            {isClient && <div>
                <button
                    onClick={() => setShowExtra(!showExtra)}
                    className="mb-4 px-3 py-1 bg-gray-200 rounded"
                >
                    {showExtra ? "Hide info" : "Show info"}
                </button>
                <h1 className="text-xl font-bold mb-4">Queue</h1>
                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="queue" isDropDisabled={false} isCombineEnabled={false}
                               ignoreContainerClipping={false} direction="vertical">
                        {(provided) => (
                            <ul {...provided.droppableProps} ref={provided.innerRef}>
                                {queue.map((entry, index) => (
                                    <Draggable key={entry.id} draggableId={entry.id.toString()} index={index}>
                                        {(provided) => (
                                            <li
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                className="border p-2 mb-2 flex justify-between items-center min-w-full"
                                            >
                                                <span
                                                    className="mr-auto pr-10">{index + 1}. {entry.runner.firstName} {entry.runner.lastName}</span>
                                                {showExtra && (
                                                    <span>
                                                        Last: {noMilliSeconds(entry.runner.laps?.[0]?.time ?? "??")} ─
                                                        Since: {formatTimeSince(entry.runner.laps?.[0]?.startTime.toString() ?? "??", entry.runner.laps?.[0]?.time ?? "??")} ─
                                                        Test: {rightTime(entry.runner.testTime)} ─
                                                        Shoe: {rightShoeSize(entry.runner.shoeSize)}
                                                      </span>
                                                )}
                                                <button onClick={() => handleDelete(entry.id)}
                                                        className="text-red-500 ml-5">
                                                    <FontAwesomeIcon icon={faXmark}/>
                                                </button>
                                            </li>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </ul>
                        )}
                    </Droppable>
                </DragDropContext>
            </div>}
        </div>
    );
}