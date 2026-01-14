"use client";

import React, { useMemo } from "react";
import MarketingLayout from "@/components/MarketingLayout";
import { useApp } from "@/context/AppContext";

type Lang = "EN" | "TH";

type PrivacySection = {
  title: string;
  content: string;
};

type PrivacyContent = {
  title: string;
  sections: PrivacySection[];
};

const PRIVACY_CONTENT: Record<Lang, PrivacyContent> = {
  EN: {
    title: "Privacy Policy",
    sections: [
      {
        title: "1. Personal Information Collected",
        content:
          "- Contact information (Name, Email address)\n- Shipping information (Address, Phone number)\n- Payment-related information (Processed by third-party providers)\n- Usage data and device information\n- Uploaded images and edit data",
      },
      {
        title: "2. Purpose of Collection and Use",
        content:
          "- Order fulfillment and delivery\n- Payment processing and identity verification\n- Customer support and responding to inquiries\n- Service improvement and development of new features\n- Compliance with legal obligations under applicable laws",
      },
      {
        title: "3. Data Retention",
        content:
          "MEMOTILE retains personal data only as long as necessary to fulfill the purposes of collection or as required by applicable laws.",
      },
      {
        title: "4. Third-Party Sharing",
        content:
          "MEMOTILE does not sell or share personal data with third parties except in the following cases:\n- Sharing information with logistics providers for delivery\n- Sharing information with payment processors for transactions\n- When required by law or for investigative purposes",
      },
      {
        title: "5. Data Processing Outsourcing",
        content:
          "To ensure reliable service, we outsource data processing to professional providers such as cloud infrastructure, payment systems, and logistics partners.",
      },
      {
        title: "6. User Rights",
        content:
          "Users may access, correct, delete, or request the restriction of their personal data at any time.",
      },
      {
        title: "7. Data Security Measures",
        content:
          "MEMOTILE implements technical and organizational safeguards to protect your information and maintain high security standards.",
      },
      {
        title: "8. Children and Teen Users",
        content:
          "The service is accessible without age restriction. However, responsibility for payments lies with the authorized payer.",
      },
      {
        title: "9. Cookies and Tracking Technologies",
        content:
          "We use cookies for functionality and analytics. Users can manage cookie preferences through their browser settings.",
      },
      {
        title: "10. Policy Updates",
        content:
          "This policy may be updated from time to time, and changes become effective immediately upon being posted on the website.",
      },
      {
        title: "11. Contact Information",
        content:
          "For any privacy-related inquiries, please contact our support team at support@memotiles.com.",
      },
    ],
  },

  TH: {
    title: "นโยบายความเป็นส่วนตัว",
    sections: [
      {
        title: "1. ข้อมูลส่วนบุคคลที่จัดเก็บ",
        content:
          "- ข้อมูลการติดต่อ (ชื่อ, ที่อยู่อีเมล)\n- ข้อมูลการจัดส่ง (ที่อยู่, เบอร์โทรศัพท์)\n- ข้อมูลที่เกี่ยวข้องกับการชำระเงิน (ประมวลผลโดยผู้ให้บริการภายนอก)\n- ข้อมูลการใช้งานและข้อมูลอุปกรณ์\n- รูปภาพที่อัปโหลดและข้อมูลการแก้ไข",
      },
      {
        title: "2. วัตถุประสงค์ในการรวบรวมและใช้งาน",
        content:
          "- การดำเนินการตามคำสั่งซื้อและการจัดส่งสินค้า\n- การประมวลผลการชำระเงินและการยืนยันตัวตน\n- การสนับสนุนลูกค้าและการตอบข้อซักถาม\n- การปรับปรุงบริการและการพัฒนาคุณสมบัติใหม่\n- การปฏิบัติตามกฎหมายที่เกี่ยวข้อง",
      },
      {
        title: "3. การเก็บรักษาข้อมูล",
        content:
          "MEMOTILE จะเก็บรักษาข้อมูลส่วนบุคคลไว้ตราบเท่าที่จำเป็นเพื่อให้บรรลุวัตถุประสงค์ในการรวบรวม หรือตามที่กฎหมายกำหนด",
      },
      {
        title: "4. การแบ่งปันข้อมูลกับบุคคลที่สาม",
        content:
          "MEMOTILE จะไม่ขายหรือแบ่งปันข้อมูลส่วนบุคคลกับบุคคลที่สาม ยกเว้นในกรณีต่อไปนี้:\n- การแบ่งปันข้อมูลกับผู้ให้บริการขนส่ง\n- การแบ่งปันข้อมูลกับผู้ให้บริการชำระเงิน\n- เมื่อกฎหมายกำหนด",
      },
      {
        title: "5. การจ้างภายนอกเพื่อประมวลผลข้อมูล",
        content:
          "เราใช้ผู้ให้บริการภายนอก เช่น ระบบคลาวด์ ระบบชำระเงิน และพันธมิตรด้านโลจิสติกส์ เพื่อให้บริการได้อย่างมีประสิทธิภาพ",
      },
      {
        title: "6. สิทธิ์ของผู้ใช้",
        content:
          "ผู้ใช้สามารถเข้าถึง แก้ไข ลบ หรือจำกัดการใช้ข้อมูลส่วนบุคคลของตนได้ตลอดเวลา",
      },
      {
        title: "7. ความปลอดภัยของข้อมูล",
        content: "เรามีมาตรการด้านเทคนิคและการจัดการเพื่อปกป้องข้อมูลของคุณ",
      },
      {
        title: "8. ผู้ใช้เด็กและเยาวชน",
        content:
          "บริการนี้ไม่มีการจำกัดอายุ แต่ความรับผิดชอบในการชำระเงินเป็นของผู้มีอำนาจ",
      },
      {
        title: "9. คุกกี้",
        content:
          "เราใช้คุกกี้เพื่อการทำงานและการวิเคราะห์ ผู้ใช้สามารถจัดการได้ผ่านการตั้งค่าเบราว์เซอร์",
      },
      {
        title: "10. การเปลี่ยนแปลงนโยบาย",
        content:
          "นโยบายนี้อาจมีการเปลี่ยนแปลง และจะมีผลทันทีเมื่อเผยแพร่บนเว็บไซต์",
      },
      {
        title: "11. ติดต่อเรา",
        content:
          "หากมีคำถามเกี่ยวกับความเป็นส่วนตัว โปรดติดต่อ support@memotiles.com",
      },
    ],
  },
};

