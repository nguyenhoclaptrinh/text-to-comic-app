/**
 * @file studio-supabase-repository.test.ts
 * @description Unit tests for the Supabase repository adapter.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SupabaseStudioRepository } from "@/lib/studio/supabase-repository";
import type { StudioRepository } from "@/lib/studio/persistence";
import type { StudioSnapshot } from "@/lib/studio/types";

describe("Supabase Studio Repository", () => {
  let mockLocalFallback: StudioRepository;
  let mockSnapshot: StudioSnapshot;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.restoreAllMocks();
    vi.clearAllMocks();

    mockSnapshot = {
      version: 1,
      projects: [],
      activeProjectId: "proj-1",
      activePageId: "page-1",
      characters: [],
      pages: [],
      storyTitle: "Title",
      storyText: "Text",
      selectedPanelId: "panel-1",
      selectedBubbleId: "bubble-1",
    };

    mockLocalFallback = {
      loadSnapshot: vi.fn(async () => mockSnapshot),
      saveSnapshot: vi.fn(async () => {}),
      clearSnapshot: vi.fn(async () => {}),
    };
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("should load snapshot from local fallback immediately", async () => {
    const repository = new SupabaseStudioRepository(mockLocalFallback);
    const data = await repository.loadSnapshot();
    expect(data).toBe(mockSnapshot);
    expect(mockLocalFallback.loadSnapshot).toHaveBeenCalled();
  });

  it("should not sync from cloud if supabase url and anon key are not configured", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const repository = new SupabaseStudioRepository(mockLocalFallback);
    await repository.loadSnapshot();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("should sync from cloud if configured on loadSnapshot", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://mock-supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "mock-key");

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ title: "Mock Project" }],
    });
    vi.stubGlobal("fetch", mockFetch);

    const repository = new SupabaseStudioRepository(mockLocalFallback);
    await repository.loadSnapshot();

    // Run pending timers and flush microtasks to execute syncFromSupabase async
    await vi.runAllTimersAsync();

    expect(mockFetch).toHaveBeenCalledWith(
      "https://mock-supabase.co/rest/v1/projects?select=*,pages(*,panels(*)),characters(*)&order=updated_at.desc&limit=1",
      {
        headers: {
          "Content-Type": "application/json",
          apikey: "mock-key",
          Authorization: "Bearer mock-key",
        },
      },
    );
  });

  it("should log issue but not fail when cloud sync load request returns non-200", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://mock-supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "mock-key");

    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });
    vi.stubGlobal("fetch", mockFetch);

    const repository = new SupabaseStudioRepository(mockLocalFallback);
    const data = await repository.loadSnapshot();
    expect(data).toBe(mockSnapshot);

    await vi.runAllTimersAsync();
    expect(mockFetch).toHaveBeenCalled();
  });

  it("should save to local fallback immediately and not sync if not configured", async () => {
    const repository = new SupabaseStudioRepository(mockLocalFallback);
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    await repository.saveSnapshot(mockSnapshot);
    expect(mockLocalFallback.saveSnapshot).toHaveBeenCalledWith(mockSnapshot);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("should debounce sync to cloud when configured on saveSnapshot", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://mock-supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "mock-key");

    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", mockFetch);

    const repository = new SupabaseStudioRepository(mockLocalFallback);
    await repository.saveSnapshot(mockSnapshot);

    expect(mockLocalFallback.saveSnapshot).toHaveBeenCalledWith(mockSnapshot);
    expect(mockFetch).not.toHaveBeenCalled();

    // Advance time by 1000ms (not yet reaching 1500ms debounce threshold)
    await vi.advanceTimersByTimeAsync(1000);
    expect(mockFetch).not.toHaveBeenCalled();

    // Advance by another 500ms (debounce triggers)
    await vi.advanceTimersByTimeAsync(500);
    expect(mockFetch).toHaveBeenCalledWith("/api/sync-supabase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mockSnapshot),
    });
  });

  it("should cancel previous sync timer and set a new one if saveSnapshot is called rapidly", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://mock-supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "mock-key");

    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", mockFetch);

    const repository = new SupabaseStudioRepository(mockLocalFallback);
    await repository.saveSnapshot(mockSnapshot);

    // Call saveSnapshot again after 1000ms
    await vi.advanceTimersByTimeAsync(1000);
    await repository.saveSnapshot(mockSnapshot);

    // Wait another 1000ms (should not trigger yet because of debounce reset)
    await vi.advanceTimersByTimeAsync(1000);
    expect(mockFetch).not.toHaveBeenCalled();

    // Advance 500ms more (triggers sync)
    await vi.advanceTimersByTimeAsync(500);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("should log error but not crash when syncToSupabase request fails", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://mock-supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "mock-key");

    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
    });
    vi.stubGlobal("fetch", mockFetch);

    const repository = new SupabaseStudioRepository(mockLocalFallback);
    await repository.saveSnapshot(mockSnapshot);
    await vi.runAllTimersAsync();

    expect(mockFetch).toHaveBeenCalled();
  });

  it("should clear snapshot from local fallback", async () => {
    const repository = new SupabaseStudioRepository(mockLocalFallback);
    await repository.clearSnapshot();
    expect(mockLocalFallback.clearSnapshot).toHaveBeenCalled();
  });
});
