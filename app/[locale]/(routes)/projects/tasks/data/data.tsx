import {
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  CheckCircledIcon,
  CircleIcon,
  CrossCircledIcon,
  QuestionMarkCircledIcon,
  StopwatchIcon,
} from "@radix-ui/react-icons";

export const labels = [
  {
    value: "bug",
    label: "Bug",
  },
  {
    value: "feature",
    label: "Feature",
  },
  {
    value: "documentation",
    label: "Documentation",
  },
];

export const statuses = [
  {
    value: "ACTIVE",
    label: "Aktif",
    icon: QuestionMarkCircledIcon,
  },
  {
    value: "PENDING",
    label: "Bekliyor",
    icon: CircleIcon,
  },
  {
    value: "COMPLETE",
    label: "Tamamlandı",
    icon: StopwatchIcon,
  },
];

export const priorities = [
  {
    label: "Düşük",
    value: "low",
    icon: ArrowDownIcon,
  },
  {
    label: "Normal",
    value: "normal",
    icon: ArrowRightIcon,
  },
  {
    label: "Orta",
    value: "medium",
    icon: ArrowRightIcon,
  },
  {
    label: "Yüksek",
    value: "high",
    icon: ArrowUpIcon,
  },
  {
    label: "Kritik",
    value: "critical",
    icon: ArrowUpIcon,
  },
];
