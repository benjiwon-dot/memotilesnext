import React from 'react';
import { useApp } from '../context/AppContext';
import MarketingLayout from '../components/MarketingLayout';

const TOS_CONTENT = {
    KO: {
        title: "이용약관",
        sections: [
            {
                title: "1. 서비스 설명",
                content: "MEMOTILES는 고객의 사진을 업로드하고 편집하여 맞춤형 포토 타일을 제작 및 배송하는 서비스를 제공합니다. 모든 제품은 주문 제작(Made-to-order) 방식으로 생산됩니다."
            },
            {
                title: "2. 사용자 책임 및 구매 권한",
                content: "사용자는 본 서비스를 이용할 수 있는 법적 권한이 있거나 부모, 보호자 또는 결제 권한이 있는 자의 허가를 받았음을 확인합니다. 서비스 내에서 이루어지는 모든 구매 및 결제에 대한 책임은 결제를 완료한 당사자에게 있습니다."
            },
            {
                title: "3. 사용자 콘텐츠 및 저작권",
                content: "사용자가 업로드한 사진의 소유권은 사용자에게 있습니다. 사용자는 주문 이행(처리, 인쇄, 배송)을 위해 필요한 범위 내에서 MEMOTILES에 비독점적이고 무상인 라이선스를 부여합니다. MEMOTILES는 사용자의 명시적인 동의 없이 사진을 마케팅 용도로 사용하지 않습니다. 업로드된 사진으로 발생하는 저작권 침해 책임은 사용자에게 있습니다."
            },
            {
                title: "4. 금지된 콘텐츠",
                content: "불법적인 콘텐츠, 저작권 침해물, 개인정보 침해물, 미성년자와 관련된 유해 콘텐츠의 업로드를 엄격히 금지합니다. MEMOTILES는 이러한 규정을 위반하는 주문을 거부하거나 취소할 권리가 있습니다."
            },
            {
                title: "5. 주문 및 맞춤형 제품",
                content: "모든 제품은 맞춤 제작되므로, 인쇄가 시작된 후에는 주문을 취소하거나 변경할 수 없습니다. 사용자는 결제 전 사진의 편집 및 크롭 상태를 신중하게 확인해야 합니다."
            },
            {
                title: "6. 주문 상태 정보",
                content: "주문 상태(결제 완료, 준비 중, 인쇄 중, 배송 중, 배송 완료 등)는 정보 제공 목적으로만 제공되며, 실시간 상황과 다소 차이가 있을 수 있습니다."
            },
            {
                title: "7. 가격 및 결제",
                content: "제품 가격은 결제 전 화면에 표시됩니다. 결제는 제3자 결제 시스템을 통해 처리되며, 관련 세금 및 관세 등이 발생할 경우 이는 사용자의 부담입니다."
            },
            {
                title: "8. 배송",
                content: "배송 예정일은 추정치이며 확정된 보장일이 아닙니다. 물류 상황, 통관, 잘못된 주소 기입 등으로 인한 배송 지연에 대해 MEMOTILES는 책임을 지지 않습니다."
            },
            {
                title: "9. 반품 및 환불",
                content: "맞춤 제작 상품의 특성상 단순 변심에 의한 환불은 불가능합니다. 제품에 결함이 있거나 파손된 경우에 한해 재제작 또는 환불이 가능하며, 배송 완료 후 합리적인 기간 내에 고객 센터로 문의해야 합니다."
            },
            {
                title: "10. 지적 재산권",
                content: "MEMOTILES의 브랜드, UI 디자인, 시스템 등에 대한 모든 권리는 MEMOTILES에 있으며, 무단 사용을 금지합니다."
            },
            {
                title: "11. 서비스 변경",
                content: "MEMOTILES는 필요에 따라 서비스의 일부 또는 전부를 수정, 중단 또는 종료할 수 있습니다."
            },
            {
                title: "12. 책임의 제한",
                content: "서비스는 '현재 상태 그대로' 제공됩니다. 화면 상의 색상과 실제 인쇄물 간의 미세한 차이가 발생할 수 있습니다. MEMOTILES의 책임 범위는 주문 시 지불한 금액으로 제한됩니다."
            },
            {
                title: "13. 약관의 개정",
                content: "본 약관은 수시로 업데이트될 수 있으며, 개정된 약관은 웹사이트에 게시되는 즉시 효력이 발생합니다."
            },
            {
                title: "14. 문의처",
                content: "문의 사항이 있으신 경우 고객 지원팀(support@memotiles.com)으로 연락해 주시기 바랍니다."
            }
        ]
    },
    EN: {
        title: "Terms of Service",
        sections: [
            {
                title: "1. Service Description",
                content: "MEMOTILES provides a service for uploading and editing photos to create and deliver custom-made photo tiles. All products are produced on a made-to-order basis."
            },
            {
                title: "2. User Responsibility & Purchase Authority",
                content: "Users confirm they have the legal authority to use this service or have received permission from a parent, guardian, or authorized payer. The responsibility for all purchases and payments made within the service lies with the person who completes the transaction."
            },
            {
                title: "3. User Content & Copyright",
                content: "Users retain ownership of the photos they upload. Users grant MEMOTILES a non-exclusive, royalty-free license to the extent necessary for order fulfillment (processing, printing, and delivery). MEMOTILES does not use user photos for marketing purposes without explicit consent. Users are responsible for any copyright violations resulting from uploaded photos."
            },
            {
                title: "4. Prohibited Content",
                content: "Uploading illegal content, items that infringe on copyrights or privacy, or harmful content involving minors is strictly prohibited. MEMOTILES reserves the right to refuse or cancel orders that violate these regulations."
            },
            {
                title: "5. Orders & Custom Products",
                content: "Since all products are custom-made, orders cannot be canceled or changed once printing has begun. Users must carefully review the editing and cropping state of their photos before checkout."
            },
            {
                title: "6. Order Status Information",
                content: "Order statuses (Paid, Processing, Printing, Shipped, Delivered, etc.) are provided for informational purposes only and may differ slightly from the real-time situation."
            },
            {
                title: "7. Pricing & Payments",
                content: "Product prices are displayed on the screen before checkout. Payments are processed through third-party payment systems, and any applicable taxes or customs duties are the responsibility of the user."
            },
            {
                title: "8. Shipping & Delivery",
                content: "Delivery dates are estimates and not guaranteed arrival dates. MEMOTILES is not responsible for delivery delays caused by logistics conditions, customs, or incorrect address entry."
            },
            {
                title: "9. Returns & Refunds",
                content: "Due to the nature of custom-made products, refunds for a simple change of mind are not possible. Reprints or refunds are only available in cases of defective or damaged products, and users must contact customer support within a reasonable period after delivery."
            },
            {
                title: "10. Intellectual Property",
                content: "All rights to the MEMOTILES brand, UI design, and systems belong to MEMOTILES, and unauthorized use is prohibited."
            },
            {
                title: "11. Service Changes",
                content: "MEMOTILES may modify, suspend, or terminate part or all of the service as needed."
            },
            {
                title: "12. Limitation of Liability",
                content: "The service is provided 'as is'. Minor differences between screen colors and actual printed materials may occur. MEMOTILES' liability is limited to the amount paid at the time of the order."
            },
            {
                title: "13. Changes to Terms",
                content: "These Terms may be updated from time to time, and updated Terms become effective immediately upon being posted on the website."
            },
            {
                title: "14. Contact Information",
                content: "If you have any questions, please contact our support team at support@memotiles.com."
            }
        ]
    },
    TH: {
        title: "ข้อกำหนดและเงื่อนไขการให้บริการ",
        sections: [
            {
                title: "1. คำอธิบายบริการ",
                content: "MEMOTILES ให้บริการอัปโหลดและปรับแต่งรูปภาพเพื่อสร้างและจัดส่งแผ่นภาพถ่าย (Photo Tiles) ตามสั่ง สินค้าทุกชิ้นผลิตขึ้นตามคำสั่งซื้อโดยเฉพาะ (Made-to-order)"
            },
            {
                title: "2. ความรับผิดชอบของผู้ใช้และสิทธิ์ในการซื้อ",
                content: "ผู้ใช้ยืนยันว่ามีสิทธิ์ทางกฎหมายในการใช้บริการนี้ หรือได้รับอนุญาตจากผู้ปกครองหรือผู้ที่มีอำนาจในการชำระเงิน ความรับผิดชอบต่อการสั่งซื้อและการชำระเงินทั้งหมดที่เกิดขึ้นภายในบริการถือเป็นของผู้ที่ทำรายการชำระเงินให้เสร็จสิ้น"
            },
            {
                title: "3. เนื้อหาของผู้ใช้และลิขสิทธิ์",
                content: "ผู้ใช้ยังคงเป็นเจ้าของรูปภาพที่อัปโหลด ผู้ใข้อนุญาตให้ MEMOTILES ใช้รูปภาพในขอบเขตที่จำเป็นเพื่อการดำเนินการตามคำสั่งซื้อเท่านั้น (การประมวลผล การพิมพ์ และการจัดส่ง) MEMOTILES จะไม่ใช้รูปภาพของผู้ใช้เพื่อการตลาดโดยไม่ได้รับความยินยอมอย่างชัดเจน ผู้ใช้ต้องรับผิดชอบต่อการละเมิดลิขสิทธิ์ใดๆ ที่เกิดจากรูปภาพที่อัปโหลด"
            },
            {
                title: "4. เนื้อหาที่ต้องห้าม",
                content: "ห้ามอัปโหลดเนื้อหาที่ผิดกฎหมาย เนื้อหาที่ละเมิดลิขสิทธิ์หรือความเป็นส่วนตัว หรือเนื้อหาที่เป็นอันตรายต่อเยาวชนอย่างเด็ดขาด MEMOTILES ขอสงวนสิทธิ์ในการปฏิเสธหรือยกเลิกคำสั่งซื้อที่ละเมิดข้อกำหนดเหล่านี้"
            },
            {
                title: "5. การสั่งซื้อและสินค้าสั่งทำ",
                content: "เนื่องจากสินค้าทุกชิ้นเป็นสินค้าสั่งทำพิเศษ จึงไม่สามารถยกเลิกหรือเปลี่ยนแปลงคำสั่งซื้อได้หลังจากเริ่มขั้นตอนการพิมพ์แล้ว ผู้ใช้ต้องตรวจสอบสถานะการปรับแต่งและขอบของรูปภาพอย่างละเอียดก่อนการชำระเงิน"
            },
            {
                title: "6. ข้อมูลสถานะคำสั่งซื้อ",
                content: "สถานะคำสั่งซื้อ (ชำระเงินแล้ว, กำลังดำเนินการ, กำลังพิมพ์, จัดส่งแล้ว, ได้รับแล้ว ฯลฯ) มีไว้เพื่อวัตถุประสงค์ในการแจ้งข้อมูลเท่านั้น และอาจคลาดเคลื่อนจากสถานการณ์จริงเล็กน้อย"
            },
            {
                title: "7. ราคาและการชำระเงิน",
                content: "ราคาสินค้าจะแสดงบนหน้าจอก่อนการชำระเงิน การชำระเงินจะถูกประมวลผลผ่านระบบชำระเงินภายนอก และภาษีหรือค่าธรรมเนียมศุลกากรใดๆ ที่เกี่ยวข้องถือเป็นความรับผิดชอบของผู้ใช้"
            },
            {
                title: "8. การจัดส่ง",
                content: "วันที่จัดส่งเป็นการประมาณการเท่านั้น ไม่ใช่การรับประกันวันที่สินค้าจะถึงปลายทาง MEMOTILES จะไม่รับผิดชอบต่อความล่าช้าในการจัดส่งที่เกิดจากสถานการณ์การขนส่ง พิธีการศุลกากร หรือการกรอกที่อยู่ไม่ถูกต้อง"
            },
            {
                title: "9. การคืนสินค้าและการคืนเงิน",
                content: "เนื่องจากลักษณะของสินค้าสั่งทำพิเศษ เราไม่สามารถคืนเงินในกรณีที่เปลี่ยนใจได้ การสั่งพิมพ์ใหม่หรือการคืนเงินจะทำได้ในกรณีที่สินค้ามีตำหนิหรือชำรุดจากการผลิตเท่านั้น และผู้ใช้ต้องติดต่อฝ่ายบริการลูกค้าภายในระยะเวลาที่เหมาะสมหลังจากได้รับสินค้า"
            },
            {
                title: "10. ทรัพย์สินทางปัญญา",
                content: "สิทธิ์ทั้งหมดในแบรนด์ MEMOTILES, การออกแบบ UI และระบบเป็นของ MEMOTILES และห้ามนำไปใช้โดยไม่ได้รับอนุญาต"
            },
            {
                title: "11. การเปลี่ยนแปลงบริการ",
                content: "MEMOTILES อาจแก้ไข ระงับ หรือยกเลิกบริการบางส่วนหรือทั้งหมดตามความจำเป็น"
            },
            {
                title: "12. ข้อจำกัดความรับผิดชอบ",
                content: "บริการนี้ให้บริการตามสภาพจริง ('as is') อาจมีสีที่แตกต่างกันเล็กน้อยระหว่างสิ่งที่เห็นบนหน้าจอกับสินค้าที่พิมพ์ออกมาจริง ความรับผิดชอบของ MEMOTILES จำกัดอยู่เพียงจำนวนเงินที่ชำระในเวลาที่สั่งซื้อเท่านั้น"
            },
            {
                title: "13. การเปลี่ยนแปลงข้อกำหนด",
                content: "ข้อกำหนดเหล่านี้อาจได้รับการอัปเดตเป็นครั้งคราว และข้อกำหนดที่อัปเดตจะมีผลทันทีเมื่อมีการเผยแพร่บนเว็บไซต์"
            },
            {
                title: "14. ข้อมูลการติดต่อ",
                content: "หากคุณมีคำถามใดๆ โปรดติดต่อทีมงานฝ่ายสนับสนุนของเราได้ที่ support@memotiles.com"
            }
        ]
    }
};

export default function Terms() {
    const { language } = useApp();
    const content = TOS_CONTENT[language] || TOS_CONTENT.EN;

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
