export type PersonStatus =
  | { tone: "success"; label: "Active" }
  | { tone: "warning"; label: "Retry" }
  | { tone: "info"; label: string };

export type Person = {
  name: string;
  email: string;
  country: "Nigeria" | "Kenya" | "South Africa" | "Egypt";
  role: string;
  contractor?: boolean;
  salaryUsd: number;
  status: PersonStatus;
};

export const PEOPLE: Person[] = [
  {
    name: "Adaeze Okonkwo",
    email: "adaeze@mavenly.com",
    country: "Nigeria",
    role: "Senior Engineer",
    salaryUsd: 6200,
    status: { tone: "success", label: "Active" },
  },
  {
    name: "Faith Mwangi",
    email: "faith@mavenly.com",
    country: "Kenya",
    role: "Product Designer",
    salaryUsd: 5400,
    status: { tone: "success", label: "Active" },
  },
  {
    name: "Mohamed Hassan",
    email: "mohamed@mavenly.com",
    country: "Egypt",
    role: "Customer Success",
    salaryUsd: 3800,
    status: { tone: "success", label: "Active" },
  },
  {
    name: "Thabo Dlamini",
    email: "thabo@mavenly.com",
    country: "South Africa",
    role: "Data Analyst",
    contractor: true,
    salaryUsd: 4100,
    status: { tone: "warning", label: "Retry" },
  },
  {
    name: "Yusuf Adeyemi",
    email: "yusuf@mavenly.com",
    country: "Nigeria",
    role: "Backend Engineer",
    salaryUsd: 5800,
    status: { tone: "info", label: "Starts Jun 1" },
  },
  {
    name: "Aisha Otieno",
    email: "aisha@mavenly.com",
    country: "Kenya",
    role: "Marketing Lead",
    salaryUsd: 4900,
    status: { tone: "success", label: "Active" },
  },
  {
    name: "Sara Naguib",
    email: "sara@mavenly.com",
    country: "Egypt",
    role: "QA Engineer",
    contractor: true,
    salaryUsd: 3200,
    status: { tone: "success", label: "Active" },
  },
  {
    name: "Lerato Khumalo",
    email: "lerato@mavenly.com",
    country: "South Africa",
    role: "Operations",
    salaryUsd: 4400,
    status: { tone: "success", label: "Active" },
  },
];
