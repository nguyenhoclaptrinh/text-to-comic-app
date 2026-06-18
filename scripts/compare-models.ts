/**
 * @file compare-models.ts
 * @description Script chạy kiểm thử song song các mô hình sinh ảnh hoạt động trên Hugging Face Serverless API qua router chính thức.
 */

import * as fs from "fs";
import * as path from "path";
import * as https from "https";

// 1. Hàm đọc và parse file .env thủ công
function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) {
    console.error("❌ Không tìm thấy file .env tại thư mục gốc.");
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, "utf-8");
  const env: Record<string, string> = {};
  
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const parts = trimmed.split("=");
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts.slice(1).join("=").trim().replace(/^['"]|['"]$/g, "");
      env[key] = value;
    }
  });

  return env;
}

const env = loadEnv();
const HF_TOKEN = env["HUGGINGFACE_API_TOKEN"];

if (!HF_TOKEN) {
  console.error("❌ Lỗi: Chưa cấu hình HUGGINGFACE_API_TOKEN trong file .env.");
  process.exit(1);
}

// 2. Cấu hình bài thử nghiệm
const PROMPT = "Comic panel, manga style, vibrant color. A young swordsman with blue hair and a black cloak stands on a cliff overlooking a fantasy city, highly detailed, clean lines.";
const SEED = 42;
const OUTPUT_DIR = path.resolve(process.cwd(), "grill-me");

const MODELS = [
  {
    name: "FLUX.1-schnell",
    repo: "black-forest-labs/FLUX.1-schnell",
  },
  {
    name: "Stable-Diffusion-3-Medium",
    repo: "stabilityai/stable-diffusion-3-medium-diffusers",
  }
];

// Tạo thư mục đầu ra nếu chưa có
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Hàm thực hiện request HTTPS POST thông thường đến router.huggingface.co
function httpsPost(
  url: string,
  bodyData: string,
  token: string
): Promise<{ status: number; contentType: string; data: Buffer }> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: 443,
      path: parsedUrl.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "Content-Length": Buffer.byteLength(bodyData),
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      }
    };

    const req = https.request(options, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const buffer = Buffer.concat(chunks);
        resolve({
          status: res.statusCode || 500,
          contentType: res.headers["content-type"] || "",
          data: buffer,
        });
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    req.setTimeout(180000, () => {
      req.destroy(new Error("Request timeout after 180 seconds."));
    });

    req.write(bodyData);
    req.end();
  });
}

// 3. Hàm gọi Hugging Face Serverless API cho từng model
async function generateImage(modelName: string, repo: string): Promise<string> {
  const endpoint = `https://router.huggingface.co/hf-inference/models/${repo}`;
  
  console.log(`[${modelName}] ⏳ Gửi request đến ${repo}...`);
  
  const payload = JSON.stringify({
    inputs: PROMPT,
    parameters: {
      seed: SEED,
    },
  });

  const response = await httpsPost(endpoint, payload, HF_TOKEN);
  const contentType = response.contentType || "";

  if (response.status !== 200) {
    const errText = response.data.toString("utf-8");
    throw new Error(`API báo lỗi HTTP ${response.status}: ${errText}`);
  }

  // Nếu trả về JSON (thường là lỗi được wrap hoặc thông báo model đang load)
  if (contentType.includes("application/json")) {
    const json = JSON.parse(response.data.toString("utf-8"));
    if (json.error && json.error.includes("currently loading")) {
      const estimatedTime = json.estimated_time || 20;
      console.warn(`[${modelName}] ⚠️ Model đang load lên serverless. Cần đợi khoảng ${estimatedTime}s...`);
      // Thử lại sau khi chờ
      await new Promise((resolve) => setTimeout(resolve, estimatedTime * 1000));
      return generateImage(modelName, repo);
    }
    throw new Error(`Lỗi JSON từ HF: ${JSON.stringify(json)}`);
  }

  const filename = `${modelName.toLowerCase().replace(/\./g, "-")}.png`;
  const filepath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(filepath, response.data);
  
  console.log(`[${modelName}] ✅ Đã lưu ảnh thành công vào: ${filepath}`);
  return filepath;
}

// 4. Thực thi song song
async function main() {
  console.log("=============================================================");
  console.log("🚀 KHỞI CHẠY KIỂM THỬ SONG SONG CÁC MÔ HÌNH HUGGING FACE HOẠT ĐỘNG");
  console.log(`Prompt: "${PROMPT}"`);
  console.log(`Seed: ${SEED}`);
  console.log(`Thư mục lưu ảnh: ${OUTPUT_DIR}`);
  console.log("=============================================================");

  const startTime = Date.now();

  const promises = MODELS.map(async (model) => {
    try {
      const path = await generateImage(model.name, model.repo);
      return { model: model.name, status: "Thành công", path };
    } catch (error: any) {
      console.error(`[${model.name}] ❌ Thất bại:`, error.message || error);
      return { model: model.name, status: "Thất bại", error: error.message || error };
    }
  });

  const results = await Promise.all(promises);

  console.log("\n=============================================================");
  console.log("📊 KẾT QUẢ KIỂM THỬ SO SÁNH:");
  results.forEach((res) => {
    if (res.status === "Thành công") {
      console.log(`- ${res.model}: ✅ THÀNH CÔNG -> ${res.path}`);
    } else {
      console.log(`- ${res.model}: ❌ THẤT BẠI -> ${res.error}`);
    }
  });
  console.log(`⏱️ Tổng thời gian thực hiện: ${((Date.now() - startTime) / 1000).toFixed(2)} giây.`);
  console.log("=============================================================");
}

main().catch((err) => {
  console.error("❌ Lỗi thực thi chính:", err);
});
