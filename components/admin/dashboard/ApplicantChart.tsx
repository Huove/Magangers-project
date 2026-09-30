"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { supabase } from "@/lib/supabase";

// =====================================================
// TYPE
// =====================================================

interface PesertaRow {
  created_at: string;
}

interface ChartData {
  month: string;
  total: number;
}

// =====================================================
// COMPONENT
// =====================================================

export default function ApplicantChart() {
  const [
    data,
    setData,
  ] = useState<ChartData[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  // ===================================================
  // LOAD
  // ===================================================

  useEffect(() => {
    loadApplicantChart();
  }, []);

  // ===================================================
  // LOAD DATA
  // ===================================================

  async function loadApplicantChart() {
    try {
      setLoading(true);
      setError("");

      // ===============================================
      // AMBIL 7 BULAN TERAKHIR
      // ===============================================

      const months =
        getLastSevenMonths();

      const startDate =
        months[0].start;

      // ===============================================
      // AMBIL PESERTA
      // ===============================================

      const {
        data: pesertaData,
        error: pesertaError,
      } = await supabase
        .from("peserta")
        .select("created_at")
        .gte(
          "created_at",
          startDate.toISOString()
        )
        .order(
          "created_at",
          {
            ascending: true,
          }
        );

      if (pesertaError) {
        throw pesertaError;
      }

      const peserta =
        (pesertaData ||
          []) as PesertaRow[];

      // ===============================================
      // HITUNG JUMLAH TIAP BULAN
      // ===============================================

      const chartData: ChartData[] =
        months.map(
          (month) => {
            const total =
              peserta.filter(
                (item) => {
                  const date =
                    new Date(
                      item.created_at
                    );

                  return (
                    date.getFullYear() ===
                      month.year &&
                    date.getMonth() ===
                      month.month
                  );
                }
              ).length;

            return {
              month:
                month.label,

              total,
            };
          }
        );

      console.log(
        "APPLICANT CHART:",
        chartData
      );

      setData(chartData);
    } catch (err) {
      console.error(
        "APPLICANT CHART ERROR:",
        err
      );

      setError(
        "Gagal mengambil statistik pendaftar."
      );
    } finally {
      setLoading(false);
    }
  }

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

      {/* HEADER */}

      <div className="mb-5">

        <h2 className="text-lg font-semibold">
          Statistik Pendaftar
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Jumlah pendaftar baru
          selama 7 bulan terakhir.
        </p>

      </div>

      {/* LOADING */}

      {loading && (
        <div className="flex h-80 items-center justify-center">

          <p className="text-sm text-gray-400">
            Memuat statistik...
          </p>

        </div>
      )}

      {/* ERROR */}

      {!loading &&
        error && (

          <div className="flex h-80 items-center justify-center">

            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">

              <p className="text-sm text-red-600">
                {error}
              </p>

            </div>

          </div>

        )}

      {/* CHART */}

      {!loading &&
        !error && (

          <div className="h-80">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <LineChart
                data={data}
                margin={{
                  top: 10,
                  right: 10,
                  left: -20,
                  bottom: 0,
                }}
              >

                {/* GRID */}

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                />

                {/* X AXIS */}

                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                />

                {/* Y AXIS */}

                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                />

                {/* TOOLTIP */}

                <Tooltip
                  formatter={(
                    value
                  ) => [
                    `${value} Pendaftar`,
                    "Total",
                  ]}
                />

                {/* LINE */}

                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#2563EB"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                    fill:
                      "#2563EB",
                  }}
                  activeDot={{
                    r: 6,
                  }}
                />

              </LineChart>

            </ResponsiveContainer>

          </div>

        )}

    </div>
  );
}

// =====================================================
// 7 BULAN TERAKHIR
// =====================================================

function getLastSevenMonths() {
  const result: {
    label: string;
    month: number;
    year: number;
    start: Date;
  }[] = [];

  const today =
    new Date();

  // 6 bulan sebelumnya
  // + bulan sekarang
  for (
    let i = 6;
    i >= 0;
    i--
  ) {
    const date =
      new Date(
        today.getFullYear(),
        today.getMonth() - i,
        1
      );

    result.push({
      label:
        date.toLocaleDateString(
          "id-ID",
          {
            month: "short",
          }
        ),

      month:
        date.getMonth(),

      year:
        date.getFullYear(),

      start: date,
    });
  }

  return result;
}