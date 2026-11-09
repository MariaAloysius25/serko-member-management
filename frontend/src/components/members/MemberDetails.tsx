
"use client";

import type { Ref } from "react";
import type { Member, Role } from "../../types/member";

type MemberDetailsProps = {
    selectedMember: Member | null;
    detailError: string | null;
    draftRole: Role | null;
    setDraftRole: (role: Role) => void;
    roles: Role[];
    roleLabels: Record<Role, string>;
    saving: boolean;
    isRefreshingResults: boolean;
    isDirty: boolean;
    saveError: string | null;
    saveMessage: string | null;
    saveFeedbackRef: Ref<HTMLParagraphElement>;
    loading: boolean;
    loaded: boolean;
    onSave: () => void;
    onRetrySave: () => void;
};

export function MemberDetails({
    selectedMember,
    detailError,
    draftRole,
    setDraftRole,
    roles,
    roleLabels,
    saving,
    isRefreshingResults,
    isDirty,
    saveError,
    saveMessage,
    saveFeedbackRef,
    loading,
    loaded,
    onSave,
    onRetrySave,
}: MemberDetailsProps) {
    return (
        <section
            aria-labelledby="details-heading"
            aria-busy={isRefreshingResults}
            className="h-fit min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
            <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
                <h2 id="details-heading" className="text-lg font-semibold">
                    Member details
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                    Review profile information and update the travel role.
                </p>

                {isRefreshingResults && selectedMember && (
                    <p
                        className="mt-2 inline-flex items-center gap-2 text-xs text-slate-500"
                        role="status"
                        aria-live="polite"
                    >
                        <span
                            className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-500"
                            aria-hidden="true"
                        />
                        Updating member details
                    </p>
                )}
            </div>

            {detailError ? (
                <div className="p-5 sm:p-6">
                    <p className="text-sm text-red-800" role="alert">
                        {detailError}
                    </p>
                </div>
            ) : selectedMember ? (
                <div className="p-5 sm:p-6">
                    <p className="text-xl font-semibold">
                        {selectedMember.firstName} {selectedMember.lastName}
                    </p>

                    <dl className="mt-5 divide-y divide-slate-100 rounded-xl border border-slate-200">
                        <div className="grid gap-1 px-4 py-3 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-4">
                            <dt className="text-sm font-medium text-slate-600">Email</dt>
                            <dd className="break-all text-sm text-slate-900">
                                {selectedMember.email}
                            </dd>
                        </div>
                        <div className="grid gap-1 px-4 py-3 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-4">
                            <dt className="text-sm font-medium text-slate-600">Member ID</dt>
                            <dd className="text-sm text-slate-900">{selectedMember.id}</dd>
                        </div>
                    </dl>

                    <form
                        className="mt-6"
                        onSubmit={(event) => {
                            event.preventDefault();
                            onSave();
                        }}
                    >
                        <label
                            htmlFor="member-role"
                            className="mb-1.5 block text-sm font-medium text-slate-700"
                        >
                            Travel role
                        </label>

                        <select
                            id="member-role"
                            value={draftRole ?? selectedMember.role}
                            onChange={(event) => setDraftRole(event.target.value as Role)}
                            disabled={saving || isRefreshingResults}
                            className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-slate-100"
                        >
                            {roles.map((role) => (
                                <option key={role} value={role}>
                                    {roleLabels[role]}
                                </option>
                            ))}
                        </select>

                        <div className="mt-4 flex flex-wrap items-center gap-3">
                            <button
                                type="submit"
                                disabled={!isDirty || saving || isRefreshingResults}
                                className="min-h-11 rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                            >
                                {saving ? "Saving…" : "Save role"}
                            </button>

                            {saving && (
                                <span className="text-sm text-slate-600" role="status">
                                    Saving changes
                                </span>
                            )}
                            {isDirty && !saving && (
                                <span className="text-sm text-slate-600">
                                    Unsaved changes
                                </span>
                            )}
                        </div>
                    </form>

                    <div className="mt-4 min-h-6">
                        {saveError && (
                            <div
                                className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900"
                                role="alert"
                                aria-live="assertive"
                            >
                                <p>{saveError}</p>
                                <button
                                    type="button"
                                    onClick={onRetrySave}
                                    disabled={saving || isRefreshingResults}
                                    className="mt-2 min-h-9 rounded-md border border-red-300 bg-white px-3 font-medium hover:bg-red-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:opacity-60"
                                >
                                    Retry save
                                </button>
                            </div>
                        )}

                        {saveMessage && (
                            <p
                                ref={saveFeedbackRef}
                                tabIndex={-1}
                                className="text-sm font-medium text-green-800"
                                role="status"
                                aria-live="polite"
                            >
                                {saveMessage}
                            </p>
                        )}
                    </div>
                </div>
            ) : (
                <div className="p-5 text-sm text-slate-600 sm:p-6">
                    {loading || !loaded
                        ? "Loading member details…"
                        : "Select a member to view their details."}
                </div>
            )}
        </section>
    );
}
