'use client'
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Search, ClipboardList, Phone, X } from 'lucide-react';

interface Runner {
  id: number;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
}

interface CheckIn {
  id: number;
  runnerId: number;
  timeSlot: string;
  checkedIn: boolean;
  alreadyCalled: boolean;
  runner: Runner;
}

export default function TimeSlotPage() {
  const params = useParams();
  const timeSlot = params.slot as string;
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [runnersList, setRunnersList] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [selectedCheckIn, setSelectedCheckIn] = useState<CheckIn | null>(null);
  const [addResults, setAddResults] = useState<{ added: string[], notFound: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Runner[]>([]);
  const [searching, setSearching] = useState(false);

  const fetchCheckIns = useCallback(async () => {
    try {
      const response = await fetch(`/api/shift-checkins?timeSlot=${encodeURIComponent(timeSlot)}`);
      const data = await response.json();
      setCheckIns(data);
    } catch (error) {
      console.error('Error fetching check-ins:', error);
    }
  }, [timeSlot]);

  useEffect(() => {
    fetchCheckIns();
    // Poll every 5 seconds
    const interval = setInterval(fetchCheckIns, 5000);
    return () => clearInterval(interval);
  }, [fetchCheckIns]);

  // Search for runners
  useEffect(() => {
    const searchRunners = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      setSearching(true);
      try {
        const response = await fetch(`/api/shift-checkins/search-runners?query=${encodeURIComponent(searchQuery)}`);
        const data = await response.json();
        setSearchResults(data);
      } catch (error) {
        console.error('Error searching runners:', error);
      } finally {
        setSearching(false);
      }
    };

    const debounce = setTimeout(searchRunners, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleAddRunners = async () => {
    setLoading(true);
    setAddResults(null);
    try {
      const response = await fetch('/api/shift-checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeSlot, runnersList }),
      });
      const results = await response.json();
      setAddResults(results);
      setRunnersList('');
      fetchCheckIns();
    } catch (error) {
      console.error('Error adding runners:', error);
      alert('Failed to add runners');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRunnerById = async (runnerId: number) => {
    try {
      await fetch('/api/shift-checkins', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeSlot, runnerId }),
      });
      fetchCheckIns();
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error adding runner:', error);
      alert('Failed to add runner');
    }
  };

  const handleRemoveRunner = async (checkInId: number) => {
    if (!confirm('Are you sure you want to remove this runner from the shift?')) {
      return;
    }

    try {
      await fetch(`/api/shift-checkins?checkInId=${checkInId}`, {
        method: 'DELETE',
      });
      fetchCheckIns();
    } catch (error) {
      console.error('Error removing runner:', error);
      alert('Failed to remove runner');
    }
  };

  const handleToggleCalled = async (checkInId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent any parent click handlers
    try {
      await fetch('/api/shift-checkins/toggle-called', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkInId }),
      });
      fetchCheckIns();
    } catch (error) {
      console.error('Error toggling called status:', error);
      alert('Failed to toggle called status');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-8">
          <div>
            <Link href="/shift-checkins" className="text-blue-600 hover:underline mb-2 block">
              ← Back to all shifts
            </Link>
            <h1 className="text-4xl font-bold text-gray-900">Shift: {timeSlot}</h1>
          </div>
          <div className="ml-6 flex gap-3">
            <button
              onClick={() => setShowSearchModal(true)}
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              <Search className="w-5 h-5 inline-block mr-2 -mt-1" />
              Search & Add
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              <ClipboardList className="w-5 h-5 inline-block mr-2 -mt-1" />
              Paste List
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">
            Runners ({checkIns.length})
          </h2>

          {checkIns.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No runners assigned to this shift yet.</p>
          ) : (
            <div className="space-y-2">
              {checkIns.map((checkIn) => (
                <div
                  key={checkIn.id}
                  className={`p-4 rounded-lg border-2 flex items-center justify-between ${
                    checkIn.checkedIn
                      ? 'bg-blue-100 border-blue-400'
                      : 'bg-gray-50 border-gray-300'
                  }`}
                >
                  <div className="flex-1">
                    <div className="font-semibold text-lg text-gray-900">
                      {checkIn.runner.firstName} {checkIn.runner.lastName}
                    </div>
                    {checkIn.runner.phoneNumber && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="text-gray-600 text-sm flex items-center">
                          <Phone className="w-4 h-4 inline-block mr-1" />
                          {checkIn.runner.phoneNumber}
                        </div>
                        <button
                          onClick={(e) => handleToggleCalled(checkIn.id, e)}
                          className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                            checkIn.alreadyCalled
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                          title={checkIn.alreadyCalled ? 'Mark as not called' : 'Mark as called'}
                        >
                          {checkIn.alreadyCalled ? '✓ Called' : 'Not Called'}
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {checkIn.checkedIn ? (
                      <button
                        onClick={() => {
                          setSelectedCheckIn(checkIn);
                          setShowCheckInModal(true);
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-full font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
                        title="Click to uncheck"
                      >
                        ✓ Checked In
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedCheckIn(checkIn);
                          setShowCheckInModal(true);
                        }}
                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded-full hover:bg-gray-400 transition-colors cursor-pointer font-semibold"
                        title="Click to manually check in"
                      >
                        Not Checked In
                      </button>
                    )}
                    <button
                      onClick={() => handleRemoveRunner(checkIn.id)}
                      className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-colors font-semibold"
                      title="Remove from shift"
                    >
                      <X className="w-4 h-4 inline-block" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Search & Add Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-900">Search & Add Runners</h2>
              <p className="text-gray-600 mb-4">
                Search for runners by name and click to add them to this shift
              </p>

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type runner name..."
                className="w-full p-4 border-2 border-gray-300 rounded-lg text-lg focus:border-green-500 focus:outline-none mb-4"
                autoFocus
              />

              {searching && (
                <div className="text-center py-8 text-gray-500">
                  Searching...
                </div>
              )}

              {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No runners found matching &quot;{searchQuery}&quot;
                </div>
              )}

              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {searchResults.map((runner) => (
                    <div
                      key={runner.id}
                      className="p-4 border-2 border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors cursor-pointer"
                      onClick={() => handleAddRunnerById(runner.id)}
                    >
                      <div className="font-semibold text-lg text-gray-900">
                        {runner.firstName} {runner.lastName}
                      </div>
                      {runner.phoneNumber && (
                        <div className="text-gray-600 text-sm mt-1">
                          <Phone className="w-4 h-4 inline-block mr-1 -mt-1" />
                          {runner.phoneNumber}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowSearchModal(false);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Paste List Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-900">Add Runners by List</h2>
              <p className="text-gray-600 mb-4">
                Paste a list of runner names (one per line, format: FirstName LastName)
              </p>

              <textarea
                value={runnersList}
                onChange={(e) => setRunnersList(e.target.value)}
                placeholder="Example:&#10;Gauthier Walcarius&#10;Luka Lagunas Vargas&#10;Len Dieltiens"
                className="w-full h-64 p-4 border-2 border-gray-300 rounded-lg font-mono text-sm resize-none focus:border-blue-500 focus:outline-none"
              />

              {addResults && (
                <div className="mt-4 space-y-2">
                  {addResults.added.length > 0 && (
                    <div className="bg-green-100 border border-green-400 rounded p-3">
                      <div className="font-semibold text-green-800 mb-1">
                        ✓ Added ({addResults.added.length}):
                      </div>
                      <div className="text-sm text-green-700">
                        {addResults.added.join(', ')}
                      </div>
                    </div>
                  )}
                  {addResults.notFound.length > 0 && (
                    <div className="bg-red-100 border border-red-400 rounded p-3">
                      <div className="font-semibold text-red-800 mb-1">
                        ✗ Not Found ({addResults.notFound.length}):
                      </div>
                      <div className="text-sm text-red-700">
                        {addResults.notFound.join(', ')}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleAddRunners}
                  disabled={loading || !runnersList.trim()}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? 'Adding...' : 'Add Runners'}
                </button>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setAddResults(null);
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Check-in/Uncheck Modal */}
      {showCheckInModal && selectedCheckIn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">
              {selectedCheckIn.checkedIn ? 'Uncheck' : 'Manual Check-in for'} {selectedCheckIn.runner.firstName} {selectedCheckIn.runner.lastName}
            </h2>
            <p className="text-gray-600 mb-4">
              {selectedCheckIn.checkedIn
                ? 'Are you sure you want to uncheck this runner? This will mark them as not checked in.'
                : 'Confirm the check-in details and click "Check In" to proceed.'
              }
            </p>

            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">
                Time Slot
              </label>
              <input
                type="text"
                value={selectedCheckIn.timeSlot}
                readOnly
                className="w-full p-3 border-2 border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
              />
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={async () => {
                  setLoading(true);
                  try {
                    await fetch('/api/shift-checkins/manual-checkin', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        checkInId: selectedCheckIn.id,
                        checkIn: !selectedCheckIn.checkedIn
                      }),
                    });
                    fetchCheckIns();
                    setShowCheckInModal(false);
                  } catch (error) {
                    console.error('Error during manual check-in/uncheck:', error);
                    alert(`Failed to ${selectedCheckIn.checkedIn ? 'uncheck' : 'check in'} runner`);
                  } finally {
                    setLoading(false);
                  }
                }}
                className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors ${
                  selectedCheckIn.checkedIn
                    ? 'bg-orange-600 text-white hover:bg-orange-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {loading
                  ? (selectedCheckIn.checkedIn ? 'Unchecking...' : 'Checking In...')
                  : (selectedCheckIn.checkedIn ? 'Uncheck' : 'Check In')
                }
              </button>
              <button
                onClick={() => setShowCheckInModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
