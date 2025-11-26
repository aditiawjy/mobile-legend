import { useState } from 'react';

export default function QuickActions({ 
  csvUpdating, 
  csvMessage, 
  handleUpdateCSV, 
  handleUpdateAdjustmentsCSV, 
  handleUpdateEmblemsCSV, 
  handleUpdateSpellsCSV 
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="font-semibold text-gray-700">Admin & Data Management</span>
        </div>
        <svg 
          className={`w-5 h-5 text-gray-400 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="p-6 border-t border-gray-200">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Section 1: Manage Pages */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Edit Pages</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <LinkCard href="/edit-hero-info" label="Hero Info & Lanes" color="blue" />
                <LinkCard href="/edit-skills" label="Hero Skills" color="purple" />
                <LinkCard href="/edit-hero-attributes" label="Hero Attributes" color="green" />
                <LinkCard href="/edit-hero-adjustments" label="Hero Adjustments" color="orange" />
                <LinkCard href="/edit-hero-combos" label="Hero Combos" color="pink" isNew />
                <LinkCard href="/edit-matches" label="Matches" color="gray" />
                <LinkCard href="/edit-teams" label="Teams" color="gray" />
              </div>
            </div>

            {/* Section 2: CSV Export */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Update CSV Data</h3>
              <div className="space-y-3">
                <CsvButton 
                  onClick={handleUpdateCSV} 
                  disabled={csvUpdating} 
                  label="Update Heroes CSV" 
                  color="blue" 
                />
                <CsvButton 
                  onClick={handleUpdateAdjustmentsCSV} 
                  disabled={csvUpdating} 
                  label="Update Adjustments CSV" 
                  color="purple" 
                />
                <div className="grid grid-cols-2 gap-3">
                  <CsvButton 
                    onClick={handleUpdateEmblemsCSV} 
                    disabled={csvUpdating} 
                    label="Emblems CSV" 
                    color="yellow" 
                  />
                  <CsvButton 
                    onClick={handleUpdateSpellsCSV} 
                    disabled={csvUpdating} 
                    label="Spells CSV" 
                    color="red" 
                  />
                </div>
                <a 
                  href="/items" 
                  className="block w-full px-4 py-2 bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-700 rounded-lg text-sm font-medium text-center transition-colors"
                >
                  Manage Items & CSV
                </a>
              </div>
              
              {csvMessage && (
                <div className={`mt-4 p-3 rounded-lg text-sm ${csvMessage.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                  {csvMessage}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LinkCard({ href, label, color, isNew }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200',
    purple: 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200',
    green: 'bg-green-50 text-green-700 hover:bg-green-100 border-green-200',
    orange: 'bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-200',
    pink: 'bg-pink-50 text-pink-700 hover:bg-pink-100 border-pink-200',
    gray: 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200',
  };

  return (
    <a
      href={href}
      className={`px-4 py-3 rounded-lg border text-sm font-medium transition-colors flex items-center justify-between group ${colorClasses[color] || colorClasses.gray}`}
    >
      <span className="flex items-center gap-2">
        {label}
        {isNew && <span className="text-[9px] px-1.5 py-0.5 bg-white/50 rounded-full border border-black/5">NEW</span>}
      </span>
      <svg className="w-3 h-3 opacity-50 group-hover:opacity-100 transform group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </a>
  );
}

function CsvButton({ onClick, disabled, label, color }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-all flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <span>{label}</span>
      <svg className="w-4 h-4 text-gray-400 group-hover:text-green-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    </button>
  );
}
