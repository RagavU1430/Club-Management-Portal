import * as XLSX from "xlsx";
import { apiFetch } from "./api";

interface ExportEvent {
  id: number | string;
  title: string;
  date?: string;
  venue?: string;
}

export function exportRegistrationsToExcel(event: ExportEvent, registrations: any[]) {
  const formattedRows = registrations.map((r) => {
    let formattedDate = "";
    if (r.created_at) {
      try {
        formattedDate = new Date(r.created_at).toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        });
      } catch {
        formattedDate = r.created_at || "";
      }
    }

    return {
      "Registration ID": r.registrationCode || `AIF-${event.id}-${r.id}`,
      "Team Name": r.team_name || "",
      "Member 1 (Lead)": r.member1 || r.name || "",
      "Lead Email": r.email || "",
      "Member 2": r.member2 || "",
      "Member 2 Email / Phone": r.member2_phone || r.member2Phone || "",
      "Department": r.department || r.college || "",
      "Year of Study": r.year || "",
      "Notes / Requirements": r.notes || "",
      "Registered At": formattedDate,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(formattedRows);

  worksheet["!cols"] = [
    { wch: 18 }, // Registration ID
    { wch: 22 }, // Team Name
    { wch: 24 }, // Member 1
    { wch: 30 }, // Lead Email
    { wch: 24 }, // Member 2
    { wch: 30 }, // Member 2 Email
    { wch: 36 }, // Department
    { wch: 20 }, // Year
    { wch: 30 }, // Notes
    { wch: 24 }, // Registered At
  ];

  const workbook = XLSX.utils.book_new();
  const safeSheetName = (event.title || "Registrations").replace(/[:\\/?*\[\]]/g, "-").slice(0, 31);
  XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);

  const safeTitle = (event.title || "Event").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 30);
  const filename = `${safeTitle}_Registrations_${new Date().toISOString().slice(0, 10)}.xlsx`;

  XLSX.writeFile(workbook, filename);
}

export async function fetchAndExportRegistrations(event: ExportEvent) {
  try {
    const token = localStorage.getItem("aif_token");
    const res = await apiFetch(`/api/events/${event.id}/registrations`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const d = await res.json();
    const list = Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : [];
    exportRegistrationsToExcel(event, list);
  } catch (err: any) {
    console.error("[Export Error]", err);
    alert(`Failed to export registrations: ${err?.message || "Unknown error"}`);
  }
}

export function exportAttendanceToExcel(event: ExportEvent, attendanceList: any[]) {
  const rows = attendanceList.map((r, index) => {
    let formattedCheckIn = "";
    if (r.checked_in_at) {
      try {
        formattedCheckIn = new Date(r.checked_in_at).toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        });
      } catch {
        formattedCheckIn = r.checked_in_at;
      }
    }

    return {
      "S.No": index + 1,
      "Registration ID": r.registrationCode || `AIF-${event.id}-${r.id}`,
      "Team Name": r.team_name || "",
      "Member 1 (Lead)": r.member1 || r.name || "",
      "Lead Email": r.email || "",
      "Member 2": r.member2 || "",
      "Member 2 Contact": r.member2_phone || r.member2Phone || "",
      "Department": r.department || r.college || "",
      "Year": r.year || "",
      "Attendance Status": r.attended === 1 || r.attended === true ? "Present" : "Absent",
      "Check-In Time": formattedCheckIn,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet["!cols"] = [
    { wch: 8 },  // S.No
    { wch: 18 }, // Registration ID
    { wch: 22 }, // Team Name
    { wch: 24 }, // Member 1
    { wch: 30 }, // Email
    { wch: 24 }, // Member 2
    { wch: 28 }, // Member 2 Contact
    { wch: 32 }, // Department
    { wch: 14 }, // Year
    { wch: 20 }, // Status
    { wch: 24 }, // Check-In Time
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

  const safeTitle = (event.title || "Event").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 30);
  const filename = `${safeTitle}_Attendance_${new Date().toISOString().slice(0, 10)}.xlsx`;

  XLSX.writeFile(workbook, filename);
}

export function exportODListToExcel(event: ExportEvent, attendanceList: any[]) {
  const presentList = attendanceList.filter((r) => r.attended === 1 || r.attended === true);

  const rows: any[] = [];
  let sNo = 1;

  presentList.forEach((r) => {
    // Lead / Member 1
    rows.push({
      "S.No": sNo++,
      "Registration ID": r.registrationCode || `AIF-${event.id}-${r.id}`,
      "Team Name": r.team_name || "",
      "Participant Name": r.member1 || r.name || "",
      "Role": "Lead / Member 1",
      "Email": r.email || "",
      "Department": r.department || r.college || "",
      "Year": r.year || "",
      "Event Title": event.title || "",
      "Event Date": event.date || "",
    });

    // Member 2 (if registered)
    if (r.member2 && String(r.member2).trim()) {
      rows.push({
        "S.No": sNo++,
        "Registration ID": r.registrationCode || `AIF-${event.id}-${r.id}`,
        "Team Name": r.team_name || "",
        "Participant Name": r.member2,
        "Role": "Member 2",
        "Email": r.member2_phone || r.member2Phone || "",
        "Department": r.department || r.college || "",
        "Year": r.year || "",
        "Event Title": event.title || "",
        "Event Date": event.date || "",
      });
    }
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet["!cols"] = [
    { wch: 8 },  // S.No
    { wch: 18 }, // Registration ID
    { wch: 22 }, // Team Name
    { wch: 24 }, // Participant Name
    { wch: 18 }, // Role
    { wch: 30 }, // Email
    { wch: 32 }, // Department
    { wch: 14 }, // Year
    { wch: 28 }, // Event Title
    { wch: 20 }, // Event Date
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "OD_List");

  const safeTitle = (event.title || "Event").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 30);
  const filename = `${safeTitle}_OD_List_${new Date().toISOString().slice(0, 10)}.xlsx`;

  XLSX.writeFile(workbook, filename);
}
