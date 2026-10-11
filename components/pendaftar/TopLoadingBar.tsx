"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function TopLoadingBar() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);

    const timer = setTimeout(() => {
      setLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <div
      className={`fixed top-0 left-0 h-[3px] bg-blue-500 z-[9999] transition-all duration-300 ${
        loading ? "w-full opacity-100" : "w-0 opacity-0"
      }`}
    />
  );
}