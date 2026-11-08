"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  failNextSave,
  getMember,
  getMembers,
  updateMemberRole,
} from "../lib/members-api";
import type { Member, Role } from "../types/member";

export function useMembers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "">("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [draftRole, setDraftRole] = useState<Role | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [armingFailure, setArmingFailure] = useState(false);
  const [failureMessage, setFailureMessage] = useState<string | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  const loadMembers = useCallback(async () => {
    const currentRequestId = ++requestId.current;
    setLoading(true);
    setLoadError(null);
    try {
      const result = await getMembers(
        debouncedSearch || undefined,
        roleFilter || undefined,
      );
      if (currentRequestId !== requestId.current) return;
      setMembers(result);
      setLoaded(true);
      setSelectedId((current) => current ?? result[0]?.id ?? null);
    } catch (error) {
      if (currentRequestId !== requestId.current) return;
      setLoadError(
        error instanceof Error ? error.message : "Unable to load members.",
      );
    } finally {
      if (currentRequestId === requestId.current) setLoading(false);
    }
  }, [debouncedSearch, roleFilter]);

  useEffect(() => {
    void Promise.resolve().then(loadMembers);
  }, [loadMembers]);

  useEffect(() => {
    if (!selectedId) return;

    let active = true;
    void getMember(selectedId)
      .then((member) => {
        if (!active) return;
        setSelectedMember(member);
        setDraftRole(member.role);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setDetailError(
          error instanceof Error ? error.message : "Unable to load member details.",
        );
      });

    return () => {
      active = false;
    };
  }, [selectedId]);

  const selectMember = (memberId: string) => {
    if (saving || memberId === selectedId) return;
    if (
      selectedMember &&
      draftRole !== null &&
      draftRole !== selectedMember.role &&
      !window.confirm("Discard your unsaved role change?")
    ) {
      return;
    }
    setSelectedMember(null);
    setDetailError(null);
    setDraftRole(null);
    setSaveError(null);
    setSaveMessage(null);
    setSelectedId(memberId);
  };

  const saveRole = async () => {
    if (
      saving ||
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
      setSelectedMember(updatedMember);
      setMembers((current) =>
        current.map((member) =>
          member.id === updatedMember.id ? updatedMember : member,
        ),
      );
      setDraftRole(updatedMember.role);
      setSaveMessage("Travel role saved.");
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
  };
}
