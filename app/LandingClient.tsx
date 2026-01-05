"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../context/AppContext";
import { Upload, Crop, Truck, Instagram } from "lucide-react";
import MarketingLayout from "../components/MarketingLayout";
import HeroHowItWorksMini from "../components/HeroHowItWorksMini";

export default function LandingClient() {
  const { isLoggedIn, t } = useApp();
  const router = useRouter();

  // ✅ Fix: logged-in users should go to /editor (NOT /app)
  const handleCreateClick = () => {
    router.push(isLoggedIn ? "/editor" : "/login");
  };

  const IG_URL = "https://www.instagram.com/runner_better";

  return (
    <MarketingLayout>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          backgroundColor: "#FFFFFF",
        }}
      >
        {/* local CSS for hover behavior (stable, app-friendly) */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              .ig-tile-overlay { opacity: 0; transition: opacity .2s ease; }
              .ig-tile:hover .ig-tile-overlay { opacity: 1; }
            `,
          }}
        />

        {/* Hero Section */}
        <section
          style={{
            padding: "8rem 1rem 4rem",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1.5rem",
            background: "linear-gradient(to bottom, #FFFFFF, #F9FAFB)",
          }}
        >
          <div className="container" style={{ maxWidth: "800px" }}>
            <h1
              style={{
                fontSize: "clamp(2.5rem, 8vw, 4.5rem)",
                fontWeight: "900",
                lineHeight: "1.1",
                marginBottom: "0.5rem",
                letterSpacing: "-0.04em",
                color: "#111827",
              }}
            >
              {t("heroTitle")}
            </h1>
            <p
              style={{
                fontSize: "clamp(1.125rem, 3vw, 1.5rem)",
                fontWeight: "600",
                color: "var(--text-secondary)",
                marginBottom: "3rem",
                letterSpacing: "-0.01em",
              }}
            >
              {t("heroMiniHeadline")}
            </p>

            <div style={{ display: "flex", justifyContent: "center" }}>
              <button
                onClick={handleCreateClick}
                className="btn btn-primary"
                style={{
                  fontSize: "1.6875rem",
                  padding: "1.5rem 4rem",
                  borderRadius: "9999px",
                  boxShadow:
                    "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                  fontWeight: "800",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {t("createTiles")}
              </button>
            </div>
          </div>
        </section>

        {/* Image Preview Section */}
        <section style={{ padding: "2rem 1rem 4rem" }}>
          <div className="container" style={{ maxWidth: "1200px" }}>
            <div
              className="image-preview-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "1.5rem",
              }}
            >
              <style
                dangerouslySetInnerHTML={{
                  __html: `
                    @media (max-width: 768px) {
                      .image-preview-grid { grid-template-columns: 1fr !important; }
                    }
                  `,
                }}
              />
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    aspectRatio: "4/5",
                    borderRadius: "2rem",
                    overflow: "hidden",
                    boxShadow: "var(--shadow-lg)",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/assets/landing/lifestyle-${i}.jpg`}
                    alt={`Lifestyle ${i}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Steps Mini */}
        <section style={{ padding: "4rem 1rem", backgroundColor: "#FFFFFF" }}>
          <div className="container">
            <HeroHowItWorksMini />
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" style={{ padding: "6rem 1rem", backgroundColor: "#F9FAFB" }}>
          <div className="container">
            <h2
              style={{
                textAlign: "center",
                marginBottom: "4rem",
                fontSize: "2.5rem",
                fontWeight: "800",
                letterSpacing: "-0.02em",
              }}
            >
              {t("howItWorks")}
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "2.5rem",
              }}
            >
              <div
                className="card"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  padding: "4rem 2rem",
                  borderRadius: "2rem",
                }}
              >
                <div
                  style={{
                    background: "#EFF6FF",
                    padding: "1.25rem",
                    borderRadius: "50%",
                    marginBottom: "2rem",
                    color: "#3B82F6",
                  }}
                >
                  <Upload size={40} />
                </div>
                <h3 style={{ fontSize: "1.5rem", fontWeight: "800", marginBottom: "1rem" }}>
                  {t("step1Title")}
                </h3>
                <p style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}>
                  {t("step1Desc")}
                </p>
              </div>

              <div
                className="card"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  padding: "4rem 2rem",
                  borderRadius: "2rem",
                }}
              >
                <div
                  style={{
                    background: "#ECFDF5",
                    padding: "1.25rem",
                    borderRadius: "50%",
                    marginBottom: "2rem",
                    color: "#10B981",
                  }}
                >
                  <Crop size={40} />
                </div>
                <h3 style={{ fontSize: "1.5rem", fontWeight: "800", marginBottom: "1rem" }}>
                  {t("step2Title")}
                </h3>
                <p style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}>
                  {t("step2Desc")}
                </p>
              </div>

              <div
                className="card"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  padding: "4rem 2rem",
                  borderRadius: "2rem",
                }}
              >
                <div
                  style={{
                    background: "#FFF7ED",
                    padding: "1.25rem",
                    borderRadius: "50%",
                    marginBottom: "2rem",
                    color: "#F97316",
                  }}
                >
                  <Truck size={40} />
                </div>
                <h3 style={{ fontSize: "1.5rem", fontWeight: "800", marginBottom: "1rem" }}>
                  {t("step3Title")}
                </h3>
                <p style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}>
                  {t("step3Desc")}
                </p>
              </div>
            </div>

            {/* Delivery Highlight */}
            <div
              style={{
                marginTop: "6rem",
                padding: "3rem",
                backgroundColor: "white",
                borderRadius: "3rem",
                boxShadow: "var(--shadow-sm)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "1.5rem",
                textAlign: "center",
              }}
            >
              <div style={{ color: "#F97316" }}>
                <Truck size={48} strokeWidth={1.5} />
              </div>
              <div>
                <h3
                  style={{
                    fontSize: "2.5rem",
                    fontWeight: "900",
                    color: "var(--text-primary)",
                    letterSpacing: "-0.03em",
                  }}
                >
                  {t("deliveryHighlightTitle")}
                </h3>
                <p
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: "600",
                    color: "var(--text-tertiary)",
                    marginTop: "0.5rem",
                  }}
                >
                  {t("deliveryHighlightSubtitle")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Instagram */}
        <section style={{ padding: "6rem 1rem", backgroundColor: "#FFFFFF" }}>
          <div className="container" style={{ textAlign: "center" }}>
            <h2 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
              {t("realWallsTitle")}
            </h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "3rem" }}>
              {t("realWallsDesc")}
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: "1rem",
                marginBottom: "3rem",
              }}
            >
              {[...Array(8)].map((_, i) => (
                <a
                  key={i}
                  href={IG_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="instagram-tile ig-tile"
                  style={{
                    display: "block",
                    aspectRatio: "1/1",
                    backgroundColor: "#F3F4F6",
                    borderRadius: "var(--radius-md)",
                    position: "relative",
                    overflow: "hidden",
                    cursor: "pointer",
                  }}
                >
                  <div
                    className="ig-tile-overlay"
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "rgba(0,0,0,0.3)",
                      color: "white",
                    }}
                  >
                    View on Instagram
                  </div>
                </a>
              ))}
            </div>

            <a
              href={IG_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
              style={{ gap: "0.5rem", display: "inline-flex", alignItems: "center" }}
            >
              <Instagram size={20} />
              {t("followUs")}
            </a>
          </div>
        </section>
      </div>
    </MarketingLayout>
  );
}
