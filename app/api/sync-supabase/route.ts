/**
 * @file route.ts
 * @description Secure server-side Supabase synchronization proxy endpoint.
 */

import { NextResponse } from "next/server";
import type { StudioSnapshot, Panel, Character } from "@/lib/studio/types";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  
  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { code: "INVALID_PAYLOAD", message: "Snapshot payload is required." },
      { status: 400 },
    );
  }

  const snapshot = body as StudioSnapshot;
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (!url || !anonKey) {
    return NextResponse.json(
      { code: "NOT_CONFIGURED", message: "Supabase connection is not configured on the server." },
      { status: 503 },
    );
  }

  try {
    const headers = {
      "Content-Type": "application/json",
      "apikey": anonKey,
      "Authorization": `Bearer ${anonKey}`,
    };

    const projectPayload = {
      title: snapshot.storyTitle || "Untitled Story",
      original_text: snapshot.storyText,
      status: "storyboard",
      updated_at: new Date().toISOString(),
    };

    // 1. Upsert Project
    const projectRes = await fetch(`${url}/rest/v1/projects?id=eq.${snapshot.activeProjectId}`, {
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

    // 2. Sync Characters (Bulk Delete and Insert)
    await fetch(`${url}/rest/v1/characters?project_id=eq.${snapshot.activeProjectId}`, {
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

      await fetch(`${url}/rest/v1/characters`, {
        method: "POST",
        headers: {
          ...headers,
          "Prefer": "return=minimal",
        },
        body: JSON.stringify(charactersPayload),
      });
    }

    // 3. Sync Pages (Bulk Delete removed pages, then Upsert current ones)
    const pageIds = snapshot.pages.map((page) => page.id);
    if (pageIds.length > 0) {
      await fetch(
        `${url}/rest/v1/pages?project_id=eq.${snapshot.activeProjectId}&id=not.in.(${pageIds.join(",")})`,
        {
          method: "DELETE",
          headers,
        }
      );
    } else {
      await fetch(`${url}/rest/v1/pages?project_id=eq.${snapshot.activeProjectId}`, {
        method: "DELETE",
        headers,
      });
    }

    if (snapshot.pages.length > 0) {
      const pagesPayload = snapshot.pages.map((page) => ({
        id: page.id,
        project_id: snapshot.activeProjectId,
        order_index: page.orderIndex,
        title: page.title,
      }));

      await fetch(`${url}/rest/v1/pages`, {
        method: "POST",
        headers: {
          ...headers,
          "Prefer": "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify(pagesPayload),
      });
    }

    // 4. Sync Panels (Bulk Delete removed panels, then Upsert current ones)
    const allPanels: Panel[] = [];
    const panelsWithPage: Array<Panel & { pageId: string }> = [];
    snapshot.pages.forEach((page) => {
      page.panels.forEach((panel) => {
        allPanels.push(panel);
        panelsWithPage.push({ ...panel, pageId: page.id });
      });
    });

    const panelIds = allPanels.map((panel) => panel.id);
    if (panelIds.length > 0) {
      await fetch(
        `${url}/rest/v1/panels?project_id=eq.${snapshot.activeProjectId}&id=not.in.(${panelIds.join(",")})`,
        {
          method: "DELETE",
          headers,
        }
      );
    } else {
      await fetch(`${url}/rest/v1/panels?project_id=eq.${snapshot.activeProjectId}`, {
        method: "DELETE",
        headers,
      });
    }

    if (panelsWithPage.length > 0) {
      const panelsPayload = panelsWithPage.map((panel) => ({
        id: panel.id,
        project_id: snapshot.activeProjectId,
        page_id: panel.pageId,
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

      const panelsRes = await fetch(`${url}/rest/v1/panels`, {
        method: "POST",
        headers: {
          ...headers,
          "Prefer": "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify(panelsPayload),
      });

      if (!panelsRes.ok) {
        throw new Error(`Failed to sync panels: ${panelsRes.statusText}`);
      }
    }

    return NextResponse.json({ success: true, message: "Sync successful." });
  } catch (error) {
    console.error("[Supabase Server Sync Error]", error);
    const message = error instanceof Error ? error.message : "Failed to synchronize snapshot to Supabase.";
    return NextResponse.json(
      { code: "SYNC_FAILED", message },
      { status: 500 },
    );
  }
}
