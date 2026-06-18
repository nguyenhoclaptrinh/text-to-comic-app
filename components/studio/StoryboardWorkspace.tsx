/**
 * @file StoryboardWorkspace.tsx
 * @description Storyboard editing workspace with page selection, character casting and panel cards.
 */

import { useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  FileText,
  MessageCircle,
  Users,
  X,
  Download,
  Wand2,
  Loader2,
} from "lucide-react";

import { CharacterCastingPanel } from "@/components/studio/CharacterCastingPanel";
import { StoryboardPanelCard } from "@/components/studio/StoryboardPanelCard";
import { PageSelector } from "@/components/studio/PageSelector";
import { analyzeStoryToPages } from "@/lib/studio/ai-services";
import type { GenerationSummary } from "@/lib/studio/types";
import type { Character, Page, Panel } from "@/lib/studio/types";

export function StoryboardWorkspace({
  characters,
  pages,
  activePageId,
  panels,
  selectedPanelId,
  onAddCharacter,
  onDeleteCharacter,
  onUpdateCharacter,
  onSelectPage,
  onAddPage,
  onDeletePage,
  onSelectPanel,
  onUpdatePanel,
  onGeneratePanel,
  onDeletePanel,
  onGoToComic,
  onGoToImport,
  onMovePanel,
  outputLanguage = "en",
  onGenerateAll,
  onOpenExport,
  isGeneratingAll = false,
  projectTitle,
  generationSummary,
  projectStyle,
  projectGenre,
  projectAspectRatio,
  onApplyPageStoryboard,
  onGenerateCharacterImage,
}: {
  characters: Character[];
  pages: Page[];
  activePageId: string;
  panels: Panel[];
  selectedPanelId: string;
  onAddCharacter: () => void;
  onDeleteCharacter?: (characterId: string) => void;
  onUpdateCharacter: (characterId: string, patch: Partial<Character>) => void;
  onSelectPage: (pageId: string) => void;
  onAddPage: () => void;
  onDeletePage: (pageId: string) => void;
  onSelectPanel: (panelId: string) => void;
  onUpdatePanel: (panelId: string, patch: Partial<Panel>) => void;
  onGeneratePanel: (panelId: string) => void;
  onDeletePanel: (panelId: string) => void;
  onGoToComic: () => void;
  onGoToImport: () => void;
  onMovePanel: (panelId: string, direction: "up" | "down") => void;
  outputLanguage?: "en" | "vi";
  onGenerateAll?: () => void;
  onOpenExport?: () => void;
  isGeneratingAll?: boolean;
  projectTitle: string;
  generationSummary: GenerationSummary;
  projectStyle?: string;
  projectGenre?: string;
  projectAspectRatio?: string;
  onApplyPageStoryboard?: (
    pageId: string,
    panels: Panel[],
    characters?: Character[],
  ) => void;
  onGenerateCharacterImage?: (characterId: string) => Promise<string | void>;
}) {
  const [isCastingOpen, setIsCastingOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [pageStoryText, setPageStoryText] = useState("");
  const [previewPanels, setPreviewPanels] = useState<Panel[] | null>(null);
  const [previewCharacters, setPreviewCharacters] = useState<Character[]>([]);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [previewError, setPreviewError] = useState("");

  const hasBackendError = panels.some((panel) => panel.status === "error");

  async function handleGeneratePreview() {
    if (!pageStoryText.trim()) return;
    setIsGeneratingPreview(true);
    setPreviewError("");
    try {
      // 1. Gather project metadata
      const styleText = projectStyle || "webtoon";
      const genreText = projectGenre || "Chưa xác định";
      const aspectText = projectAspectRatio || "1:1";

      let finalStoryText = `[Thể loại truyện]: ${genreText}\n[Phong cách vẽ]: ${styleText}\n[Tỉ lệ khung hình]: ${aspectText}\n\n`;

      // 2. Gather characters casting database context
      if (characters && characters.length > 0) {
        const charLines = characters.map((c) => {
          const genderText =
            c.gender === "Nam" ? "Nam" : c.gender === "Nữ" ? "Nữ" : "Khác";
          const roleText = c.role || "Vai phụ";
          const desc =
            c.descriptionDisplayVi ||
            c.descriptionDisplayEn ||
            c.description ||
            "";
          return `- Tên: ${c.name} (${genderText}, Vai trò: ${roleText}). Mô tả ngoại hình: ${desc}`;
        });
        finalStoryText += `[Danh sách nhân vật cố định - Hãy giữ đúng tên và mô tả này khi họ xuất hiện trong phân cảnh mới]:\n${charLines.join("\n")}\n\n`;
      }

      // 3. Gather storyboard timeline context from previous pages
      const activePageIndex = pages.findIndex((p) => p.id === activePageId);
      if (activePageIndex > 0) {
        const prevPages = pages.slice(0, activePageIndex);
        const prevPanelsDescriptions = prevPages
          .flatMap((p) => p.panels)
          .map((p, idx) => {
            const scene = p.scenePromptDisplayVi || p.scenePrompt || "";
            const dial = p.dialogueDisplayVi || p.dialogue || "";
            return `Khung ${idx + 1}: Bối cảnh: "${scene}"${dial ? `, Thoại: "${dial}"` : ""}`;
          })
          .slice(-6); // Take last 6 panels for narrative continuation

        if (prevPanelsDescriptions.length > 0) {
          finalStoryText += `[Diễn biến mạch truyện trước đó - Các khung hình đã diễn ra]:\n${prevPanelsDescriptions.join("\n")}\n\n`;
        }
      }

      // 4. Inject current new page narrative input
      finalStoryText += `[Nội dung cốt truyện mới cần tạo phân cảnh cho trang này]:\n${pageStoryText}`;

      // 5. Inject draft panels editing context if regenerating
      if (previewPanels && previewPanels.length > 0) {
        const existingContext = previewPanels
          .map((p, idx) => {
            const scene = p.scenePromptDisplayVi || p.scenePrompt || "";
            const dial = p.dialogueDisplayVi || p.dialogue || "";
            return `Khung ${idx + 1}: Bối cảnh: "${scene}"${dial ? `, Thoại: "${dial}"` : ""}`;
          })
          .join("\n");
        finalStoryText += `\n\n[Dữ liệu các khung cũ của trang này để tham khảo/chỉnh sửa, hãy giữ tính nhất quán hoặc điều chỉnh theo yêu cầu mới]:\n${existingContext}`;
      }

      const { pages: generatedPages, characters: generatedCharacters } =
        await analyzeStoryToPages({
          storyTitle: projectTitle || "Page Storyboard",
          storyText: finalStoryText,
          outputLanguage: outputLanguage === "vi" ? "vi" : "en",
        });

      if (generatedPages && generatedPages.length > 0) {
        const newPanels = generatedPages[0].panels.map((p) => ({
          ...p,
          style: "inherit" as const,
        }));
        setPreviewPanels(newPanels);
        if (generatedCharacters) {
          setPreviewCharacters(generatedCharacters);
        }
      } else {
        setPreviewError("Không nhận được dữ liệu phân cảnh từ AI.");
      }
    } catch (error) {
      setPreviewError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsGeneratingPreview(false);
    }
  }

  return (
    <div className="relative grid min-h-0 flex-1 grid-cols-1 overflow-hidden transition-colors duration-200 lg:grid-cols-[288px_minmax(0,1fr)]">
      {/* Sidebar Casting nhân vật tĩnh trên màn hình lớn */}
      <CharacterCastingPanel
        characters={characters}
        onAddCharacter={onAddCharacter}
        onUpdateCharacter={onUpdateCharacter}
        onDeleteCharacter={onDeleteCharacter}
        onGenerateImage={onGenerateCharacterImage}
        outputLanguage={outputLanguage}
        className="hidden lg:block"
      />

      {/* Vùng biên tập Storyboard bên phải */}
      <section className="min-w-0 overflow-y-auto px-4 py-5 pb-24 md:pb-8 lg:px-6">
        {hasBackendError ? <ImageBackendAlert /> : null}

        <StoryboardHeader
          projectTitle={projectTitle}
          generationSummary={generationSummary}
          onGoToComic={onGoToComic}
          onOpenCasting={() => setIsCastingOpen(true)}
          onGenerateAll={onGenerateAll}
          onOpenExport={onOpenExport}
          onOpenAiModal={() => setIsAiModalOpen(true)}
          isGeneratingAll={isGeneratingAll}
          isGeneratingPage={isGeneratingPreview}
          style={projectStyle}
          genre={projectGenre}
          aspectRatio={projectAspectRatio}
        />

        <PageSelector
          pages={pages}
          activePageId={activePageId}
          onSelectPage={onSelectPage}
          onAddPage={onAddPage}
          onDeletePage={onDeletePage}
        />

        <div className="space-y-4 pb-8">
          {panels.length > 0 ? (
            panels.map((panel, index) => (
              <StoryboardPanelCard
                key={panel.id}
                panel={panel}
                characters={characters}
                outputLanguage={outputLanguage}
                selected={panel.id === selectedPanelId}
                disabled={isGeneratingAll}
                canDelete={panels.length > 1}
                canMoveUp={index > 0}
                canMoveDown={index < panels.length - 1}
                onSelect={() => onSelectPanel(panel.id)}
                onUpdate={(patch) => onUpdatePanel(panel.id, patch)}
                onGenerate={() => onGeneratePanel(panel.id)}
                onDelete={() => onDeletePanel(panel.id)}
                onMove={(direction) => onMovePanel(panel.id, direction)}
              />
            ))
          ) : (
            <EmptyStoryboardState onGoToImport={onGoToImport} />
          )}
        </div>
      </section>

      {/* Modal nhập truyện chữ để AI tự động phân cảnh cho trang */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div
            className="w-full max-w-4xl rounded-xl border border-border-main bg-surface-elevated p-6 shadow-2xl animate-in scale-in duration-200 flex flex-col max-h-[85vh]"
            role="dialog"
            aria-modal="true"
          >
            <div className="mb-4 flex items-center justify-between border-b border-border-main pb-3 shrink-0">
              <h3 className="text-lg font-semibold text-text-primary">
                Tự động Phân cảnh bằng AI cho Trang này
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsAiModalOpen(false);
                  setPreviewPanels(null);
                  setPreviewError("");
                }}
                className="text-text-secondary hover:text-text-primary transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden flex-1 py-2">
              {/* Cột trái: Nhập truyện chữ */}
              <div className="flex flex-col h-full min-h-0">
                <label className="mb-2 text-sm font-semibold text-text-primary">
                  Nhập cốt truyện chữ cho trang:
                </label>

                {/* Context dự án đã có */}
                <div className="mb-3 rounded-lg border border-border-main/50 bg-surface/30 p-2.5 text-xs text-text-secondary">
                  <div className="font-semibold text-text-primary mb-1">
                    Mạch truyện liên quan:
                  </div>
                  <div className="grid grid-cols-2 gap-1 mb-1.5">
                    <div>
                      <span className="text-zinc-500">Thể loại:</span>{" "}
                      {projectGenre || "Chưa chọn"}
                    </div>
                    <div>
                      <span className="text-zinc-500">Phong cách:</span>{" "}
                      {projectStyle || "webtoon"}
                    </div>
                  </div>
                  {characters && characters.length > 0 && (
                    <div>
                      <span className="text-zinc-500">
                        Nhân vật đã casting ({characters.length}):
                      </span>{" "}
                      <span className="text-text-primary font-medium">
                        {characters.map((c) => c.name).join(", ")}
                      </span>
                    </div>
                  )}
                </div>

                <textarea
                  className="flex-1 w-full min-h-[150px] rounded-lg border border-border-main bg-surface p-3 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  placeholder="Ví dụ: Cậu bé bước vào phòng thí nghiệm bí mật. Có một cỗ máy khổng lồ đang hoạt động. Cậu reo lên: 'Tuyệt quá, cuối cùng mình cũng tìm thấy nó!'..."
                  value={pageStoryText}
                  onChange={(e) => setPageStoryText(e.target.value)}
                />
                <div className="mt-4">
                  <button
                    type="button"
                    disabled={!pageStoryText.trim() || isGeneratingPreview}
                    onClick={handleGeneratePreview}
                    className="w-full inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-violet-650 px-4 text-sm font-semibold text-white hover:bg-violet-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGeneratingPreview ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <Wand2 size={16} />
                    )}
                    {previewPanels
                      ? "Tạo lại phân cảnh khác (Refetch)"
                      : "Tạo phân cảnh"}
                  </button>
                </div>
              </div>

              {/* Cột phải: Xem trước kết quả */}
              <div className="flex flex-col h-full border border-border-main/50 rounded-lg bg-surface/30 p-4 min-h-0">
                <span className="mb-3 text-sm font-semibold text-text-primary block">
                  Xem trước phân cảnh:
                </span>

                <div className="flex-1 overflow-y-auto min-h-0 space-y-3 pr-1">
                  {isGeneratingPreview ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                      <Loader2
                        className="animate-spin text-primary mb-3"
                        size={32}
                      />
                      <p className="text-sm text-text-secondary">
                        AI đang phân cảnh... Vui lòng đợi trong giây lát.
                      </p>
                    </div>
                  ) : previewError ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4 text-red-500">
                      <AlertTriangle className="mb-2" size={28} />
                      <p className="text-sm font-medium">Lỗi tạo phân cảnh</p>
                      <p className="text-xs text-text-secondary mt-1">
                        {previewError}
                      </p>
                    </div>
                  ) : previewPanels ? (
                    previewPanels.map((panel, idx) => (
                      <div
                        key={panel.id}
                        className="border border-border-main bg-surface-elevated/40 rounded-lg p-3 text-xs space-y-2"
                      >
                        <div className="font-semibold text-primary flex items-center justify-between">
                          <span>Khung {idx + 1}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-elevated text-text-secondary">
                            Tone:{" "}
                            {panel.imageTone.replace("from-", "").split(" ")[0]}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
                            Bối cảnh (Vẽ tranh)
                          </label>
                          <textarea
                            value={
                              panel.scenePromptDisplayVi ||
                              panel.scenePrompt ||
                              ""
                            }
                            onChange={(e) => {
                              const val = e.target.value;
                              setPreviewPanels((prev) =>
                                prev
                                  ? prev.map((p) =>
                                      p.id === panel.id
                                        ? {
                                            ...p,
                                            scenePrompt: val,
                                            scenePromptDisplayVi: val,
                                            scenePromptDisplayEn: val,
                                          }
                                        : p,
                                    )
                                  : null,
                              );
                            }}
                            className="w-full bg-background border border-border-main rounded p-1.5 text-xs text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-y"
                            rows={2}
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
                            Lời thoại
                          </label>
                          <textarea
                            value={
                              panel.dialogueDisplayVi || panel.dialogue || ""
                            }
                            onChange={(e) => {
                              const val = e.target.value;
                              setPreviewPanels((prev) =>
                                prev
                                  ? prev.map((p) =>
                                      p.id === panel.id
                                        ? {
                                            ...p,
                                            dialogue: val,
                                            dialogueDisplayVi: val,
                                            dialogueDisplayEn: val,
                                          }
                                        : p,
                                    )
                                  : null,
                              );
                            }}
                            className="w-full bg-background border border-border-main rounded p-1.5 text-xs text-violet-700 dark:text-violet-300 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-y"
                            rows={1}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4 text-text-muted">
                      <FileText className="mb-2 opacity-50" size={32} />
                      <p className="text-xs">Chưa có phân cảnh nào được tạo.</p>
                      <p className="text-[10px] text-text-secondary mt-1">
                        Hãy nhập nội dung bên trái rồi bấm nút tạo phân cảnh.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-3 border-t border-border-main pt-4 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsAiModalOpen(false);
                  setPreviewPanels(null);
                  setPreviewError("");
                }}
                className="h-10 rounded-lg border border-border-main px-4 text-sm font-medium text-text-primary hover:bg-surface transition"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={!previewPanels || isGeneratingPreview}
                onClick={() => {
                  if (onApplyPageStoryboard && previewPanels) {
                    onApplyPageStoryboard(
                      activePageId,
                      previewPanels,
                      previewCharacters,
                    );
                    setIsAiModalOpen(false);
                    setPreviewPanels(null);
                    setPageStoryText("");
                  }
                }}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-emerald-950 px-5 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <BadgeCheck size={16} />
                Áp dụng lên trang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* RESPONSIVE UI: LEFT SLIDE DRAWER FOR CHARACTER CASTING         */}
      {/* ============================================================== */}

      {/* Slide-out Drawer cho Casting Panel trên di động (< 1024px) */}
      {isCastingOpen && (
        <div className="fixed inset-0 z-40 flex animate-in fade-in bg-black/60 backdrop-blur-sm duration-200 lg:hidden">
          <div
            className="relative flex h-full w-[288px] flex-col border-r border-border-main bg-surface-elevated p-4 shadow-2xl animate-in slide-in-from-left duration-300"
            role="dialog"
            aria-modal="true"
            aria-label="Casting nhân vật"
          >
            <div className="mb-4 flex items-center justify-between border-b border-border-main pb-3">
              <span className="inline-flex items-center gap-2 font-semibold text-text-primary">
                <Users size={16} />
                Casting Nhân vật
              </span>
              <button
                type="button"
                onClick={() => setIsCastingOpen(false)}
                aria-label="Đóng bảng nhân vật"
                className="rounded-lg p-1 text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <CharacterCastingPanel
                characters={characters}
                onAddCharacter={onAddCharacter}
                onUpdateCharacter={onUpdateCharacter}
                onDeleteCharacter={onDeleteCharacter}
                onGenerateImage={onGenerateCharacterImage}
                outputLanguage={outputLanguage}
                className="border-none bg-transparent p-0"
              />
            </div>
          </div>
          <div className="flex-1" onClick={() => setIsCastingOpen(false)} />
        </div>
      )}
    </div>
  );
}

