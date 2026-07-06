import React, { useState } from 'react';

export function FacultyAttendance() {
  const students = [
    {id:"S-2401", name:"Julianne Sterling", h:["P","A","P","P"]},
    {id:"S-2402", name:"Marcus Chen", h:["P","P","L","P"]},
    {id:"S-2403", name:"Elara Vance", h:["P","L","P","P"]},
    {id:"S-2404", name:"Dimitri Petrov", h:["P","P","P","A"]},
    {id:"S-2405", name:"Lin Zhao", h:["P","P","P","P"]},
    {id:"S-2406", name:"Noor Hassan", h:["A","P","P","P"]},
    {id:"S-2407", name:"Felix Ortega", h:["P","P","L","P"]},
    {id:"S-2408", name:"Anika Sørensen", h:["P","L","P","A"]},
    {id:"S-2409", name:"Tomás Riveros", h:["P","P","P","A"]},
    {id:"S-2410", name:"Yuki Watanabe", h:["P","P","P","P"]},
    {id:"S-2411", name:"Hanan El-Amin", h:["A","P","P","P"]},
    {id:"S-2412", name:"Oliver Brennan", h:["P","P","L","P"]},
  ];

  const [today, setToday] = useState(students.map(() => "P"));

  const dc = (v: string) =>
    v === "P" ? "bg-emerald-500" : v === "L" ? "bg-amber-400" : "bg-red-400";

  const presentCount = today.filter(v => v === "P").length;
  const lateCount = today.filter(v => v === "L").length;
  const absentCount = today.filter(v => v === "A").length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Attendance Grid</h1>
      <p className="text-sm text-gray-400 mb-6">Algorithms · CS · A · Y3</p>

      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
        <div className="flex items-center gap-6 flex-wrap">
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest block mb-1">Class</label>
            <select className="border border-gray-100 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none">
              <option>Algorithms · CS · A · Y3</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest block mb-1">Date</label>
            <input
              type="date"
              defaultValue="2026-05-18"
              className="border border-gray-100 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none"
            />
          </div>
          <div className="ml-auto flex gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600">{presentCount}</p>
              <p className="text-xs text-gray-400">Present</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-500">{lateCount}</p>
              <p className="text-xs text-gray-400">Late</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-500">{absentCount}</p>
              <p className="text-xs text-gray-400">Absent</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100">
        <div className="p-4 border-b border-gray-50 flex items-center justify-between flex-wrap gap-2">
          <input
            placeholder="Search students…"
            className="border border-gray-100 rounded-lg px-3 py-1.5 text-sm text-gray-600 focus:outline-none w-56"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setToday(students.map(() => "P"))}
              className="text-xs font-semibold border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              All present
            </button>
            <button
              onClick={() => setToday(students.map(() => "A"))}
              className="text-xs font-semibold border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              All absent
            </button>
            <button className="bg-gray-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-gray-700 transition-colors">
              Save attendance
            </button>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-50">
              {["ID","Student","Last 4 Sessions","Today"].map(h => (
                <th key={h} className="text-left py-3 px-4 text-xs font-semibold tracking-widest uppercase text-gray-400">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map((s, i) => (
              <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4 text-xs font-mono text-gray-400">{s.id}</td>
                <td className="py-3 px-4 font-medium text-gray-900">{s.name}</td>
                <td className="py-3 px-4">
                  <div className="flex gap-1.5">
                    {s.h.map((h, j) => (
                      <div key={j} className={`w-3 h-3 rounded-full ${dc(h)}`}/>
                    ))}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    {["P","L","A"].map(opt => (
                      <button
                        key={opt}
                        onClick={() => {
                          const n = [...today];
                          n[i] = opt;
                          setToday(n);
                        }}
                        className={`text-xs font-semibold px-2.5 py-1 rounded transition-all ${
                          today[i] === opt
                            ? opt === "P"
                              ? "bg-emerald-500 text-white"
                              : opt === "L"
                                ? "bg-amber-400 text-white"
                                : "bg-red-400 text-white"
                            : "text-gray-400 hover:bg-gray-100"
                        }`}
                      >
                        {opt === "P" ? "✓ P" : opt === "L" ? "L" : "× A"}
                      </button>
                    ))}
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