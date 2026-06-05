"use client";

/**
 * Client-side data-fetching hook for the authenticated app screens.
 *
 * The Solvo API client attaches the Bearer token from localStorage, which only
 * exists in the browser — so the screens that need a session fetch on the
 * client through this hook instead of at server-render time. It handles the
 * three states every screen needs (loading / error / data) and bounces to
 * /login when there is no session or the API returns 401.
 */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, apiMode, getAccessToken } from "./api";

type ApiState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
};

export function useApi<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
): ApiState<T> {
  const router = useRouter();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    // Real mode needs a session; skip the round-trip and bounce if absent.
    if (apiMode === "real" && !getAccessToken()) {
      router.replace("/login");
      return;
    }

    let alive = true;

    const load = async () => {
      // Defer past the effect's synchronous pass before touching state.
      await Promise.resolve();
      if (!alive) return;
      setLoading(true);
      setError(null);
      try {
        const result = await fetcher();
        if (alive) setData(result);
      } catch (err) {
        if (!alive) return;
        if (err instanceof ApiError && err.status === 401) {
          router.replace("/login");
          return;
        }
        setError(
          err instanceof ApiError && typeof err.detail === "string"
            ? err.detail
            : "Something went wrong loading this page.",
        );
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  return { data, loading, error, reload };
}

/**
 * Full-area loading / error placeholder, sized to drop straight into the
 * layout's flex column where a page's <Header> + <main> would normally sit.
 */
export function PageStatus({
  loading,
  error,
  onRetry,
}: {
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
}) {
  return (
    <div className="flex-1 flex items-center justify-center p-10">
      {loading ? (
        <div className="flex items-center gap-2 text-text-tertiary">
          <i className="ti ti-loader-2 text-[17px] animate-spin" />
          <span className="text-[13px]">Loading…</span>
        </div>
      ) : (
        <div className="text-center">
          <div className="w-[40px] h-[40px] rounded-full bg-subtle flex items-center justify-center mx-auto mb-[12px]">
            <i className="ti ti-alert-triangle text-[18px] text-warning" />
          </div>
          <div className="text-[13px] text-text-secondary mb-[14px] max-w-[280px]">
            {error ?? "Something went wrong."}
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="text-[12.5px] font-medium text-text-primary border border-border-strong rounded-[6px] px-[14px] py-[7px] hover:bg-subtle transition-colors"
            >
              Try again
            </button>
          )}
        </div>
      )}
    </div>
  );
}
