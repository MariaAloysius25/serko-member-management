"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { failNextSave, getMembers, updateMemberRole } from "../lib/members-api";
import type { Member, Role } from "../types/member";

export function getSelectionAfterRefresh(
  updatedMemberId: string,
  refreshedMembers: Member[],
): Member | null {
  return reconcileMemberSelection(
    updatedMemberId,
    refreshedMembers,
    updatedMemberId,
  );
}

export function reconcileMemberSelection(
  selectedMemberId: string | null,
  refreshedMembers: Member[],
  preferredMemberId: string | null = selectedMemberId,
): Member | null {
  const memberToKeep = preferredMemberId ?? selectedMemberId;
  return (
    refreshedMembers.find((member) => member.id === memberToKeep) ??
    refreshedMembers[0] ??
    null
  );
}

export function getSelectedMember(
  selectedMemberId: string | null,
  members: Member[],
): Member | null {
  return members.find((member) => member.id === selectedMemberId) ?? null;
}

export function useMembers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "">("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedMember = getSelectedMember(selectedId, members);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [draftRole, setDraftRole] = useState<Role | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [armingFailure, setArmingFailure] = useState(false);
  const [failureMessage, setFailureMessage] = useState<string | null>(null);
  const requestId = useRef(0);
  const selectionAfterSave = useRef<string | null>(null);
  const [appliedFilterState, setAppliedFilterState] = useState<{
    search: string;
    roleFilter: Role | "";
  }>({ search: "", roleFilter: "" });
  const filters = useRef({ search: debouncedSearch, roleFilter });
  const appliedFilters = useRef({
    search: "",
    roleFilter: "" as Role | "",
  });
  const selection = useRef({ selectedId, selectedMember, draftRole });
  const hasUnappliedFilters =
    search !== debouncedSearch ||
    debouncedSearch !== appliedFilterState.search ||
    roleFilter !== appliedFilterState.roleFilter;
  const isRefreshingResults =
    (loading && loaded) || (hasUnappliedFilters && !loadError);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    filters.current = { search: debouncedSearch, roleFilter };
  }, [debouncedSearch, roleFilter]);

  useEffect(() => {
    selection.current = { selectedId, selectedMember, draftRole };
  }, [selectedId, selectedMember, draftRole]);

  const loadMembers = useCallback(async (options: { quiet?: boolean } = {}) => {
    const currentRequestId = ++requestId.current;
    if (!options.quiet) setLoading(true);
    setLoadError(null);
    setRefreshError(null);
    try {
      const currentFilters = filters.current;
      const result = await getMembers(
        currentFilters.search || undefined,
        currentFilters.roleFilter || undefined,
      );
      if (currentRequestId !== requestId.current) return;

      const currentSelection = selection.current;
      const preferredMemberId = selectionAfterSave.current;
      const selected = reconcileMemberSelection(
        currentSelection.selectedId,
        result,
        preferredMemberId,
      );
      const selectionWillChange = selected?.id !== currentSelection.selectedId;
      const hasUnsavedChanges =
        currentSelection.selectedMember !== null &&
        currentSelection.draftRole !== null &&
        currentSelection.draftRole !== currentSelection.selectedMember.role;

      if (
        selectionWillChange &&
        !preferredMemberId &&
        hasUnsavedChanges &&
        !window.confirm("Discard your unsaved role change?")
      ) {
        const previousFilters = appliedFilters.current;
        filters.current = previousFilters;
        setAppliedFilterState(previousFilters);
        setSearch(previousFilters.search);
        setDebouncedSearch(previousFilters.search);
        setRoleFilter(previousFilters.roleFilter);
        return;
      }

      appliedFilters.current = currentFilters;
      setAppliedFilterState(currentFilters);
      setMembers(result);
      setLoaded(true);
      selectionAfterSave.current = null;
      const nextDraftRole =
        selected?.id === currentSelection.selectedId
          ? currentSelection.draftRole
          : (selected?.role ?? null);
      selection.current = {
        selectedId: selected?.id ?? null,
        selectedMember: selected,
        draftRole: nextDraftRole,
      };
      setSelectedId(selected?.id ?? null);
      setDetailError(null);
      if (selected?.id !== currentSelection.selectedId) {
        setDraftRole(selected?.role ?? null);
        setSaveError(null);
        setSaveMessage(null);
      }
    } catch (error) {
      if (currentRequestId !== requestId.current) return;
      const message =
        error instanceof Error ? error.message : "Unable to load members.";
      if (options.quiet) {
        setRefreshError(message);
      } else {
        setLoadError(message);
      }
    } finally {
      if (currentRequestId === requestId.current && !options.quiet) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => loadMembers());
  }, [debouncedSearch, roleFilter, loadMembers]);

  const selectMember = (memberId: string) => {
    if (saving || isRefreshingResults || memberId === selectedId) return;
    if (
      selectedMember &&
      draftRole !== null &&
      draftRole !== selectedMember.role &&
      !window.confirm("Discard your unsaved role change?")
    ) {
      return;
    }
    const member =
      members.find((candidate) => candidate.id === memberId) ?? null;
    selectionAfterSave.current = null;
    selection.current = {
      selectedId: memberId,
      selectedMember: member,
      draftRole: member?.role ?? null,
    };
    setDetailError(null);
    setDraftRole(member?.role ?? null);
    setSaveError(null);
    setSaveMessage(null);
    setRefreshError(null);
    setSelectedId(memberId);
  };

  const saveRole = async () => {
    if (
      saving ||
      isRefreshingResults ||
      hasUnappliedFilters ||
      !selectedMember ||
      !draftRole ||
      draftRole === selectedMember.role
    ) {
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaveMessage(null);
    try {
      const updatedMember = await updateMemberRole(
        selectedMember.id,
        draftRole,
      );
      selection.current = {
        selectedId: updatedMember.id,
        selectedMember: updatedMember,
        draftRole: updatedMember.role,
      };
      setMembers((current) =>
        current.map((member) =>
          member.id === updatedMember.id ? updatedMember : member,
        ),
      );
      setDraftRole(updatedMember.role);
      setSaveMessage("Travel role saved.");
      selectionAfterSave.current = updatedMember.id;
      await loadMembers({ quiet: true });
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Unable to save the travel role. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const armFailure = async () => {
    setArmingFailure(true);
    setFailureMessage(null);
    try {
      await failNextSave();
      setFailureMessage("The next role save is set to fail.");
    } catch (error) {
      setFailureMessage(
        error instanceof Error
          ? error.message
          : "Unable to arm the simulated failure.",
      );
    } finally {
      setArmingFailure(false);
    }
  };

  return {
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
  };
}