function EmptyStoryboardState({ onGoToImport }: { onGoToImport: () => void }) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-lg border border-dashed border-border-main bg-surface/40 px-5 py-10 text-center">
      <div className="flex size-12 items-center justify-center rounded-lg bg-primary/15 text-primary">
        <FileText size={22} />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-text-primary">
        Chưa có storyboard
      </h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-text-secondary">
        Quay lại Dashboard để tạo dự án từ truyện chữ trước khi vẽ ảnh và xuất
        webtoon.
      </p>
      <button
        type="button"
        onClick={onGoToImport}
        className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
      >
        <FileText size={16} />
        Về Dashboard
      </button>
    </div>
  );
}

function ImageBackendAlert() {
  return (
    <div
      className="mb-4 flex items-start gap-3 rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-650 dark:text-red-100"
      role="alert"
    >
      <AlertTriangle className="mt-0.5 shrink-0" size={17} />
      <div>
        <div className="font-semibold">Hệ thống vẽ ảnh cần lưu ý</div>
        <div className="mt-1 text-red-750 dark:text-red-100/80">
          Các khung hình bị lỗi vẫn giữ nguyên mô tả và lời thoại. Nếu backend
          ảnh offline, bạn có thể thử lại hoặc dùng ảnh fallback demo để tiếp
          tục chỉnh truyện và export phần đã có.
        </div>
      </div>
    </div>
  );
}

