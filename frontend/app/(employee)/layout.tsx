import EmployeeSidebar from "../_components/EmployeeSidebar";

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <EmployeeSidebar />
      <div className="flex-1 flex flex-col min-w-0">{children}</div>
    </div>
  );
}
