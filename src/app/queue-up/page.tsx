'use client'
import { useState, useEffect } from "react";
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
    const [searchResults, setSearchResults] = useState<Runner[]>([]);
    const [selectedRunner, setSelectedRunner] = useState<Runner | null>(null);
    const [showResults, setShowResults] = useState(false);

    const [showGroupModal, setShowGroupModal] = useState(false);
    const [newGroupName, setNewGroupName] = useState("");

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

        fetchGroups();
        fetchFaculties();
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

    const handleRunnerClick = (runner: Runner) => {
        setSelectedRunner(runner);
        setSearchQuery(`${runner.firstName} ${runner.lastName}`);
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
                testTime: runner.testTime ? parseFloat(runner.testTime.replace(":", ".")) : null,
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

    const addToQueue = async (runner: Runner) => {
        const response = await fetch("/api/add-to-queue", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ runnerId: runner.id }),
        });
        if (response.ok) {
            alert("Runner added to queue successfully!");
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

    return (
        <div className="flex flex-col justify-center items-center w-full h-full">
            <div className="bg-white rounded-lg shadow-md p-6 mx-auto max-w-lg w-full">
                <h1 className="text-2xl font-bold mb-6">Queue Up</h1>

                {/* Add existing runner */}
                <h4 className="text-lg font-semibold mb-3">Add existing runner</h4>
                <div className="mb-6 relative">
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
              <span className="font-medium">
                {result.firstName} {result.lastName}
              </span>{" "}
                                    <span className="text-gray-600 text-sm">
                ({result.identification})
              </span>
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
                    <input
                        type="text"
                        name="identification"
                        placeholder="Identification Number"
                        value={runner.identification}
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
                    <div>
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
