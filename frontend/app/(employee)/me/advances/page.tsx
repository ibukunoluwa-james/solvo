import Header from "../../../_components/Header";
import { UnderConstruction } from "../../../_components/UnderConstruction";

export default function MyAdvancesPage() {
  return (
    <>
      <Header title="Advances" />
      <UnderConstruction
        title="Your advances"
        description="A history of your pay advances and their status is coming here. For now, you can request a new advance from your profile."
        backHref="/advances/request"
        backLabel="Request an advance"
      />
    </>
  );
}