"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Student } from "../data";

type Ctx = {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  featured: Student | null;
};

const StudentsContext = createContext<Ctx | null>(null);

export function StudentsProvider({
  initial,
  featuredSlug = "amaia",
  children,
}: {
  initial: Student[];
  featuredSlug?: string;
  children: ReactNode;
}) {
  const [students, setStudents] = useState<Student[]>(initial);
  const featured = useMemo(
    () => students.find((s) => s.slug === featuredSlug) || students[0] || null,
    [students, featuredSlug]
  );

  return (
    <StudentsContext.Provider value={{ students, setStudents, featured }}>
      {children}
    </StudentsContext.Provider>
  );
}

export function useStudents() {
  const ctx = useContext(StudentsContext);
  if (!ctx) throw new Error("useStudents must be used within StudentsProvider");
  return ctx;
}
