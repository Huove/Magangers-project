"use client";

import { useEffect } from "react";

const COOKIE_NAME = "magangers_utm";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 90; // 90 hari

const UTM_KEYS = [
  "utm_id",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;

function cleanValue(
  value: string | null,
  maxLength = 200
): string | null {
  if (!value) {
    return null;
  }

  const cleaned = value.trim();

  if (!cleaned) {
    return null;
  }

  return cleaned.slice(0, maxLength);
}

export default function UtmTracker() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(
        window.location.search
      );

      const utmData = {
        utm_id: cleanValue(
          params.get("utm_id")
        ),

        utm_source: cleanValue(
          params.get("utm_source")
        ),

        utm_medium: cleanValue(
          params.get("utm_medium")
        ),

        utm_campaign: cleanValue(
          params.get("utm_campaign")
        ),

        utm_term: cleanValue(
          params.get("utm_term")
        ),

        utm_content: cleanValue(
          params.get("utm_content")
        ),

        landing_page:
          `${window.location.pathname}${window.location.search}`.slice(
            0,
            1000
          ),

        referrer: cleanValue(
          document.referrer,
          1000
        ),
      };

      const hasUtm = UTM_KEYS.some(
        (key) => Boolean(utmData[key])
      );

      if (!hasUtm) {
        return;
      }

      // Jangan timpa attribution pertama.
      const existingCookie =
        document.cookie
          .split("; ")
          .find((row) =>
            row.startsWith(
              `${COOKIE_NAME}=`
            )
          );

      if (existingCookie) {
        return;
      }

      const encoded = encodeURIComponent(
        JSON.stringify(utmData)
      );

      const secure =
        window.location.protocol === "https:"
          ? "; Secure"
          : "";

      document.cookie =
        `${COOKIE_NAME}=${encoded}; ` +
        `Path=/; ` +
        `Max-Age=${COOKIE_MAX_AGE}; ` +
        `SameSite=Lax` +
        secure;
    } catch (error) {
      console.warn(
        "UTM TRACKING ERROR:",
        error
      );
    }
  }, []);

  return null;
}