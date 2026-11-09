import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import Home from "./page";
import type { Member } from "../types/member";

const api = vi.hoisted(() => ({
    getMembers: vi.fn(),
    updateMemberRole: vi.fn(),
    failNextSave: vi.fn(),
}));

vi.mock("../lib/members-api", () => ({
    getMembers: api.getMembers,
    updateMemberRole: api.updateMemberRole,
    failNextSave: api.failNextSave,
}));

const alex: Member = {
    id: "m1",
    firstName: "Alex",
    lastName: "River",
    email: "alex@example.test",
    role: "traveller",
};
const updatedAlex: Member = {
    ...alex,
    role: "arranger",
};

describe("member management page", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        api.getMembers.mockResolvedValue([alex]);
    });

    afterEach(() => {
        cleanup();
    });

    it("loads a member and disables save when there are no changes", async () => {
        render(<Home />);

        // Wait for the initial API request and member list to finish loading.
        expect(
            await screen.findByRole("button", { name: /Alex River/ })
        ).toBeInTheDocument();

        // There are two comboboxes with this label, so target the editor.
        const memberRole = document.getElementById(
            "member-role"
        ) as HTMLSelectElement;

        expect(memberRole).toHaveValue("traveller");

        expect(
            screen.getByRole("button", { name: "Save role" })
        ).toBeDisabled();
    });

    it("searches using the entered name and selected role together", async () => {
        render(<Home />);

        expect(
            await screen.findByRole("button", { name: /Alex River/ })
        ).toBeInTheDocument();

        fireEvent.change(screen.getByLabelText("Search members"), {
            target: { value: "Alex" },
        });
        fireEvent.change(document.getElementById("role-filter") as HTMLSelectElement, {
            target: { value: "traveller" },
        });

        await waitFor(() => {
            expect(api.getMembers).toHaveBeenLastCalledWith("Alex", "traveller");
        });
    });

    it("saves a changed role and displays success feedback", async () => {
        api.updateMemberRole.mockResolvedValue(updatedAlex);
        api.getMembers
            .mockResolvedValueOnce([alex])
            .mockResolvedValueOnce([updatedAlex]);

        render(<Home />);

        await screen.findByRole("button", { name: /Alex River/ });

        fireEvent.change(screen.getByLabelText("Travel role", { selector: "#member-role" }), {
            target: { value: "arranger" },
        });


        expect(screen.getByRole("button", { name: "Save role" })).toBeEnabled();

        fireEvent.click(screen.getByRole("button", { name: "Save role" }));

        expect(await screen.findByText("Travel role saved.")).toBeInTheDocument();

        expect(api.updateMemberRole).toHaveBeenCalledWith("m1", "arranger");
        expect(
            screen.getByLabelText("Travel role", { selector: "#member-role" })
        ).toHaveValue("arranger"); expect(screen.getByRole("button", { name: "Save role" })).toBeDisabled();
    });

    it("preserves the unsaved role after a failed save and allows retry", async () => {
        api.updateMemberRole
            .mockRejectedValueOnce(new Error("Simulated service unavailable"))
            .mockResolvedValueOnce(updatedAlex);

        api.getMembers
            .mockResolvedValueOnce([alex])
            .mockResolvedValueOnce([updatedAlex]);

        render(<Home />);

        await screen.findByRole("button", { name: /Alex River/ });

        const roleSelect = screen.getByLabelText("Travel role", {
            selector: "#member-role",
        });
        fireEvent.change(roleSelect, {
            target: { value: "arranger" },
        });

        fireEvent.click(screen.getByRole("button", { name: "Save role" }));

        expect(
            await screen.findByRole("alert"),
        ).toHaveTextContent("Simulated service unavailable");

        expect(
            screen.getByLabelText("Travel role", { selector: "#member-role" })
        ).toHaveValue("arranger");
        fireEvent.click(screen.getByRole("button", { name: "Retry save" }));

        await waitFor(() => {
            expect(api.updateMemberRole).toHaveBeenCalledTimes(2);
        });

        expect(await screen.findByText("Travel role saved.")).toBeInTheDocument();
        expect(
            screen.getByLabelText("Travel role", { selector: "#member-role" })
        ).toHaveValue("arranger");
    });
});