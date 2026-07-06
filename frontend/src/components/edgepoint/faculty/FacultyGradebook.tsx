import React from 'react';
import { Badge } from '../Badge';

export function FacultyGradebook() {
  const students = [
    {id:"S-2401", name:"Julianne Sterling", mid:92, proj:88, att:"96%", avg:90, standing:"Excelling"},
    {id:"S-2402", name:"Marcus Chen", mid:78, proj:82, att:"88%", avg:80, standing:"On track"},
    {id:"S-2403", name:"Elara Vance", mid:64, proj:70, att:"71%", avg:67, standing:"Pending"},
    {id:"S-2404", name:"Dimitri Petrov", mid:95, proj:91, att:"98%", avg:93, standing:"Excelling"},
    {id:"S-2405", name:"Lin Zhao", mid:81, proj:84, att:"92%", avg:83, standing:"On track"},
    {id:"S-2406", name:"Noor Hassan", mid:58, proj:62, att:"64%", avg:60, standing:"Pending"},
    {id:"S-2407", name:"Felix Ortega", mid:86, proj:80, att:"90%", avg:83, standing:"On track"},
    {id:"S-2408", name:"Anika Sørensen", mid:89, proj:92, att:"94%", avg:91, standing:"Excelling"},
  ];

  const sc = (s: string) =>
    s === "Excelling"
      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
      : s === "On track"
        ? "bg-blue-50 text-blue-700 border border-blue-200"
        : "bg-amber-50 text-amber-700 border border-amber-200";

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-gray-900">Gradebook</h1>
        <div className="flex gap-2">
          <button className="border border-gray-200 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-gray-50">
            Export CSV
          </button>
          <button className="bg-gray-900 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-gray-700">
            Submit for review
          </button>
        </div>
      </div>
      <p className="text-sm text-gray-400 mb-6">Spreadsheet-style entry · changes save when you commit</p>

      <div className="bg-white rounded-xl border border-gray-100">
        <div className="p-4 border-b border-gray-50 flex gap-3">
          <input
            placeholder="Search students…"
            className="flex-1 border border-gray-100 rounded-lg px-3 py-1.5 text-sm text-gray-600 focus:outline-none"
          />
          <select className="flex-1 border border-gray-100 rounded-lg px-3 py-1.5 text-sm text-gray-600 focus:outline-none">
            <option>Standing: All</option>
            <option>Excelling</option>
            <option>On track</option>
            <option>Pending</option>
          </select>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-50">
              {["ID","Student","Mid","Project","Final","Attendance","Avg","Standing"].map(h => (
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
                <td className="py-3 px-4 text-gray-700">{s.mid}</td>
                <td className="py-3 px-4 text-gray-700">{s.proj}</td>
                <td className="py-3 px-4 text-gray-300">—</td>
                <td className={`py-3 px-4 font-semibold ${parseInt(s.att) < 75 ? "text-red-500" : "text-gray-700"}`}>
                  {s.att}
                </td>
                <td className="py-3 px-4 font-bold text-gray-900">{s.avg}</td>
                <td className="py-3 px-4">
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${sc(s.standing)}`}>
                    {s.standing}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}