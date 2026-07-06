import React, { useState } from 'react';
import { Badge } from '../Badge';
import { TopBar } from '../TopBar';
import { SidebarLayout } from '../SidebarLayout';
import { NavItem } from '../NavItem';
import { SectionLabel } from '../SectionLabel';
import { UserFooter } from '../UserFooter';
import { Icons } from '../Icons';
import { StudentToday } from './StudentToday';
import { StudentMarks } from './StudentMarks';
import { StudentExams } from './StudentExams';
import { StudentAnalytics } from './StudentAnalytics';
import { StudentWallet } from './StudentWallet';
import { useAuthStore } from '../../../store/authStore';

export function StudentPortal() {
  const [active, setActive] = useState("today");
  const { user, logout } = useAuthStore();

  const logo = (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
        <div className="w-2.5 h-2.5 bg-white rounded-full"/>
      </div>
      <div>
        <p className="text-sm font-bold text-gray-900 leading-none">St. Jude's University</p>
        <p className="text-xs text-gray-400">MAIN CAMPUS</p>
      </div>
    </div>
  );

  const nav = (
    <>
      <SectionLabel>Student Portal</SectionLabel>
      {[
        {id:"today", label:"Today", icon: <Icons.Today/>},
        {id:"marks", label:"Marks", icon: <Icons.Marks/>},
        {id:"exams", label:"Exam Schedule", icon: <Icons.Assignments/>},
        {id:"analytics", label:"Analytics", icon: <Icons.Analytics/>},
        {id:"wallet", label:"Wallet", icon: <Icons.Wallet/>}
      ].map(item => (
        <NavItem
          key={item.id}
          {...item}
          active={active===item.id}
          onClick={()=>setActive(item.id)}
        />
      ))}
      <SectionLabel>Account</SectionLabel>
      <NavItem icon={<Icons.Profile/>} label="Profile"/>
    </>
  );

  const titles = {
    today: "Today",
    marks: "Marks",
    exams: "Exam Schedule",
    analytics: "Analytics",
    wallet: "Wallet"
  };

  const userDisplayName = user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Student';
  const userInitials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`;
  const userSub = user?.roles?.[0] ? `${user.roles[0]} · Year 3` : 'Year 3';

  return (
    <SidebarLayout
      logo={logo}
      nav={nav}
      footer={<UserFooter initials={userInitials} name={userDisplayName} sub={userSub} onLogout={logout}/>}
    >
      <TopBar breadcrumb={["Portal", titles[active]]}/>
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
        {active==="today" && <StudentToday/>}
        {active==="marks" && <StudentMarks/>}
        {active==="exams" && <StudentExams/>}
        {active==="analytics" && <StudentAnalytics/>}
        {active==="wallet" && <StudentWallet/>}
      </div>
    </SidebarLayout>
  );
}