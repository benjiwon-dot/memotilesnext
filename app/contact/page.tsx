"use client";

import React from "react";
import { Mail, MessageCircle } from "lucide-react";
import { useApp } from "@/context/AppContext";
import MarketingLayout from "@/components/MarketingLayout";

type Lang = "EN" | "TH";

const CONTACT_CONTENT: Record<
  Lang,
  {
    title: string;
    subtitle: string;
    emailLabel: string;
    lineLabel: string;
    lineCta: string;
    lineNote: string;
  }
> = {
  EN: {
    title: "Contact Us",
    subtitle: "Need help? We're here for you.",
    emailLabel: "Email",
    lineLabel: "LINE Chat",
    lineCta: "Chat with us on LINE",
    lineNote: "Fastest support via LINE.",
  },
  TH: {
    title: "ติดต่อเรา",
    subtitle: "ต้องการความช่วยเหลือ? เราพร้อมดูแลคุณ",
    emailLabel: "อีเมล",
    lineLabel: "แชทผ่าน LINE",
    lineCta: "แชทกับเราผ่าน LINE",
    lineNote: "ติดต่อได้รวดเร็วที่สุดผ่าน LINE",
  },
};

export default function ContactPage() {
  const { language } = useApp() as { language?: string };
  const content = CONTACT_CONTENT[language === "TH" ? "TH" : "EN"];
  const email = "support@memotiles.com";

  return (
    <MarketingLayout>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "calc(100vh - 64px)",
          backgroundColor: "#F9FAFB",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "4rem 1rem",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "480px",
              backgroundColor: "white",
              padding: "3rem 2rem",
              borderRadius: "2rem",
              boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
              textAlign: "center",
            }}
          >
            <h1
              style={{
                fontSize: "2.5rem",
                fontWeight: 800,
                marginBottom: "0.5rem",
                color: "var(--text-primary)",
              }}
            >
              {content.title}
            </h1>

            <p
              style={{
                fontSize: "1.125rem",
                color: "var(--text-secondary)",
                marginBottom: "3rem",
              }}
            >
              {content.subtitle}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              {/* Email */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    backgroundColor: "#EEF2FF",
                    borderRadius: "1rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--primary)",
                    marginBottom: "0.5rem",
                  }}
                >
                  <Mail size={24} />
                </div>

                <span
                  style={{
                    fontSize: "1rem",
                    fontWeight: 500,
                    color: "var(--text-secondary)",
                  }}
                >
                  {content.emailLabel}
                </span>

                <a
                  href={`mailto:${email}`}
                  style={{
                    fontSize: "1rem",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    textDecoration: "none",
                  }}
                >
                  {email}
                </a>
              </div>

              <div style={{ height: 1, backgroundColor: "#F3F4F6", width: "100%" }} />

              {/* LINE */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    backgroundColor: "#ECFDF5",
                    borderRadius: "1rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#10B981",
                    marginBottom: "0.5rem",
                  }}
                >
                  <MessageCircle size={24} />
                </div>

                <span
                  style={{
                    fontSize: "1rem",
                    fontWeight: 500,
                    color: "var(--text-secondary)",
                  }}
                >
                  {content.lineLabel}
                </span>

                <a
                  href="https://line.me/R/ti/p/@YOUR_LINE_ID"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    padding: "1.25rem",
                    backgroundColor: "#06C755",
                    color: "white",
                    borderRadius: "1rem",
                    fontWeight: 700,
                    textDecoration: "none",
                    fontSize: "1.125rem",
                  }}
                >
                  {content.lineCta}
                </a>

                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--text-tertiary)",
                  }}
                >
                  {content.lineNote}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
