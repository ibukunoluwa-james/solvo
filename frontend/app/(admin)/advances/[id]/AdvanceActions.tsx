"use client";

import { useState } from "react";
import { api, ApiError } from "../../../_lib/api";
import type { Advance } from "../../../_lib/types";

export default function AdvanceActions({
  advance,
  onChanged,
}: {
  advance: Advance;
  onChanged?: () => void;
}) {
  const [busy, setBusy] = useState<"approve" | "reject" | "disburse" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handle = async (action: "approve" | "reject" | "disburse") => {
    setError(null);
    setBusy(action);
    try {
      if (action === "approve") {
        await api.advances.approve(advance.id, {});
      } else if (action === "reject") {
        const note = window.prompt("Reason for rejecting?");
        if (!note) {
          setBusy(null);
          return;
        }
        await api.advances.reject(advance.id, { employer_note: note });
      } else {
        await api.advances.disburse(advance.id);
      }
      onChanged?.();
    } catch (err) {
      setError(
        err instanceof ApiError && typeof err.detail === "string"
          ? err.detail
          : "Action failed"
      );
    } finally {
      setBusy(null);
    }
  };

  if (advance.status === "rejected") {
    return (
      <div className="text-[12px] text-text-tertiary">
        Rejected{advance.employer_note ? `: ${advance.employer_note}` : ""}
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div
          className="text-[11.5px] font-medium mb-3 px-[12px] py-[8px] rounded-[5px]"
          style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b" }}
        >
          {error}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {advance.status === "pending" && (
          <>
            <button
              onClick={() => handle("approve")}
              disabled={busy !== null}
              className="w-full bg-text-primary text-white font-medium rounded-[5px] py-[10px] text-[13px] hover:bg-text-primary/90 transition-colors disabled:opacity-60"
            >
              {busy === "approve" ? "Approving…" : "Approve"}
            </button>
            <button
              onClick={() => handle("reject")}
              disabled={busy !== null}
              className="w-full bg-card text-text-secondary border border-border-strong font-medium rounded-[5px] py-[10px] text-[13px] hover:bg-subtle transition-colors disabled:opacity-60"
            >
              Decline
            </button>
          </>
        )}

        {advance.status === "approved" && (
          <button
            onClick={() => handle("disburse")}
            disabled={busy !== null}
            className="w-full bg-text-primary text-white font-medium rounded-[5px] py-[10px] text-[13px] hover:bg-text-primary/90 transition-colors disabled:opacity-60"
          >
            {busy === "disburse" ? "Disbursing…" : "Disburse via Kora"}
          </button>
        )}

        {advance.status === "disbursed" && (
          <div className="text-[12px] text-success">
            Disbursed {advance.disbursed_at ? new Date(advance.disbursed_at).toLocaleString() : ""}
          </div>
        )}
      </div>
    </div>
  );
}
