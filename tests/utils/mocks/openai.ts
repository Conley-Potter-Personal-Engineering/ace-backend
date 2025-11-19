import { vi } from "vitest";

export const mockOpenAI = () => {
  const invoke = vi.fn();
  
  const ChatOpenAI = vi.fn(() => ({
    invoke,
  }));

  return {
    ChatOpenAI,
    invoke,
  };
};
