import React from 'react';
import { Badge } from '../Badge';

interface Class {
  name: string;
  code: string;
  students: number;
  time: string;
  room: string;
}

interface FacultyCommandCenterProps {
  onSelect: (cls: Class) => void;
}

export function FacultyCommandCenter({ onSelect }: FacultyCommandCenterProps) {
  const classes: Class[] = [
    {name:"Algorithms", code:"CS · A · Y3", students:48, time:"Today · 10:00", room:"B-204"},
    {name:"Databases", code:"CS · A · Y3", students:48, time:"Today · 14:00", room:"B-211"},
    {name:"Data Structures", code:"CS · B · Y2", students:44, time:"Tomorrow · 09:00", room:"A-118"},
    {name:"AI Foundations", code:"CS · A · Y4", students:36, time:"Thursday · 11:00", room:"B-301"},
  ];

  const flagged = [
    {initials:"NH", name:"Noor Hassan", subject:"Algorithms", reason:"Marks dropped 24% from last assessment"},
    {initials:"EV", name:"Elara Vance", subject:"Databases", reason:"Attendance below 75% threshold"},
    {initials:"MC", name:"Marcus Chen", subject:"Data Structures", reason:"Missed 2 consecutive submissions"},
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-gray-900">Command Center</h1>
        <button className="bg-gray-900 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
          Start session
        </button>
      </div>
      <p className="text-sm text-gray-400 mb-6">Welcome back, Marcus · 4 active sections this term</p>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          {l:"Sessions Today", v:"2", s:"Next at 10:00"},
          {l:"Pending Grading", v:"36", s:"Across 2 subjects"},
          {l:"Avg Attendance", v:"89%", s:"+1.2%", sc:"text-emerald-600"},
          {l:"Needs Attention", v:"3", s:"Students flagged", sc:"text-red-500"}
        ].map(s => (
          <div key={s.l} className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-2">{s.l}</p>
            <p className="text-3xl font-bold text-gray-900">{s.v}</p>
            <p className={`text-sm mt-1 font-medium ${s.sc || "text-gray-400"}`}>{s.s}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {classes.map(cls => (
          <button
            key={cls.name}
            onClick={() => onSelect(cls)}
            className="bg-white rounded-xl border border-gray-100 p-5 text-left hover:border-gray-300 hover:shadow-sm transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-gray-400 font-mono">{cls.code}</span>
              <span className="text-gray-300 group-hover:text-gray-600 transition-colors">→</span>
            </div>
            <p className="text-lg font-bold text-gray-900 mb-3">{cls.name}</p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>👥 {cls.students}</span>
              <span>🕐 {cls.time}</span>
              <span>📍 {cls.room}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100">
        <div className="p-5 border-b border-gray-50">
          <h2 className="text-sm font-bold text-gray-900">Needs attention</h2>
        </div>
        {flagged.map((f, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
              {f.initials}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {f.name} <span className="text-gray-400 font-normal">· {f.subject}</span>
              </p>
              <p className="text-xs text-gray-400">{f.reason}</p>
            </div>
            <button className="text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors">
              Open profile
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}