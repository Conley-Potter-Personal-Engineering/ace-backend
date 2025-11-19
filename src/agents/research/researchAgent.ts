import { embedText } from "../../embeddings/embed";
import { ChatOpenAI } from "@langchain/openai";
import { getSupabase } from "../../db/db";

const supabase = getSupabase() as any;

export class ResearchAgent {
  private llm = new ChatOpenAI({ model: "gpt-4.1" });

  async ingestContent(source: string, rawText: string) {
    const embedding = await embedText(rawText);

    const { error } = await supabase
      .from("raw_documents")
      .insert({
        source,
        raw_text: rawText,
        embedding
      });

    if (error) throw error;
  }

  async searchSimilar(query: string, limit = 5) {
    const queryEmbedding = await embedText(query);

    const { data, error } = await supabase.rpc(
      "match_raw_documents",
      {
        query_embedding: queryEmbedding,
        match_threshold: 0.75,
        match_count: limit
      }
    );

    if (error) throw error;
    return data ?? [];
  }

  async analyze(query: string) {
    const similar = await this.searchSimilar(query);

    const context = similar
      .map((x: any) => x.raw_text?.slice(0, 500))
      .join("\n\n");

    const response = await this.llm.invoke([
      {
        role: "system",
        content: "You are a precise analytical engine that extracts trends."
      },
      {
        role: "user",
        content: `Context:\n${context}\n\nQuestion:\n${query}`
      }
    ]);

    return response.content;
  }
}
