import React, { useState } from 'react';
import { Badge } from '../Badge';

export function StudentMarks() {
  const [sem, setSem] = useState("5");
  const subjects = [
    {code:"CS501", name:"Algorithms", int:28, ext:64, total:92, grade:"A+"},
    {code:"CS502", name:"Databases", int:26, ext:59, total:85, grade:"A"},
    {code:"CS503", name:"Operating Sys.", int:22, ext:49, total:71, grade:"B+"},
    {code:"CS504", name:"Networks", int:27, ext:61, total:88, grade:"A"},
    {code:"CS505", name:"AI Foundations", int:24, ext:55, total:79, grade:"B+"},
  ];

  const gc = (g: string) =>
    g.startsWith("A")
      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
      : "bg-blue-50 text-blue-700 border border-blue-200";

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Examination Marks</h1>
      <p className="text-sm text-gray-400 mb-6">Internal continuous assessment and external university marks</p>

      <div className="flex gap-2 mb-6">
        {[
          ["5","Sem 5 · 2025-26"],
          ["4","Sem 4 · 2024-25"],
          ["3","Sem 3 · 2024-25"]
        ].map(([id,label])=>(
          <button
            key={id}
            onClick={()=>setSem(id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              sem===id
                ? "bg-gray-900 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100">
        <div className="p-5 border-b border-gray-50">
          <h2 className="text-sm font-bold text-gray-900">Sem 5 · 2025-26 · Mark sheet</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-50">
              {["","Code","Subject","Internal / 30","External / 70","Total / 100","Grade"].map(h=>(
                <th key={h} className="text-left py-3 px-4 text-xs font-semibold tracking-widest uppercase text-gray-400">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {subjects.map(s=>(
              <tr key={s.code} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4 text-gray-300 text-xs">›</td>
                <td className="py-3 px-4 text-xs text-gray-400 font-mono">{s.code}</td>
                <td className="py-3 px-4 text-gray-900 font-medium">{s.name}</td>
                <td className="py-3 px-4 text-right text-gray-700">{s.int}</td>
                <td className="py-3 px-4 text-right text-gray-700">{s.ext}</td>
                <td className="py-3 px-4 text-right font-bold text-gray-900">{s.total}</td>
                <td className="py-3 px-4 text-right">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${gc(s.grade)}`}>
                    {s.grade}
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