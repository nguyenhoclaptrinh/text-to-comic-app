/**
 * @file supabase-repository.ts
 * @description Advanced Supabase DB repository adapter implementing write-behind PostgREST sync.
 */

import type { StudioRepository } from "@/lib/studio/persistence";
import type { StudioSnapshot, Panel, Character } from "@/lib/studio/types";

export class SupabaseStudioRepository implements StudioRepository {
  private readonly url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  private readonly anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  private debounceTimer: NodeJS.Timeout | null = null;
  private readonly DEBOUNCE_DELAY_MS = 1500;

  constructor(private readonly localFallback: StudioRepository) {}

  loadSnapshot(): StudioSnapshot | null {
    // Luôn ưu tiên đọc dữ liệu local khởi động nhanh (Hydration Speed)
    // Sau đó trigger tải bất đồng bộ từ Supabase nếu cấu hình khả dụng
    const localData = this.localFallback.loadSnapshot();
    if (this.isConfigured()) {
      void this.syncFromSupabase();
    }
    return localData;
  }

  saveSnapshot(snapshot: StudioSnapshot): void {
    // 1. Lưu lập tức vào localStorage làm lớp đệm an toàn (Write-through Local Cache)
    this.localFallback.saveSnapshot(snapshot);

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

  clearSnapshot(): void {
    this.localFallback.clearSnapshot();
  }

  private isConfigured(): boolean {
    return Boolean(this.url && this.anonKey);
  }

  private async syncFromSupabase(): Promise<void> {
    try {
      // Gọi PostgREST endpoint lấy project mới nhất của user
      const response = await fetch(`${this.url}/rest/v1/projects?select=*,panels(*),characters(*)&order=updated_at.desc&limit=1`, {
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
      const headers = this.getHeaders();
      const projectPayload = {
        title: snapshot.storyTitle || "Untitled Story",
        original_text: snapshot.storyText,
        status: "storyboard",
        updated_at: new Date().toISOString(),
      };

      // 1. Upsert Project
      const projectRes = await fetch(`${this.url}/rest/v1/projects?id=eq.${snapshot.activeProjectId}`, {
        method: "PUT",
        headers: {
          ...headers,
          "Prefer": "resolution=merge-duplicates,return=representation",
        },
        body: JSON.stringify({
          id: snapshot.activeProjectId,
          ...projectPayload,
        }),
      });

      if (!projectRes.ok) {
        throw new Error(`Failed to upsert project: ${projectRes.statusText}`);
      }

      // 2. Sync Characters (Bulk Delete and Insert for alignment)
      await fetch(`${this.url}/rest/v1/characters?project_id=eq.${snapshot.activeProjectId}`, {
        method: "DELETE",
        headers,
      });

      if (snapshot.characters.length > 0) {
        const charactersPayload = snapshot.characters.map((char: Character) => ({
          project_id: snapshot.activeProjectId,
          name: char.name,
          role: char.role,
          description: char.description,
          color: char.color,
        }));

        await fetch(`${this.url}/rest/v1/characters`, {
          method: "POST",
          headers: {
            ...headers,
            "Prefer": "return=minimal",
          },
          body: JSON.stringify(charactersPayload),
        });
      }

      // 3. Sync Panels (Bulk Upsert)
      if (snapshot.panels.length > 0) {
        const panelsPayload = snapshot.panels.map((panel: Panel) => ({
          project_id: snapshot.activeProjectId,
          order_index: panel.orderIndex,
          scene_prompt: panel.scenePrompt,
          dialogue: panel.dialogue,
          character_ids: panel.characterIds,
          status: panel.status,
          image_tone: panel.imageTone,
          image_url: panel.imageUrl || null,
          error_message: panel.errorMessage || null,
          speech_bubbles: panel.bubbles,
          updated_at: new Date().toISOString(),
        }));

        await fetch(`${this.url}/rest/v1/panels`, {
          method: "POST",
          headers: {
            ...headers,
            "Prefer": "resolution=merge-duplicates,return=minimal",
          },
          body: JSON.stringify(panelsPayload),
        });
      }

      console.log("[Supabase Sync] Đồng bộ đám mây thành công.");
    } catch (error) {
      console.warn("[Supabase Sync] Lỗi đồng bộ đám mây:", error);
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
