"use client";

import { useState } from "react";
import "./style.css";

export default function StatusPendaftarPage() {
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
              <div className="circle yellow"></div>
            </div>

            <div className="line"></div>

            <div className="step">
              <span>Verifikasi</span>
              <div className="circle red"></div>
            </div>

            <div className="line"></div>

            <div className="step">
              <span>Wawancara</span>
              <div className="circle red"></div>
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
              <div className="dash">-</div>
              <h2>Status Pendaftaran</h2>

              <div className="status-line purple">
                <span className="status-dot"></span>
                <span>Pendaftar</span>
              </div>

              <p>
                Silakan lengkapi data diri dan ajukan permohonan magang.
              </p>

              <button className="btn-green">Kirim Ulang</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}