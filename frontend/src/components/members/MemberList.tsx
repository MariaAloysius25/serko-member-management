"use client";

import type { Member } from "../../types/member";

type MemberListProps = {
    members: Member[];
    selectedId: string | null;
    loading: boolean;
    loaded: boolean;
    isRefreshingResults: boolean;
    loadError: string | null;
    refreshError: string | null;
    onSelectMember: (id: string) => void;
    onRetry: () => void;
};

export function MemberList({
    members,
    selectedId,
    loading,
    loaded,
    isRefreshingResults,
    loadError,
    refreshError,
    onSelectMember,
    onRetry,
}: MemberListProps) {
    if (loading && !loaded) {
        return <p className="mt-5 text-sm text-slate-500">Loading members…</p>;
    }

    if (loadError && !loaded) {
        return (
            <div className="mt-5" role="alert">
                <p className="text-sm text-red-700">{loadError}</p>
                <button
                    type="button"
                    onClick={onRetry}
                    className="mt-3 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (members.length === 0) {
        return (
            <p className="mt-5 text-sm text-slate-500">
                No members found. Try changing your search or role filter.
            </p>
        );
    }

    return (
        <div className="mt-5">
            {isRefreshingResults && (
                <p className="mb-3 text-sm text-slate-500" role="status">
                    Updating results…
                </p>
            )}

            {refreshError && (
                <div className="mb-3" role="alert">
                    <p className="text-sm text-red-700">{refreshError}</p>
                    <button
                        type="button"
                        onClick={onRetry}
                        className="mt-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium"
                    >
                        Retry
                    </button>
                </div>
            )}

            <ul className="divide-y divide-slate-200">
                {members.map((member) => {
                    const isSelected = selectedId === member.id;

                    return (
                        <li key={member.id}>
                            <button
                                type="button"
                                onClick={() => onSelectMember(member.id)}
                                aria-current={isSelected ? "true" : undefined}
                                className={`w-full rounded-lg px-3 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${isSelected
                                    ? "bg-indigo-50"
                                    : "hover:bg-slate-50"
                                    }`}
                            >
                                <span className="block font-medium text-slate-900">
                                    {member.firstName} {member.lastName}
                                </span>
                                <span className="mt-1 block text-sm text-slate-500">
                                    {member.email}
                                </span>
                            </button>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}