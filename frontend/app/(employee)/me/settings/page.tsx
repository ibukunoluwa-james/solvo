import Header from "../../../_components/Header";
import { UnderConstruction } from "../../../_components/UnderConstruction";

export default function MySettingsPage() {
  return (
    <>
      <Header title="Settings" />
      <UnderConstruction
        title="Settings"
        description="Personal settings — notifications, security, and payout details — are still being built. Check back soon."
        backHref="/me"
        backLabel="Back to my profile"
      />
    </>
  );
}