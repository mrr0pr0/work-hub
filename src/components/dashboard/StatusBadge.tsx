type Tone = "green" | "yellow" | "red" | "gray" | "blue";

function toneToClasses(tone: Tone) {
  switch (tone) {
    case "green":
      return "bg-emerald-500/10 text-emerald-200 border-emerald-500/30";
    case "yellow":
      return "bg-amber-500/10 text-amber-200 border-amber-500/30";
    case "red":
      return "bg-red-500/10 text-red-200 border-red-500/30";
    case "blue":
      return "bg-sky-500/10 text-sky-200 border-sky-500/30";
    case "gray":
    default:
      return "bg-zinc-500/10 text-zinc-300 border-zinc-500/30";
  }
}

export function StatusBadge({ label, tone }: { label: string; tone: Tone }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${toneToClasses(
        tone
      )}`}
    >
      {label}
    </span>
  );
}

export function projectStatusTone(status: string): Tone {
  if (status === "Done") return "green";
  if (status === "In Progress") return "yellow";
  if (status === "Review") return "yellow";
  if (status === "Archived") return "gray";
  return "gray";
}

export function clientStatusTone(status: string): Tone {
  if (status === "Active") return "green";
  if (status === "Paused") return "yellow";
  if (status === "Completed") return "gray";
  return "gray";
}

export function paymentStatusTone(status: string): Tone {
  if (status === "Paid") return "green";
  if (status === "Pending") return "yellow";
  if (status === "Invoiced") return "blue";
  return "gray";
}

export function bugSeverityTone(severity: string): Tone {
  if (severity === "Critical") return "red";
  if (severity === "Major") return "yellow";
  if (severity === "Minor") return "gray";
  return "gray";
}

export function bugLocalStatusTone(status: string): Tone {
  if (status === "Resolved") return "green";
  if (status === "In Progress") return "yellow";
  if (status === "Open") return "red";
  return "gray";
}

