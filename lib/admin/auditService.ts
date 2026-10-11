"use client";

import {
  adminApi,
} from "./adminApi";


// =====================================================
// METADATA
// =====================================================

export type AuditMetadata =
  Record<
    string,
    unknown
  >;


// =====================================================
// AUDIT
// =====================================================

export interface AdminAuditLog {
  id:
    string;

  actorId:
    string
    | null;

  actorName:
    string;

  actorEmail:
    string;

  action:
    string;

  entity:
    string;

  entityId:
    string
    | null;

  pesertaId:
    string
    | null;

  pesertaName:
    string
    | null;

  nomorPeserta:
    string
    | null;

  description:
    string;

  metadata:
    AuditMetadata;

  createdAt:
    string;
}


// =====================================================
// PAGINATION
// =====================================================

export interface AuditPagination {
  page:
    number;

  pageSize:
    number;

  total:
    number;

  totalPages:
    number;
}


// =====================================================
// STATS
// =====================================================

export interface AuditStats {
  total:
    number;

  admin:
    number;

  system:
    number;
}


// =====================================================
// DATA
// =====================================================

export interface AdminAuditData {
  logs:
    AdminAuditLog[];

  pagination:
    AuditPagination;

  stats:
    AuditStats;
}


// =====================================================
// RESPONSE
// =====================================================

interface AuditResponse {
  success:
    boolean;

  data:
    AdminAuditLog[];

  pagination:
    AuditPagination;

  stats:
    AuditStats;
}


// =====================================================
// PARAMS
// =====================================================

export interface GetAdminAuditParams {
  page?:
    number;

  pageSize?:
    number;

  entity?:
    string;

  action?:
    string;

  search?:
    string;
}


// =====================================================
// GET AUDIT
// =====================================================

export async function getAdminAuditLogs(
  params:
    GetAdminAuditParams = {}
): Promise<AdminAuditData> {
  const searchParams =
    new URLSearchParams();


  if (
    params.page
  ) {
    searchParams.set(
      "page",
      String(
        params.page
      )
    );
  }


  if (
    params.pageSize
  ) {
    searchParams.set(
      "pageSize",
      String(
        params.pageSize
      )
    );
  }


  if (
    params.entity
  ) {
    searchParams.set(
      "entity",
      params.entity
    );
  }


  if (
    params.action
  ) {
    searchParams.set(
      "action",
      params.action
    );
  }


  if (
    params.search
  ) {
    searchParams.set(
      "search",
      params.search
    );
  }


  const query =
    searchParams
      .toString();


  const response =
    await adminApi<
      AuditResponse
    >(
      `/api/admin/audit${
        query
          ? `?${query}`
          : ""
      }`
    );


  return {
    logs:
      response.data,

    pagination:
      response.pagination,

    stats:
      response.stats,
  };
}