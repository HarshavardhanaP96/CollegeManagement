import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppHeader } from "@/components/app-shell";
import { PageContainer, PageTitle, Panel, Btn, Tag } from "@/components/ui-kit";
import { TableToolbar } from "@/components/table-toolbar";
import { Modal } from "@/components/modal";
import { ASSIGNMENTS, COURSES, STAFF, type Assignment } from "@/lib/mock-data";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/app/admin/assignments")({ component: Assignments });

function Assignments() {
  const [rows, setRows] = useState<Assignment[]>(ASSIGNMENTS);
  const [q, setQ] = useState("");
  const [course, setCourse] = useState("");
  const [year, setYear] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => rows.filter((r) =>
    (course === "" || r.course === course) &&
    (year === "" || r.year === year) &&
    (q === "" || [r.subject, r.staff, r.section].some((v) => v.toLowerCase().includes(q.toLowerCase())))
  ), [rows, q, course, year]);

  return (
    <>
      <AppHeader crumbs={["Registry", "Assignments"]} />
      <PageContainer>
        <PageTitle
          title="Subject & Staff Assignments"
          subtitle="Map subjects to a class & year, and assign the staff who teach them"
          action={<Btn variant="primary" onClick={() => setOpen(true)}>New assignment</Btn>}
        />

        <Panel padded={false}>
          <TableToolbar
            query={q} onQuery={setQ}
            placeholder="Search subject, staff, or section…"
            filters={[
              { label: "Course", value: course, onChange: setCourse, options: COURSES.map((c) => ({ label: c.name, value: c.name })) },
              { label: "Year",   value: year,   onChange: setYear,   options: ["Year 1","Year 2","Year 3","Year 4"].map((y) => ({ label: y, value: y })) },
            ]}
          />
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border bg-secondary/40">
                <th className="px-5 py-3">ID</th>
                <th className="px-3 py-3">Subject</th>
                <th className="px-3 py-3">Course</th>
                <th className="px-3 py-3">Year</th>
                <th className="px-3 py-3">Section</th>
                <th className="px-3 py-3">Assigned staff</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-secondary/30">
                  <td className="px-5 py-3 text-xs font-mono text-muted-foreground">{r.id}</td>
                  <td className="px-3 py-3 text-sm font-medium">{r.subject}</td>
                  <td className="px-3 py-3 text-sm">{r.course}</td>
                  <td className="px-3 py-3"><Tag tone="blue">{r.year}</Tag></td>
                  <td className="px-3 py-3 text-sm">Section {r.section}</td>
                  <td className="px-3 py-3 text-sm">{r.staff}</td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => setRows(rows.filter((x) => x.id !== r.id))}
                      className="size-7 inline-grid place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-destructive">
                      <Trash2 className="size-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-muted-foreground">No assignments match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </Panel>
      </PageContainer>

      <NewAssignmentModal
        open={open} onClose={() => setOpen(false)}
        onCreate={(a) => { setRows([{ ...a, id: `A-${String(rows.length + 1).padStart(2, "0")}` }, ...rows]); setOpen(false); }}
      />
    </>
  );
}

function NewAssignmentModal({ open, onClose, onCreate }: {
  open: boolean; onClose: () => void; onCreate: (a: Omit<Assignment, "id">) => void;
}) {
  const [course, setCourse] = useState(COURSES[0].name);
  const [subject, setSubject] = useState(COURSES[0].subjects[0]);
  const [year, setYear] = useState("Year 1");
  const [section, setSection] = useState("A");
  const [staff, setStaff] = useState(STAFF[0].name);

  const subjectsForCourse = COURSES.find((c) => c.name === course)?.subjects ?? [];

  return (
    <Modal open={open} onClose={onClose} title="New subject assignment"
      footer={<>
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={() => onCreate({ course, subject, year, section, staff })}>Create</Btn>
      </>}>
      <div className="space-y-3">
        <Sel label="Course" value={course} onChange={(v) => { setCourse(v); setSubject(COURSES.find((c) => c.name === v)?.subjects[0] ?? ""); }}
          options={COURSES.map((c) => c.name)} />
        <Sel label="Subject" value={subject} onChange={setSubject} options={subjectsForCourse} />
        <div className="grid grid-cols-2 gap-3">
          <Sel label="Year / Semester" value={year} onChange={setYear} options={["Year 1","Year 2","Year 3","Year 4"]} />
          <Sel label="Section" value={section} onChange={setSection} options={["A","B","C"]} />
        </div>
        <Sel label="Assigned staff" value={staff} onChange={setStaff} options={STAFF.map((s) => s.name)} />
      </div>
    </Modal>
  );
}

function Sel({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="block">
      <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm bg-background ring-1 ring-black/5 rounded-md outline-none focus:ring-ring">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}
