"use client";

import { useEffect, useRef } from "react";
import { useMembers } from "../hooks/use-members";
import type { Role } from "../types/member";
import { MemberSearch } from "../components/members/MemberSearch";
import { MemberList } from "../components/members/MemberList";
import { MemberDetails } from "../components/members/MemberDetails";

const roleLabels: Record<Role, string> = {
  traveller: "Traveller",
  arranger: "Arranger",
  administrator: "Administrator",
};

const roles = Object.keys(roleLabels) as Role[];

export default function Home() {
  const {
    members,
    loading,
    loaded,
    isRefreshingResults,
    loadError,
    refreshError,
    loadMembers,
    search,
    setSearch,
    roleFilter,
    setRoleFilter,
    selectedId,
    selectedMember,
    detailError,
    draftRole,
    setDraftRole,
    saving,
    saveError,
    saveMessage,
    saveRole,
    selectMember,
    armingFailure,
    failureMessage,
    armFailure,
  } = useMembers();
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const saveFeedbackRef = useRef<HTMLParagraphElement | null>(null);
  const savedMemberIdRef = useRef<string | null>(null);
  const isDirty =
    selectedMember !== null &&
    draftRole !== null &&
    draftRole !== selectedMember.role;

  useEffect(() => {
    if (saving) return;

    const savedMemberId = savedMemberIdRef.current;
    if (!savedMemberId) return;

    if (saveError) {
      savedMemberIdRef.current = null;
      return;
    }

    if (saveMessage || selectedId !== savedMemberId) {
      if (selectedId === savedMemberId) {
        saveFeedbackRef.current?.focus({ preventScroll: true });
      } else {
        searchInputRef.current?.focus({ preventScroll: true });
      }
      savedMemberIdRef.current = null;
    }
  }, [saveError, saveMessage, saving, selectedId]);

  const handleSaveRole = () => {
    if (selectedMember && isDirty && !saving && !isRefreshingResults) {
      savedMemberIdRef.current = selectedMember.id;
    }
    void saveRole();
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-700">
              Serko · People
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              Member management
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Search colleagues and manage their travel access.
            </p>
          </div>
          {process.env.NODE_ENV === "development" && (
            <div className="flex flex-col items-start gap-1">
              <button
                type="button"
                onClick={armFailure}
                disabled={armingFailure}
                className="min-h-11 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-950 hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 disabled:cursor-wait disabled:opacity-60"
              >
                {armingFailure ? "Arming failure…" : "Simulate next save failure"}
              </button>
              <p
                className="text-sm text-slate-600"
                role="status"
                aria-live="polite"
              >
                {failureMessage}
              </p>
            </div>
          )}
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)] lg:px-8">
        <section
          aria-labelledby="directory-heading"
          className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="directory-heading" className="text-lg font-semibold">
                  Colleagues
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {members.length} {members.length === 1 ? "member" : "members"}
                </p>
              </div>
              {/* List status */}
              {isRefreshingResults && (
                <span
                  className="mt-1 inline-flex items-center gap-2 text-xs text-slate-500"
                  role="status"
                  aria-live="polite"
                >
                  <span
                    className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-500"
                    aria-hidden="true"
                  />
                  Updating results…
                </span>
              )}
            </div>
            {/* Search */}
            <MemberSearch
              search={search}
              setSearch={setSearch}
              roleFilter={roleFilter}
              setRoleFilter={setRoleFilter}
              searchInputRef={searchInputRef}
              roles={roles}
              roleLabels={roleLabels}
            />
          </div>

          {/* Members list view */}
          <MemberList
            members={members}
            selectedId={selectedId}
            loading={loading}
            loaded={loaded}
            isRefreshingResults={isRefreshingResults}
            loadError={loadError}
            refreshError={refreshError}
            onSelectMember={selectMember}
            onRetry={loadMembers}
          />

          {/* Retry */}
          {loadError && loaded && (
            <div className="mx-4 mb-4 rounded-xl border border-red-200 bg-red-50 p-4 sm:mx-5">
              <p className="text-sm text-red-900" role="alert">
                Couldn’t update the results: {loadError}
              </p>
              <button
                type="button"
                onClick={() => void loadMembers()}
                className="mt-3 min-h-10 rounded-lg border border-red-300 bg-white px-3 text-sm font-medium text-red-900 hover:bg-red-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
              >
                Retry results
              </button>
            </div>
          )}
          {refreshError && (
            <div className="mx-4 mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:mx-5">
              <p className="text-sm text-amber-950" role="alert">
                The role was saved, but the filtered member list could not be refreshed:{" "}
                {refreshError}
              </p>
              <button
                type="button"
                onClick={() => void loadMembers({ quiet: true })}
                className="mt-3 min-h-10 rounded-lg border border-amber-300 bg-white px-3 text-sm font-medium text-amber-950 hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
              >
                Retry refresh
              </button>
            </div>
          )}
        </section>
        {/* Member detail view */}
        <MemberDetails
          selectedMember={selectedMember}
          detailError={detailError}
          draftRole={draftRole}
          setDraftRole={setDraftRole}
          roles={roles}
          roleLabels={roleLabels}
          saving={saving}
          isRefreshingResults={isRefreshingResults}
          isDirty={isDirty}
          saveError={saveError}
          saveMessage={saveMessage}
          saveFeedbackRef={saveFeedbackRef}
          loading={loading}
          loaded={loaded}
          onSave={handleSaveRole}
          onRetrySave={() => void saveRole()}
        />
      </div>
    </main>
  );
}
