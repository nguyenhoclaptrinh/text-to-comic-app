/**
 * @file CharacterCastingPanel.tsx
 * @description Editable character casting panel for prompt consistency.
 */

import { Plus, Upload, Trash } from "lucide-react";
import { useState } from "react";

import type { Character } from "@/lib/studio/types";

export function CharacterCastingPanel({
  characters,
  onAddCharacter,
  onUpdateCharacter,
  onDeleteCharacter,
  onGenerateImage,
  className = "",
}: {
  characters: Character[];
  onAddCharacter: () => void;
  onUpdateCharacter: (characterId: string, patch: Partial<Character>) => void;
  onDeleteCharacter?: (characterId: string) => void;
  onGenerateImage?: (characterId: string) => Promise<string | void>;
  className?: string;
}) {
  return (
    <aside
      className={`border-r border-border-main bg-surface p-4 transition-colors duration-200 ${className}`}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-secondary">
          Nhân vật
        </h2>
        <button
          type="button"
          onClick={onAddCharacter}
          aria-label="Thêm nhân vật"
          title="Thêm nhân vật"
          className="flex size-8 items-center justify-center rounded-lg border border-border-main bg-surface-elevated text-text-primary hover:bg-surface transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>
      <div className="space-y-3">
        {characters.map((character) => (
          <CharacterCard
            key={character.id}
            character={character}
            onUpdate={(patch) => onUpdateCharacter(character.id, patch)}
            onDelete={() => onDeleteCharacter?.(character.id)}
            onGenerateImage={onGenerateImage ? () => onGenerateImage(character.id) : undefined}
          />
        ))}
      </div>
    </aside>
  );
}

function CharacterCard({
  character,
  onUpdate,
  onDelete,
  onGenerateImage,
}: {
  character: Character;
  onUpdate: (patch: Partial<Character>) => void;
  onDelete?: () => void;
  onGenerateImage?: () => Promise<string | void>;
}) {
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);

  const handleGenerate = async () => {
    if (!onGenerateImage) return;
    try {
      setLoading(true);
      const result = await onGenerateImage();
      if (typeof result === "string") setAvatarUrl(result);
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
    <article className="rounded-lg border border-border-main bg-surface-elevated p-3 transition-colors duration-200">
      <div className="mb-3 flex items-start gap-3">
        <div className="relative">
          <button
            type="button"
            onClick={() => avatarUrl && setViewerOpen(true)}
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white shadow-sm overflow-hidden"
            style={{ backgroundColor: character.color }}
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={character.name} className="h-full w-full object-cover" />
            ) : (
              character.name.slice(0, 1) || "C"
            )}
          </button>
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <input
            aria-label="Tên nhân vật"
            value={character.name}
            placeholder="Tên nhân vật..."
            onChange={(event) => onUpdate({ name: event.target.value })}
            className="h-8 w-full rounded-md border border-border-main bg-background px-2 text-sm font-semibold text-text-primary focus:border-primary focus:outline-none"
          />
          <div className="flex flex-col gap-2">
            <select
              aria-label="Vai trò nhân vật"
              value={character.role}
              onChange={(e) => onUpdate({ role: e.target.value })}
              className="h-8 rounded-md border border-border-main bg-background px-2 text-sm text-text-primary focus:border-primary focus:outline-none"
            >
              <option value="">Vai trò</option>
              <option value="Vai chính">Vai chính</option>
              <option value="Vai phụ">Vai phụ</option>
              <option value="Phản diện">Phản diện</option>
              <option value="Quần chúng">Quần chúng</option>
            </select>

            <select
              aria-label="Giới tính"
              value={character.gender ?? ""}
              onChange={(e) => onUpdate({ gender: e.target.value as any })}
              className="h-8 rounded-md border border-border-main bg-background px-2 text-sm text-text-primary focus:border-primary focus:outline-none"
            >
              <option value="">Giới tính</option>
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
              <option value="Khác">Khác</option>
            </select>

            <input
              aria-label="Độ ưu tiên"
              type="number"
              value={character.priority ?? ""}
              onChange={(e) =>
                onUpdate({ priority: e.target.value ? Number(e.target.value) : undefined })
              }
              placeholder="Ưu tiên"
              className="h-8 w-28 rounded-md border border-border-main bg-background px-2 text-sm text-text-primary focus:border-primary focus:outline-none"
            />
          </div>
        </div>
        {/* buttons moved below description */}
      </div>
      <textarea
        aria-label="Mô tả ngoại hình nhân vật"
        value={character.description}
        placeholder="Mô tả ngoại hình (vd: Mặc áo khoác đen, tóc ngắn đỏ, đeo kính)..."
        onChange={(event) => onUpdate({ description: event.target.value })}
        className="min-h-20 w-full resize-y rounded-md border border-border-main bg-background p-2 text-xs leading-5 text-text-secondary focus:border-primary focus:outline-none"
      />
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          className="inline-flex h-8 items-center gap-2 rounded-md border border-border-main bg-surface px-3 text-xs text-text-secondary hover:bg-surface-elevated transition-colors"
        >
          <Upload size={13} />
          Ảnh mẫu
        </button>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="inline-flex h-8 items-center gap-2 rounded-md border border-border-main bg-primary/10 px-3 text-xs text-text-primary hover:bg-primary/15 transition-colors"
        >
          {loading ? "Đang tạo..." : "Tạo ảnh"}
        </button>
        {avatarUrl && (
          <button
            type="button"
            onClick={() => setViewerOpen(true)}
            className="inline-flex h-8 items-center gap-2 rounded-md border border-border-main bg-surface px-3 text-xs text-text-secondary hover:bg-surface-elevated transition-colors"
          >
            Xem ảnh
          </button>
        )}
      </div>
      <div className="mt-2 flex justify-center">
        <button
          type="button"
          onClick={() => onDelete?.()}
          aria-label="Xóa nhân vật"
          title="Xóa nhân vật"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border-main bg-surface text-text-danger hover:bg-surface-elevated transition-colors"
        >
          <Trash size={14} />
        </button>
      </div>
    </article>
    {viewerOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setViewerOpen(false)}>
        <div className="max-h-[90vh] max-w-[90vw] p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatarUrl} alt={character.name} className="max-h-[80vh] max-w-[80vw] rounded-md" />
        </div>
      </div>
    )}
    </>
  );
}
