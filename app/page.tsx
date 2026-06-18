"use client";

/**
 * @file page.tsx
 * @description Bright, modern, high-contrast light theme landing page for ComicCraft Studio.
 * Includes interactive slides presented in a modal popup overlay to avoid scroll conflicts.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Layers,
  Cpu,
  ShieldCheck,
  BookOpen,
  GitBranch,
  X,
  Volume2,
  RotateCcw,
} from "lucide-react";

type Slide = {
  title: string;
  subtitle: string;
  theme: string;
  icon: React.ReactNode;
  description: string;
  bullets: string[];
  visualType: "flow" | "architecture" | "persistence" | "resilience" | "qa" | "roadmap";
};

export default function LandingPage() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [showSlides, setShowSlides] = useState(false);

  // Set mounted state on client to avoid hydration mismatch
  useEffect(() => {
    let active = true;
    const handle = requestAnimationFrame(() => {
      if (active) setMounted(true);
    });
    return () => {
      active = false;
      cancelAnimationFrame(handle);
    };
  }, []);

  // Lock body scroll when slide popup is open
  useEffect(() => {
    if (showSlides) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showSlides]);

  const slides: Slide[] = [
    {
      title: "Sứ mệnh & Quy trình Cốt lõi",
      subtitle: "Slide 1: Product Vision & Workflow",
      theme: "Sáng tác truyện tranh không cần kỹ năng vẽ",
      icon: <BookOpen className="text-violet-600" size={20} />,
      description: "Thay thế quy trình tự động hóa cứng nhắc bằng một hệ thống cộng tác thông minh từng bước. Người dùng giữ quyền kiểm soát cao nhất đối với kết quả nghệ thuật.",
      bullets: [
        "Chuyển đổi truyện chữ thành Kịch bản phân cảnh (Storyboard) tự động bằng AI.",
        "Quy trình 4 bước khép kín: Nhập truyện ➔ Phân cảnh ➔ Vẽ tranh ➔ Thêm thoại ➔ Xuất bản.",
        "Chỉnh sửa tự do ở mọi điểm chạm trước khi tiến hành vẽ ảnh."
      ],
      visualType: "flow",
    },
    {
      title: "Kiến trúc AI Kiểm soát được",
      subtitle: "Slide 2: Controllable AI Architecture",
      theme: "BYOK & Tối ưu hóa phản hồi của mô hình",
      icon: <Cpu className="text-indigo-600" size={20} />,
      description: "Tận dụng API mô hình ngôn ngữ lớn (Gemini) để tạo cấu trúc phân cảnh JSON hợp lệ (được validate chặt chẽ bởi thư viện Zod) cùng cơ chế casting đồng bộ nhân vật.",
      bullets: [
        "BYOK (Bring Your Own Key) cho cả Gemini (nhập thoại) và HuggingFace (vẽ tranh).",
        "Character Casting: Đảm bảo tính nhất quán ngoại hình nhân vật qua các khung hình bằng prompt-engineering.",
        "Tự động xoay vòng dự phòng (model pooling) giảm thiểu lỗi nghẽn hoặc cạn quota."
      ],
      visualType: "architecture",
    },
    {
      title: "Triết lý Thiết kế Local-First",
      subtitle: "Slide 3: Client-side First Design & Data Flow",
      theme: "Bảo mật tuyệt đối, hoạt động tức thì",
      icon: <Layers className="text-pink-600" size={20} />,
      description: "Ứng dụng hoạt động trực tiếp trên trình duyệt của người dùng. Mọi bản phác thảo, lời thoại, hình ảnh đều được lưu trữ an toàn trong bộ nhớ cục bộ, sẵn sàng xuất bản bất cứ lúc nào.",
      bullets: [
        "Tự động lưu tiến độ vào LocalStorage, không lo mất dữ liệu khi vô tình tải lại trang.",
        "Toàn bộ tiến độ được nén trong cấu trúc StudioSnapshot phục vụ sao lưu/khôi phục ngoại tuyến.",
        "Thiết kế sẵn sàng đồng bộ cơ sở dữ liệu Supabase khi chuyển đổi sang môi trường cloud."
      ],
      visualType: "persistence",
    },
    {
      title: "Khả năng Phục hồi & Chống lỗi",
      subtitle: "Slide 4: Resilient Architecture & Fallbacks",
      theme: "Trải nghiệm không bao giờ gián đoạn",
      icon: <ShieldCheck className="text-emerald-600" size={20} />,
      description: "Bảo vệ quy trình sáng tác của bạn khỏi các sự cố mạng hoặc lỗi API ngoại vi. Ứng dụng luôn có sẵn các phương án dự phòng chất lượng cao.",
      bullets: [
        "Tự động phát hiện lỗi kết nối/mã lỗi API từ các nhà cung cấp mô hình vẽ tranh.",
        "Fallback sang bộ thư viện Vector SVG và hình ảnh lưu đệm phong cách đa dạng.",
        "Cơ chế tạo lại ảnh (regenerate) riêng lẻ cho từng khung hình bị lỗi mà không ảnh hưởng tới cả trang."
      ],
      visualType: "resilience",
    },
    {
      title: "Kiểm thử & Đảm bảo Chất lượng",
      subtitle: "Slide 5: Quality Assurance & Automation",
      theme: "Cam kết sản phẩm chất lượng cao",
      icon: <GitBranch className="text-amber-600" size={20} />,
      description: "Được phát triển dưới tiêu chuẩn nghiêm ngặt với bộ công cụ tự động hóa toàn diện từ định dạng mã nguồn đến kiểm thử hành vi người dùng.",
      bullets: [
        "Vitest chạy toàn bộ unit tests và tích hợp bộ đo tỷ lệ phủ mã nguồn (coverage gate).",
        "Playwright E2E mô phỏng hành trình sáng tác trọn vẹn của người dùng (happy path).",
        "Quy trình tự động hóa kiểm tra tính nhất quán (npm run build & lint) trước khi phát hành."
      ],
      visualType: "qa",
    },
    {
      title: "Lộ trình Phát triển Tương lai",
      subtitle: "Slide 6: Limitations & Future Roadmap",
      theme: "Mở rộng khả năng sáng tạo nghệ thuật",
      icon: <Sparkles className="text-violet-600" size={20} />,
      description: "Lộ trình hoàn thiện ComicCraft Studio từ một bản thử nghiệm local-first thành một nền tảng sáng tác truyện tranh đa người dùng mạnh mẽ.",
      bullets: [
        "Đồng bộ đám mây toàn diện (Supabase Auth, Supabase DB và Storage).",
        "Tích hợp sâu ComfyUI và Stable Diffusion qua API chuyên biệt để vẽ tranh theo nét vẽ riêng.",
        "Sử dụng IP-Adapter/ControlNet để khóa cứng góc mặt nhân vật chính xác 100%."
      ],
      visualType: "roadmap",
    },
  ];

  const handleNext = () => {
    setActiveSlide((prev) => (prev + 1) % slides.length);
  };

  const handlePrev = () => {
    setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  if (!mounted) return null;

  return (
    <div className="h-screen flex flex-col justify-between bg-[#f8fafc] text-slate-800 font-sans selection:bg-violet-100 selection:text-violet-900 overflow-hidden relative">

      {/* Elegant Dot Canvas Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-70 pointer-events-none" />

      {/* Modern Soft Glowing Mesh Backdrop */}
      <div className="absolute top-[-10%] left-[-5%] w-[45vw] h-[45vw] rounded-full bg-violet-200/40 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[40vw] h-[40vw] rounded-full bg-indigo-200/40 blur-[130px] pointer-events-none" />
      <div className="absolute top-[30%] left-[20%] w-[35vw] h-[35vw] rounded-full bg-pink-100/30 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-md shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/20">
              <Sparkles size={18} />
            </div>
            <div>
              <span className="text-base font-bold tracking-wide text-slate-900 block leading-tight">ComicCraft Studio</span>
              <span className="text-[10px] text-slate-550 block tracking-wider uppercase mt-0.5 font-bold">Xưởng tạo truyện</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span
              onClick={() => setShowSlides(true)}
              className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors hidden sm:block cursor-pointer"
            >
              Giới thiệu
            </span>
            <Link
              href="/studio"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-semibold text-white transition hover:bg-violet-500 shadow-md shadow-violet-600/15 active:scale-95 cursor-pointer"
            >
              Vào ứng dụng
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Content Section - Fits precisely within remaining viewport space */}
      <section className="relative flex-1 min-h-0 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 text-center max-w-7xl mx-auto w-full">
        
        <span className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-violet-600 block mb-2 sm:mb-3">
          ComicCraft Studio
        </span>

        <h1 className="text-3xl sm:text-5xl md:text-[50px] font-black tracking-tight text-slate-900 leading-[1.15] max-w-4xl">
          Biến Câu Chữ Thành{" "}
          <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-pink-600 bg-clip-text text-transparent">
            Trang Truyện Tranh
          </span>{" "}
          Sống Động
        </h1>

        <p className="mt-3 text-xs sm:text-sm text-slate-650 max-w-2xl leading-relaxed">
          Nền tảng hỗ trợ sáng tác truyện tranh bằng trí tuệ nhân tạo (AI) local-first.
          Kiểm soát chặt chẽ từng công đoạn từ kịch bản phân cảnh tới bong bóng hội thoại.
        </p>

        {/* 3 Core Highlights Dashboard (Premium Minimalist White Glassmorphism Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl w-full mt-6 sm:mt-8 mb-6 sm:mb-8 text-left">

          <div className="border border-white/60 bg-white/30 hover:bg-white/60 backdrop-blur-md rounded-2xl p-5 transition-all duration-300 hover:border-violet-200/80 hover:shadow-[0_20px_40px_rgba(124,58,237,0.03)] flex gap-4 items-start">
            <div className="size-10 rounded-full bg-white border border-slate-200/60 flex items-center justify-center text-violet-600 shrink-0 shadow-sm">
              <BookOpen size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-extrabold text-slate-800 leading-snug tracking-tight">Kiểm Soát Từng Bước</h3>
              <p className="text-[11px] sm:text-xs text-slate-500/90 mt-1.5 leading-relaxed font-medium">
                Tự do chỉnh sửa storyboard và ngoại hình nhân vật trước khi vẽ tranh thay vì để AI tự động hoàn toàn.
              </p>
            </div>
          </div>

          <div className="border border-white/60 bg-white/30 hover:bg-white/60 backdrop-blur-md rounded-2xl p-5 transition-all duration-300 hover:border-indigo-200/80 hover:shadow-[0_20px_40px_rgba(79,70,229,0.03)] flex gap-4 items-start">
            <div className="size-10 rounded-full bg-white border border-slate-200/60 flex items-center justify-center text-indigo-600 shrink-0 shadow-sm">
              <Cpu size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-extrabold text-slate-800 leading-snug tracking-tight">Gemini AI & BYOK</h3>
              <p className="text-[11px] sm:text-xs text-slate-550/90 mt-1.5 leading-relaxed font-medium">
                Tích hợp trực tiếp Gemini API với tính năng bảo mật khóa cá nhân (BYOK) ngay tại trình duyệt để phân tích kịch bản.
              </p>
            </div>
          </div>

          <div className="border border-white/60 bg-white/30 hover:bg-white/60 backdrop-blur-md rounded-2xl p-5 transition-all duration-300 hover:border-pink-200/80 hover:shadow-[0_20px_40px_rgba(219,39,119,0.03)] flex gap-4 items-start">
            <div className="size-10 rounded-full bg-white border border-slate-200/60 flex items-center justify-center text-pink-600 shrink-0 shadow-sm">
              <ShieldCheck size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-extrabold text-slate-800 leading-snug tracking-tight">Local-First & Chống Lỗi</h3>
              <p className="text-[11px] sm:text-xs text-slate-550/90 mt-1.5 leading-relaxed font-medium">
                Tự lưu tiến độ vào LocalStorage, hỗ trợ vẽ lại từng ô tranh riêng lẻ và tự động fallback sang SVG khi mất mạng.
              </p>
            </div>
          </div>

        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
          <Link
            href="/studio"
            className="w-full sm:w-auto inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-8 text-sm font-bold text-white transition hover:from-violet-500 hover:to-indigo-500 shadow-md shadow-violet-600/20 active:scale-95 cursor-pointer"
          >
            Bắt đầu Sáng tác
            <ArrowRight size={16} />
          </Link>
          <button
            onClick={() => setShowSlides(true)}
            className="w-full sm:w-auto inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-8 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition active:scale-95 cursor-pointer"
          >
            Giới thiệu
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-4 bg-white/60 backdrop-blur-sm shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:flex sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500 leading-normal font-medium">
            &copy; {new Date().getFullYear()} ComicCraft Studio.
          </p>
          <div className="flex justify-center gap-6 mt-3 sm:mt-0">
            <Link href="/studio" className="text-xs text-slate-500 hover:text-slate-950 transition font-semibold">
              Trải nghiệm ứng dụng
            </Link>
            <span
              onClick={() => setShowSlides(true)}
              className="text-xs text-slate-500 hover:text-slate-950 transition font-semibold cursor-pointer"
            >
              Giới thiệu
            </span>
          </div>
        </div>
      </footer>

      {/* Slide Presentation Dialog Popup Overlay */}
      {showSlides && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 backdrop-blur-sm p-3 sm:p-6 md:p-10 animate-in fade-in duration-200">

          <div className="relative bg-white text-slate-800 border border-slate-200 shadow-2xl rounded-3xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-sm text-violet-600">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-none">
                    Nội dung Thuyết trình Dự án
                  </h2>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mt-1">
                    Báo cáo thiết kế & kỹ thuật ứng dụng ComicCraft Studio
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowSlides(false)}
                className="size-8 rounded-full border border-slate-200 bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition flex items-center justify-center active:scale-95 cursor-pointer shadow-sm"
                aria-label="Đóng popup"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Interactive Content Section */}
            <div className="flex-1 min-h-0 grid lg:grid-cols-12 overflow-hidden">

              {/* Left Column: List of Slide Topics */}
              <div className="lg:col-span-4 bg-slate-50 border-r border-slate-200 p-4 overflow-y-auto flex lg:flex-col gap-2 shrink-0 lg:shrink select-none">
                {slides.map((slide, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveSlide(idx)}
                    className={`flex items-center gap-3 w-full text-left px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-bold transition-all shrink-0 lg:shrink duration-200 ${activeSlide === idx
                        ? "border-violet-200 bg-white text-violet-700 shadow-sm"
                        : "border-transparent text-slate-500 hover:bg-slate-200/50 hover:text-slate-800"
                      }`}
                  >
                    <span className={`flex size-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold border transition ${activeSlide === idx ? "bg-violet-50 border-violet-100 text-violet-700" : "bg-white border-slate-200 text-slate-400"
                      }`}>
                      {idx + 1}
                    </span>
                    <span className="truncate">{slide.title}</span>
                  </button>
                ))}
              </div>

              {/* Right Column: Slide Panel details */}
              <div className="lg:col-span-8 p-6 sm:p-8 overflow-y-auto flex flex-col justify-between">

                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-5">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-violet-600">
                        {slides[activeSlide].icon}
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">
                          {slides[activeSlide].title}
                        </h3>
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mt-0.5">
                          {slides[activeSlide].subtitle}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-violet-700 bg-violet-50 border border-violet-100 px-2.5 py-1 rounded-full">
                      {slides[activeSlide].theme}
                    </span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 items-center">

                    {/* Left details */}
                    <div className="space-y-4">
                      <p className="text-xs sm:text-sm text-slate-650 leading-relaxed font-semibold">
                        {slides[activeSlide].description}
                      </p>
                      <ul className="space-y-2">
                        {slides[activeSlide].bullets.map((bullet, bIdx) => (
                          <li key={bIdx} className="flex items-start gap-2.5 text-[11px] sm:text-xs text-slate-600 leading-relaxed">
                            <span className="flex size-1.5 shrink-0 rounded-full bg-violet-500 mt-1.5" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Right dynamic visuals */}
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 min-h-[220px] flex items-center justify-center relative overflow-hidden">

                      {/* Visual: Flow */}
                      {slides[activeSlide].visualType === "flow" && (
                        <div className="flex flex-col gap-3 w-full text-center">
                          <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 px-1">
                            <span>VĂN BẢN</span>
                            <span>PHÂN CẢNH</span>
                            <span>BẢN VẼ</span>
                            <span>XUẤT BẢN</span>
                          </div>
                          <div className="grid grid-cols-4 gap-1.5">
                            <div className="border border-violet-100 bg-white rounded-xl p-2 flex flex-col items-center gap-1 shadow-sm">
                              <span className="text-[9px] font-bold text-violet-600">Text</span>
                              <div className="h-1 w-5 bg-violet-200 rounded-full" />
                            </div>
                            <div className="border border-indigo-100 bg-white rounded-xl p-2 flex flex-col items-center gap-1 shadow-sm">
                              <span className="text-[9px] font-bold text-indigo-600">JSON</span>
                              <div className="h-1 w-5 bg-indigo-200 rounded-full" />
                            </div>
                            <div className="border border-pink-100 bg-white rounded-xl p-2 flex flex-col items-center gap-1 shadow-sm">
                              <span className="text-[9px] font-bold text-pink-600">Panel</span>
                              <div className="h-1 w-5 bg-pink-200 rounded-full" />
                            </div>
                            <div className="border border-emerald-100 bg-white rounded-xl p-2 flex flex-col items-center gap-1 shadow-sm">
                              <span className="text-[9px] font-bold text-emerald-600">PNG</span>
                              <div className="h-1 w-5 bg-emerald-200 rounded-full" />
                            </div>
                          </div>
                          <div className="text-[9px] text-slate-450 mt-1 font-medium">
                            Mô hình quy trình phân đoạn 4 bước
                          </div>
                        </div>
                      )}

                      {/* Visual: Architecture */}
                      {slides[activeSlide].visualType === "architecture" && (
                        <div className="space-y-2.5 w-full text-xs">
                          <div className="border border-slate-200 bg-white rounded-xl p-2 flex items-center justify-between shadow-sm">
                            <span className="font-bold text-slate-700">Gemini LLM API</span>
                            <span className="text-[8px] font-bold text-pink-600 border border-pink-100 bg-pink-50 px-2 py-0.5 rounded">Prompt & JSON</span>
                          </div>
                          <div className="border border-slate-200 bg-white rounded-xl p-2 flex items-center justify-between shadow-sm">
                            <span className="font-bold text-slate-700">Image API (HF/Imagen)</span>
                            <span className="text-[8px] font-bold text-indigo-600 border border-indigo-100 bg-indigo-50 px-2 py-0.5 rounded">Stable Diffusion</span>
                          </div>
                          <div className="border border-slate-200 bg-white rounded-xl p-2 flex items-center justify-between shadow-sm">
                            <span className="font-bold text-slate-700">Client-Side Engine</span>
                            <span className="text-[8px] font-bold text-emerald-600 border border-emerald-100 bg-emerald-50 px-2 py-0.5 rounded">Zod Schema</span>
                          </div>
                        </div>
                      )}

                      {/* Visual: Persistence */}
                      {slides[activeSlide].visualType === "persistence" && (
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex gap-2">
                            <div className="size-9 rounded-lg border border-pink-100 bg-white flex items-center justify-center text-pink-600 shadow-sm">
                              <Layers size={16} />
                            </div>
                            <div className="size-9 rounded-lg border border-slate-250 bg-white flex items-center justify-center text-slate-400 shadow-sm">
                              <Volume2 size={16} />
                            </div>
                            <div className="size-9 rounded-lg border border-slate-250 bg-white flex items-center justify-center text-slate-400 shadow-sm">
                              <RotateCcw size={16} />
                            </div>
                          </div>
                          <div className="text-center mt-1">
                            <div className="text-xs font-bold text-slate-700">LocalStorage Snapshot</div>
                            <div className="text-[9px] text-pink-600 font-bold mt-0.5">status: auto_saved</div>
                          </div>
                          <div className="h-1 w-20 bg-slate-200 rounded-full overflow-hidden mt-1">
                            <div className="h-full w-4/5 bg-pink-500 rounded-full" />
                          </div>
                        </div>
                      )}

                      {/* Visual: Resilience */}
                      {slides[activeSlide].visualType === "resilience" && (
                        <div className="flex flex-col items-center gap-2">
                          <div className="size-11 rounded-full border border-emerald-100 bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm animate-pulse">
                            <ShieldCheck size={20} />
                          </div>
                          <div className="text-xs font-bold text-slate-700 text-center">Active Offline Engine</div>
                          <div className="flex gap-1 mt-1">
                            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded border border-emerald-100 bg-white text-emerald-600 shadow-sm">API Fallback</span>
                            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded border border-emerald-100 bg-white text-emerald-600 shadow-sm">SVG Cache</span>
                          </div>
                        </div>
                      )}

                      {/* Visual: QA */}
                      {slides[activeSlide].visualType === "qa" && (
                        <div className="space-y-2 w-full text-xs">
                          <div className="flex justify-between items-center text-[9px] text-slate-450 font-bold">
                            <span>Vitest coverage</span>
                            <span className="text-emerald-600 font-bold">100% passed</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden border border-slate-100">
                            <div className="h-full w-full bg-gradient-to-r from-violet-500 to-emerald-500 rounded-full" />
                          </div>
                          <div className="flex items-center justify-between border-t border-slate-100 pt-2 mt-1">
                            <span className="text-[9px] text-slate-500 font-semibold">Playwright E2E</span>
                            <span className="text-[8px] px-1.5 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded font-bold">SUCCESS</span>
                          </div>
                        </div>
                      )}

                      {/* Visual: Roadmap */}
                      {slides[activeSlide].visualType === "roadmap" && (
                        <div className="flex flex-col gap-2 w-full text-xs font-medium text-slate-600">
                          <div className="flex items-center gap-2">
                            <span className="size-1.5 rounded-full bg-violet-600" />
                            <span>Supabase DB & Auth</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="size-1.5 rounded-full bg-violet-600" />
                            <span>ComfyUI Custom Endpoint</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="size-1.5 rounded-full bg-violet-600" />
                            <span>IP-Adapter Face Lock</span>
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                </div>

                {/* Bottom Controls */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-5 mt-6 shrink-0">
                  <span className="text-[11px] text-slate-450 font-bold">
                    Slide {activeSlide + 1} / {slides.length}
                  </span>

                  <div className="flex gap-2">
                    <button
                      onClick={handlePrev}
                      className="size-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition flex items-center justify-center active:scale-95 cursor-pointer shadow-sm"
                      aria-label="Slide trước"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={handleNext}
                      className="size-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition flex items-center justify-center active:scale-95 cursor-pointer shadow-sm"
                      aria-label="Slide sau"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