function StoryboardHeader({
  projectTitle,
  generationSummary,
  onGoToComic,
  onOpenCasting,
  onGenerateAll,
  onOpenExport,
  onOpenAiModal,
  isGeneratingAll,
  isGeneratingPage,
  style,
  genre,
  aspectRatio,
}: {
  projectTitle: string;
  generationSummary: GenerationSummary;
  onGoToComic: () => void;
  onOpenCasting: () => void;
  onGenerateAll?: () => void;
  onOpenExport?: () => void;
  onOpenAiModal?: () => void;
  isGeneratingAll?: boolean;
  isGeneratingPage?: boolean;
  style?: string;
  genre?: string;
  aspectRatio?: string;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      {/* Left: Project title + generation badges */}
      <div className="order-1 mb-2 md:order-1 md:mb-0 md:w-1/2">
        <div className="flex flex-col items-start md:items-start">
          <h1 className="text-xl font-semibold text-text-primary">
            {projectTitle}
          </h1>
          <div className="mt-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border-main bg-surface-elevated px-2.5 py-0.5 text-[10px] font-semibold text-text-secondary shadow-[0_1px_2px_rgba(0,0,0,0.15)]">
              Đã vẽ {generationSummary.done}/{generationSummary.total} khung
              hình
            </span>
            {generationSummary.errors > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-red-400/30 bg-red-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-red-500 dark:text-red-300">
                {generationSummary.errors} khung hình lỗi cần vẽ lại
              </span>
            ) : null}
          </div>
        </div>
        <div className="mt-1 flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenCasting}
            className="inline-flex h-7 items-center gap-1.5 rounded-full bg-primary/20 px-2.5 text-xs font-medium text-primary transition-colors hover:bg-primary/30 lg:hidden"
          >
            <Users size={12} />
            <span>Nhân vật</span>
          </button>
        </div>
      </div>

      {/* Right: Actions + below them project meta */}
      <div className="order-2 md:order-2 md:w-1/2">
        <div className="flex justify-end items-center gap-3">
          <button
            type="button"
            onClick={onOpenAiModal}
            disabled={isGeneratingAll || isGeneratingPage}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 text-sm font-semibold text-violet-700 dark:text-violet-200 transition hover:bg-violet-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isGeneratingPage ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Wand2 size={16} className="text-violet-600 dark:text-violet-400" />
            )}
            Phân cảnh AI
          </button>

          <button
            type="button"
            onClick={onGenerateAll}
            disabled={isGeneratingAll || isGeneratingPage}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-500 px-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isGeneratingAll ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Wand2 size={16} />
            )}
            Vẽ tất cả
          </button>
          <button
            type="button"
            onClick={onGoToComic}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border-main bg-surface-elevated px-4 text-sm font-semibold text-text-primary transition-colors hover:bg-surface"
          >
            <MessageCircle size={16} />
            Chỉnh lời thoại trên ảnh
          </button>
        </div>

        <div className="mt-3 flex justify-end flex-wrap items-center gap-2">
          <div className="rounded-md border border-border-main bg-surface px-2 py-1 text-xs text-text-secondary">
            Phong cách: {style ?? "webtoon"}
          </div>
          <div className="rounded-md border border-border-main bg-surface px-2 py-1 text-xs text-text-secondary">
            Thể loại: {genre ?? "Chưa chọn"}
          </div>
          <div className="rounded-md border border-border-main bg-surface px-2 py-1 text-xs text-text-secondary">
            Tỉ lệ: {aspectRatio ?? "1:1"}
          </div>
        </div>
      </div>
    </div>
  );
}
