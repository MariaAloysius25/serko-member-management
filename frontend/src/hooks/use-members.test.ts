import { describe, expect, it } from "vitest";
import {
  getSelectionAfterRefresh,
  reconcileMemberSelection,
} from "./use-members";
import type { Member } from "../types/member";

const updatedMember: Member = {
  id: "m1",
  firstName: "Alex",
  lastName: "River",
  email: "alex@example.test",
  role: "arranger",
};

const otherMember: Member = {
  id: "m2",
  firstName: "Sam",
  lastName: "Brook",
  email: "sam@example.test",
  role: "arranger",
};

const robin: Member = {
  id: "m4",
  firstName: "Robin",
  lastName: "Lake",
  email: "robin@example.test",
  role: "traveller",
};

const lee: Member = {
  id: "m3",
  firstName: "Lee",
  lastName: "Vale",
  email: "lee@example.test",
  role: "administrator",
};

const sam: Member = {
  id: "m6",
  firstName: "Sam",
  lastName: "Vale",
  email: "sam.vale@example.test",
  role: "administrator",
};

describe("selection after a successful role update", () => {
  it("keeps the updated employee selected when present in refreshed results", () => {
    expect(
      getSelectionAfterRefresh(updatedMember.id, [otherMember, updatedMember]),
    ).toBe(updatedMember);
  });

  it("selects the first refreshed employee when the updated employee is filtered out", () => {
    expect(getSelectionAfterRefresh(updatedMember.id, [otherMember])).toBe(
      otherMember,
    );
  });

  it("returns no selection when refreshed results are empty", () => {
    expect(getSelectionAfterRefresh(updatedMember.id, [])).toBeNull();
  });
});

describe("selection after filtered member results change", () => {
  it("switches from a selected traveller to the first administrator", () => {
    expect(reconcileMemberSelection(robin.id, [lee, sam])).toBe(lee);
  });

  it("keeps the selected member when they remain in the filtered results", () => {
    expect(reconcileMemberSelection(otherMember.id, [lee, otherMember])).toBe(
      otherMember,
    );
  });

  it("clears selection when the filter has no results", () => {
    expect(reconcileMemberSelection(robin.id, [])).toBeNull();
  });

  it("selects the first search result when the selected member no longer matches", () => {
    expect(reconcileMemberSelection(robin.id, [otherMember])).toBe(otherMember);
  });
});
