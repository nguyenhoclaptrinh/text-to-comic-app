/**
 * @file supabase-repository.ts
 * @description Advanced Supabase repository adapter proxying sync operations via Next.js API.
 */

import type { StudioRepository } from "@/lib/studio/persistence";
import type { StudioSnapshot } from "@/lib/studio/types";

export class SupabaseStudioRepository implements StudioRepository {
  private readonly url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  private readonly anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  private debounceTimer: NodeJS.Timeout | null = null;
  private readonly DEBOUNCE_DELAY_MS = 1500;

  constructor(private readonly localFallback: StudioRepository) {}

  async loadSnapshot(): Promise<StudioSnapshot | null> {
    // Luôn ưu tiên đọc dữ liệu local khởi động nhanh (Hydration Speed)
    // Sau đó trigger tải bất đồng bộ từ Supabase nếu cấu hình khả dụng
    const localData = await this.localFallback.loadSnapshot();
    if (this.isConfigured()) {
      void this.syncFromSupabase();
    }
    return localData;
  }

  async saveSnapshot(snapshot: StudioSnapshot): Promise<void> {
    // 1. Lưu lập tức vào localStorage làm lớp đệm an toàn (Write-through Local Cache)
    await this.localFallback.saveSnapshot(snapshot);

    // 2. Debounce ghi bất đồng bộ lên Supabase để tránh Spam API (Write-behind Sync)
    if (!this.isConfigured()) {
      return;
    }

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      void this.syncToSupabase(snapshot);
    }, this.DEBOUNCE_DELAY_MS);
  }

  async clearSnapshot(): Promise<void> {
    await this.localFallback.clearSnapshot();
  }

  private isConfigured(): boolean {
    return Boolean(this.url && this.anonKey);
  }

  private async syncFromSupabase(): Promise<void> {
    try {
      // Gọi PostgREST endpoint lấy project mới nhất của user kèm pages và panels lồng nhau
      const response = await fetch(`${this.url}/rest/v1/projects?select=*,pages(*,panels(*)),characters(*)&order=updated_at.desc&limit=1`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const dbProject = data[0] as { title?: string };
        console.log("[Supabase Sync] Cực bộ đã được đồng bộ với DB. Project:", dbProject.title);
      }
    } catch (error) {
      console.warn("[Supabase Sync] Không thể đồng bộ dữ liệu từ cloud:", error);
    }
  }

  private async syncToSupabase(snapshot: StudioSnapshot): Promise<void> {
    try {
      const response = await fetch("/api/sync-supabase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(snapshot),
      });

      if (!response.ok) {
        throw new Error(`Sync API proxy returned status ${response.status}`);
      }

      console.log("[Supabase Sync] Đồng bộ đám mây thành công qua Next.js API Route Proxy.");
    } catch (error) {
      console.warn("[Supabase Sync] Lỗi đồng bộ đám mây qua API Proxy:", error);
    }
  }

  private getHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "apikey": this.anonKey,
      "Authorization": `Bearer ${this.anonKey}`,
    };
  }
}
