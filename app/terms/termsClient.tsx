// app/terms/termsClient.tsx
"use client";

import React from "react";
import { useApp } from "@/context/AppContext";

type Lang = "TH" | "EN";

const TOS_CONTENT: Record<
  Lang,
  {
    title: string;
    sections: Array<{ title: string; content: string }>;
  }
> = {
  EN: {
    title: "Terms of Service",
    sections: [
      {
        title: "1. Service Description",
        content:
          "MEMOTILES provides a service for uploading and editing photos to create and deliver custom-made photo tiles. All products are produced on a made-to-order basis.",
      },
      {
        title: "2. User Responsibility & Purchase Authority",
        content:
          "Users confirm they have the legal authority to use this service or have received permission from a parent, guardian, or authorized payer. The responsibility for all purchases and payments made within the service lies with the person who completes the transaction.",
      },
      {
        title: "3. User Content & Copyright",
        content:
          "Users retain ownership of the photos they upload. Users grant MEMOTILES a non-exclusive, royalty-free license to the extent necessary for order fulfillment (processing, printing, and delivery). MEMOTILES does not use user photos for marketing purposes without explicit consent. Users are responsible for any copyright violations resulting from uploaded photos.",
      },
      {
        title: "4. Prohibited Content",
        content:
          "Uploading illegal content, items that infringe on copyrights or privacy, or harmful content involving minors is strictly prohibited. MEMOTILES reserves the right to refuse or cancel orders that violate these regulations.",
      },
      {
        title: "5. Orders & Custom Products",
        content:
          "Since all products are custom-made, orders cannot be canceled or changed once printing has begun. Users must carefully review the editing and cropping state of their photos before checkout.",
      },
      {
        title: "6. Order Status Information",
        content:
          "Order statuses (Paid, Processing, Printing, Shipped, Delivered, etc.) are provided for informational purposes only and may differ slightly from the real-time situation.",
      },
      {
        title: "7. Pricing & Payments",
        content:
          "Product prices are displayed on the screen before checkout. Payments are processed through third-party payment systems, and any applicable taxes or customs duties are the responsibility of the user.",
      },
      {
        title: "8. Shipping & Delivery",
        content:
          "Delivery dates are estimates and not guaranteed arrival dates. MEMOTILES is not responsible for delivery delays caused by logistics conditions, customs, or incorrect address entry.",
      },
      {
        title: "9. Returns & Refunds",
        content:
          "Due to the nature of custom-made products, refunds for a simple change of mind are not possible. Reprints or refunds are only available in cases of defective or damaged products, and users must contact customer support within a reasonable period after delivery.",
      },
      {
        title: "10. Intellectual Property",
        content:
          "All rights to the MEMOTILES brand, UI design, and systems belong to MEMOTILES, and unauthorized use is prohibited.",
      },
      {
        title: "11. Service Changes",
        content:
          "MEMOTILES may modify, suspend, or terminate part or all of the service as needed.",
      },
      {
        title: "12. Limitation of Liability",
        content:
          "The service is provided 'as is'. Minor differences between screen colors and actual printed materials may occur. MEMOTILES' liability is limited to the amount paid at the time of the order.",
      },
      {
        title: "13. Changes to Terms",
        content:
          "These Terms may be updated from time to time, and updated Terms become effective immediately upon being posted on the website.",
      },
      {
        title: "14. Contact Information",
        content:
          "If you have any questions, please contact our support team at support@memotiles.com.",
      },
    ],
  },

  TH: {
    title: "ข้อกำหนดและเงื่อนไขการให้บริการ",
    sections: [
      {
        title: "1. คำอธิบายบริการ",
        content:
          "MEMOTILES ให้บริการอัปโหลดและปรับแต่งรูปภาพเพื่อสร้างและจัดส่งแผ่นภาพถ่าย (Photo Tiles) ตามสั่ง สินค้าทุกชิ้นผลิตขึ้นตามคำสั่งซื้อโดยเฉพาะ (Made-to-order)",
      },
      {
        title: "2. ความรับผิดชอบของผู้ใช้และสิทธิ์ในการซื้อ",
        content:
          "ผู้ใช้ยืนยันว่ามีสิทธิ์ทางกฎหมายในการใช้บริการนี้ หรือได้รับอนุญาตจากผู้ปกครองหรือผู้ที่มีอำนาจในการชำระเงิน ความรับผิดชอบต่อการสั่งซื้อและการชำระเงินทั้งหมดที่เกิดขึ้นภายในบริการถือเป็นของผู้ที่ทำรายการชำระเงินให้เสร็จสิ้น",
      },
      {
        title: "3. เนื้อหาของผู้ใช้และลิขสิทธิ์",
        content:
          "ผู้ใช้ยังคงเป็นเจ้าของรูปภาพที่อัปโหลด ผู้ใข้อนุญาตให้ MEMOTILES ใช้รูปภาพในขอบเขตที่จำเป็นเพื่อการดำเนินการตามคำสั่งซื้อเท่านั้น (การประมวลผล การพิมพ์ และการจัดส่ง) MEMOTILES จะไม่ใช้รูปภาพของผู้ใช้เพื่อการตลาดโดยไม่ได้รับความยินยอมอย่างชัดเจน ผู้ใช้ต้องรับผิดชอบต่อการละเมิดลิขสิทธิ์ใดๆ ที่เกิดจากรูปภาพที่อัปโหลด",
      },
      {
        title: "4. เนื้อหาที่ต้องห้าม",
        content:
          "ห้ามอัปโหลดเนื้อหาที่ผิดกฎหมาย เนื้อหาที่ละเมิดลิขสิทธิ์หรือความเป็นส่วนตัว หรือเนื้อหาที่เป็นอันตรายต่อเยาวชนอย่างเด็ดขาด MEMOTILES ขอสงวนสิทธิ์ในการปฏิเสธหรือยกเลิกคำสั่งซื้อที่ละเมิดข้อกำหนดเหล่านี้",
      },
      {
        title: "5. การสั่งซื้อและสินค้าสั่งทำ",
        content:
          "เนื่องจากสินค้าทุกชิ้นเป็นสินค้าสั่งทำพิเศษ จึงไม่สามารถยกเลิกหรือเปลี่ยนแปลงคำสั่งซื้อได้หลังจากเริ่มขั้นตอนการพิมพ์แล้ว ผู้ใช้ต้องตรวจสอบสถานะการปรับแต่งและขอบของรูปภาพอย่างละเอียดก่อนการชำระเงิน",
      },
      {
        title: "6. ข้อมูลสถานะคำสั่งซื้อ",
        content:
          "สถานะคำสั่งซื้อ (ชำระเงินแล้ว, กำลังดำเนินการ, กำลังพิมพ์, จัดส่งแล้ว, ได้รับแล้ว ฯลฯ) มีไว้เพื่อวัตถุประสงค์ในการแจ้งข้อมูลเท่านั้น และอาจคลาดเคลื่อนจากสถานการณ์จริงเล็กน้อย",
      },
      {
        title: "7. ราคาและการชำระเงิน",
        content:
          "ราคาสินค้าจะแสดงบนหน้าจอก่อนการชำระเงิน การชำระเงินจะถูกประมวลผลผ่านระบบชำระเงินภายนอก และภาษีหรือค่าธรรมเนียมศุลกากรใดๆ ที่เกี่ยวข้องถือเป็นความรับผิดชอบของผู้ใช้",
      },
      {
        title: "8. การจัดส่ง",
        content:
          "วันที่จัดส่งเป็นการประมาณการเท่านั้น ไม่ใช่การรับประกันวันที่สินค้าจะถึงปลายทาง MEMOTILES จะไม่รับผิดชอบต่อความล่าช้าในการจัดส่งที่เกิดจากสถานการณ์การขนส่ง พิธีการศุลกากร หรือการกรอกที่อยู่ไม่ถูกต้อง",
      },
      {
        title: "9. การคืนสินค้าและการคืนเงิน",
        content:
          "เนื่องจากลักษณะของสินค้าสั่งทำพิเศษ เราไม่สามารถคืนเงินในกรณีที่เปลี่ยนใจได้ การสั่งพิมพ์ใหม่หรือการคืนเงินจะทำได้ในกรณีที่สินค้ามีตำหนิหรือชำรุดจากการผลิตเท่านั้น และผู้ใช้ต้องติดต่อฝ่ายบริการลูกค้าภายในระยะเวลาที่เหมาะสมหลังจากได้รับสินค้า",
      },
      {
        title: "10. ทรัพย์สินทางปัญญา",
        content:
          "สิทธิ์ทั้งหมดในแบรนด์ MEMOTILES, การออกแบบ UI และระบบเป็นของ MEMOTILES และห้ามนำไปใช้โดยไม่ได้รับอนุญาต",
      },
      {
        title: "11. การเปลี่ยนแปลงบริการ",
        content:
          "MEMOTILES อาจแก้ไข ระงับ หรือยกเลิกบริการบางส่วนหรือทั้งหมดตามความจำเป็น",
      },
      {
        title: "12. ข้อจำกัดความรับผิดชอบ",
        content:
          "บริการนี้ให้บริการตามสภาพจริง ('as is') อาจมีสีที่แตกต่างกันเล็กน้อยระหว่างสิ่งที่เห็นบนหน้าจอกับสินค้าที่พิมพ์ออกมาจริง ความรับผิดชอบของ MEMOTILES จำกัดอยู่เพียงจำนวนเงินที่ชำระในเวลาที่สั่งซื้อเท่านั้น",
      },
      {
        title: "13. การเปลี่ยนแปลงข้อกำหนด",
        content:
          "ข้อกำหนดเหล่านี้อาจได้รับการอัปเดตเป็นครั้งคราว และข้อกำหนดที่อัปเดตจะมีผลทันทีเมื่อมีการเผยแพร่บนเว็บไซต์",
      },
      {
        title: "14. ข้อมูลการติดต่อ",
        content:
          "หากคุณมีคำถามใดๆ โปรดติดต่อทีมงานฝ่ายสนับสนุนของเราได้ที่ support@memotiles.com.",
      },
    ],
  },
};

export default function TermsClient() {
  const { language } = useApp();
  const lang: Lang = language === "EN" ? "EN" : "TH";
  const content = TOS_CONTENT[lang];

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 64px)" }}>
      <div className="container" style={{ padding: "6rem 1rem", maxWidth: "800px" }}>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: "3rem", textAlign: "center" }}>
          {content.title}
        </h1>

        <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
          {content.sections.map((section, idx) => (
            <div key={idx} style={{ borderBottom: "1px solid var(--border)", paddingBottom: "2.5rem" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem", color: "var(--text-primary)" }}>
                {section.title}
              </h2>
              <p style={{ fontSize: "1rem", lineHeight: "1.8", color: "var(--text-secondary)", whiteSpace: "pre-wrap" }}>
                {section.content}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
