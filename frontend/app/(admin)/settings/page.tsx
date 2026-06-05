"use client";

import Header from "../../_components/Header";
import { api } from "../../_lib/api";
import { useApi, PageStatus } from "../../_lib/useApi";
import SettingsForm from "./SettingsForm";

export default function SettingsPage() {
  const { data, loading, error, reload } = useApi(() => api.companies.getMe());
  if (!data) return <PageStatus loading={loading} error={error} onRetry={reload} />;

  const company = data;

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
