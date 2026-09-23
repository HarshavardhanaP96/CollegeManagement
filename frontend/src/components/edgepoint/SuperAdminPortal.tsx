import React, { useEffect, useState } from 'react';
import { Settings } from 'lucide-react';
import { Badge } from './Badge';
import { TopBar } from './TopBar';
import { SidebarLayout } from './SidebarLayout';
import { NavItem } from './NavItem';
import { SectionLabel } from './SectionLabel';
import { UserFooter } from './UserFooter';
import { Icons } from './Icons';
import { useAuthStore } from '../../store/authStore';
import { getInstitutions, type InstitutionDto } from '../../api/institution';
import { NotificationConfigPanel } from './NotificationConfigPanel';

export function SuperAdminPortal() {
  const { user, logout } = useAuthStore();
  const [institutions, setInstitutions] = useState<InstitutionDto[]>([]);
  const [selectedInstitution, setSelectedInstitution] = useState<InstitutionDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInstitutions = async () => {
      try {
        const response = await getInstitutions();
        if (response.success && response.data) {
          setInstitutions(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch institutions:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchInstitutions();
  }, []);

  const logo = (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
        <div className="w-3 h-3 bg-white rounded-sm" />
      </div>
      <div>
        <p className="text-sm font-bold text-gray-900 leading-none">EdgePoint Platform</p>
        <p className="text-xs text-gray-400">PLATFORM CONSOLE</p>
      </div>
    </div>
  );

  const userDisplayName = user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Operator';
  const userInitials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`;
  const userRole = user?.roles?.[0] || 'SUPERADMIN';

  return (
    <SidebarLayout
      logo={logo}
      nav={
        <>
          <SectionLabel>Platform</SectionLabel>
          <NavItem icon={<Icons.Overview />} label="Overview" active />
          <SectionLabel>Account</SectionLabel>
          <NavItem icon={<Icons.Profile />} label="Profile" />
        </>
      }
      footer={<UserFooter initials={userInitials} name={userDisplayName} sub={userRole} onLogout={logout} />}
    >
      <TopBar breadcrumb={["Platform", selectedInstitution ? `Configure: ${selectedInstitution.name}` : "Executive Overview"]} />
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
        {loading ? (
          <div className="text-center py-10">Loading institutions...</div>
        ) : selectedInstitution ? (
          <NotificationConfigPanel 
            institutionId={selectedInstitution.id} 
            institutionName={selectedInstitution.name} 
            readOnly={false}
            onClose={() => setSelectedInstitution(null)}
          />
        ) : (
          <PlatformConsole institutions={institutions} onSelectInstitution={setSelectedInstitution} />
        )}
      </div>
    </SidebarLayout>
  );
}

function PlatformConsole({ institutions, onSelectInstitution }: { institutions: InstitutionDto[], onSelectInstitution: (inst: InstitutionDto) => void }) {
  const totalStudents = institutions.reduce((sum, i) => sum + (i.students || 0), 0);
  const totalStaff = institutions.reduce((sum, i) => sum + (i.staff || 0), 0);
  const mrr = institutions.reduce((sum, i) => sum + (parseInt(i.plan?.replace(/[^0-9]/g, '') || '0')), 0);

  const sc = (s: string) => s === "Active" ? "green" : s === "Auditing" ? "orange" : s === "Trial" ? "blue" : "gray";
  const pc = (p: string) => p === "Enterprise" ? "dark" : p === "Growth" ? "blue" : "gray";

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-gray-900">Platform Console</h1>
        <div className="flex gap-2">
          <button className="border border-gray-200 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-gray-50">Export</button>
          <button className="bg-gray-900 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-700">Onboard institution</button>
        </div>
      </div>
      <p className="text-sm text-gray-400 mb-6">{institutions.length} institutions · real-time platform health</p>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Active Institutions", value: institutions.length.toString(), change: "+1 this month", positive: true },
          { label: "Total Students", value: totalStudents.toLocaleString(), change: "+2.4%", positive: true },
          { label: "MRR", value: `$${mrr.toLocaleString()}`, change: "+8.2%", positive: true },
          { label: "Uptime · 30D", value: "99.98%", change: "SLA met", positive: true }
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-2">{s.label}</p>
            <p className="text-3xl font-bold text-gray-900">{s.value}</p>
            <p className={`text-sm mt-1 font-medium ${s.positive ? "text-emerald-600" : "text-gray-400"}`}>{s.change}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="col-span-2 bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-900">Platform revenue · last 12 months</h2>
            <select className="border border-gray-100 rounded-lg px-3 py-1.5 text-xs text-gray-600 focus:outline-none">
              <option>USD</option>
            </select>
          </div>
          <div className="h-36 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 mb-2">
            <span>Revenue chart visualization would render here</span>
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            {["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"].map(m => (
              <span key={m}>{m}</span>
            ))}
          </div>
          <div className="flex gap-8 mt-4 pt-4 border-t border-gray-50">
            {[["Trailing 30D", "$268k"], ["YOY Growth", "+38%"], ["Net Retention", "114%"]].map(([l, v]) => (
              <div key={l}>
                <p className="text-xs text-gray-400">{l}</p>
                <p className="text-lg font-bold text-gray-900">{v as string}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Health alerts</h2>
          {[
            { c: "bg-amber-400", t: "Lakeside · audit pending", d: "Tier 2 review window closes in 6 days" },
            { c: "bg-emerald-400", t: "Verdant · onboarding complete", d: "Trial converts in 14 days" },
            { c: "bg-red-400", t: "Cascade · invoice failure", d: "Auto-retry scheduled for tomorrow 02:00" }
          ].map((a, i) => (
            <div key={i} className="flex items-start gap-3 mb-4">
              <div className={`w-2 h-2 rounded-full ${a.c} mt-1.5 flex-shrink-0`} />
              <div>
                <p className="text-sm font-semibold text-gray-900">{a.t}</p>
                <p className="text-xs text-gray-400 mt-0.5">{a.d}</p>
              </div>
            </div>
          ))}
          <div className="mt-4 pt-4 border-t border-gray-50">
            <h3 className="text-xs font-semibold text-gray-700 mb-2">Today's session count</h3>
            <p className="text-3xl font-bold text-gray-900">214 <span className="text-sm font-medium text-emerald-600">+11 vs avg</span></p>
            <div className="mt-2 w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: "82%" }} />
            </div>
            <p className="text-xs text-gray-400 mt-2">82% of sessions confirmed by faculty.</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100">
        <div className="p-5 border-b border-gray-50">
          <h2 className="text-sm font-bold text-gray-900">Institutions</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-50">
              <th className="text-left py-3 px-4 text-xs font-semibold tracking-widest uppercase text-gray-400">Institution</th>
              <th className="text-left py-3 px-4 text-xs font-semibold tracking-widest uppercase text-gray-400">Domain</th>
              <th className="text-left py-3 px-4 text-xs font-semibold tracking-widest uppercase text-gray-400">Plan</th>
              <th className="text-left py-3 px-4 text-xs font-semibold tracking-widest uppercase text-gray-400">Status</th>
              <th className="text-left py-3 px-4 text-xs font-semibold tracking-widest uppercase text-gray-400">Created</th>
            </tr>
          </thead>
          <tbody>
            {institutions.map(inst => (
              <tr key={inst.id} onClick={() => onSelectInstitution(inst)} className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer group">
                <td className="py-3 px-4 font-medium text-gray-900 group-hover:text-blue-600 flex items-center justify-between">
                  {inst.name}
                  <span className="inline-flex items-center gap-1 text-xs text-gray-400 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    Configure <Settings size={12} />
                  </span>
                </td>
                <td className="py-3 px-4 text-xs font-mono text-gray-400">{inst.domain}</td>
                <td className="py-3 px-4">
                  <Badge color={pc(inst.plan || 'Starter')}>{inst.plan || 'Starter'}</Badge>
                </td>
                <td className="py-3 px-4">
                  <Badge color={sc(inst.status)}>{inst.status}</Badge>
                </td>
                <td className="py-3 px-4 text-xs font-mono text-gray-400">
                  {inst.createdAt ? new Date(inst.createdAt).toISOString().split('T')[0] : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}