"use client";

import { useState } from "react";
import "./style.css";

export default function JadwalWawancaraPage() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="layout">
      {/* MAIN */}
      <div className="main">


        {/* CONTENT */}
        <div className="content">
          <div className="card-area">
            <div className="card-bg"></div>

            <div className="card">
              <h2>Pengumuman</h2>
              <p>Jadwal tes wawancara akan dilaksanakan</p>

              <div className="schedule">
                <div className="box">
                  <div className="badge smk">SMK</div>
                  <div className="date">31 Juli 2026</div>
                  <div className="time">15.00 WIB</div>
                </div>

                <div className="box">
                  <div className="badge mhs">MAHASISWA</div>
                  <div className="date">31 Mei 2026</div>
                  <div className="time">16.00 WIB</div>
                </div>
              </div>

              <div className="warning">
                Perhatikan informasi, Jangan terlambat!!!
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}