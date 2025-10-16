'use client'
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

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
  runner: Runner;
}

export default function TimeSlotPage() {
  const params = useParams();
  const timeSlot = params.slot as string;
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [runnersList, setRunnersList] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addResults, setAddResults] = useState<{ added: string[], notFound: string[] } | null>(null);
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/shift-checkins" className="text-blue-600 hover:underline mb-2 block">
              ← Back to all shifts
            </Link>
            <h1 className="text-4xl font-bold text-gray-900">Shift: {timeSlot}</h1>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            + Add Runners
          </button>
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
                      <div className="text-gray-600 text-sm mt-1">
                        📞 {checkIn.runner.phoneNumber}
                      </div>
                    )}
                  </div>
                  <div>
                    {checkIn.checkedIn ? (
                      <span className="bg-blue-600 text-white px-4 py-2 rounded-full font-semibold">
                        ✓ Checked In
                      </span>
                    ) : (
                      <span className="bg-gray-300 text-gray-700 px-4 py-2 rounded-full">
                        Not Checked In
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Runners Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-900">Add Runners to Shift</h2>
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
    </div>
  );
}
