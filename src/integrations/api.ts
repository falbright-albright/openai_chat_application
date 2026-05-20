export async function callGPTAPI(data: object) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "content-type": "application/json",
      authorization: "Bearer " + Bun.env.OPENAI_API_KEY,
    },
  });
  return res;
}
