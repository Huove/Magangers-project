"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Loader2,
} from "lucide-react";

import { supabase } from "@/lib/supabase";


type MasterDivision = {
  id: string;
  nama: string;
  aktif: boolean;
};


type MasterPosition = {
  id: string;
  divisiId: string;
  divisiNama: string;
  nama: string;
  aktif: boolean;
};


type RawPosition = {
  id?: unknown;
  divisiId?: unknown;
  divisi_id?: unknown;
  divisiNama?: unknown;
  divisi_nama?: unknown;
  nama?: unknown;
  aktif?: unknown;
};


interface MasterPlacementSelectsProps {
  divisi: string;
  posisi: string;
  onDivisiChange: (value: string) => void;
  onPosisiChange: (value: string) => void;
  disabled?: boolean;
}


interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  data?: T;
}


export default function MasterPlacementSelects({
  divisi,
  posisi,
  onDivisiChange,
  onPosisiChange,
  disabled = false,
}: MasterPlacementSelectsProps) {
  const [
    divisions,
    setDivisions,
  ] =
    useState<MasterDivision[]>([]);


  const [
    positions,
    setPositions,
  ] =
    useState<MasterPosition[]>([]);


  const [
    loading,
    setLoading,
  ] =
    useState(true);


  const [
    error,
    setError,
  ] =
    useState("");


  useEffect(() => {
    let mounted = true;


    async function loadMasterData() {
      try {
        setLoading(true);
        setError("");


        const [
          divisionData,
          positionData,
        ] =
          await Promise.all([
            adminGet<MasterDivision[]>(
              "/api/admin/master-data/divisi"
            ),

            adminGet<RawPosition[]>(
              "/api/admin/master-data/posisi"
            ),
          ]);


        if (!mounted) {
          return;
        }


        const normalizedDivisions =
          (
            divisionData ??
            []
          )
            .filter(
              (
                item
              ) =>
                Boolean(
                  item?.id
                ) &&
                Boolean(
                  item?.nama
                )
            )
            .map(
              (
                item
              ) => ({
                id:
                  String(
                    item.id
                  ),

                nama:
                  String(
                    item.nama
                  ),

                aktif:
                  item.aktif !==
                  false,
              })
            );


        const normalizedPositions =
          (
            positionData ??
            []
          )
            .map(
              normalizePosition
            )
            .filter(
              (
                item
              ): item is MasterPosition =>
                Boolean(item)
            );


        normalizedDivisions.sort(
          (
            a,
            b
          ) =>
            a.nama.localeCompare(
              b.nama,
              "id"
            )
        );


        normalizedPositions.sort(
          (
            a,
            b
          ) => {
            const byDivision =
              a.divisiNama.localeCompare(
                b.divisiNama,
                "id"
              );


            if (
              byDivision !==
              0
            ) {
              return byDivision;
            }


            return a.nama.localeCompare(
              b.nama,
              "id"
            );
          }
        );


        setDivisions(
          normalizedDivisions
        );


        setPositions(
          normalizedPositions
        );

      } catch (
        error
      ) {
        console.warn(
          "LOAD MASTER PLACEMENT:",
          error
        );


        if (!mounted) {
          return;
        }


        setError(
          error instanceof Error
            ? error.message
            : "Gagal memuat pilihan divisi dan posisi."
        );

      } finally {
        if (
          mounted
        ) {
          setLoading(false);
        }
      }
    }


    loadMasterData();


    return () => {
      mounted = false;
    };
  }, []);


  const activeDivisions =
    useMemo(
      () =>
        divisions.filter(
          (
            item
          ) =>
            item.aktif
        ),
      [
        divisions,
      ]
    );


  const selectedDivision =
    useMemo(
      () =>
        divisions.find(
          (
            item
          ) =>
            sameText(
              item.nama,
              divisi
            )
        ) ??
        null,
      [
        divisions,
        divisi,
      ]
    );


  const availablePositions =
    useMemo(
      () => {
        if (
          !selectedDivision
        ) {
          return [];
        }


        return positions.filter(
          (
            item
          ) =>
            item.aktif &&
            item.divisiId ===
              selectedDivision.id
        );
      },
      [
        positions,
        selectedDivision,
      ]
    );


  const currentDivisionInActiveMaster =
    activeDivisions.some(
      (
        item
      ) =>
        sameText(
          item.nama,
          divisi
        )
    );


  const currentPositionInActiveMaster =
    availablePositions.some(
      (
        item
      ) =>
        sameText(
          item.nama,
          posisi
        )
    );


  function handleDivisionChange(
    nextDivision: string
  ) {
    const changed =
      !sameText(
        nextDivision,
        divisi
      );


    onDivisiChange(
      nextDivision
    );


    if (
      changed
    ) {
      onPosisiChange("");
    }
  }


  if (
    loading
  ) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <Loader2
            size={16}
            className="animate-spin"
          />

          Memuat pilihan divisi dan posisi...
        </div>
      </div>
    );
  }


  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}


      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-neutral-700">
            Divisi
          </span>


          <select
            value={
              divisi
            }
            disabled={
              disabled ||
              loading
            }
            onChange={(
              event
            ) =>
              handleDivisionChange(
                event.target.value
              )
            }
            className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500"
          >
            <option value="">
              Pilih divisi
            </option>


            {divisi &&
              !currentDivisionInActiveMaster && (

              <option
                value={
                  divisi
                }
              >
                {divisi} (data lama/nonaktif)
              </option>

            )}


            {activeDivisions.map(
              (
                item
              ) => (

              <option
                key={
                  item.id
                }
                value={
                  item.nama
                }
              >
                {item.nama}
              </option>

              )
            )}
          </select>
        </label>


        <label className="block">
          <span className="mb-2 block text-sm font-medium text-neutral-700">
            Posisi
          </span>


          <select
            value={
              posisi
            }
            disabled={
              disabled ||
              !divisi
            }
            onChange={(
              event
            ) =>
              onPosisiChange(
                event.target.value
              )
            }
            className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500"
          >
            <option value="">
              {!divisi
                ? "Pilih divisi terlebih dahulu"
                : "Pilih posisi"}
            </option>


            {posisi &&
              !currentPositionInActiveMaster && (

              <option
                value={
                  posisi
                }
              >
                {posisi} (data lama/nonaktif)
              </option>

            )}


            {availablePositions.map(
              (
                item
              ) => (

              <option
                key={
                  item.id
                }
                value={
                  item.nama
                }
              >
                {item.nama}
              </option>

              )
            )}
          </select>
        </label>
      </div>


      {!error &&
        activeDivisions.length ===
          0 && (

        <p className="text-xs text-amber-600">
          Belum ada divisi aktif. Tambahkan atau aktifkan divisi di Master Data.
        </p>

      )}


      {!error &&
        divisi &&
        selectedDivision &&
        availablePositions.length ===
          0 && (

        <p className="text-xs text-amber-600">
          Belum ada posisi aktif untuk divisi ini.
        </p>

      )}
    </div>
  );
}


