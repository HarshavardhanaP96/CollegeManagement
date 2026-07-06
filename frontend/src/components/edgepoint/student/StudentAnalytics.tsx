import React from 'react';
import { Badge } from '../Badge';

export function StudentAnalytics() {
  const subjects = [
    {name:"Algorithms", score:92, avg:78, delta:"+6", above:true},
    {name:"Databases", score:85, avg:74, delta:"+2", above:true},
    {name:"Operating Sys.", score:71, avg:76, delta:"-4", above:false},
    {name:"Networks", score:88, avg:80, delta:"+3", above:true},
    {name:"AI Foundations", score:79, avg:72, delta:"+1", above:true},
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">How am I doing?</h1>
      <p className="text-sm text-gray-400 mb-6">Cross-subject performance, growth and class comparison</p>

      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="col-span-2 bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-6">Subject performance vs class average</h2>
          <div className="flex items-end gap-6 h-36 mb-4">
            {subjects.map(s=>(
              <div key={s.name} className="flex-1 flex flex-col items-center">
                <div className="w-full flex items-end gap-1 h-28">
                  <div className="flex-1 bg-blue-500 rounded-t transition-all" style={{height:`${(s.score/100)*100}%`}}/>
                  <div className="flex-1 bg-gray-200 rounded-t" style={{height:`${(s.avg/100)*100}%`}}/>
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">{s.name.split(" ")[0]}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500"/>
              <span>You</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-300"/>
              <span>Class average</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Month-over-month growth</h2>
          <svg viewBox="0 0 200 100" className="w-full h-32">
            <defs>
              <linearGradient id="mg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2"/>
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
              </linearGradient>
            </defs>
            {(() => {
              const pts = [40,45,42,50,55,58,62,70];
              const mx = Math.max(...pts);
              const coords = pts.map((v,i)=>`${(i/(pts.length-1))*200},${100-(v/mx)*90}`);
              return (
                <>
                  <path d={`M ${coords.join(" L ")}`} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d={`M 0,${100-(pts[0]/mx)*90} ${coords.map(c=>`L ${c}`).join(" ")} L 200,100 L 0,100 Z`} fill="url(#mg)"/>
                </>
              );
            })()}
          </svg>
          <p className="text-2xl font-bold text-gray-900 mt-2">+22.5%</p>
          <p className="text-sm text-gray-400">since September</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100">
        <div className="p-5 border-b border-gray-50">
          <h2 className="text-sm font-bold text-gray-900">Subject breakdown</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-50">
              {["Subject","Your Score","Class Average","Δ vs Last Exam","Standing"].map(h=>(
                <th key={h} className="text-left py-3 px-4 text-xs font-semibold tracking-widest uppercase text-gray-400">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {subjects.map(s=>(
              <tr key={s.name} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4 font-medium text-gray-900">{s.name}</td>
                <td className="py-3 px-4 text-gray-700">{s.score}</td>
                <td className="py-3 px-4 text-gray-700">{s.avg}</td>
                <td className={`py-3 px-4 font-semibold ${s.above?"text-emerald-600":"text-red-500"}`}>
                  {s.delta}
                </td>
                <td className="py-3 px-4">
                  <Badge color={s.above?"green":"red"}>
                    {s.above?"Above average":"Below average"}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}