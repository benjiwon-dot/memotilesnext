"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { useApp } from "@/context/AppContext";
import MarketingLayout from "@/components/MarketingLayout";

type AnimationKind = "fade-up" | "slide-up" | "scale" | "none";

function FadeInSection({
  children,
  animation = "fade-up",
  delay = 0,
}: {
  children: React.ReactNode;
  animation?: AnimationKind;
  delay?: number;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = domRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(node);

    return () => {
      try {
        observer.unobserve(node);
      } catch {}
      observer.disconnect();
    };
  }, []);

  const getAnimationStyles = () => {
    const base: React.CSSProperties = {
      transition: `all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) ${delay}s`,
      opacity: isVisible ? 1 : 0,
      transform: isVisible
        ? "none"
        : animation === "fade-up"
        ? "translateY(40px)"
        : animation === "slide-up"
        ? "translateY(100px)"
        : animation === "scale"
        ? "scale(0.98)"
        : "none",
    };
    return base;
  };

  return (
    <div ref={domRef} style={getAnimationStyles()}>
      {children}
    </div>
  );
}

export default function AboutPage() {
  const router = useRouter();
  const { t } = useApp();

  const handleCreateClick = () => {
    router.push("/app"); // 기존 navigate('/app')
  };

  const sectionStyle: React.CSSProperties = {
    minHeight: "100vh",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem 1rem",
    overflow: "hidden",
    position: "relative",
  };

  const contentBoxStyle: React.CSSProperties = {
    maxWidth: "800px",
    width: "100%",
    textAlign: "center",
    zIndex: 2,
    margin: "0 auto",
  };

  const headlineStyle: React.CSSProperties = {
    fontSize: "clamp(2rem, 5vw, 3rem)",
    fontWeight: 800,
    lineHeight: 1.2,
    marginBottom: "1.5rem",
    letterSpacing: "-0.02em",
    color: "#111827",
  };

  const bodyStyle: React.CSSProperties = {
    fontSize: "clamp(1rem, 2vw, 1.25rem)",
    color: "#4B5563",
    lineHeight: 1.6,
    maxWidth: "600px",
    margin: "0 auto",
    whiteSpace: "pre-line",
  };

  const imageContainerStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: "500px",
    margin: "3rem auto 0",
    borderRadius: "2rem",
    overflow: "hidden",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.1)",
  };

  return (
    <MarketingLayout>
      <div style={{ backgroundColor: "#FFFFFF" }}>
        {/* Section 1: Hero */}
        <section style={sectionStyle}>
          <div style={contentBoxStyle}>
            <FadeInSection animation="fade-up">
              <h1 style={headlineStyle}>{t("aboutHeroTitle")}</h1>
              <p style={bodyStyle}>{t("aboutHeroSubtitle")}</p>
            </FadeInSection>

            <FadeInSection animation="fade-up" delay={0.2}>
              <div style={imageContainerStyle}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/about/about-hero-wall.jpg"
                  alt="Memotiles Gallery Wall"
                  style={{ width: "100%", display: "block" }}
                />
              </div>
            </FadeInSection>
          </div>
        </section>

        {/* Section 2: Designed for meaningful images */}
        <section style={{ ...sectionStyle, backgroundColor: "#F9FAFB" }}>
          <div style={contentBoxStyle}>
            <FadeInSection animation="slide-up">
              <h2 style={headlineStyle}>{t("aboutSection2Title")}</h2>
              <p style={bodyStyle}>{t("aboutSection2Body")}</p>
              <p style={{ fontSize: "0.75rem", color: "#9CA3AF", marginTop: "1.5rem" }}>{t("aboutNote")}</p>
            </FadeInSection>

            <FadeInSection animation="slide-up" delay={0.2}>
              <div style={{ ...imageContainerStyle, maxWidth: "600px" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/about/gallery-new.jpg"
                  alt="Gallery Layout"
                  style={{ width: "100%", display: "block" }}
                />
              </div>
            </FadeInSection>
          </div>
        </section>

        {/* Section 3: Effortless & flexible */}
        <section style={sectionStyle}>
          <div style={contentBoxStyle}>
            <FadeInSection animation="scale">
              <h2 style={headlineStyle}>{t("aboutSection3Title")}</h2>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                  alignItems: "center",
                  marginTop: "2rem",
                }}
              >
                {["aboutBullet1", "aboutBullet2", "aboutBullet3"].map((key) => (
                  <div
                    key={key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      color: "#4B5563",
                    }}
                  >
                    <div
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        backgroundColor: "var(--accent)",
                      }}
                    />
                    <span>{t(key)}</span>
                  </div>
                ))}
              </div>
            </FadeInSection>

            <FadeInSection animation="scale" delay={0.3}>
              <div style={{ ...imageContainerStyle, maxWidth: "450px", borderRadius: "1.5rem" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/about/hero.png"
                  alt="Memotiles Interior"
                  style={{ width: "100%", display: "block" }}
                />
              </div>
            </FadeInSection>
          </div>
        </section>

        {/* Section 4: More than interior — a thoughtful gift */}
        <section style={{ ...sectionStyle, backgroundColor: "#FFFBF7" }}>
          <div style={contentBoxStyle}>
            <FadeInSection animation="fade-up">
              <h2 style={headlineStyle}>{t("aboutSection4Title")}</h2>
              <p style={bodyStyle}>{t("aboutSection4Body")}</p>
            </FadeInSection>

            <FadeInSection animation="fade-up" delay={0.2}>
              <div style={{ ...imageContainerStyle, maxWidth: "500px" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/about/gift.png" alt="Memotiles Gift" style={{ width: "100%", display: "block" }} />
              </div>
            </FadeInSection>
          </div>
        </section>

        {/* Section 5: Closing belief + CTA */}
        <section style={sectionStyle}>
          <div style={contentBoxStyle}>
            <FadeInSection animation="fade-up">
              <h2 style={{ ...headlineStyle, fontSize: "2rem" }}>{t("aboutSection5Title")}</h2>
              <p style={{ ...bodyStyle, marginBottom: "3rem" }}>{t("aboutSection5Body")}</p>

              <button
                onClick={handleCreateClick}
                className="btn btn-primary"
                style={{
                  fontSize: "1.125rem",
                  padding: "1.25rem 3rem",
                  borderRadius: "9999px",
                  boxShadow: "var(--shadow-xl)",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                {t("aboutCta")}
              </button>
            </FadeInSection>
          </div>
        </section>
      </div>
    </MarketingLayout>
  );
}
