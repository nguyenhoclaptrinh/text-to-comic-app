/**
 * @file SettingsModal.tsx
 * @description Modal component to configure user's personal API keys (BYOK).
 */

import { useRef, useState } from "react";
import {
  CheckCircle2,
  Cpu,
  Database,
  Download,
  Key,
  ShieldAlert,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import {
  createStudioBackupPayload,
  parseStudioBackup,
  serializeStudioBackup,
} from "@/lib/studio/backup";
import { STUDIO_STORAGE_KEY } from "@/lib/studio/constants";
import {
  getDefaultAiModelPools,
  getLastAiRoute,
  getProviderStatuses,
  getPublicKaggleEnabled,
  getPublicImageBackendUrl,
} from "@/lib/studio/production-config";
import type { Project } from "@/lib/studio/types";

export function SettingsModal({
  isOpen,
  onClose,
  activeProject,
  onUpdateProjectStyle,
}: {
  isOpen: boolean;
  onClose: () => void;
  activeProject?: Project;
  onUpdateProjectStyle?: (projectId: string, style: string) => void;
}) {
  const [geminiKey, setGeminiKey] = useState(() => {
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      return localStorage.getItem("text-to-comic:gemini-key") || "";
    }
    return "";
  });
  const [hfToken, setHfToken] = useState(() => {
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      return localStorage.getItem("text-to-comic:huggingface-token") || "";
    }
    return "";
  });
  const [projectStyle, setProjectStyle] = useState(
    activeProject?.style || "webtoon",
  );
  const [isSaved, setIsSaved] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );
  const [dataStatus, setDataStatus] = useState<
    "idle" | "exported" | "imported" | "cleared" | "error"
  >("idle");
  const [lastTextRoute] = useState(() =>
    getLastAiRoute(
      typeof window !== "undefined" ? window.localStorage : undefined,
      "text",
    ),
  );
  const [lastImageRoute] = useState(() =>
    getLastAiRoute(
      typeof window !== "undefined" ? window.localStorage : undefined,
      "image",
    ),
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const providerStatuses = getProviderStatuses({
    geminiKey,
    huggingFaceToken: hfToken,
    imageBackendUrl: getPublicImageBackendUrl(),
    kaggleEnabled: getPublicKaggleEnabled(),
  });
  const modelPools = getDefaultAiModelPools();

  const handleSyncCloud = async () => {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return;
    }

    const rawSnapshot = localStorage.getItem(STUDIO_STORAGE_KEY);
    if (!rawSnapshot) {
      alert("Không tìm thấy dữ liệu truyện để đồng bộ!");
      return;
    }

    setIsSyncing(true);
    setSyncStatus("idle");

    try {
      const parsed: unknown = JSON.parse(rawSnapshot);
      const response = await fetch("/api/sync-supabase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });

      if (response.ok) {
        setSyncStatus("success");
      } else {
        setSyncStatus("error");
      }
    } catch (err) {
      console.error("[Supabase Sync] Error:", err);
      setSyncStatus("error");
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus("idle"), 2500);
    }
  };

  if (!isOpen) return null;

  const handleSave = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("text-to-comic:gemini-key", geminiKey.trim());
      localStorage.setItem("text-to-comic:huggingface-token", hfToken.trim());
      if (activeProject && onUpdateProjectStyle) {
        onUpdateProjectStyle(activeProject.id, projectStyle);
      }
      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
        onClose();
      }, 800);
    }
  };

  const handleClear = () => {
    setGeminiKey("");
    setHfToken("");
    if (typeof window !== "undefined") {
      localStorage.removeItem("text-to-comic:gemini-key");
      localStorage.removeItem("text-to-comic:huggingface-token");
    }
  };

  const handleExportBackup = () => {
    if (typeof window === "undefined") {
      return;
    }

    const rawSnapshot = window.localStorage.getItem(STUDIO_STORAGE_KEY);
    if (!rawSnapshot) {
      setDataStatus("error");
      return;
    }

    try {
      const snapshot = JSON.parse(rawSnapshot);
      const backup = serializeStudioBackup(createStudioBackupPayload(snapshot));
      const blob = new Blob([backup], { type: "application/json" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `text-to-comic-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      URL.revokeObjectURL(link.href);
      link.remove();
      setDataStatus("exported");
    } catch {
      setDataStatus("error");
    }
  };

  const handleImportBackup = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || typeof window === "undefined") {
      return;
    }

    try {
      const backup = parseStudioBackup(await file.text());
      window.localStorage.setItem(
        STUDIO_STORAGE_KEY,
        JSON.stringify(backup.snapshot),
      );
      setDataStatus("imported");
      setTimeout(() => window.location.reload(), 600);
    } catch {
      setDataStatus("error");
    } finally {
      event.target.value = "";
    }
  };

  const handleClearLocalData = () => {
    if (typeof window === "undefined") {
      return;
    }

    const confirmed = window.confirm(
      "Xóa dữ liệu truyện đang lưu trên trình duyệt này? API key vẫn được giữ lại.",
    );
    if (!confirmed) {
      return;
    }

    window.localStorage.removeItem(STUDIO_STORAGE_KEY);
    setDataStatus("cleared");
    setTimeout(() => window.location.reload(), 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl transition-all">
        {/* Decorative background gradients */}
        <div className="absolute -left-16 -top-16 h-32 w-32 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />
        <div className="absolute -right-16 -bottom-16 h-32 w-32 rounded-full bg-emerald-600/10 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-900">
          <div className="flex items-center gap-2">
            <Key className="text-violet-400" size={20} />
            <h2 className="text-lg font-bold text-zinc-100">
              Cấu hình API Keys
            </h2>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Warning Alert */}
        <div className="my-4 flex gap-3 rounded-lg border border-violet-500/20 bg-violet-500/5 p-3.5 text-xs text-zinc-400">
          <ShieldAlert className="shrink-0 text-violet-400" size={16} />
          <div>
            <p className="font-semibold text-zinc-300">
              Bảo mật thông tin của bạn
            </p>
            <p className="mt-0.5">
              Key của bạn được lưu cục bộ trong trình duyệt (`localStorage`) và
              chỉ gửi qua headers khi gọi API. Chúng tôi không lưu trữ chúng
              trên máy chủ.
            </p>
          </div>
        </div>

        <div className="mb-5 rounded-lg border border-zinc-900 bg-zinc-950 p-3.5">
          <div className="mb-3 flex items-center gap-2">
            <CheckCircle2 className="text-emerald-400" size={16} />
            <p className="text-xs font-semibold text-zinc-300">
              Trạng thái dịch vụ AI
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-4">
            {providerStatuses.map((provider) => (
              <div
                key={provider.label}
                className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-2.5"
              >
                <div className="text-[11px] font-semibold text-zinc-300">
                  {provider.label}
                </div>
                <div
                  className={`mt-1 text-[11px] ${
                    provider.configured ? "text-emerald-300" : "text-zinc-500"
                  }`}
                >
                  {provider.configured
                    ? provider.source === "local"
                      ? "Đã nhập trong trình duyệt"
                      : "Đã cấu hình bằng môi trường"
                    : "Đang dùng fallback demo"}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-5 rounded-lg border border-zinc-900 bg-zinc-950 p-3.5">
          <div className="mb-3 flex items-center gap-2">
            <Cpu className="text-sky-400" size={16} />
            <p className="text-xs font-semibold text-zinc-300">
              Xoay vòng model AI
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-4">
            {modelPools.map((pool) => (
              <div
                key={pool.label}
                className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-2.5"
              >
                <div className="text-[11px] font-semibold text-zinc-300">
                  {pool.label}
                </div>
                <div className="mt-1 text-[11px] leading-4 text-zinc-500">
                  {pool.models.join(", ")}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-2.5">
              <div className="text-[11px] font-semibold text-zinc-300">
                Phân tích gần nhất
              </div>
              <div className="mt-1 text-[11px] text-zinc-500">
                {lastTextRoute.model
                  ? `${lastTextRoute.provider || "AI"} · ${lastTextRoute.model}`
                  : "Chưa có lần gọi AI trong trình duyệt này"}
              </div>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-2.5">
              <div className="text-[11px] font-semibold text-zinc-300">
                Vẽ ảnh gần nhất
              </div>
              <div className="mt-1 text-[11px] text-zinc-500">
                {lastImageRoute.model || lastImageRoute.provider
                  ? `${lastImageRoute.provider || "AI"} · ${
                      lastImageRoute.model || "fallback demo"
                    }`
                  : "Chưa có lần vẽ ảnh trong trình duyệt này"}
              </div>
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <div>
            <label
              htmlFor="gemini-key-input"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-500"
            >
              Gemini API Key
            </label>
            <input
              id="gemini-key-input"
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="Nhập Gemini API Key..."
              className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3.5 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition focus:border-violet-500/50 focus:bg-zinc-900"
            />
          </div>

          <div>
            <label
              htmlFor="hf-token-input"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-500"
            >
              HuggingFace API Token
            </label>
            <input
              id="hf-token-input"
              type="password"
              value={hfToken}
              onChange={(e) => setHfToken(e.target.value)}
              placeholder="Nhập HuggingFace Token (hf_...)"
              className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3.5 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition focus:border-violet-500/50 focus:bg-zinc-900"
            />
          </div>

          {activeProject ? (
            <div>
              <label
                htmlFor="project-style-input"
                className="block text-xs font-semibold uppercase tracking-wider text-zinc-500"
              >
                Phong cách truyện tranh mặc định
              </label>
              <select
                id="project-style-input"
                value={projectStyle}
                onChange={(e) => setProjectStyle(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3.5 py-2 text-sm text-zinc-200 outline-none transition focus:border-violet-500/50 focus:bg-zinc-900"
              >
                <option value="webtoon">
                  Modern Webtoon (Màu sắc sống động)
                </option>
                <option value="manga">
                  Classic Manga (Đen trắng, nét mực Nhật Bản)
                </option>
                <option value="western">
                  Western Comic (Truyện tranh Mỹ cổ điển)
                </option>
              </select>
            </div>
          ) : null}
        </div>

        <div className="my-5 rounded-lg border border-zinc-900 bg-zinc-950 p-3.5">
          <div className="mb-3 flex items-start gap-2">
            <Database className="mt-0.5 shrink-0 text-violet-400" size={16} />
            <div>
              <p className="text-xs font-semibold text-zinc-300">
                Dữ liệu của bạn
              </p>
              <p className="mt-0.5 text-[11px] leading-5 text-zinc-500">
                Dự án được lưu local-first trên trình duyệt. Hãy tải backup
                trước khi đổi máy, đổi trình duyệt hoặc xóa dữ liệu web.
              </p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleImportBackup}
          />

          <div className="grid gap-2 sm:grid-cols-3">
            <button
              type="button"
              onClick={handleExportBackup}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-xs font-semibold text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
            >
              <Download size={14} />
              Tải backup
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-xs font-semibold text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
            >
              <Upload size={14} />
              Khôi phục
            </button>
            <button
              type="button"
              onClick={handleClearLocalData}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 text-xs font-semibold text-red-200 transition hover:bg-red-500/15"
            >
              <Trash2 size={14} />
              Xóa dữ liệu
            </button>
          </div>

          {dataStatus !== "idle" ? (
            <p
              className={`mt-2 text-[11px] ${
                dataStatus === "error" ? "text-red-300" : "text-emerald-300"
              }`}
              role="status"
            >
              {dataStatus === "exported"
                ? "Đã tải file backup."
                : dataStatus === "imported"
                  ? "Đã khôi phục backup, trang sẽ tải lại."
                  : dataStatus === "cleared"
                    ? "Đã xóa dữ liệu truyện, trang sẽ tải lại."
                    : "Không thể xử lý dữ liệu. Hãy kiểm tra file backup."}
            </p>
          ) : null}
        </div>

        {/* Supabase Cloud Sync Section */}
        <div className="my-5 rounded-lg border border-zinc-900 bg-zinc-950 p-3.5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-zinc-300">
                Đồng bộ Đám mây (Supabase)
              </p>
              <p className="mt-0.5 text-[11px] text-zinc-500">
                Lưu dự án hiện tại lên database cloud.
              </p>
            </div>
            <button
              onClick={handleSyncCloud}
              disabled={isSyncing}
              type="button"
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
                syncStatus === "success"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : syncStatus === "error"
                    ? "border-red-500/30 bg-red-500/10 text-red-400"
                    : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              {isSyncing
                ? "Đang đồng bộ..."
                : syncStatus === "success"
                  ? "Đồng bộ xong!"
                  : syncStatus === "error"
                    ? "Lỗi đồng bộ!"
                    : "Đồng bộ ngay"}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-between gap-3 border-t border-zinc-900 pt-4">
          <button
            onClick={handleClear}
            type="button"
            className="text-xs font-medium text-zinc-500 hover:text-red-400 transition-colors"
          >
            Xóa cấu hình
          </button>
          <div className="flex gap-2.5">
            <button
              onClick={onClose}
              type="button"
              className="rounded-lg border border-zinc-800 bg-transparent px-4 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 transition"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              type="button"
              className="relative overflow-hidden rounded-lg bg-violet-600 px-5 py-2 text-sm font-semibold text-white hover:bg-violet-500 transition active:scale-95 flex items-center gap-1.5"
            >
              {isSaved ? (
                <>
                  <Sparkles size={14} className="animate-bounce" />
                  <span>Đã lưu!</span>
                </>
              ) : (
                <span>Lưu lại</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