function renderContent(text: string) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const isList = lines.some((l) => l.startsWith("- "));

  if (isList) {
    return (
      <ul style={{ paddingLeft: 20, marginTop: 8 }}>
        {lines.map((line, i) => (
          <li
            key={i}
            style={{
              margin: "8px 0",
              fontSize: 14,
              lineHeight: 1.6,
              color: "#475569",
            }}
          >
            {line.replace(/^- /, "")}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <p
      style={{
        fontSize: 14,
        lineHeight: 1.9,
        color: "#475569",
        whiteSpace: "pre-wrap",
        marginTop: 8,
      }}
    >
      {text}
    </p>
  );
}

export default function PrivacyPage() {
  const { language } = useApp() as { language?: string };

  const content = useMemo(() => {
    const lang: Lang = language === "TH" ? "TH" : "EN";
    return PRIVACY_CONTENT[lang];
  }, [language]);

  return (
    <MarketingLayout>
      {/* ✅ 디버그용 배지: 확인 후 삭제해도 됨 */}


      {/* ✅ 강제 가운데 정렬 */}
      <main
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 720,
            padding: "80px 24px",
          }}
        >
          <h1
            style={{
              textAlign: "center",
              fontSize: "40px",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              marginBottom: "56px",
              color: "#0f172a",
            }}
          >
            {content.title}
          </h1>

          <div>
            {content.sections.map((section, idx) => (
              <section key={idx} style={{ padding: "32px 0" }}>
                <h2
                  style={{
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "#0f172a",
                  }}
                >
                  {section.title}
                </h2>

                <div style={{ marginTop: 12 }}>
                  {renderContent(section.content)}
                </div>

                {idx !== content.sections.length - 1 && (
                  <div
                    style={{
                      marginTop: 32,
                      height: 1,
                      width: "100%",
                      background: "#e2e8f0",
                    }}
                  />
                )}
              </section>
            ))}
          </div>
        </div>
      </main>
    </MarketingLayout>
  );
}
