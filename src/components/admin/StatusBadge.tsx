import { Badge } from "@/components/ui/badge";
import { statusLabel } from "@/constants/fortbildung";

const VARIANTE: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  VEROEFFENTLICHT: "default",
  ENTWURF: "secondary",
  ABGESAGT: "destructive",
  ARCHIVIERT: "outline",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={VARIANTE[status] ?? "outline"} className="whitespace-nowrap">
      {statusLabel(status)}
    </Badge>
  );
}
