'use client'
import React from 'react';
import Link from 'next/link';

const timeSlots = [
  { slot: '20u-22u', color: 'bg-[#f3cccc] border-[#c00000]' },
  { slot: '20u30-22u', color: 'bg-[#f3cccc] border-[#c00000]' },
  { slot: '22u00-23u00', color: 'bg-[#f3cccc] border-[#c00000]' },
  { slot: '22u30-23u30', color: 'bg-[#f3cccc] border-[#c00000]' },
  { slot: '23u00-00u00', color: 'bg-[#f3cccc] border-[#c00000]' },
  { slot: '23u30-0u30', color: 'bg-[#f3cccc] border-[#c00000]' },
  { slot: '00u00-01u00', color: 'bg-[#f3cccc] border-[#c00000]' },
  { slot: '00u30-01u30', color: 'bg-[#f3cccc] border-[#c00000]' },
  { slot: '1u00-2u00', color: 'bg-[#f3cccc] border-[#c00000]' },
  { slot: '1u30-2u30', color: 'bg-[#f3cccc] border-[#c00000]' },
  { slot: '2u00-3u00', color: 'bg-[#f3cccc] border-[#c00000]' },
  { slot: '2u30-3u30', color: 'bg-[#f3cccc] border-[#c00000]' },
  { slot: '3u00-4u00', color: 'bg-[#f3cccc] border-[#c00000]' },
  { slot: '3u30-4u30', color: 'bg-[#f3cccc] border-[#c00000]' },
  { slot: '4u00-5u00', color: 'bg-[#f3cccc] border-[#c00000]' },
  { slot: '4u30-5u30', color: 'bg-[#f3cccc] border-[#c00000]' },
  { slot: '5u00-6u00', color: 'bg-[#f3cccc] border-[#c00000]' },
  { slot: '5u30-6u30', color: 'bg-[#f3cccc] border-[#c00000]' },
  { slot: '4u00-6u00', color: 'bg-[#E6F4F1] border-[#67bed9]' },
  { slot: '6u00-7u00', color: 'bg-[#f3cccc] border-[#c00000]' },
  { slot: '6u30-7u30', color: 'bg-[#f3cccc] border-[#c00000]' },
  { slot: '7u00-8u00', color: 'bg-[#f3cccc] border-[#c00000]' },
  { slot: '7u30-8u30', color: 'bg-[#f3cccc] border-[#c00000]' },
  { slot: '8u00-9u00', color: 'bg-[#ffeebf] border-[#ffbf00]' },
  { slot: '8u30-9u30', color: 'bg-[#f3cccc] border-[#c00000]' },
  { slot: '9u00-10u00', color: 'bg-[#f3cccc] border-[#c00000]' },
  { slot: '9u30-10u30', color: 'bg-[#f3cccc] border-[#c00000]' },
  { slot: '10u00-11u00', color: 'bg-[#f3cccc] border-[#c00000]' },
  { slot: '10u30-11u30', color: 'bg-[#f3cccc] border-[#c00000]' },
  { slot: '11u00-12u00', color: 'bg-[#f3cccc] border-[#c00000]' },
  { slot: '11u30-12u30', color: 'bg-[#E7EFFF] border-[#4285f4]' },
  { slot: '12u00-13u00', color: 'bg-[#E7EFFF] border-[#4285f4]' },
  { slot: '12u30-13u30', color: 'bg-[#E7EFFF] border-[#4285f4]' },
  { slot: '13u00-14u00', color: 'bg-[#E7EFFF] border-[#4285f4]' },
  { slot: '13u30-14u30', color: 'bg-[#E7EFFF] border-[#4285f4]' },
  { slot: '12u00-14u00', color: 'bg-[#E6F4F1] border-[#67bed9]' },
  { slot: '14u00-15u00', color: 'bg-[#E7EFFF] border-[#4285f4]' },
  { slot: '14u30-15u30', color: 'bg-[#E7EFFF] border-[#4285f4]' },
  { slot: '15u00-16u00', color: 'bg-[#E7EFFF] border-[#4285f4]' },
  { slot: '15u30-16u30', color: 'bg-[#E7EFFF] border-[#4285f4]' },
  { slot: '14u00-16u00', color: 'bg-[#E6F4F1] border-[#67bed9]' },
  { slot: '16u00-17u00', color: 'bg-[#E7EFFF] border-[#4285f4]' },
  { slot: '16u30-17u30', color: 'bg-[#f3cccc] border-[#c00000]' },
  { slot: '17u00-18u00', color: 'bg-[#E7EFFF] border-[#4285f4]' },
  { slot: '17u30-18u30', color: 'bg-[#f3cccc] border-[#c00000]' },
  { slot: '18u00-19u00', color: 'bg-[#f3cccc] border-[#c00000]' },
  { slot: '18u30-19u30', color: 'bg-[#f3cccc] border-[#c00000]' },
  { slot: '19u00-20u00', color: 'bg-[#CCCCCC] border-[#434343]' },
];

export default function ShiftCheckIns() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-900">Shift Check-Ins</h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {timeSlots.map((slot) => (
            <Link
              key={slot.slot}
              href={`/shift-checkins/${slot.slot}`}
              className={`${slot.color} border-2 rounded-lg p-4 text-center font-semibold text-gray-800 hover:shadow-lg transition-shadow duration-200 hover:scale-105 transform`}
            >
              {slot.slot}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

