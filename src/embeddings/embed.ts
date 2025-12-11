import { OpenAIEmbeddings } from "@langchain/openai";

let embedder: OpenAIEmbeddings | null = null;

function getEmbedder() {
  if (!embedder) {
    embedder = new OpenAIEmbeddings({
      model: "text-embedding-3-large"
    });
  }
  return embedder;
}

export async function embedText(text: string) {
  const result = await getEmbedder().embedDocuments([text]);
  return result[0];
}
