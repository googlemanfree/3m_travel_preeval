import React, { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { OFFICE_CONTACTS, type OfficeContact, type OfficeId } from "@/lib/officeContacts";

const STORAGE_KEY = "3m_selected_contact_office";

type OfficeContactContextValue = {
  office: OfficeContact;
  officeId: OfficeId;
  setOfficeId: (officeId: OfficeId) => void;
};

const OfficeContactContext = createContext<OfficeContactContextValue | null>(null);

export function OfficeContactProvider({ children }: { children: ReactNode }) {
  const [officeId, setOfficeId] = useState<OfficeId>(() => {
    if (typeof window === "undefined") return "ottawa";
    return sessionStorage.getItem(STORAGE_KEY) === "cameroon" ? "cameroon" : "ottawa";
  });

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, officeId);
  }, [officeId]);

  const value = useMemo(() => ({ office: OFFICE_CONTACTS[officeId], officeId, setOfficeId }), [officeId]);
  return <OfficeContactContext.Provider value={value}>{children}</OfficeContactContext.Provider>;
}

export function useOfficeContact() {
  const context = useContext(OfficeContactContext);
  if (!context) throw new Error("useOfficeContact doit être utilisé dans OfficeContactProvider");
  return context;
}
