"use client";

import { useMembers } from "../hooks/use-members";
import type { Role } from "../types/member";

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
    loadError,
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
  const isDirty =
    selectedMember !== null &&
    draftRole !== null &&
    draftRole !== selectedMember.role;

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
                  {loading && loaded
                    ? "Updating results…"
                    : `${members.length} ${members.length === 1 ? "member" : "members"}`}
                </p>
              </div>
              {loading && (
                <span
                  className="mt-1 inline-flex items-center gap-2 text-sm text-indigo-700"
                  role="status"
                >
                  <span
                    className="h-2 w-2 animate-pulse rounded-full bg-indigo-600"
                    aria-hidden="true"
                  />
                  Loading
                </span>
              )}
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem]">
              <div>
                <label
                  htmlFor="member-search"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Search members
                </label>
                <input
                  id="member-search"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Name or email"
                  className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm shadow-sm placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                />
              </div>
              <div>
                <label
                  htmlFor="role-filter"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Travel role
                </label>
                <select
                  id="role-filter"
                  value={roleFilter}
                  onChange={(event) =>
                    setRoleFilter(event.target.value as Role | "")
                  }
                  className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  <option value="">All roles</option>
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {roleLabels[role]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {loadError ? (
            <div className="m-5 rounded-xl border border-red-200 bg-red-50 p-4 sm:m-6">
              <p className="font-medium text-red-900">Couldn’t load members</p>
              <p className="mt-1 text-sm text-red-800" role="alert">
                {loadError}
              </p>
              <button
                type="button"
                onClick={() => void loadMembers()}
                className="mt-3 min-h-10 rounded-lg border border-red-300 bg-white px-3 text-sm font-medium text-red-900 hover:bg-red-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
              >
                Try again
              </button>
            </div>
          ) : members.length === 0 && !loading ? (
            <div className="px-5 py-12 text-center sm:px-6">
              <p className="font-medium text-slate-900">No members found</p>
              <p className="mt-1 text-sm text-slate-600">
                Try another name, email, or role.
              </p>
            </div>
          ) : (
            <ul
              className="grid gap-3 p-4 sm:p-5 lg:grid-cols-1"
              aria-label="Members"
              aria-busy={loading}
            >
              {members.map((member) => {
                const isSelected = selectedId === member.id;
                return (
                  <li key={member.id}>
                    <button
                      type="button"
                      onClick={() => selectMember(member.id)}
                      aria-current={isSelected ? "true" : undefined}
                      className={`w-full rounded-xl border p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:flex sm:items-center sm:justify-between ${
                        isSelected
                          ? "border-indigo-300 bg-indigo-50"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <span className="block min-w-0">
                        <span className="block truncate font-semibold text-slate-900">
                          {member.firstName} {member.lastName}
                        </span>
                        <span className="mt-1 block truncate text-sm text-slate-600">
                          {member.email}
                        </span>
                      </span>
                      <span className="mt-3 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 sm:mt-0">
                        {roleLabels[member.role]}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section
          aria-labelledby="details-heading"
          className="h-fit min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
            <h2 id="details-heading" className="text-lg font-semibold">
              Member details
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Review profile information and update the travel role.
            </p>
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
                  void saveRole();
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
                  onChange={(event) => {
                    setDraftRole(event.target.value as Role);
                  }}
                  disabled={saving}
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
                    disabled={!isDirty || saving}
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
                      onClick={() => void saveRole()}
                      disabled={saving}
                      className="mt-2 min-h-9 rounded-md border border-red-300 bg-white px-3 font-medium hover:bg-red-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:opacity-60"
                    >
                      Retry save
                    </button>
                  </div>
                )}
                {saveMessage && (
                  <p
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
      </div>
    </main>
  );
}
