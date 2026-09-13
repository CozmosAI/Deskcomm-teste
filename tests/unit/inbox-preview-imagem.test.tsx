import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ConversationListItem } from "@/components/inbox/ConversationListItem";
import type { ConversationWithContact } from "@/hooks/inbox/useConversationsRealtime";

afterEach(cleanup);
const at = "2026-09-12T12:00:00.000Z";
function pintar(preview: string | null, message?: { type: string; body: string | null; revoked_at?: string | null }) {
  const conversation = {
    id: "qa-preview", status: "open", last_message_at: at,
    last_message_preview: preview, unread_count_for_assignee: 0,
    contacts: { display_name: "QA-AUTO", tags: [] },
    latest_message: message ? [{ ...message, sent_at: at, revoked_at: message.revoked_at ?? null }] : undefined,
  } as unknown as ConversationWithContact;
  return render(<ConversationListItem conversation={conversation} isSelected={false} mostrarAutomatico={false} onSelect={() => {}} />);
}

describe("prévia de imagem na Inbox", () => {
  it("preserva a legenda, inclusive quando contém o token literal", () => {
    pintar("Legenda [image] QA", { type: "image", body: "Legenda [image] QA" });
    expect(screen.getByText("Imagem: Legenda [image] QA")).toBeInTheDocument();
  });
  it.each(["[image]", "Use [image] no exemplo"])("não substitui texto legítimo: %s", (body) => {
    pintar(body, { type: "text", body });
    expect(screen.getByText(body)).toBeInTheDocument();
    expect(screen.queryByText("Imagem")).not.toBeInTheDocument();
  });
  it("não infere mídia em cache antigo sem metadados", () => {
    pintar("[image]");
    expect(screen.getByText("[image]")).toBeInTheDocument();
  });
  it("não recupera legenda de mensagem revogada", () => {
    pintar("Mensagem apagada", { type: "image", body: "Legenda antiga", revoked_at: at });
    expect(screen.getByText("Mensagem apagada")).toBeInTheDocument();
    expect(screen.queryByText(/Legenda antiga/)).not.toBeInTheDocument();
  });
  it("mantém fallback sem mensagens", () => {
    pintar(null);
    expect(screen.getByText("Sem mensagens")).toBeInTheDocument();
  });
  it("mostra ícone de foto e Imagem para mídia sem legenda", () => {
    pintar("[image]", { type: "image", body: null });
    expect(screen.getByText("Imagem")).toBeInTheDocument();
    expect(screen.queryByText("[image]")).not.toBeInTheDocument();
    expect(screen.getByText("Imagem").querySelector('svg[aria-hidden="true"]')).not.toBeNull();
  });
});
