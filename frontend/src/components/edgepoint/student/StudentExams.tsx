import React from 'react';
import { Badge } from '../Badge';

export function StudentExams() {
  const exams = [
    {date:"2026-05-15", past:true, code:"CS501-I", subject:"Algorithms · Internal II", time:"10:00 – 11:30", room:"B-204", type:"Internal"},
    {date:"2026-05-17", past:true, code:"CS502-I", subject:"Databases · Internal II", time:"10:00 – 11:30", room:"B-211", type:"Internal"},
    {date:"2026-05-22", code:"CS501", subject:"Algorithms", time:"09:30 – 12:30", room:"Hall A", type:"External"},
    {date:"2026-05-25", code:"CS502", subject:"Databases", time:"09:30 – 12:30", room:"Hall A", type:"External"},
    {date:"2026-05-28", code:"CS503", subject:"Operating Sys.", time:"14:00 – 17:00", room:"Hall B", type:"External"},
    {date:"2026-06-01", code:"CS504", subject:"Networks", time:"09:30 – 12:30", room:"Hall A", type:"External"},
    {date:"2026-06-04", code:"CS505", subject:"AI Foundations", time:"14:00 – 17:00", room:"Hall C", type:"External"},
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Exam Schedule</h1>
      <p className="text-sm text-gray-400 mb-6">Upcoming internal and external assessments</p>

      <div className="bg-white rounded-xl border border-gray-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-50">
              {["Date","Code","Subject","Time","Room","Type"].map(h=>(
                <th key={h} className="text-left py-3 px-4 text-xs font-semibold tracking-widest uppercase text-gray-400">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {exams.map((e,i)=>(
              <tr key={i} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${e.past?"opacity-50":""}`}>
                <td className="py-3 px-4">
                  <p className="font-mono font-semibold text-gray-900">{e.date}</p>
                  {e.past&&<p className="text-xs text-gray-400">past</p>}
                </td>
                <td className="py-3 px-4 text-xs text-gray-400 font-mono">{e.code}</td>
                <td className="py-3 px-4 text-gray-900 font-medium">{e.subject}</td>
                <td className="py-3 px-4 text-gray-600">{e.time}</td>
                <td className="py-3 px-4 text-gray-600">{e.room}</td>
                <td className="py-3 px-4">
                  <Badge color={e.type==="Internal"?"blue":"orange"}>{e.type}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}