async function adminGet<T>(
  url: string
): Promise<T> {
  const {
    data: {
      session,
    },
    error:
      sessionError,
  } =
    await supabase.auth
      .getSession();


  if (
    sessionError
  ) {
    throw sessionError;
  }


  const token =
    session?.access_token;


  if (
    !token
  ) {
    throw new Error(
      "Sesi admin tidak ditemukan. Silakan login kembali."
    );
  }


  const response =
    await fetch(
      url,
      {
        method:
          "GET",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },

        cache:
          "no-store",
      }
    );


  const rawText =
    await response.text();


  let result:
    ApiResponse<T>;


  try {
    result =
      JSON.parse(
        rawText
      ) as ApiResponse<T>;
  } catch {
    throw new Error(
      `Response ${url} tidak valid.`
    );
  }


  if (
    !response.ok ||
    result.success ===
      false
  ) {
    throw new Error(
      result.message ||
        `Gagal mengambil data dari ${url}.`
    );
  }


  if (
    result.data ===
    undefined
  ) {
    throw new Error(
      `Data dari ${url} tidak tersedia.`
    );
  }


  return result.data;
}


function normalizePosition(
  item: RawPosition
): MasterPosition | null {
  const id =
    getNonEmptyString(
      item.id
    );


  const divisiId =
    getNonEmptyString(
      item.divisiId
    ) ||
    getNonEmptyString(
      item.divisi_id
    );


  const divisiNama =
    getNonEmptyString(
      item.divisiNama
    ) ||
    getNonEmptyString(
      item.divisi_nama
    );


  const nama =
    getNonEmptyString(
      item.nama
    );


  if (
    !id ||
    !divisiId ||
    !nama
  ) {
    return null;
  }


  return {
    id,
    divisiId,
    divisiNama,
    nama,
    aktif:
      item.aktif !==
      false,
  };
}


function getNonEmptyString(
  value: unknown
) {
  if (
    typeof value !==
    "string"
  ) {
    return "";
  }


  return value.trim();
}


function sameText(
  left: string,
  right: string
) {
  return (
    left
      .trim()
      .toLocaleLowerCase(
        "id-ID"
      ) ===
    right
      .trim()
      .toLocaleLowerCase(
        "id-ID"
      )
  );
}
