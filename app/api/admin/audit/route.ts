import {
  NextResponse,
} from "next/server";

import {
  requireAdmin,
} from "@/lib/admin/requireAdmin";

export const dynamic =
  "force-dynamic";


// =====================================================
// GET AUDIT LOG
// =====================================================

export async function GET(
  request: Request
) {
  try {
    // =================================================
    // AUTH
    // =================================================

    const auth =
      await requireAdmin(
        request
      );


    if (!auth.ok) {
      return auth.response;
    }


    const {
      supabase,
    } = auth;


    // =================================================
    // QUERY PARAMS
    // =================================================

    const url =
      new URL(
        request.url
      );


    const pageRaw =
      Number(
        url.searchParams.get(
          "page"
        ) ?? 1
      );


    const pageSizeRaw =
      Number(
        url.searchParams.get(
          "pageSize"
        ) ?? 20
      );


    const page =
      Number.isFinite(
        pageRaw
      )
        ? Math.max(
            pageRaw,
            1
          )
        : 1;


    const pageSize =
      Number.isFinite(
        pageSizeRaw
      )
        ? Math.min(
            Math.max(
              pageSizeRaw,
              5
            ),
            100
          )
        : 20;


    const entity =
      url.searchParams
        .get(
          "entity"
        )
        ?.trim() ??
      "";


    const action =
      url.searchParams
        .get(
          "action"
        )
        ?.trim() ??
      "";


    const search =
      url.searchParams
        .get(
          "search"
        )
        ?.trim() ??
      "";


    const from =
      (
        page -
        1
      ) *
      pageSize;


    const to =
      from +
      pageSize -
      1;


    // =================================================
    // MAIN QUERY
    // =================================================

    let query =
      supabase
        .from(
          "admin_audit_log"
        )
        .select(
          `
            id,
            actor_id,
            action,
            entity,
            entity_id,
            peserta_id,
            description,
            metadata,
            created_at
          `,
          {
            count:
              "exact",
          }
        )
        .order(
          "created_at",
          {
            ascending:
              false,
          }
        );


    // =================================================
    // FILTER ENTITY
    // =================================================

    if (
      entity &&
      entity !==
        "semua"
    ) {
      query =
        query.eq(
          "entity",
          entity
        );
    }


    // =================================================
    // FILTER ACTION
    // =================================================

    if (
      action &&
      action !==
        "semua"
    ) {
      query =
        query.eq(
          "action",
          action
        );
    }


    // =================================================
    // SEARCH DESCRIPTION
    // =================================================

    if (search) {
      query =
        query.ilike(
          "description",
          `%${search}%`
        );
    }


    // =================================================
    // PAGINATION
    // =================================================

    const {
      data: auditRows,
      error:
        auditError,
      count,
    } =
      await query.range(
        from,
        to
      );


    if (
      auditError
    ) {
      console.error(
        "Audit query error:",
        auditError
      );


      return NextResponse.json(
        {
          success:
            false,

          message:
            "Gagal mengambil audit log",
        },
        {
          status:
            500,
        }
      );
    }


    const rows =
      auditRows ??
      [];


    // =================================================
    // ACTOR IDS
    // =================================================

    const actorIds = [
      ...new Set(
        rows
          .map(
            (
              item
            ) =>
              item.actor_id
          )
          .filter(
            (
              id
            ): id is string =>
              Boolean(
                id
              )
          )
      ),
    ];


    // =================================================
    // PESERTA IDS
    // =================================================

    const pesertaIds = [
      ...new Set(
        rows
          .map(
            (
              item
            ) =>
              item.peserta_id
          )
          .filter(
            (
              id
            ): id is string =>
              Boolean(
                id
              )
          )
      ),
    ];


    // =================================================
    // PROFILES + PESERTA
    // =================================================

    const [
      profileResult,
      pesertaResult,
    ] =
      await Promise.all([
        actorIds.length >
        0
          ? supabase
              .from(
                "profiles"
              )
              .select(`
                id,
                nama_lengkap,
                email
              `)
              .in(
                "id",
                actorIds
              )

          : Promise.resolve({
              data: [],
              error:
                null,
            }),


        pesertaIds.length >
        0
          ? supabase
              .from(
                "peserta"
              )
              .select(`
                id,
                nama_lengkap,
                nomor_peserta
              `)
              .in(
                "id",
                pesertaIds
              )

          : Promise.resolve({
              data: [],
              error:
                null,
            }),
      ]);


    // =================================================
    // PROFILE MAP
    // =================================================

    const profileMap =
      new Map<
        string,
        {
          nama:
            string;

          email:
            string;
        }
      >();


    if (
      profileResult.error
    ) {
      console.error(
        "Audit profile error:",
        profileResult.error
      );
    } else {
      for (
        const profile
        of profileResult.data ??
        []
      ) {
        profileMap.set(
          profile.id,
          {
            nama:
              profile
                .nama_lengkap ??
              "Admin",

            email:
              profile.email ??
              "-",
          }
        );
      }
    }


    // =================================================
    // PESERTA MAP
    // =================================================

    const pesertaMap =
      new Map<
        string,
        {
          nama:
            string;

          nomorPeserta:
            string;
        }
      >();


    if (
      pesertaResult.error
    ) {
      console.error(
        "Audit peserta error:",
        pesertaResult.error
      );
    } else {
      for (
        const peserta
        of pesertaResult.data ??
        []
      ) {
        pesertaMap.set(
          peserta.id,
          {
            nama:
              peserta
                .nama_lengkap ??
              "Peserta",

            nomorPeserta:
              peserta
                .nomor_peserta ??
              "-",
          }
        );
      }
    }


    // =================================================
    // FORMAT
    // =================================================

    const result =
      rows.map(
        (
          item
        ) => {
          const actor =
            item.actor_id
              ? profileMap.get(
                  item.actor_id
                )
              : null;


          const peserta =
            item.peserta_id
              ? pesertaMap.get(
                  item.peserta_id
                )
              : null;


          return {
            id:
              item.id,

            actorId:
              item.actor_id ??
              null,

            actorName:
              item.actor_id
                ? actor?.nama ??
                  "Admin"
                : "System",

            actorEmail:
              item.actor_id
                ? actor?.email ??
                  "-"
                : "-",

            action:
              item.action,

            entity:
              item.entity,

            entityId:
              item.entity_id ??
              null,

            pesertaId:
              item.peserta_id ??
              null,

            pesertaName:
              peserta?.nama ??
              null,

            nomorPeserta:
              peserta
                ?.nomorPeserta ??
              null,

            description:
              item.description ??
              "",

            metadata:
              item.metadata ??
              {},

            createdAt:
              item.created_at,
          };
        }
      );


    // =================================================
    // GLOBAL SUMMARY
    // =================================================

    const [
      totalResult,
      adminResult,
      systemResult,
    ] =
      await Promise.all([
        supabase
          .from(
            "admin_audit_log"
          )
          .select(
            "id",
            {
              count:
                "exact",
              head:
                true,
            }
          ),


        supabase
          .from(
            "admin_audit_log"
          )
          .select(
            "id",
            {
              count:
                "exact",
              head:
                true,
            }
          )
          .not(
            "actor_id",
            "is",
            null
          ),


        supabase
          .from(
            "admin_audit_log"
          )
          .select(
            "id",
            {
              count:
                "exact",
              head:
                true,
            }
          )
          .is(
            "actor_id",
            null
          ),
      ]);


    const totalRows =
      count ??
      0;


    const totalPages =
      Math.max(
        Math.ceil(
          totalRows /
          pageSize
        ),
        1
      );


    return NextResponse.json({
      success:
        true,

      data:
        result,

      pagination: {
        page,

        pageSize,

        total:
          totalRows,

        totalPages,
      },

      stats: {
        total:
          totalResult.count ??
          0,

        admin:
          adminResult.count ??
          0,

        system:
          systemResult.count ??
          0,
      },
    });

  } catch (error) {
    console.error(
      "GET /api/admin/audit:",
      error
    );


    return NextResponse.json(
      {
        success:
          false,

        message:
          "Terjadi kesalahan pada server",
      },
      {
        status:
          500,
      }
    );
  }
}