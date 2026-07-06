import React, { useEffect, useState } from 'react';
import { Badge } from '../Badge';
import { getStudentDashboardById, type StudentDashboardDto } from '../../../api/student';
import { useAuthStore } from '../../../store/authStore';

export function StudentToday() {
  const { user } = useAuthStore();
  const [dashboard, setDashboard] = useState<StudentDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!user?.id) return;
      try {
        const response = await getStudentDashboardById(user.id);
        if (response.success && response.data) {
          setDashboard(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [user?.id]);

  const timeline = [
    {title:"Algorithms · Midterm released", meta:"92 / 100 · Class avg 78", time:"TODAY · 11:42", tag:"mark", tc:"blue"},
    {title:"Marked Present · Databases", meta:"B-211 · 14:00", time:"YESTERDAY", tag:"attendance", tc:"gray"},
    {title:"Tuition installment received", meta:"$2,400 · Receipt INV-2842", time:"2 DAYS AGO", tag:"fee", tc:"gray"},
    {title:"Genetics · Quiz 4 released", meta:"18 / 20 · Class avg 14.2", time:"3 DAYS AGO", tag:"mark", tc:"blue"},
    {title:"Marked Absent · Operating Sys.", meta:"B-204 · 10:00", time:"5 DAYS AGO", tag:"attendance", tc:"orange"},
    {title:"Library hours extended", meta:"Open until 23:00 during finals", time:"1 WEEK AGO", tag:"notice", tc:"orange"},
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Today, {user?.firstName || 'Student'}</h1>
      <p className="text-sm text-gray-400 mb-6">Wednesday · 13 May 2026 · BSc Computer Science · Year 3</p>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {loading ? (
          <div className="text-center py-4 col-span-4">Loading...</div>
        ) : (
          [
            {l:"Term GPA", v: dashboard?.gpa?.toFixed(2) || "0.00", s:"+0.08 vs last term", sc:"text-emerald-600"},
            {l:"Attendance", v: `${dashboard?.attendance || 0}%`, s:"Top 12% of class", sc:"text-emerald-600"},
            {l:"Outstanding Fees", v: `$${dashboard?.outstandingFees || 0}`, s:"All paid", sc:"text-emerald-600"},
            {l:"New Marks", v: `${dashboard?.newMarksCount || 0}`, s:"Released today", sc:"text-gray-400"}
          ].map(s=>(
            <div key={s.l} className="bg-white rounded-xl border border-gray-100 p-5">
              <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-2">{s.l}</p>
              <p className="text-3xl font-bold text-gray-900">{s.v}</p>
              <p className={`text-sm mt-1 font-medium ${s.sc}`}>{s.s}</p>
            </div>
          ))
        )}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Story timeline</h2>
          <div className="space-y-4">
            {timeline.map((item,i)=>(
              <div key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-gray-400"/>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium text-gray-900">{item.title}</p>
                    <Badge color={item.tc as any}>{item.tag}</Badge>
                  </div>
                  <p className="text-xs text-gray-500">{item.meta}</p>
                  <p className="text-xs text-gray-300 mt-0.5 font-medium tracking-wide">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-4">Today's schedule</h2>
            {[
              {t:"10:00", s:"Algorithms", r:"B-204"},
              {t:"12:00", s:"Lunch break", r:"—"},
              {t:"14:00", s:"Databases", r:"B-211"},
              {t:"16:00", s:"Project clinic", r:"Lab 3"}
            ].map((s,i)=>(
              <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <span className="text-xs font-mono text-gray-400 w-12">{s.t}</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">{s.s}</p>
                  <p className="text-xs text-gray-400">{s.r}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-gray-900 rounded-xl p-5">
            <p className="text-xs font-semibold tracking-widest uppercase text-gray-500 mb-2">Streak</p>
            <p className="text-4xl font-bold text-white">{dashboard?.streak || 0} days</p>
            <p className="text-sm text-gray-400 mt-1">Of full attendance. Personal best.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
