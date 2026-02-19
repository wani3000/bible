import { describe, expect, it } from "vitest";
import {
  canInviteBeAccepted,
  createInvite,
  isInviteCodeFormatValid,
  type GroupInvite,
} from "@/features/group/inviteStore";

describe("inviteStore", () => {
  it("creates invite with initial audit history", () => {
    const invite = createInvite(
      "테스터",
      "user-001",
      true,
      [],
      "admin-1",
      "초대 생성",
      { sessionId: "sess-1", platform: "iPhone" },
    );

    expect(invite.code).toMatch(/^BIB-[A-Z0-9]{6}-\d{2}$/);
    expect(isInviteCodeFormatValid(invite.code)).toBe(true);
    expect(invite.acceptHistory).toHaveLength(0);
    expect(invite.auditHistory).toHaveLength(1);
    expect(invite.auditHistory[0].action).toBe("CREATED");
    expect(invite.auditHistory[0].actorId).toBe("admin-1");
    expect(invite.auditHistory[0].platform).toBe("iPhone");
    expect(invite.maxAcceptCount).toBe(1);
  });

  it("blocks accept after limit", () => {
    const invite: GroupInvite = {
      code: "BIB-ABC123-00",
      name: "A",
      targetId: "u1",
      createdAt: "2026-02-01T00:00:00.000Z",
      expiresAt: "2026-02-28T00:00:00.000Z",
      acceptedCount: 1,
      maxAcceptCount: 1,
      acceptHistory: [],
      auditHistory: [],
      status: "PENDING",
    };
    expect(canInviteBeAccepted(invite, new Date("2026-02-10T00:00:00.000Z"))).toBe(false);
  });
});
