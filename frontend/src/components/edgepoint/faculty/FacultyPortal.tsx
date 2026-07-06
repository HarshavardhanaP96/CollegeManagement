import React, { useState } from 'react';
import { Badge } from '../Badge';
import { TopBar } from '../TopBar';
import { SidebarLayout } from '../SidebarLayout';
import { NavItem } from '../NavItem';
import { SectionLabel } from '../SectionLabel';
import { UserFooter } from '../UserFooter';
import { Icons } from '../Icons';
import { FacultyCommandCenter } from './FacultyCommandCenter';
import { FacultyClassDetail } from './FacultyClassDetail';
import { FacultyAttendance } from './FacultyAttendance';
import { FacultyGradebook } from './FacultyGradebook';
import { useAuthStore } from '../../../store/authStore';

export function FacultyPortal() {
  const [active, setActive] = useState("classes");
  const [selectedClass, setSelectedClass] = useState<null | {name: string, code: string, students: number, time: string, room: string}> (null);
  const { user, logout } = useAuthStore();

  const logo = (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center text-white font-bold text-xs">St</div>
      <div>
        <p className="text-sm font-bold text-gray-900 leading-none">St. Jude's University</p>
        <p className="text-xs text-gray-400">MAIN CAMPUS</p>
      </div>
    </div>
  );

  const nav = (
    <>
      <SectionLabel>Faculty Tools</SectionLabel>
      {[
        {id:"classes", label:"My Classes", icon: <Icons.Classes/>},
        {id:"attendance", label:"Attendance Grid", icon: <Icons.Attendance/>},
        {id:"gradebook", label:"Gradebook", icon: <Icons.Gradebook/>}
      ].map(item => (
        <NavItem
          key={item.id}
          {...item}
          active={active===item.id}
          onClick={() => {
            setActive(item.id);
            setSelectedClass(null);
          }}
        />
      ))}
      <SectionLabel>Account</SectionLabel>
      <NavItem icon={<Icons.Profile/>} label="Profile"/>
    </>
  );

  const bc = selectedClass
    ? ["Faculty","My Classes", selectedClass.name]
    : active === "classes"
      ? ["Faculty","My Classes"]
      : active === "attendance"
        ? ["Faculty","Algorithms","Attendance"]
        : ["Faculty","Algorithms · CS-A · Y3","Gradebook"];

  const userDisplayName = user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Faculty Member';
  const userInitials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`;
  const userRole = user?.roles?.[0] || 'TEACHER';

  return (
    <SidebarLayout logo={logo} nav={nav} footer={<UserFooter initials={userInitials} name={userDisplayName} sub={userRole} onLogout={logout}/>}>
      <TopBar breadcrumb={bc}/>
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
        {active === "classes" && !selectedClass && <FacultyCommandCenter onSelect={cls => setSelectedClass(cls)}/>}
        {active === "classes" && selectedClass && <FacultyClassDetail cls={selectedClass} onBack={() => setSelectedClass(null)}/>}
        {active === "attendance" && <FacultyAttendance/>}
        {active === "gradebook" && <FacultyGradebook/>}
      </div>
    </SidebarLayout>
  );
}