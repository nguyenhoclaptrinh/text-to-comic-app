import * as dns from "dns";

dns.resolve4("api-inference.huggingface.co", (err, addresses) => {
  if (err) {
    console.error("❌ resolve4 lỗi:", err);
  } else {
    console.log("✅ resolve4 Addresses:", addresses);
  }
});

dns.lookup("api-inference.huggingface.co", { all: true }, (err, addresses) => {
  if (err) {
    console.error("❌ lookup lỗi:", err);
  } else {
    console.log("✅ lookup Addresses:", addresses);
  }
});
