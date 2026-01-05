import React from 'react';
import { useApp } from '../context/AppContext';
import MarketingLayout from '../components/MarketingLayout';

const PRIVACY_CONTENT = {
    KO: {
        title: "개인정보 처리방침",
        sections: [
            {
                title: "1. 수집하는 개인정보의 항목",
                content: "- 연락처 정보 (이름, 이메일 주소)\n- 배송 정보 (주소, 전화번호)\n- 결제 관련 정보 (제3자 결제 서비스 제공업체를 통해 처리됨)\n- 서비스 이용 기록 및 기기 정보\n- 업로드된 이미지 및 편집 데이터"
            },
            {
                title: "2. 개인정보의 수집 및 이용 목적",
                content: "- 주문 이행 및 제품 배송\n- 결제 처리 및 본인 확인\n- 고객 지원 및 문의 응대\n- 서비스 개선 및 새로운 기능 개발\n- 관련 법령에 따른 법적 의무 이행"
            },
            {
                title: "3. 개인정보의 보유 및 이용 기간",
                content: "MEMOTILES는 수집 목적이 달성될 때까지 또는 관련 법령에 명시된 기간 동안 개인정보를 보유합니다."
            },
            {
                title: "4. 개인정보의 제3자 제공",
                content: "MEMOTILES는 다음과 같은 경우를 제외하고 개인정보를 제3자에게 판매하거나 공유하지 않습니다.\n- 배송을 위한 배송 업체와의 정보 공유\n- 결제를 위한 결제 대행 업체와의 정보 공유\n- 법령에 의거하거나 수사 목적으로 요구되는 경우"
            },
            {
                title: "5. 개인정보 처리의 위탁",
                content: "원활한 서비스 제공을 위해 클라우드 서비스 인프라, 결제 시스템, 물류 파트너 등 외부 전문 업체에 처리를 위탁하고 있습니다."
            },
            {
                title: "6. 정보 주체의 권리",
                content: "사용자는 언제든지 자신의 개인정보를 조회, 수정, 삭제 요청할 수 있으며 서비스 이용을 제한할 수 있습니다."
            },
            {
                title: "7. 개인정보의 기술적/관리적 보호 대책",
                content: "MEMOTILES는 사용자의 정보를 보호하기 위해 보안 시스템 구축 및 기술적 보호 조치를 수행하고 있습니다."
            },
            {
                title: "8. 아동 및 청소년 사용자",
                content: "본 서비스는 연령 제한 없이 이용할 수 있습니다. 다만, 결제와 관련된 책임은 결제 권한을 가진 당사자에게 있습니다."
            },
            {
                title: "9. 쿠키 및 자동 수집 장치의 운영",
                content: "웹사이트의 기능 지원 및 분석을 위해 쿠키를 사용합니다. 사용자는 브라우저 설정을 통해 쿠키 허용 여부를 결정할 수 있습니다."
            },
            {
                title: "10. 개인정보 처리방침의 변경",
                content: "본 방침은 수시로 업데이트될 수 있으며, 웹사이트에 게시되는 즉시 효력이 발생합니다."
            },
            {
                title: "11. 고객 지원 문의",
                content: "개인정보 관련 문의 사항은 고객 지원팀(support@memotiles.com)으로 연락해 주시기 바랍니다."
            }
        ]
    },
    EN: {
        title: "Privacy Policy",
        sections: [
            {
                title: "1. Personal Information Collected",
                content: "- Contact information (Name, Email address)\n- Shipping information (Address, Phone number)\n- Payment-related information (Processed by third-party providers)\n- Usage data and device information\n- Uploaded images and edit data"
            },
            {
                title: "2. Purpose of Collection and Use",
                content: "- Order fulfillment and delivery\n- Payment processing and identity verification\n- Customer support and responding to inquiries\n- Service improvement and development of new features\n- Compliance with legal obligations under applicable laws"
            },
            {
                title: "3. Data Retention",
                content: "MEMOTILES retains personal data only as long as necessary to fulfill the purposes of collection or as required by applicable laws."
            },
            {
                title: "4. Third-Party Sharing",
                content: "MEMOTILES does not sell or share personal data with third parties except in the following cases:\n- Sharing information with logistics providers for delivery\n- Sharing information with payment processors for transactions\n- When required by law or for investigative purposes"
            },
            {
                title: "5. Data Processing Outsourcing",
                content: "To ensure reliable service, we outsource data processing to professional providers such as cloud infrastructure, payment systems, and logistics partners."
            },
            {
                title: "6. User Rights",
                content: "Users may access, correct, delete, or request the restriction of their personal data at any time."
            },
            {
                title: "7. Data Security Measures",
                content: "MEMOTILES implements technical and organizational safeguards to protect your information and maintain high security standards."
            },
            {
                title: "8. Children and Teen Users",
                content: "The service is accessible without age restriction. However, responsibility for payments lies with the authorized payer."
            },
            {
                title: "9. Cookies and Tracking Technologies",
                content: "We use cookies for functionality and analytics. Users can manage cookie preferences through their browser settings."
            },
            {
                title: "10. Policy Updates",
                content: "This policy may be updated from time to time, and changes become effective immediately upon being posted on the website."
            },
            {
                title: "11. Contact Information",
                content: "For any privacy-related inquiries, please contact our support team at support@memotiles.com."
            }
        ]
    },
    TH: {
        title: "นโยบายความเป็นส่วนตัว",
        sections: [
            {
                title: "1. ข้อมูลส่วนบุคคลที่จัดเก็บ",
                content: "- ข้อมูลการติดต่อ (ชื่อ, ที่อยู่อีเมล)\n- ข้อมูลการจัดส่ง (ที่อยู่, เบอร์โทรศัพท์)\n- ข้อมูลที่เกี่ยวข้องกับการชำระเงิน (ประมวลผลโดยผู้ให้บริการภายนอก)\n- ข้อมูลการใช้งานและข้อมูลอุปกรณ์\n- รูปภาพที่อัปโหลดและข้อมูลการแก้ไข"
            },
            {
                title: "2. วัตถุประสงค์ในการรวบรวมและใช้งาน",
                content: "- การดำเนินการตามคำสั่งซื้อและการจัดส่งสินค้า\n- การประมวลผลการชำระเงินและการยืนยันตัวตน\n- การสนับสนุนลูกค้าและการตอบข้อซักถาม\n- การปรับปรุงบริการและการพัฒนาคุณสมบัติใหม่\n- การปฏิบัติตามกฎ무ทางกฎหมายภายใต้กฎหมายที่เกี่ยวข้อง"
            },
            {
                title: "3. การเก็บรักษาข้อมูล",
                content: "MEMOTILES จะเก็บรักษาข้อมูลส่วนบุคคลไว้ตราบเท่าที่จำเป็นเพื่อให้บรรลุวัตถุประสงค์ในการรวบรวม หรือตามที่กฎหมายกำหนด"
            },
            {
                title: "4. การแบ่งปันข้อมูลกับบุคคลที่สาม",
                content: "MEMOTILES จะไม่ขายหรือแบ่งปันข้อมูลส่วนบุคคลกับบุคคลที่สาม ยกเว้นในกรณีต่อไปนี้:\n- การแบ่งปันข้อมูลกับผู้ให้บริการขนส่งเพื่อการจัดส่ง\n- การแบ่งปันข้อมูลกับผู้ให้บริการประมวลผลการชำระเงินสำหรับการทำธุรกรรม\n- เมื่อกฎหมายกำหนดหรือเพื่อวัตถุประสงค์ในการตรวจสอบ"
            },
            {
                title: "5. การจ้างภายนอกเพื่อประมวลผลข้อมูล",
                content: "เพื่อให้มั่นใจในบริการที่เชื่อถือได้ เรามีการจ้างบริษัทภายนอกที่มีความเชี่ยวชาญ เช่น ผู้ให้บริการคลาวด์ ระบบชำระเงิน และพันธมิตรด้านขนส่ง"
            },
            {
                title: "6. สิทธิ์ของผู้ใช้",
                content: "ผู้ใช้สามารถเข้าถึง แก้ไข ลบ หรือขอให้จำกัดการประมวลผลข้อมูลส่วนบุคคลของตนได้ทุกเมื่อ"
            },
            {
                title: "7. มาตรการรักษาความปลอดภัยของข้อมูล",
                content: "MEMOTILES ใช้มาตรการป้องกันทางเทคนิคและระดับองค์กรเพื่อปกป้องข้อมูลของคุณและรักษามาตรฐานความปลอดภัยให้สูงที่สุด"
            },
            {
                title: "8. ผู้ใช้ที่เป็นเด็กและเยาวชน",
                content: "บริการนี้สามารถเข้าถึงได้โดยไม่มีข้อจำกัดด้านอายุ อย่างไรก็ตาม ความรับผิดชอบในการชำระเงินถือเป็นของผู้ที่มีอำนาจในการชำระเงิน"
            },
            {
                title: "9. คุกกี้และเทคโนโลยีการติดตาม",
                content: "เราใช้คุกกี้เพื่อสนับสนุนการทำงานและการวิเคราะห์ ผู้ใช้สามารถจัดการการตั้งค่าคุกกี้ผ่านการตั้งค่าเบราว์เซอร์ของตนเองได้"
            },
            {
                title: "10. การอัปเดตนโยบาย",
                content: "นโยบายนี้อาจได้รับการอัปเดตเป็นครั้งคราว และการเปลี่ยนแปลงจะมีผลทันทีหลังจากเผยแพร่บนเว็บไซต์"
            },
            {
                title: "11. ข้อมูลการติดต่อ",
                content: "หากมีข้อสงสัยเกี่ยวกับความเป็นส่วนตัว โปรดติดต่อทีมสนับสนุนของเราได้ที่ support@memotiles.com"
            }
        ]
    }
};

export default function Privacy() {
    const { language } = useApp();
    const content = PRIVACY_CONTENT[language] || PRIVACY_CONTENT.EN;

    return (
        <MarketingLayout>
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 64px)' }}>
                <div className="container" style={{ padding: '6rem 1rem', maxWidth: '800px' }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '3rem', textAlign: 'center' }}>{content.title}</h1>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                        {content.sections.map((section, idx) => (
                            <div key={idx} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '2.5rem' }}>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                                    {section.title}
                                </h2>
                                <p style={{ fontSize: '1rem', lineHeight: '1.8', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                                    {section.content}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </MarketingLayout>
    );
}
