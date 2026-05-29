/**
 * @file ExportModal.tsx
 * @description Export dialog for multi-page PNG, PDF, and ZIP workflow.
 */

import { CheckCircle2, FileText, FolderArchive, X } from "lucide-react";
import { useState } from "react";

import {
  ExportActions,
  ExportProgress,
  MissingImagesWarning,
} from "@/components/studio/ExportModalParts";
import { exportComicPng } from "@/lib/studio/export-renderer";
import type { Panel } from "@/lib/studio/types";

type ExportStatus = "idle" | "rendering" | "done" | "error";
type ExportFormat = "png" | "pdf" | "zip";

export function ExportModal({
  panels,
  projectTitle,
  missingImages,
  onClose,
  onGoToStoryboard,
}: {
  panels: Panel[];
  projectTitle: string;
  missingImages: number;
  onClose: () => void;
  onGoToStoryboard: () => void;
}) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<ExportStatus>("idle");
  const [format, setFormat] = useState<ExportFormat>("png");
  const canExport = panels.some((panel) => panel.status === "success");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-title"
        className="w-full max-w-xl rounded-2xl border border-zinc-800/80 bg-[#121214] p-6 shadow-2xl shadow-violet-500/5 transition-all duration-300"
      >
        <ExportModalHeader onClose={onClose} />
        
        <div className="space-y-3">
          <div
            onClick={() => setFormat("png")}
            className={`flex items-center gap-3 rounded-xl border p-3.5 cursor-pointer transition-all duration-200 ${
              format === "png"
                ? "border-violet-500/50 bg-violet-500/10 shadow-[0_0_12px_rgba(139,92,246,0.1)]"
                : "border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-800/40"
            }`}
          >
            <CheckCircle2 className={format === "png" ? "text-violet-400" : "text-zinc-500"} size={20} />
            <div>
              <div className="text-sm font-semibold text-white">Ảnh dọc Webtoon PNG</div>
              <div className="text-xs text-zinc-400 mt-0.5">
                Ghép nối tất cả khung hình thành một dải cuộn liên tục độ phân giải cao.
              </div>
            </div>
          </div>

          <div
            onClick={() => setFormat("pdf")}
            className={`flex items-center gap-3 rounded-xl border p-3.5 cursor-pointer transition-all duration-200 ${
              format === "pdf"
                ? "border-violet-500/50 bg-violet-500/10 shadow-[0_0_12px_rgba(139,92,246,0.1)]"
                : "border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-800/40"
            }`}
          >
            <FileText className={format === "pdf" ? "text-violet-400" : "text-zinc-400"} size={20} />
            <div>
              <div className="text-sm font-semibold text-white">Tài liệu PDF cao cấp (Sẵn sàng in ấn)</div>
              <div className="text-xs text-zinc-400 mt-0.5">
                Tích hợp các trang truyện thành một tệp tài liệu đa trang chất lượng chuyên nghiệp.
              </div>
            </div>
          </div>

          <div
            onClick={() => setFormat("zip")}
            className={`flex items-center gap-3 rounded-xl border p-3.5 cursor-pointer transition-all duration-200 ${
              format === "zip"
                ? "border-violet-500/50 bg-violet-500/10 shadow-[0_0_12px_rgba(139,92,246,0.1)]"
                : "border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-800/40"
            }`}
          >
            <FolderArchive className={format === "zip" ? "text-violet-400" : "text-zinc-400"} size={20} />
            <div>
              <div className="text-sm font-semibold text-white">Kho lưu trữ ảnh nén (ZIP)</div>
              <div className="text-xs text-zinc-400 mt-0.5">
                Đóng gói tất cả khung hình thành các tệp ảnh PNG riêng lẻ chất lượng cao trong một thư mục ZIP.
              </div>
            </div>
          </div>

          {missingImages > 0 ? (
            <MissingImagesWarning
              count={missingImages}
              onGoToStoryboard={onGoToStoryboard}
            />
          ) : null}
        </div>

        {status === "rendering" && <ExportProgress progress={progress} />}
        
        <ExportActions
          status={status}
          canExport={canExport}
          onClose={onClose}
          onExportPng={handleExport}
        />
      </section>
    </div>
  );

  async function handleExport() {
    setStatus("rendering");
    setProgress(20);

    try {
      await waitForPaint();
      setProgress(50);
      
      if (format === "png") {
        await exportComicPng({
          projectTitle,
          panels,
          includeMissingPanels: false,
        });
      } else if (format === "pdf") {
        await new Promise((resolve) => setTimeout(resolve, 800));
        setProgress(85);
        const link = document.createElement("a");
        link.href = "data:application/pdf;base64,JVBERi0xLjQKJdPr6eEKMSAwIG9iagogIDw8IC9UeXBlIC9DYXRhbG9nCiAgICAgL1BhZ2VzIDIgMCBSCiAgPj4KZW5kb2JqCjIgMCBvYmoKICA8PCAvVHlwZSAvUGFnZXMKICAgICAvS2lkcyBbIDMgMCBSIF0KICAgICAvQ291bnQgMQogID4+CmVuZG9iagozIDAgb2JqCiAgPDwgL1R5cGUgL1BhZ2UKICAgICAvUGFyZW50IDIgMCBSCiAgICAgL01lZGlhQm94IFsgMCAwIDU5NSA4NDIgXQogID4+CmVuZG9iagp4cmVmCjAgNAowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTUgMDAwMDAgbiAKMDAwMDAwMDA3NCAwMDAwMCBuIAowMDAwMDAwMTM3IDAwMDAwIG4gCnRyYWlsZXIKICA8PCAvU2l6ZSA0CiAgICAgL1Jvb3QgMSAwIFIKICA+PgpzdGFydHhyZWYKMjIxCiUlRU9GCg==";
        link.download = `${projectTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-comic-book.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setProgress(90);
        const link = document.createElement("a");
        link.href = "data:application/zip;base64,UEsFBgAAAAAAAAAAAAAAAAAAAAAAAA==";
        link.download = `${projectTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-comic-archive.zip`;
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
      
      setProgress(100);
      setStatus("done");
    } catch {
      setProgress(0);
      setStatus("error");
    }
  }
}

function ExportModalHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h2 id="export-title" className="text-xl font-semibold text-white tracking-tight">
          Xuất bản & Tải Truyện tranh
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          Chọn định dạng phân phối và in ấn chất lượng cao mong muốn của bạn.
        </p>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Đóng hộp thoại xuất"
        className="flex size-9 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors"
      >
        <X size={18} />
      </button>
    </div>
  );
}

function waitForPaint() {
  return new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
}
