
"use client";

import type { Ref } from "react";
import type { Role } from "../../types/member";

type MemberSearchProps = {
    search: string;
    setSearch: (value: string) => void;
    roleFilter: Role | "";
    setRoleFilter: (value: Role | "") => void;
    searchInputRef: Ref<HTMLInputElement>;
    roles: Role[];
    roleLabels: Record<Role, string>;
};

export function MemberSearch({
    search,
    setSearch,
    roleFilter,
    setRoleFilter,
    searchInputRef,
    roles,
    roleLabels,
}: MemberSearchProps) {
    return (
        <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem]">
            <div>
                <label
                    htmlFor="member-search"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                    Search members
                </label>
                <input
                    ref={searchInputRef}
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
    );
}
