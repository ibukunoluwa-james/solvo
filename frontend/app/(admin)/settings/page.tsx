import Header from "../../_components/Header";
import { api } from "../../_lib/api";
import SettingsForm from "./SettingsForm";

export default async function SettingsPage() {
  const company = await api.companies.getMe();

  return (
    <>
      <Header
        left={
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-text-tertiary">Settings</span>
            <i className="ti ti-chevron-right text-[11px] text-text-quaternary" />
            <span className="text-[13px] font-medium text-text-primary">Company profile</span>
          </div>
        }
      />

      <main className="flex-1 px-8 pt-7 pb-10 overflow-auto">
        <div className="max-w-[720px]">
          <SettingsForm initial={company} />
        </div>
      </main>
    </>
  );
}
