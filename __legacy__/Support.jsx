import React from 'react';
import { useApp } from '../context/AppContext';
import MarketingLayout from '../components/MarketingLayout';

const SUPPORT_CONTENT = {
    EN: {
        title: "FAQ",
        items: [
            {
                question: "How long does shipping take?",
                answer: "Our photo tiles are custom printed and typically shipped within 5 days. Delivery times may vary slightly depending on production volume and location, but most orders are dispatched within this timeframe."
            },
            {
                question: "What if my tiles fall off the wall?",
                answer: "MEMOTILES tiles are designed to be removable and reusable. You can attach and remove them multiple times. If you experience any issues with adhesion, please contact our customer support team and we will assist you promptly."
            },
            {
                question: "What if my photo quality is low?",
                answer: "MEMOTILES is known for high-quality printing results. If you receive a damaged product or experience print quality issues, please contact our customer support team. We will review the issue and provide a fast resolution when applicable."
            },
            {
                question: "Can I modify my order after placing it?",
                answer: "You may edit or modify your order until it enters the printing stage. Once the product has been printed, changes or cancellations are no longer possible due to the custom-made nature of the product."
            }
        ],
        stillHaveQuestions: "Still have questions?",
        subtitle: "Our team is here to help you create your perfect wall.",
        emailSupport: "Email Support"
    },
    TH: {
        title: "คำถามที่พบบ่อย (FAQ)",
        items: [
            {
                question: "ระยะเวลาในการจัดส่งนานแค่ไหน?",
                answer: "แผ่นภาพของเราถูกพิมพ์ขึ้นตามสั่งและโดยปกติจะจัดส่งภายใน 5 วัน ระยะเวลาการจัดส่งอาจแตกต่างกันเล็กน้อยขึ้นอยู่กับปริมาณการผลิตและสถานที่ตั้ง แต่คำสั่งซื้อส่วนใหญ่จะถูกส่งออกภายในกรอบเวลานี้"
            },
            {
                question: "ถ้าแผ่นภาพหลุดจากผนังต้องทำอย่างไร?",
                answer: "แผ่นภาพ MEMOTILES ถูกออกแบบมาให้ลอกออกและติดใหม่ได้หลายครั้ง คุณสามารถติดและลอกออกได้ซ้ำๆ หากคุณพบปัญหาในการยึดเกาะ โปรดติดต่อทีมสนับสนุนลูกค้าของเราและเราจะช่วยเหลือคุณโดยเร็วที่สุด"
            },
            {
                question: "ถ้าคุณภาพรูปภาพต่ำจะเป็นอย่างไร?",
                answer: "MEMOTILES มีชื่อเสียงด้านคุณภาพการพิมพ์ที่สูง หากคุณได้รับสินค้าที่ชำรุดหรือพบปัญหาด้านคุณภาพการพิมพ์ โปรดติดต่อทีมสนับสนุนลูกค้าของเรา เราจะตรวจสอบปัญหาและหาทางแก้ไขที่รวดเร็วให้คุณ"
            },
            {
                question: "ฉันสามารถแก้ไขคำสั่งซื้อหลังจากสั่งไปแล้วได้ไหม?",
                answer: "คุณสามารถแก้ไขหรือเปลี่ยนแปลงคำสั่งซื้อได้จนกว่าจะเริ่มขั้นตอนการพิมพ์ เมื่อสินค้าถูกพิมพ์แล้ว จะไม่สามารถเปลี่ยนแปลงหรือยกเลิกได้เนื่องจากเป็นสินค้าที่ผลิตขึ้นตามสั่งโดยเฉพาะ"
            }
        ],
        stillHaveQuestions: "ยังมีข้อสงสัยอยู่ใช่ไหม?",
        subtitle: "ทีมงานของเราพร้อมช่วยเหลือคุณในการสร้างผนังที่สมบูรณ์แบบ",
        emailSupport: "ติดต่อทางอีเมล"
    }
};

export default function Support() {
    const { language } = useApp();
    const content = SUPPORT_CONTENT[language] || SUPPORT_CONTENT.EN;

    return (
        <MarketingLayout>
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 64px)' }}>
                <div className="container" style={{ padding: '6rem 1rem', maxWidth: '800px', flex: 1 }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '3rem', textAlign: 'center' }}>{content.title}</h1>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                        {content.items.map((item, idx) => (
                            <div key={idx} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '2.5rem' }}>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                                    {item.question}
                                </h2>
                                <p style={{ fontSize: '1rem', lineHeight: '1.8', color: 'var(--text-secondary)' }}>
                                    {item.answer}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: '4rem', textAlign: 'center', padding: '3rem', backgroundColor: '#F9FAFB', borderRadius: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem' }}>{content.stillHaveQuestions}</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>{content.subtitle}</p>
                        <a href="mailto:support@memotiles.com" style={{
                            display: 'inline-block',
                            padding: '1rem 2.5rem',
                            backgroundColor: 'var(--primary)',
                            color: 'white',
                            borderRadius: '999px',
                            fontWeight: '700',
                            textDecoration: 'none'
                        }}>
                            {content.emailSupport}
                        </a>
                    </div>
                </div>
            </div>
        </MarketingLayout>
    );
}
