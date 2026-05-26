/**
 * @file chunking-engine.ts
 * @description Backtracking-assisted smart story text segmenter for production scale.
 */

export function chunkStoryText(text: string, maxChunkSize = 5000): string[] {
  const cleanText = text.trim();
  if (cleanText.length <= maxChunkSize) {
    return [cleanText];
  }

  // 1. Tách văn bản thô thành các câu đơn độc lập bằng Regex
  // Dấu hiệu tách câu: dấu chấm, hỏi, than kèm theo khoảng trắng, hoặc ký tự xuống dòng
  const sentences = cleanText
    .split(/(?<=[.?!])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (sentences.length === 0) {
    return [cleanText];
  }

  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentLength = 0;

  for (const sentence of sentences) {
    // Độ dài ước tính khi cộng câu mới (bao gồm khoảng trắng phân cách)
    const estimatedLength = currentLength + (currentLength > 0 ? 1 : 0) + sentence.length;

    if (estimatedLength <= maxChunkSize) {
      currentChunk.push(sentence);
      currentLength = estimatedLength;
    } else {
      // Khi vượt kích thước tối đa, đóng gói đoạn hiện tại
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.join(" "));
      }
      
      // Khởi tạo đoạn mới bằng câu hiện hành
      currentChunk = [sentence];
      currentLength = sentence.length;
    }
  }

  // Thu dọn đoạn cuối cùng
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(" "));
  }

  return chunks;
}
