import type { Member, Role } from "../types/member";

type MemberListResponse = {
  items: Member[];
};

type ApiErrorResponse = {
  error?: {
    code?: unknown;
    message?: unknown;
  };
};

export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

const apiBaseUrl = () =>
  (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5080").replace(
    /\/+$/,
    "",
  );

const readResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    let payload: ApiErrorResponse | undefined;
    try {
      payload = (await response.json()) as ApiErrorResponse;
    } catch {
      // Non-JSON error responses use the status-based fallback below.
    }

    const code =
      typeof payload?.error?.code === "string"
        ? payload.error.code
        : undefined;
    const message =
      typeof payload?.error?.message === "string"
        ? payload.error.message
        : `Request failed with status ${response.status}`;

    throw new ApiClientError(response.status, message, code);
  }

  return (await response.json()) as T;
};

export async function getMembers(
  search?: string,
  role?: Role,
): Promise<Member[]> {
  const query = new URLSearchParams();
  if (search !== undefined) query.set("search", search);
  if (role !== undefined) query.set("role", role);

  const queryString = query.toString();
  const url = `${apiBaseUrl()}/api/members${queryString ? `?${queryString}` : ""}`;
  const response = await fetch(url);
  const result = await readResponse<MemberListResponse>(response);
  return result.items;
}

export async function getMember(id: string): Promise<Member> {
  const response = await fetch(
    `${apiBaseUrl()}/api/members/${encodeURIComponent(id)}`,
  );
  return readResponse<Member>(response);
}

export async function updateMemberRole(
  id: string,
  role: Role,
): Promise<Member> {
  const response = await fetch(
    `${apiBaseUrl()}/api/members/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    },
  );
  return readResponse<Member>(response);
}

export async function failNextSave(): Promise<{ armed: true }> {
  const response = await fetch(`${apiBaseUrl()}/api/dev/fail-next-save`, {
    method: "POST",
  });
  return readResponse<{ armed: true }>(response);
}
