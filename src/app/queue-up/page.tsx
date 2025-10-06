'use client'
import { useState, useEffect, useRef } from "react";
import { Runner, Group, Faculty } from '@prisma/client';

export default function Page() {
    const [runner, setRunner] = useState({
        firstName: "",
        lastName: "",
        identification: "",
        facultyId: "",
        groupNumber: "",
        testTime: "",
        firstYear: false,
    });

    const [groups, setGroups] = useState<Group[]>([]);
    const [faculties, setFaculties] = useState<Faculty[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<(Runner & { lastLapTime?: string | null })[]>([]);
    const [selectedRunner, setSelectedRunner] = useState<Runner | null>(null);
    const [showResults, setShowResults] = useState(false);
    const [averageLapTime, setAverageLapTime] = useState<string | null>(null);

    const [showGroupModal, setShowGroupModal] = useState(false);
    const [newGroupName, setNewGroupName] = useState("");

    // NEW: optional student-card input + loading/error states
    const [studentCard, setStudentCard] = useState("");
    const [filling, setFilling] = useState(false);
    const [fillError, setFillError] = useState<string | null>(null);

    // Prevent duplicate triggers for the same scanned value
    const lastTriggeredRef = useRef<string | null>(null);

    // R-number field non-required for VTK Gent, only two IDs: 1 for KUL and 3 for UGent
    // Generates a identifier based on the time
    const isIdentificationRequired = Number(runner.facultyId) === 1;

    useEffect(() => {
        async function fetchGroups() {
            const response = await fetch("/api/groups");
            const data: Group[] = await response.json();
            setGroups(data);
        }

        async function fetchFaculties() {
            const response = await fetch("/api/faculties");
            const data: Faculty[] = await response.json();
            setFaculties(data);
        }

        async function fetchAverageLapTime() {
            try {
                const response = await fetch("/api/average-lap-time");
                const data = await response.json();
                setAverageLapTime(data.averageTime);
            } catch (error) {
                console.error("Failed to fetch average lap time:", error);
            }
        }

        fetchGroups();
        fetchFaculties();
        fetchAverageLapTime();
    }, []);

    useEffect(() => {
        if (searchQuery.trim() === "") {
            setSearchResults([]);
            return;
        }

        const handleSearch = async () => {
            const terms = searchQuery.split(" ").map(term => term.trim()).filter(term => term);
            const response = await fetch(`/api/search?terms=${encodeURIComponent(JSON.stringify(terms))}`);
            const data = await response.json();
            setSearchResults(data);
            setShowResults(true);
        };

        handleSearch();
    }, [searchQuery]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === "checkbox") {
            const { checked } = e.target as HTMLInputElement;
            setRunner({ ...runner, [name]: checked });
        } else {
            setRunner({ ...runner, [name]: value });
        }
    };

    const handleSearchQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        setSelectedRunner(null);
        setShowResults(true);
    };

    const handleSearchFocus = () => setShowResults(true);

    const handleRunnerClick = (runnerItem: Runner) => {
        setSelectedRunner(runnerItem);
        setSearchQuery(`${runnerItem.firstName} ${runnerItem.lastName}`);
        setTimeout(() => setShowResults(false), 100);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const response = await fetch("/api/add-runner", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ...runner,
                groupNumber: parseInt(runner.groupNumber, 10),
                testTime: runner.testTime || null,
                facultyId: parseInt(runner.facultyId, 10),
            }),
        });
        if (response.ok) {
            const newRunner = await response.json();
            alert("Runner added successfully!");
            setRunner({
                firstName: "",
                lastName: "",
                identification: "",
                facultyId: "",
                groupNumber: "",
                testTime: "",
                firstYear: false,
            });
            addToQueue(newRunner);
        } else {
            alert("Failed to add runner.");
        }
    };

    const addToQueue = async (runnerItem: Runner) => {
        const response = await fetch("/api/add-to-queue", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ runnerId: runnerItem.id }),
        });
        if (response.ok) {
            alert("Runner added to queue successfully!");
            setSearchQuery("");
            setSelectedRunner(null);
            setSearchResults([]);
        } else {
            alert("Failed to add runner to queue.");
        }
    };

    const handleCreateGroup = async () => {
        if (!newGroupName.trim()) return;

        const response = await fetch("/api/groups", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ groupName: newGroupName }),
        });

        if (response.ok) {
            const createdGroup = await response.json();
            setGroups(prev => [...prev, createdGroup]);
            setRunner(prev => ({ ...prev, groupNumber: String(createdGroup.groupNumber) }));
            setShowGroupModal(false);
            setNewGroupName("");
        } else {
            alert("Failed to create group");
        }
    };

    // Helper: cleaned scanned string (remove trailing newlines/whitespace)
    const cleanScannedValue = (val: string) => val.replace(/[\r\n]+/g, "").trim();

    // Core fill function that optionally accepts a scanned value (so it can be triggered from key events or effect)
    const handleFillFromStudentCard = async (scannedValue?: string) => {
        setFillError(null);
        const scanned = typeof scannedValue === "string" ? cleanScannedValue(scannedValue) : cleanScannedValue(studentCard);

        if (!scanned || !scanned.includes(";")) {
            setFillError("Provide scanned string in format serial;cardAppId");
            return;
        }

        // avoid calling twice for the same input
        if (lastTriggeredRef.current === scanned) return;
        lastTriggeredRef.current = scanned;

        setFilling(true);
        try {
            const res = await fetch("/api/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ scanned }),
            });

            const json = await res.json();

            if (!res.ok || json?.ok === false) {
                const msg = json?.error ?? json?.details ?? `Request failed (status ${res.status})`;
                setFillError(String(msg));
            } else if (json?.ok === true && json?.data) {
                const data = json.data as {
                    firstName?: string;
                    lastName?: string;
                    userName?: string;
                    moreUnifiedUid?: string;
                    [k: string]: unknown;
                };

                const identificationValue = data.userName

                setRunner(prev => ({
                    ...prev,
                    firstName: typeof data.firstName === "string" ? data.firstName : prev.firstName,
                    lastName: typeof data.lastName === "string" ? data.lastName : prev.lastName,
                    identification: identificationValue || prev.identification,
                }));

                // also update the input to the cleaned version (remove newline chars)
                setStudentCard(scanned);
            } else {
                setFillError("Unexpected response from server");
            }
        } catch (err: unknown) {
            setFillError(String(err));
        } finally {
            setFilling(false);
        }
    };

    // Trigger when user presses Enter while the input is focused
    const handleStudentCardKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault(); // avoid form submits or other default behaviour
            handleFillFromStudentCard();
        }
    };

    // Trigger automatically if scanner injects newline chars into the input value.
    // Some scanners paste the characters and include a newline instead of firing an Enter key event.
    useEffect(() => {
        if (!studentCard) return;

        // if studentCard contains newline characters, trigger fill
        if (studentCard.includes("\n") || studentCard.includes("\r")) {
            // schedule microtask to ensure the state has the latest value
            const t = setTimeout(() => {
                handleFillFromStudentCard(studentCard);
            }, 0);
            return () => clearTimeout(t);
        }
    }, [studentCard]);

    return (
        <div className="flex flex-col justify-center items-center w-full h-full">
            <div className="bg-white rounded-lg shadow-md p-6 mx-auto max-w-lg w-full">
                <div className="flex justify-between items-center mb-3">
                    <h1 className="text-2xl font-bold">Queue Up</h1>
                    {averageLapTime && (
                        <div className="text-sm text-gray-600">
                            Avg lap time last hour: <span className="text-blue-600 font-mono font-semibold">{averageLapTime}</span>
                        </div>
                    )}
                </div>

                {/* Add existing runner */}
                <h4 className="text-lg font-semibold mb-3">Add existing runner</h4>
                <div className="mb-3 relative">
                    <input
                        type="text"
                        placeholder="Search by First Name, Last Name, or ID"
                        value={searchQuery}
                        onChange={handleSearchQueryChange}
                        onFocus={handleSearchFocus}
                        className="rounded-md px-3 py-2 w-full border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    {showResults && searchResults.length > 0 && (
                        <ul className="absolute z-10 w-full bg-white shadow-lg rounded-b-md max-h-48 overflow-auto">
                            {searchResults.map((result) => (
                                <li
                                    key={result.id}
                                    className={`px-3 py-2 cursor-pointer hover:bg-blue-50 ${
                                        selectedRunner?.id === result.id ? "bg-blue-100" : ""
                                    }`}
                                    onClick={() => handleRunnerClick(result)}
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <span className="font-medium">
                                                {result.firstName} {result.lastName}
                                            </span>{" "}
                                            <span className="text-gray-600 text-sm">
                                                ({result.identification})
                                            </span>
                                        </div>
                                        {result.lastLapTime ? (
                                            <span className="text-sm text-blue-600 font-mono">
                                                Last lap: {result.lastLapTime}
                                            </span>
                                        ) : result.testTime ? (
                                            <span className="text-sm text-red-600 font-mono">
                                                Test time: {result.testTime}
                                            </span>
                                        ) : null}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                    {selectedRunner && (
                        <button
                            onClick={() => addToQueue(selectedRunner)}
                            className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-semibold w-full"
                        >
                            Add to Queue
                        </button>
                    )}
                </div>

                {/* NEW: optional student-card scanner input */}
                <div className="mb-3">
                    <label className="block text-sm font-medium mb-2">Optional: Student card scanner input</label>
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            placeholder="e.g. 123456789;0123456789"
                            value={studentCard}
                            onChange={(e) => setStudentCard(e.target.value)}
                            onKeyDown={handleStudentCardKeyDown}
                            className="rounded-md px-3 w-full border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                        <button
                            type="button"
                            onClick={() => handleFillFromStudentCard()}
                            disabled={filling}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 rounded-md font-semibold"
                        >
                            {filling ? "Filling..." : "Fill"}
                        </button>
                    </div>
                    {fillError && <div className="mt-2 text-sm text-red-600">{fillError}</div>}
                </div>

                {/* Add new runner */}
                <h4 className="text-lg font-semibold mb-3">Add new runner</h4>
                <form onSubmit={handleSubmit} className="flex flex-col space-y-3">
                    <input
                        type="text"
                        name="firstName"
                        placeholder="First Name"
                        value={runner.firstName}
                        onChange={handleChange}
                        required
                        className="rounded-md px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <input
                        type="text"
                        name="lastName"
                        placeholder="Last Name"
                        value={runner.lastName}
                        onChange={handleChange}
                        required
                        className="rounded-md px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <select
                        name="facultyId"
                        value={runner.facultyId}
                        onChange={handleChange}
                        required
                        className="rounded-md px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                        <option value="" disabled>
                            Select Faculty
                        </option>
                        {faculties.map((faculty) => (
                            <option key={faculty.id} value={faculty.id}>
                                {faculty.name}
                            </option>
                        ))}
                    </select>
                    <input
                        type="text"
                        name="identification"
                        placeholder="Identification Number"
                        value={!isIdentificationRequired ? `${Date.now()}` : runner.identification}
                        onChange={handleChange}
                        required={isIdentificationRequired}
                        className="rounded-md px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <div>S
                        <select
                            name="groupNumber"
                            value={runner.groupNumber}
                            onChange={handleChange}
                            required
                            className="rounded-md px-3 py-2 w-full border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                            <option value="" disabled>
                                Select Group
                            </option>
                            {groups.map((group) => (
                                <option key={group.groupNumber} value={group.groupNumber}>
                                    {group.groupName}
                                </option>
                            ))}
                        </select>
                        <button
                            type="button"
                            onClick={() => setShowGroupModal(true)}
                            className="mt-2 text-sm text-blue-600 hover:underline"
                        >
                            + Create New Group
                        </button>
                    </div>
                    <input
                        type="text"
                        name="testTime"
                        placeholder="Test Time (mm:ss)"
                        pattern="\d{2}:\d{2}"
                        value={runner.testTime}
                        onChange={handleChange}
                        className="rounded-md px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <label className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            name="firstYear"
                            checked={runner.firstYear}
                            onChange={handleChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm">First Year</span>
                    </label>
                    <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-semibold w-full"
                    >
                        Add Runner
                    </button>
                </form>
            </div>

            {/* Group Modal */}
            {showGroupModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-80">
                        <h2 className="text-lg font-bold mb-4">Create New Group</h2>
                        <input
                            type="text"
                            placeholder="Group Name"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            className="rounded-md px-3 py-2 w-full mb-4 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={() => setShowGroupModal(false)}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateGroup}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold"
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}