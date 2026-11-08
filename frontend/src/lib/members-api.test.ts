import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ApiClientError,
  failNextSave,
  getMember,
  getMembers,
  updateMemberRole,
} from "./members-api";
import type { Member } from "../types/member";

const member: Member = {
  id: "m1",
  firstName: "Alex",
  lastName: "River",
  email: "alex@example.test",
  role: "traveller",
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

describe("members API client", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("requests members without filters", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ items: [member] }));

    await expect(getMembers()).resolves.toEqual([member]);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:5080/api/members",
    );
  });

  it("encodes combined search and role filters", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ items: [member] }));

    await getMembers("Alex River & Co", "traveller");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:5080/api/members?search=Alex+River+%26+Co&role=traveller",
    );
  });

  it("updates a member with the expected PATCH request body", async () => {
    const updatedMember = { ...member, role: "arranger" as const };
    fetchMock.mockResolvedValueOnce(jsonResponse(updatedMember));

    await expect(updateMemberRole("m/1", "arranger")).resolves.toEqual(
      updatedMember,
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:5080/api/members/m%2F1",
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "arranger" }),
      },
    );
  });

  it("retains HTTP status and API error details", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        {
          error: {
            code: "MEMBER_NOT_FOUND",
            message: "No member exists with the supplied ID.",
          },
        },
        404,
      ),
    );

    const request = getMember("missing");

    await expect(request).rejects.toMatchObject({
      name: "ApiClientError",
      status: 404,
      code: "MEMBER_NOT_FOUND",
      message: "No member exists with the supplied ID.",
    });
    await expect(request).rejects.toBeInstanceOf(ApiClientError);
  });

  it("propagates network errors", async () => {
    const networkError = new TypeError("Failed to fetch");
    fetchMock.mockRejectedValueOnce(networkError);

    await expect(getMembers()).rejects.toBe(networkError);
  });

  it("posts to the development failure endpoint and returns its response", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ armed: true }));

    await expect(failNextSave()).resolves.toEqual({ armed: true });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:5080/api/dev/fail-next-save",
      { method: "POST" },
    );
  });
});
