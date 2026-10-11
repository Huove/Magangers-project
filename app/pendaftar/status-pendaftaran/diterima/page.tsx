"use client";

import { useState } from "react";
import "./style.css";

export default function StatusDiterimaPage() {
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

              <div className="status-line green-status">
                <span className="status-dot"></span>
                <span className="big-status">DITERIMA</span>
              </div>

              <p>
                Data diri dan dokumen Anda telah diterima. Silakan mengikuti
                proses wawancara sesuai jadwal yang telah ditentukan.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}