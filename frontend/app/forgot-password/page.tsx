import { UnderConstructionScreen } from "../_components/UnderConstruction";

export default function ForgotPasswordPage() {
  return (
    <UnderConstructionScreen
      title="Reset your password"
      description="Password recovery isn’t wired up yet. For now, head back to sign in — or reach out if you’re locked out."
      backHref="/login"
      backLabel="Back to sign in"
    />
  );
}