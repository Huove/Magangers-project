"use client";

import { useState } from "react";
import "./style.css";


export default function StatusPerluPerbaikanPage() {
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
              <h2>Status Pendaftaran</h2>

              <div className="status-line red-status">
                <span className="status-dot"></span>
                <span>Perlu Perbaikan</span>
              </div>

              <div className="perbaikan-box">
                <p className="section-title">📌 Bagian yang Harus Diperbaiki</p>
                <ul>
                  <li>CV belum sesuai format</li>
                  <li>Surat Pengantar belum ditandatangani</li>
                  <li>Scan Kartu Pelajar kurang jelas</li>
                </ul>
              </div>

              <div className="catatan">
                <p>💬 Catatan Administrator</p>
                <span>
                  Mohon unggah dokumen terbaru sesuai ketentuan
                </span>
              </div>

              <div className="deadline">
                ⏰ Deadline <br />
                <span>20 Juli 2026 • 23.59 WIB</span>
              </div>

              <div className="button-group">
                <button className="btn-yellow">Perbaiki</button>
                <button className="btn-green">Kirim Ulang</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}