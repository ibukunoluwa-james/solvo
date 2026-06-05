import Header from "../../_components/Header";
import { UnderConstruction } from "../../_components/UnderConstruction";

export default function WalletsPage() {
  return (
    <>
      <Header title="Wallets" />
      <UnderConstruction
        title="Wallets"
        description="Multi-currency operating balances and funding sources are on the way. Soon you’ll hold and move USD and local currencies from here."
        backHref="/overview"
        backLabel="Back to overview"
      />
    </>
  );
}