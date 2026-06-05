import Header from "../../_components/Header";
import { UnderConstruction } from "../../_components/UnderConstruction";

export default function ReportsPage() {
  return (
    <>
      <Header title="Reports" />
      <UnderConstruction
        title="Reports"
        description="Exportable payroll, disbursement, and compliance reports are being built. Check back soon to download and schedule them."
        backHref="/overview"
        backLabel="Back to overview"
      />
    </>
  );
}