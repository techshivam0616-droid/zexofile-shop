import { jsPDF } from "jspdf";

export interface VerificationPdfData {
  title: string;
  uid: string;
  email?: string;
  fullName: string;
  username: string;
  mobile: string;
  dob: string;
  idPhotoUrl?: string;
  status: string;
  submittedAt?: number;
  reviewedAt?: number;
  rejectionReason?: string;
  reapplyAfter?: number;
}

const loadImage = (url: string): Promise<HTMLImageElement | null> =>
  new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });

export const downloadVerificationPdf = async (d: VerificationPdfData) => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 40;
  let y = margin;

  doc.setFontSize(18);
  doc.text(d.title, margin, y);
  y += 24;
  doc.setDrawColor(180);
  doc.line(margin, y, 555, y);
  y += 20;

  doc.setFontSize(11);
  const rows: [string, string][] = [
    ["Full name", d.fullName || "-"],
    ["Username", d.username || "-"],
    ["Mobile", d.mobile || "-"],
    ["Date of birth", d.dob || "-"],
    ["Email", d.email || "-"],
    ["UID", d.uid],
    ["Status", d.status],
    ["Submitted", d.submittedAt ? new Date(d.submittedAt).toLocaleString() : "-"],
    ["Reviewed", d.reviewedAt ? new Date(d.reviewedAt).toLocaleString() : "-"],
  ];
  if (d.rejectionReason) rows.push(["Rejection reason", d.rejectionReason]);
  if (d.reapplyAfter) rows.push(["Reapply after", new Date(d.reapplyAfter).toLocaleString()]);

  rows.forEach(([k, v]) => {
    doc.setFont("helvetica", "bold");
    doc.text(k + ":", margin, y);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(String(v), 380);
    doc.text(lines, margin + 130, y);
    y += 16 * Math.max(1, lines.length);
  });

  if (d.idPhotoUrl) {
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.text("ID Card Photo:", margin, y);
    y += 12;
    const img = await loadImage(d.idPhotoUrl);
    if (img) {
      const maxW = 400;
      const ratio = img.height / img.width;
      const w = Math.min(maxW, img.width);
      const h = w * ratio;
      try {
        doc.addImage(img, "JPEG", margin, y, w, h);
      } catch {
        try { doc.addImage(img, "PNG", margin, y, w, h); } catch {}
      }
    } else {
      doc.setFont("helvetica", "normal");
      doc.textWithLink(d.idPhotoUrl, margin, y + 12, { url: d.idPhotoUrl });
    }
  }

  doc.save(`${d.title.replace(/\s+/g, "_")}_${d.username || d.uid}.pdf`);
};
