import { Plus, Trash, Save } from "lucide-react";
import { useState, useEffect } from "react";

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
            onGenerateImage={
              onGenerateImage ? () => onGenerateImage(character.id) : undefined
            }
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

  // Local draft states
  const [name, setName] = useState(character.name);
  const [role, setRole] = useState(character.role);
  const [gender, setGender] = useState(character.gender ?? "");
  const [priority, setPriority] = useState(character.priority ?? "");
  const [description, setDescription] = useState(character.description);

  // Sync internal state when character prop changes
  useEffect(() => {
    setName(character.name);
    setRole(character.role);
    setGender(character.gender ?? "");
    setPriority(character.priority ?? "");
    setDescription(character.description);
  }, [character]);

  const isDirty =
    name !== character.name ||
    role !== character.role ||
    gender !== (character.gender ?? "") ||
    String(priority) !== String(character.priority ?? "") ||
    description !== character.description;

  const handleSave = () => {
    onUpdate({
      name,
      role,
      gender: isCharacterGender(gender) ? gender : undefined,
      priority: priority !== "" ? Number(priority) : undefined,
      description,
    });
  };

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
                <img
                  src={avatarUrl}
                  alt={name}
                  className="h-full w-full object-cover"
                />
              ) : (
                name.slice(0, 1) || "C"
              )}
            </button>
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <input
              aria-label="Tên nhân vật"
              value={name}
              placeholder="Tên nhân vật..."
              onChange={(event) => setName(event.target.value)}
              className="h-8 w-full rounded-md border border-border-main bg-background px-2 text-sm font-semibold text-text-primary focus:border-primary focus:outline-none"
            />
            <div className="flex flex-col gap-2">
              <select
                aria-label="Vai trò nhân vật"
                value={role}
                onChange={(e) => setRole(e.target.value)}
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
                value={gender}
                onChange={(e) => setGender(e.target.value)}
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
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                placeholder="Ưu tiên"
                className="h-8 w-28 rounded-md border border-border-main bg-background px-2 text-sm text-text-primary focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        </div>
        <textarea
          aria-label="Mô tả ngoại hình nhân vật"
          value={description}
          placeholder="Mô tả ngoại hình (vd: Mặc áo khoác đen, tóc ngắn đỏ, đeo kính)..."
          onChange={(event) => setDescription(event.target.value)}
          className="min-h-20 w-full resize-y rounded-md border border-border-main bg-background p-2 text-xs leading-5 text-text-secondary focus:border-primary focus:outline-none"
        />
        {onGenerateImage || avatarUrl ? (
          <div className="mt-3 flex items-center gap-2">
            {onGenerateImage ? (
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="inline-flex h-8 items-center gap-2 rounded-md border border-border-main bg-primary/10 px-3 text-xs text-text-primary transition-colors hover:bg-primary/15"
              >
                {loading ? "Đang tạo..." : "Tạo ảnh"}
              </button>
            ) : null}
            {avatarUrl ? (
              <button
                type="button"
                onClick={() => setViewerOpen(true)}
                className="inline-flex h-8 items-center gap-2 rounded-md border border-border-main bg-surface px-3 text-xs text-text-secondary transition-colors hover:bg-surface-elevated"
              >
                Xem ảnh
              </button>
            ) : null}
          </div>
        ) : null}
        
        {/* Save and Delete actions */}
        <div className="mt-3 flex items-center gap-2 border-t border-border-main/50 pt-2.5">
          <button
            type="button"
            onClick={() => onDelete?.()}
            aria-label="Xóa nhân vật"
            title="Xóa nhân vật"
            className="flex-1 inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-red-500/25 bg-red-500/10 text-xs font-semibold text-red-400 transition hover:border-red-500/50 hover:bg-red-500/20 hover:text-red-300 cursor-pointer"
          >
            <Trash size={13} />
            Xóa
          </button>
          
          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty}
            aria-label="Lưu nhân vật"
            title="Lưu nhân vật"
            className="flex-1 inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-violet-600 text-xs font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer animate-in fade-in"
          >
            <Save size={13} />
            Lưu
          </button>
        </div>
      </article>
      {viewerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setViewerOpen(false)}
        >
          <div className="max-h-[90vh] max-w-[90vw] p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatarUrl}
              alt={character.name}
              className="max-h-[80vh] max-w-[80vw] rounded-md"
            />
          </div>
        </div>
      )}
    </>
  );
}

function isCharacterGender(value: string): value is "Nam" | "Nữ" | "Khác" {
  return value === "Nam" || value === "Nữ" || value === "Khác";
}
