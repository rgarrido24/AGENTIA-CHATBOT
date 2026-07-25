"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type PhotoSlot =
  | "hero.portada"
  | "amaia.avatar"
  | "amaia.primerDia"
  | "amaia.diaFinal"
  | "maestra.vale"
  | "maestra.paty"
  | "generacion.grupal";

const SLOT_LABELS: Record<PhotoSlot, string> = {
  "hero.portada": "Portada / Hero",
  "amaia.avatar": "Amaia · Avatar",
  "amaia.primerDia": "Amaia · Primer día",
  "amaia.diaFinal": "Amaia · Día final",
  "maestra.vale": "Miss Vale",
  "maestra.paty": "Miss Paty",
  "generacion.grupal": "Foto grupal",
};

type PhotoMap = Partial<Record<PhotoSlot, string>>;

type Ctx = {
  photos: PhotoMap;
  setPhoto: (slot: PhotoSlot, file: File) => void;
  clearPhoto: (slot: PhotoSlot) => void;
  resolve: (slot: PhotoSlot | null | undefined, fallback: string | null) => string | null;
  labels: typeof SLOT_LABELS;
  slots: PhotoSlot[];
};

const PhotoContext = createContext<Ctx | null>(null);

export function PhotoStudioProvider({ children }: { children: ReactNode }) {
  const [photos, setPhotos] = useState<PhotoMap>({});

  const setPhoto = useCallback((slot: PhotoSlot, file: File) => {
    const url = URL.createObjectURL(file);
    setPhotos((prev) => {
      if (prev[slot]) URL.revokeObjectURL(prev[slot]!);
      return { ...prev, [slot]: url };
    });
  }, []);

  const clearPhoto = useCallback((slot: PhotoSlot) => {
    setPhotos((prev) => {
      if (prev[slot]) URL.revokeObjectURL(prev[slot]!);
      const next = { ...prev };
      delete next[slot];
      return next;
    });
  }, []);

  const resolve = useCallback(
    (slot: PhotoSlot | null | undefined, fallback: string | null) => {
      if (slot && photos[slot]) return photos[slot]!;
      return fallback;
    },
    [photos]
  );

  const value = useMemo(
    () => ({
      photos,
      setPhoto,
      clearPhoto,
      resolve,
      labels: SLOT_LABELS,
      slots: Object.keys(SLOT_LABELS) as PhotoSlot[],
    }),
    [photos, setPhoto, clearPhoto, resolve]
  );

  return <PhotoContext.Provider value={value}>{children}</PhotoContext.Provider>;
}

export function usePhotoStudio() {
  const ctx = useContext(PhotoContext);
  if (!ctx) throw new Error("usePhotoStudio must be used within PhotoStudioProvider");
  return ctx;
}
