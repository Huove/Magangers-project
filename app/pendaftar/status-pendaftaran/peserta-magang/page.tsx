"use client";

import { useState } from "react";
import "./style.css";

export default function StatusPesertaMagangPage() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="layout">
      {/* MAIN */}
      <div className="main">
        {/* TOPBAR */}
        <div className="topbar">
<div className="timeline">
  <div className="timeline-step">
    <span className="label">Registrasi</span>
    <div className="circle active"></div>
  </div>

  <div className="timeline-line active"></div>

  <div className="timeline-step">
    <span className="label">Mengajukan</span>
    <div className="circle active"></div>
  </div>

  <div className="timeline-line active"></div>

  <div className="timeline-step">
    <span className="label">Verifikasi</span>
    <div className="circle active"></div>
  </div>

  <div className="timeline-line active"></div>

  <div className="timeline-step">
    <span className="label">Wawancara</span>
    <div className="circle active"></div>
  </div>

  <div className="timeline-line active"></div>

  <div className="timeline-step">
    <span className="label">Diterima</span>
    <div className="circle active"></div>
  </div>
</div>

          <div className="user">
            <div className="user-info">
              <span className="user-name">Nama Lengkap</span>
              <span className="user-status green-text">
                Peserta Magang
              </span>
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

              <div className="status-line green-status">
                <span className="status-dot"></span>
                <span className="big-status">DI TERIMA</span>
              </div>

              <p className="subtitle">
                Selamat anda dinyatakan lolos tes wawancara
              </p>

              <div className="detail-box">
                <div><b>Divisi :</b> Teknologi Informasi</div>
                <div><b>Lokasi Magang :</b> PT. Datasoft Solusi Indonesia</div>
                <div><b>Posisi :</b> Web Developer</div>
                <div><b>Nama pembimbing :</b> Budi Tzy, S.Kom</div>
                <div><b>Jam kerja :</b> 08.00 - 16.00 WIB</div>
                <div className="link">Peraturan peserta magang</div>
                <div><b>Tanggal orientasi :</b> 1 Agustus 2026</div>
                <div><b>Tanggal mulai magang :</b> 3 Agustus 2026</div>
                <div><b>Tanggal selesai magang :</b> 31 Oktober 2026</div>
              </div>

              <button className="btn-green">
                Konfirmasi Kesediaan Magang
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}