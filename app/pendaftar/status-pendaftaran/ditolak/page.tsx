"use client";

import { useState } from "react";
import "./style.css";

export default function StatusDitolakPage() {
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
            <div className="timeline-line"></div>

            <div className="timeline-step">
              <span className="label">Wawancara</span>
              <div className="circle warning"></div>
            </div>
            <div className="timeline-line"></div>

            <div className="timeline-step">
              <span className="label">Diterima</span>
              <div className="circle danger"></div>
            </div>
          </div>

          <div className="user">
            <div className="user-info">
              <span className="user-name">Nama Lengkap</span>
              <span className="user-status red-text">
                Pendaftar Baru
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
              <div className="dash">-</div>
              <h2>Status Pendaftaran</h2>

              <div className="status-line red-status">
                <span className="status-dot"></span>
                <span className="big-status">DITOLAK</span>
              </div>

              <p>
                Terima kasih telah mengikuti proses seleksi.
                Saat ini Anda belum dapat diterima dalam program magang
              </p>

              <div className="notes">
                Notes : Tetap semangat, perbaiki dalam Problem Solving!!!
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}