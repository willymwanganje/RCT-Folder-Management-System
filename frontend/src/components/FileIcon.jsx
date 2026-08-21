const MAP = {
  pdf: "PDF",
  doc: "DOC",
  docx: "DOC",
  xls: "XLS",
  xlsx: "XLS",
  ppt: "PPT",
  pptx: "PPT",
  txt: "TXT",
  csv: "CSV",
  jpg: "IMG",
  jpeg: "IMG",
  png: "IMG",
};

export default function FileIcon({ type }) {
  const label = MAP[(type || "").toLowerCase()] || "FILE";
  return <span className={`file-icon file-${label.toLowerCase()}`}>{label}</span>;
}
