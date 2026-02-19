import type { GroupMember } from "@/features/bible/types";

export type InviteStatus = "PENDING" | "ACCEPTED" | "REVOKED";
const INVITE_TTL_DAYS = 7;
const CODE_PREFIX = "BIB";
const MAX_CODE_RETRY = 10;

export type InviteAcceptHistory = {
  acceptedAt: string;
  acceptedBy: string;
  acceptedMemberId: string;
};

export type InviteAuditAction =
  | "CREATED"
  | "ACCEPTED"
  | "REVOKED"
  | "REISSUED";

export type InviteAuditLog = {
  action: InviteAuditAction;
  at: string;
  actorId: string;
  detail?: string;
  sessionId?: string;
  userAgent?: string;
  platform?: string;
  language?: string;
  timezone?: string;
  ipHint?: string;
};

export type GroupInvite = {
  code: string;
  name: string;
  targetId: string;
  createdAt: string;
  expiresAt: string;
  acceptedAt?: string;
  revokedAt?: string;
  acceptedCount: number;
  maxAcceptCount: number;
  acceptHistory: InviteAcceptHistory[];
  auditHistory: InviteAuditLog[];
  status: InviteStatus;
};

const INVITE_KEY = "bible.groupInvites";

function randomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  const randomValues = crypto.getRandomValues(new Uint8Array(6));
  for (let i = 0; i < randomValues.length; i += 1) {
    const value = randomValues[i];
    out += chars[value % chars.length];
  }
  return out;
}

function checksum(base: string) {
  let sum = 0;
  for (const ch of base) sum += ch.charCodeAt(0);
  return (sum % 97).toString().padStart(2, "0");
}

export function normalizeInviteCode(input: string) {
  return input.trim().toUpperCase();
}

export function buildInviteCode() {
  const body = randomCode();
  return `${CODE_PREFIX}-${body}-${checksum(`${CODE_PREFIX}-${body}`)}`;
}

export function isInviteCodeFormatValid(input: string) {
  const normalized = normalizeInviteCode(input);
  const m = normalized.match(/^([A-Z]{3})-([A-Z0-9]{6})-(\d{2})$/);
  if (!m) return false;
  const [, prefix, body, sign] = m;
  if (prefix !== CODE_PREFIX) return false;
  return checksum(`${prefix}-${body}`) === sign;
}

export function loadGroupInvites() {
  const raw = localStorage.getItem(INVITE_KEY);
  if (!raw) return [] as GroupInvite[];
  try {
    const parsed = JSON.parse(raw) as Array<Partial<GroupInvite>>;
    return parsed.map((invite) => {
      const createdAt = invite.createdAt ?? new Date(0).toISOString();
      const auditHistory = Array.isArray(invite.auditHistory)
        ? invite.auditHistory
        : [
            {
              action: "CREATED" as const,
              at: createdAt,
              actorId: "legacy",
              detail: "기존 데이터 마이그레이션",
            },
          ];

      return {
        code: invite.code ?? "",
        name: invite.name ?? "",
        targetId: invite.targetId ?? "",
        createdAt,
        expiresAt: invite.expiresAt ?? new Date(0).toISOString(),
        acceptedAt: invite.acceptedAt,
        revokedAt: invite.revokedAt,
        acceptedCount: invite.acceptedCount ?? 0,
        maxAcceptCount: invite.maxAcceptCount ?? 1,
        acceptHistory: Array.isArray(invite.acceptHistory) ? invite.acceptHistory : [],
        auditHistory,
        status: invite.status ?? "PENDING",
      };
    });
  } catch {
    return [] as GroupInvite[];
  }
}

export function saveGroupInvites(invites: GroupInvite[]) {
  localStorage.setItem(INVITE_KEY, JSON.stringify(invites));
}

export function createInvite(
  name: string,
  targetId: string,
  oneTime: boolean,
  existingInvites: GroupInvite[],
  actorId = "system",
  detail?: string,
  auditContext?: Partial<InviteAuditLog>,
): GroupInvite {
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + INVITE_TTL_DAYS);
  let code = buildInviteCode();

  let retry = 0;
  while (existingInvites.some((invite) => invite.code === code) && retry < MAX_CODE_RETRY) {
    code = buildInviteCode();
    retry += 1;
  }

  return {
    code,
    name,
    targetId,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    acceptedCount: 0,
    maxAcceptCount: oneTime ? 1 : 9999,
    acceptHistory: [],
    auditHistory: [
      {
        action: "CREATED",
        at: now.toISOString(),
        actorId,
        detail,
        ...auditContext,
      },
    ],
    status: "PENDING",
  };
}

export function isInviteExpired(invite: GroupInvite, now = new Date()) {
  return new Date(invite.expiresAt).getTime() < now.getTime();
}

export function canInviteBeAccepted(invite: GroupInvite, now = new Date()) {
  if (invite.status !== "PENDING") return false;
  if (isInviteExpired(invite, now)) return false;
  return invite.acceptedCount < invite.maxAcceptCount;
}

export function acceptInviteToMember(invite: GroupInvite): GroupMember {
  return {
    id: invite.targetId,
    name: invite.name,
    bookName: "누가복음",
    chapter: 1,
    weeklyReadChapters: 0,
  };
}
