import React from 'react';
import { ClipboardList, FileText } from 'lucide-react';

interface Class {
  name: string;
  code: string;
  students: number;
  time: string;
  room: string;
}

interface FacultyClassDetailProps {
  cls: Class;
  onBack: () => void;
}

export function FacultyClassDetail({ cls, onBack }: FacultyClassDetailProps) {
  const students = [
    {id:"S-2401", name:"Julianne Sterling", att:"70%", grade:60},
    {id:"S-2402", name:"Marcus Chen", att:"83%", grade:67},
    {id:"S-2403", name:"Elara Vance", att:"96%", grade:74},
    {id:"S-2404", name:"Dimitri Petrov", att:"79%", grade:81},
    {id:"S-2405", name:"Lin Zhao", att:"92%", grade:88},
    {id:"S-2406", name:"Noor Hassan", att:"75%", grade:95},
    {id:"S-2407", name:"Felix Ortega", att:"88%", grade:62},
    {id:"S-2408", name:"Anika Sørensen", att:"71%", grade:69},
    {id:"S-2409", name:"Tomás Riveros", att:"84%", grade:76},
    {id:"S-2410", name:"Yuki Watanabe", att:"97%", grade:83},
    {id:"S-2411", name:"Hanan El-Amin", att:"80%", grade:90},
    {id:"S-2412", name:"Oliver Brennan", att:"93%", grade:97},
  ];

  return (
    <div>
      <button
        onClick={onBack}
        className="text-xs text-gray-400 hover:text-gray-700 mb-4 flex items-center gap-1 transition-colors"
      >
        ← Back to classes
      </button>

      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-gray-900">{cls.name}</h1>
        <div className="flex gap-2">
          <button className="border border-gray-200 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-gray-50">
            Mark attendance
          </button>
          <button className="bg-gray-900 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
            Open gradebook
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-400 mb-6">
        {cls.code} · {cls.students} students · Next {cls.time} · {cls.room}
      </p>

      <div className="bg-white rounded-xl border border-gray-100">
        <div className="p-5 border-b border-gray-50">
          <h2 className="text-sm font-bold text-gray-900">Roster</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-50">
              {["ID","Student","Attendance","Last Grade","Quick Actions"].map(h => (
                <th key={h} className="text-left py-3 px-4 text-xs font-semibold tracking-widest uppercase text-gray-400">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map(s => (
              <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4 text-xs font-mono text-gray-400">{s.id}</td>
                <td className="py-3 px-4 font-medium text-gray-900">{s.name}</td>
                <td className={`py-3 px-4 font-semibold ${parseInt(s.att) < 75 ? "text-red-500" : "text-gray-700"}`}>
                  {s.att}
                </td>
                <td className="py-3 px-4 text-gray-700">{s.grade}</td>
                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    <button className="inline-flex items-center gap-1 text-xs border border-gray-100 rounded px-2 py-1 text-gray-500 hover:text-gray-900 transition-colors">
                      <ClipboardList size={13} /> Mark
                    </button>
                    <button className="inline-flex items-center gap-1 text-xs border border-gray-100 rounded px-2 py-1 text-gray-500 hover:text-gray-900 transition-colors">
                      <FileText size={13} /> Grade
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}