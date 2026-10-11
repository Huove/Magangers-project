"use client";

import { useState } from "react";
import "./style.css";

export default function StatusMenungguWawancaraPage() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="layout">
      {/* MAIN */}
      <div className="main">
        {/* TOPBAR */}
        <div className="topbar">
          <div className="timeline">
            <div className="step">
              <span>Registrasi</span>
              <div className="circle green"></div>
            </div>

            <div className="line"></div>

            <div className="step">
              <span>Mengajukan</span>
              <div className="circle green"></div>
            </div>

            <div className="line"></div>

            <div className="step">
              <span>Verifikasi</span>
              <div className="circle green"></div>
            </div>

            <div className="line"></div>

            <div className="step">
              <span>Wawancara</span>
              <div className="circle yellow"></div>
            </div>

            <div className="line"></div>

            <div className="step">
              <span>Diterima</span>
              <div className="circle red"></div>
            </div>
          </div>

          <div className="user">
            <div className="user-info">
              <span className="user-name">Nama Lengkap</span>
              <span className="user-status">Mengajukan</span>
            </div>
            <div className="avatar"></div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="content">
          <div className="card-area">
            <div className="card-bg"></div>

            <div className="card">
              <h2>Status Pendaftaran</h2>

              <div className="status-line cyan-status">
                <span className="status-dot"></span>
                <span>Menunggu Wawancara</span>
              </div>

              <div className="detail-box">
                <div className="row">
                  <span>Tanggal wawancara</span>
                  <span>Senin, 20 Juli 2026</span>
                </div>
                <div className="row">
                  <span>Jam wawancara</span>
                  <span>09.00 - 10.00 WIB</span>
                </div>
                <div className="row">
                  <span>Lokasi wawancara</span>
                  <span>
                    Ruang Meeting, Datasoft Solusi Indonesia
                  </span>
                </div>
                <div className="row">
                  <span>Metode wawancara</span>
                  <span>Offline</span>
                </div>
                <div className="row">
                  <span>Nama pewawancara</span>
                  <span>Fiki Permata Sari</span>
                </div>
                <div className="row">
                  <span>Hal yang harus dipersiapkan</span>
                  <span>CV & Portofolio</span>
                </div>
              </div>

              <div className="button-group">
                <button className="btn-yellow">
                  Ajukan Perubahan Jadwal
                </button>
                <button className="btn-green">
                  Konfirmasi Hadir
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}