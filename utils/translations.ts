// utils/translations.ts

export type Locale = "EN" | "TH";

export type TranslationKey =

  // Navbar
  | "login"
  | "myOrders"
  | "signOut"

  // ✅ Header / Footer links (추가)
  | "aboutUs"
  | "support"
  | "terms"
  | "privacy"
  | "footerAboutUs"
  | "footerSupport"
  | "footerTerms"
  | "footerPrivacy"

  // Landing
  | "heroTitle"
  | "heroSubtitle"
  | "heroMiniHeadline"
  | "heroMiniStep1Title"
  | "heroMiniStep1Desc"
  | "heroMiniStep2Title"
  | "heroMiniStep2Desc"
  | "heroMiniStep3Title"
  | "heroMiniStep3Desc"
  | "heroMiniStep4Title"
  | "heroMiniStep4Desc"
  | "createTiles"
  | "howItWorks"
  | "step1Title"
  | "step1Desc"
  | "step2Title"
  | "step2Desc"
  | "step3Title"
  | "step3Desc"
  | "realWallsTitle"
  | "realWallsDesc"
  | "followUs"
  | "deliveryHighlightTitle"
  | "deliveryHighlightSubtitle"
  | "aboutHeroTitle"
  | "aboutHeroSubtitle"
  | "aboutSection2Title"
  | "aboutSection2Body"
  | "aboutNote"
  | "aboutSection3Title"
  | "aboutBullet1"
  | "aboutBullet2"
  | "aboutBullet3"
  | "aboutSection4Title"
  | "aboutSection4Body"
  | "aboutSection5Title"
  | "aboutSection5Body"
  | "aboutCta"

  // Login
  | "welcomeBack"
  | "createAccount"
  | "continueGoogle"
  | "or"
  | "emailPlaceholder"
  | "passwordPlaceholder"
  | "confirmPasswordPlaceholder"
  | "signIn"
  | "createAccountBtn"
  | "alreadyHaveAccount"
  | "newHere"
  | "termsPrivacy"
  | "loginRedirect"
  | "loginSigningIn"
  | "loginEnterName"
  | "loginPwMin"
  | "loginPwMismatch"
  | "loginEmailInUse"
  | "loginInvalidEmail"
  | "loginWrongPassword"
  | "loginNoUser"
  | "loginFailed"

  // Recovery
  | "recoveryLink"
  | "recoveryTitle"
  | "recoveryDesc"
  | "recoveryEmailLabel"
  | "recoverySendReset"
  | "recoveryBackToLogin"
  | "recoverySent"
  | "recoverySendFailed"
  | "sending"

  // Dashboard
  | "uploadStep"
  | "cropStep"
  | "checkoutStep"
  | "uploadBtn"
  | "uploadRec"
  | "photosUploaded"
  | "addMore"
  | "maxPhotos"
  | "yourAlbum"
  | "ready"
  | "edit"
  | "cropTitle"
  | "zoom"
  | "rotate"
  | "dragReposition"
  | "filters"
  | "saveCrop"
  | "updateCrop"
  | "selectPhoto"
  | "tilesCount"
  | "estTotal"
  | "proceedCheckout"

  // Checkout
  | "checkoutTitle"
  | "shippingAddress"
  | "fullName"
  | "address"
  | "city"
  | "postalCode"
  | "country"
  | "phone"
  | "payment"
  | "payGPay"
  | "payCard"
  | "orderSummary"
  | "free"
  | "shipping"
  | "total"
  | "payNow"
  | "cartEmpty"
  | "goToDashboard"

  // Orders legacy/other
  | "ordersTitle"
  | "active"
  | "past"
  | "noOrders"
  | "paid"
  | "processing"
  | "cancelled"
  | "orderNumber"
  | "items"
  | "orderStatus"
  | "printing"
  | "shipped"
  | "delivered"
  | "orderStatusShippingInProgress"
  | "orderStatusDelivered"
  | "orderSubtitleShippingInProgress"
  | "orderSubtitleDelivered"
  | "orderLocked"
  | "orderLockedDesc"
  | "reorder"

  // My-orders page keys
  | "home"
  | "myOrdersTitle"
  | "myOrdersSubtitle"
  | "searchOrders"
  | "loading"
  | "ordersSummaryActive"
  | "ordersSummaryActiveHelper"
  | "ordersSummaryDelivered"
  | "ordersSummaryDeliveredHelper"
  | "ordersSummaryTotal"
  | "ordersSummaryTotalHelper"
  | "noOrdersTitle"
  | "noOrdersSubtitle"
  | "startNewOrder"
  | "statusPaid"
  | "statusPrinting"
  | "statusPrinted"
  | "statusShipping"
  | "statusDelivered"
  | "statusCancelled"
  | "statusProcessing"
  | "tilesUnit"
  | "view"

  // ✅ My-order detail page keys
  | "backToMyOrders"
  | "order"
  | "yourTiles"
  | "tilePreviews"
  | "noPreviewImages"
  | "shippingTitle"
  | "shippingSubtitle"
  | "tracking"
  | "needHelp"
  | "contactUs"
  | "viewFAQ"
  | "orderNotFound"
  | "orderNotFoundDesc"
  | "startNewOrderCta"
  | "orderDate"

  // ✅ Toss Success Page
  | "paymentSuccessTitle"
  | "paymentConfirmed"
  | "paymentPreparing"
  | "goToMyOrders"

  // ✅ Verify Email (추가)
  | "verifyTitle"
  | "verifySubtitle"        // ✅ 추가됨
  | "verifySentToEmail"
  | "verifyPleaseClick"
  | "verifyGenericDesc"
  | "verifyTip"
  | "verifyResend"
  | "verifyResentOk"
  | "verifyResentFail"
  | "verifyAlreadyVerified"
  | "verifyChecking"
  | "verifyNotYet"
  | "verifyCheckFail"
  | "verifySending"
  | "verifyBackToLogin"     // ✅ 추가됨
  | "verifyHintBox"
  | "verifyPreparing"
  | "verifyVerifiedRedirecting"
  | "verifyConfirmBtn"
  | "verifyResendBtn"


export type TranslationDict = Record<TranslationKey, string>;

export const translations: Record<Locale, TranslationDict> = {
  EN: {
    // Navbar
    login: "Log in",
    myOrders: "My Orders",
    signOut: "Sign out",

    // ✅ Header / Footer links
    aboutUs: "About us",
    support: "Support",
    terms: "Terms",
    privacy: "Privacy",
    footerAboutUs: "About us",
    footerSupport: "Support",
    footerTerms: "Terms",
    footerPrivacy: "Privacy",

    // Landing
    heroTitle: "Get your tiles.",
    heroSubtitle: "",
    heroMiniHeadline: "Stays up moves easily",
    heroMiniStep1Title: "1. Peel",
    heroMiniStep1Desc: "Remove the backing",
    heroMiniStep2Title: "2. Stick",
    heroMiniStep2Desc: "Place on the wall",
    heroMiniStep3Title: "3. Move",
    heroMiniStep3Desc: "Reposition anytime",
    heroMiniStep4Title: "4. Press",
    heroMiniStep4Desc: "Press firmly to secure",
    createTiles: "Create your tiles",
    howItWorks: "How it works",
    step1Title: "1. Upload photos",
    step1Desc: "Choose your favorites from your phone or computer.",
    step2Title: "2. Crop & adjust",
    step2Desc: "Fit perfectly in a square 20×20 cm tile.",
    step3Title: "3. Checkout & delivery",
    step3Desc: "We print specifically for you and deliver to your door.",
    realWallsTitle: "See how Memotile looks on real walls",
    realWallsDesc: "Reusable stickers. Easy to rearrange.",
    followUs: "Follow us on Instagram",
    deliveryHighlightTitle: "Delivered in just 5 days",
    deliveryHighlightSubtitle: "From upload to delivery",
    aboutHeroTitle: "Creating moments that stay in your space.",
    aboutHeroSubtitle:
      "Memotile are photo tiles that turn memories with loved ones into the atmosphere and emotion of your home.",
    aboutSection2Title: "Designed for the images you love",
    aboutSection2Body:
      "From moments of travel and family expressions to images that remind you of your loved ones. Memotile are designed for impressive images and poster-style displays in personal spaces.",
    aboutNote: "*Based on the use of images for appreciation in personal spaces.",
    aboutSection3Title: "Easy to install, free to change",
    aboutBullet1: "Install without nails or tools",
    aboutBullet2: "Minimize wall damage even after multiple peels and sticks",
    aboutBullet3: "Rearrange anytime to fit your space",
    aboutSection4Title: "More than interior — a thoughtful gift",
    aboutSection4Body:
      "Memotile is more than just wall decor. It makes a sensible gift for loved ones on moving days, anniversaries, and special occasions. Create a meaningful choice that stays in the recipient's space for a long time.",
    aboutSection5Title: "Our belief",
    aboutSection5Body:
      "We believe that images should be experienced in space, not just stored. Memotile naturally blends into your space and the daily life of your loved ones.",
    aboutCta: "Create your tiles",

    // Login
    welcomeBack: "Welcome back",
    createAccount: "Create your account",
    continueGoogle: "Continue with Google",
    or: "or",
    emailPlaceholder: "Email address",
    passwordPlaceholder: "Password",
    confirmPasswordPlaceholder: "Confirm Password",
    signIn: "Sign in",
    createAccountBtn: "Create account",
    alreadyHaveAccount: "Already have an account?",
    newHere: "New here?",
    termsPrivacy: "By continuing, you agree to Terms & Privacy.",
    loginRedirect: "(After login you return to /app automatically.)",
    loginSigningIn: "Signing in...",
    loginEnterName: "Please enter your name.",
    loginPwMin: "Password must be at least 8 characters.",
    loginPwMismatch: "Passwords do not match.",
    loginEmailInUse: "This email is already registered. Please sign in.",
    loginInvalidEmail: "Please enter a valid email address.",
    loginWrongPassword: "Incorrect email or password.",
    loginNoUser: "No account found with this email.",
    loginFailed: "Action failed.",

    // Recovery
    recoveryLink: "Find my email / password",
    recoveryTitle: "Account recovery",
    recoveryDesc: "Enter your email address and we’ll send you a password reset link.",
    recoveryEmailLabel: "Email address",
    recoverySendReset: "Send reset link",
    recoveryBackToLogin: "Back to login",
    recoverySent: "Reset link sent. Please check inbox & spam.",
    recoverySendFailed: "Failed to send reset email.",
    sending: "Sending…",

    // Dashboard
    uploadStep: "Upload",
    cropStep: "Crop",
    checkoutStep: "Checkout",
    uploadBtn: "Upload Photos",
    uploadRec: "Recommended: high-resolution images",
    photosUploaded: "Photos uploaded! Select below to edit.",
    addMore: "Add more",
    maxPhotos: "Max 20 photos per order.",
    yourAlbum: "Your Album",
    ready: "Ready",
    edit: "Edit",
    cropTitle: "Crop (20×20 cm)",
    zoom: "Zoom",
    rotate: "Rotate",
    dragReposition: "Drag to reposition",
    filters: "Filters",
    saveCrop: "Save Crop",
    updateCrop: "Update Crop",
    selectPhoto: "Select a photo to edit",
    tilesCount: "Tiles",
    estTotal: "Estimated total",
    proceedCheckout: "Proceed to Checkout",

    // Checkout
    checkoutTitle: "Checkout",
    shippingAddress: "Shipping Address",
    fullName: "Full Name",
    address: "Address",
    city: "City",
    postalCode: "Postal Code",
    country: "Country",
    phone: "Phone",
    payment: "Payment",
    payGPay: "Pay with GPay",
    payCard: "Or pay with card",
    orderSummary: "Order Summary",
    free: "Free",
    shipping: "Shipping",
    total: "Total",
    payNow: "Pay now",
    cartEmpty: "Your cart is empty",
    goToDashboard: "Go to Dashboard",

    // Orders (legacy / other pages)
    ordersTitle: "My Orders",
    active: "Active",
    past: "Past",
    noOrders: "No orders found.",
    paid: "Paid",
    processing: "Processing",
    cancelled: "Cancelled",
    orderNumber: "Order #",
    items: "items",
    orderStatus: "Order Status",
    printing: "Printing",
    shipped: "Shipped",
    delivered: "Delivered",
    orderStatusShippingInProgress: "Shipping in progress",
    orderStatusDelivered: "Delivered",
    orderSubtitleShippingInProgress: "Your tiles are on the way.",
    orderSubtitleDelivered: "Delivered to your address.",
    orderLocked: "Order Locked",
    orderLockedDesc: "This order is already in production, so changes are locked.",
    reorder: "Reorder (Coming soon)",

    // ✅ my-orders page keys
    home: "Home",
    myOrdersTitle: "My Orders",
    myOrdersSubtitle: "Your paid orders and delivery status updates.",
    searchOrders: "Search by order #",
    loading: "Loading...",

    ordersSummaryActive: "Active",
    ordersSummaryActiveHelper: "Paid / Printing / Shipping",
    ordersSummaryDelivered: "Delivered",
    ordersSummaryDeliveredHelper: "Completed orders",
    ordersSummaryTotal: "Total",
    ordersSummaryTotalHelper: "All time",

    noOrdersTitle: "No orders yet",
    noOrdersSubtitle: "After checkout, your order will appear here with status updates and previews.",
    startNewOrder: "Start a new order",

    statusPaid: "Paid",
    statusPrinting: "Printing",
    statusPrinted: "Printed",
    statusShipping: "Shipping",
    statusDelivered: "Delivered",
    statusCancelled: "Cancelled",
    statusProcessing: "Processing",

    tilesUnit: "tiles",
    view: "View",

    // ✅ My-order detail page keys
    backToMyOrders: "Back to My Orders",
    order: "Order",
    yourTiles: "Your tiles",
    tilePreviews: "Tile previews",
    noPreviewImages: "No preview images found.",
    shippingTitle: "Shipping",
    shippingSubtitle: "Where your tiles will be delivered",
    tracking: "Tracking",
    needHelp: "Need help?",
    contactUs: "Contact us",
    viewFAQ: "View FAQ",
    orderNotFound: "Order not found",
    orderNotFoundDesc: "This order may have been stored under a different browser key.",
    startNewOrderCta: "Start a new order",
    orderDate: "Order date",

    // ✅ Toss Success Page
    paymentSuccessTitle: "Thank you!",
    paymentConfirmed: "Your order has been confirmed.",
    paymentPreparing: "We’ll start preparing your tiles right away.",
    goToMyOrders: "Go to My Orders",

    // ✅ Verify Email (추가)
    verifyTitle: "Verify your email",
    verifySubtitle: "One quick step to secure your account",
    verifySentToEmail: "Verification email sent to {email}",
    verifyPleaseClick: "Please check your inbox and click the verification link.",
    verifyGenericDesc: "Please check your email and click the verification link.",
    verifyTip: "Check spam/junk if you can’t find the email.",
    verifyResend: "Resend email",
    verifyResentOk: "Verification email sent again. Please check your inbox.",
    verifyResentFail: "Failed to resend verification email.",
    verifyAlreadyVerified: "Confirm",
    verifyChecking: "Checking…",
    verifyNotYet: "Not verified yet. Please click the link in your email and try again.",
    verifyCheckFail: "Failed to check verification status.",
    verifySending: "Sending…",
    verifyHintBox: "Please verify your email to continue.",
    verifyBackToLogin: "Back to login",
    verifyPreparing: "Preparing verification…",
    verifyVerifiedRedirecting: "Verified! Redirecting…",
    verifyConfirmBtn: "Confirm",
    verifyResendBtn: "Resend email",

  },

  TH: {
    // Navbar
    login: "เข้าสู่ระบบ",
    myOrders: "คำสั่งซื้อของฉัน",
    signOut: "ออกจากระบบ",

    // ✅ Header / Footer links
    aboutUs: "เกี่ยวกับเรา",
    support: "ฝ่ายช่วยเหลือ",
    terms: "ข้อกำหนด",
    privacy: "ความเป็นส่วนตัว",
    footerAboutUs: "เกี่ยวกับเรา",
    footerSupport: "ฝ่ายช่วยเหลือ",
    footerTerms: "ข้อกำหนด",
    footerPrivacy: "ความเป็นส่วนตัว",

    // Landing
    heroTitle: "สั่งทำรูปติดผนัง",
    heroSubtitle: "",
    heroMiniHeadline: "ติดแน่น เคลื่อนย้ายง่าย",
    heroMiniStep1Title: "1. ลอก",
    heroMiniStep1Desc: "ลอกแผ่นด้านหลังออก",
    heroMiniStep2Title: "2. ติด",
    heroMiniStep2Desc: "ติดลงบนผนัง",
    heroMiniStep3Title: "3. ย้าย",
    heroMiniStep3Desc: "ย้ายตำแหน่งได้ทุกเมื่อ",
    heroMiniStep4Title: "4. กด",
    heroMiniStep4Desc: "กดให้แน่นเพื่อยึดติด",
    createTiles: "สร้างรายการใหม่",
    howItWorks: "วิธีการสั่งซื้อ",
    step1Title: "1. อัปโหลดรูปภาพ",
    step1Desc: "เลือกรูปโปรดจากมือถือหรือคอมพิวเตอร์ของคุณ",
    step2Title: "2. ปรับแต่ง",
    step2Desc: "ปรับให้พอดีกับแผ่นขนาด 20×20 ซม.",
    step3Title: "3. ชำระเงินและจัดส่ง",
    step3Desc: "เราพิมพ์ให้คุณโดยเฉพาะและจัดส่งถึงหน้าบ้าน",
    realWallsTitle: "ดูตัวอย่าง Memotile บนผนังจริง",
    realWallsDesc: "ติดซ้ำได้ ปรับเปลี่ยนตำแหน่งง่าย",
    followUs: "ติดตามเราบน Instagram",
    deliveryHighlightTitle: "ได้รับสินค้าภายใน 5 วัน",
    deliveryHighlightSubtitle: "นับจากเริ่มสั่งจนถึงหน้าบ้านคุณ",
    aboutHeroTitle: "สร้างช่วงเวลาที่คงอยู่ในพื้นที่ของคุณ",
    aboutHeroSubtitle:
      "Memotile คือแผ่นภาพถ่ายที่เปลี่ยนความทรงจำกับคนที่คุณรัก ให้กลายเป็นบรรยากาศและความรู้สึกภายในบ้าน",
    aboutSection2Title: "ออกแบบมาเพื่อภาพที่คุณรัก",
    aboutSection2Body:
      "ตั้งแต่ช่วงเวลาแห่งการเดินทาง รอยยิ้มของครอบครัว ไปจนถึงภาพที่ทำให้คุณนึกถึงคนที่รัก Memotile ถูกออกแบบมาเพื่อการจัดวางภาพที่ประทับใจในสไตล์โปสเตอร์ภายในพื้นที่ส่วนตัวของคุณ",
    aboutNote: "*สำหรับการใช้งานภาพเพื่อการชื่นชมในพื้นที่ส่วนตัว",
    aboutSection3Title: "ติดตั้งง่าย เปลี่ยนแปลงได้ดั่งใจ",
    aboutBullet1: "ติดตั้งโดยไม่ต้องใช้ตะปูหรือเครื่องมือ",
    aboutBullet2: "ลดการความเสียหายของผนัง แม้จะลอกออกและติดซ้ำหลายครั้ง",
    aboutBullet3: "จัดวางใหม่ได้ทุกเมื่อเพื่อให้เข้ากับพื้นที่ของคุณ",
    aboutSection4Title: "เป็นทั้งของตกแต่ง และของขวัญที่แทนใจ",
    aboutSection4Body:
      "Memotile เป็นมากกว่าแค่ของตกแต่งผนัง แต่เป็นของขวัญที่เปี่ยมด้วยรสนิยมสำหรับคนที่คุณรักในวันขึ้นบ้านใหม่ วันครบรอบ หรือโอกาสพิเศษ สร้างตัวเลือกที่มีความหมายซึ่งจะคงอยู่ในพื้นที่ของผู้รับไปอีกนาน",
    aboutSection5Title: "ความเชื่อของเรา",
    aboutSection5Body:
      "เราเชื่อว่ารูปภาพไม่ควรเป็นเพียงสิ่งที่ถูกบันทึกไว้ แต่ควรได้รับการสัมผัสในพื้นที่จริง Memotile จะกลมกลืนเข้ากับพื้นที่ของคุณและชีวิตประจำวันของคนที่คุณรักอย่างเป็นธรรมชาติ",
    aboutCta: "สร้างแผ่นภาพของคุณ",

    // Login
    welcomeBack: "ยินดีต้อนรับกลับ",
    createAccount: "สร้างบัญชีใหม่",
    continueGoogle: "ดำเนินการต่อด้วย Google",
    or: "หรือ",
    emailPlaceholder: "อีเมล",
    passwordPlaceholder: "รหัสผ่าน",
    confirmPasswordPlaceholder: "ยืนยันรหัสผ่าน",
    signIn: "เข้าสู่ระบบ",
    createAccountBtn: "สร้างบัญชี",
    alreadyHaveAccount: "มีบัญชีอยู่แล้ว?",
    newHere: "เพิ่งเคยมาที่นี่?",
    termsPrivacy: "การดำเนินการต่อถือว่าคุณยอมรับเงื่อนไขและนโยบายความเป็นส่วนตัว",
    loginRedirect: "(หลังจากเข้าสู่ระบบจะกลับไปที่ /app โดยอัตโนมัติ)",
    loginSigningIn: "กำลังเข้าสู่ระบบ...",
    loginEnterName: "กรุณากรอกชื่อของคุณ",
    loginPwMin: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร",
    loginPwMismatch: "รหัสผ่านไม่ตรงกัน",
    loginEmailInUse: "อีเมลนี้ถูกสมัครไว้แล้ว กรุณาเข้าสู่ระบบ",
    loginInvalidEmail: "กรุณากรอกอีเมลให้ถูกต้อง",
    loginWrongPassword: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
    loginNoUser: "ไม่พบบัญชีที่ใช้อีเมลนี้",
    loginFailed: "ดำเนินการไม่สำเร็จ",

    // Recovery
    recoveryLink: "กู้คืนบัญชี / รหัสผ่าน",
    recoveryTitle: "กู้คืนบัญชี",
    recoveryDesc: "กรอกอีเมลของคุณ แล้วเราจะส่งลิงก์รีเซ็ตรหัสผ่านให้",
    recoveryEmailLabel: "อีเมล",
    recoverySendReset: "ส่งลิงก์รีเซ็ต",
    recoveryBackToLogin: "กลับไปหน้าเข้าสู่ระบบ",
    recoverySent: "ส่งลิงก์แล้ว กรุณาตรวจสอบอีเมล (รวมถึงสแปม)",
    recoverySendFailed: "ส่งอีเมลรีเซ็ตไม่สำเร็จ",
    sending: "กำลังส่ง…",

    // Dashboard
    uploadStep: "อัปโหลด",
    cropStep: "ปรับแต่ง",
    checkoutStep: "ชำระเงิน",
    uploadBtn: "อัปโหลดรูปภาพ",
    uploadRec: "แนะนำ: รูปภาพความละเอียดสูง",
    photosUploaded: "อัปโหลดรูปภาพแล้ว! เลือกด้านล่างเพื่อแก้ไข",
    addMore: "เพิ่มรูปภาพ",
    maxPhotos: "สูงสุด 20 รูปต่อรายการ",
    yourAlbum: "อัลบั้มของคุณ",
    ready: "เสร็จ",
    edit: "แก้ไข",
    cropTitle: "ปรับแต่ง (20×20 ซม.)",
    zoom: "ซูม",
    rotate: "หมุน",
    dragReposition: "ลากเพื่อจัดตำแหน่ง",
    filters: "ฟิลเตอร์",
    saveCrop: "บันทึก",
    updateCrop: "อัปเดต",
    selectPhoto: "เลือกรูปภาพเพื่อแก้ไข",
    tilesCount: "จำนวนรูป",
    estTotal: "ยอดรวมโดยประมาณ",
    proceedCheckout: "ดำเนินการชำระเงิน",

    // Checkout
    checkoutTitle: "ชำระเงิน",
    shippingAddress: "ที่อยู่จัดส่ง",
    fullName: "ชื่อ-นามสกุล",
    address: "ที่อยู่",
    city: "เมือง / เขต",
    postalCode: "รหัสไปรษณีย์",
    country: "ประเทศ",
    phone: "เบอร์โทรศัพท์",
    payment: "การชำระเงิน",
    payGPay: "ชำระด้วย GPay",
    payCard: "หรือจ่ายด้วยบัตรเครดิต",
    orderSummary: "สรุปคำสั่งซื้อ",
    free: "ฟรี",
    shipping: "ค่าจัดส่ง",
    total: "ยอดรวม",
    payNow: "ชำระเงินทันที",
    cartEmpty: "ตะกร้าของคุณว่างเปล่า",
    goToDashboard: "ไปที่แดชบอร์ด",

    // Orders
    ordersTitle: "คำสั่งซื้อของฉัน",
    active: "ที่ต้องได้รับ",
    past: "ประวัติ",
    noOrders: "ไม่พบคำสั่งซื้อ",
    paid: "ชำระเงินแล้ว",
    processing: "กำลังดำเนินการ",
    cancelled: "ยกเลิกแล้ว",
    orderNumber: "หมายเลขคำสั่งซื้อ #",
    items: "รายการ",
    orderStatus: "สถานะ",
    printing: "กำลังพิมพ์",
    shipped: "จัดส่งแล้ว",
    delivered: "ได้รับแล้ว",
    orderStatusShippingInProgress: "กำลังจัดส่ง",
    orderStatusDelivered: "จัดส่งสำเร็จ",
    orderSubtitleShippingInProgress: "ไทล์ของคุณกำลังถูกจัดส่ง",
    orderSubtitleDelivered: "จัดส่งถึงที่อยู่ของคุณแล้ว",
    orderLocked: "คำสั่งซื้อถูกล็อก",
    orderLockedDesc: "คำสั่งซื้อนี้อยู่ในขั้นตอนการผลิตแล้ว จึงไม่สามารถแก้ไขได้",
    reorder: "สั่งซื้อซ้ำ (เร็วๆ นี้)",

    // ✅ my-orders page keys
    home: "หน้าแรก",
    myOrdersTitle: "คำสั่งซื้อของฉัน",
    myOrdersSubtitle: "คำสั่งซื้อที่ชำระแล้วและอัปเดตสถานะการจัดส่ง",
    searchOrders: "ค้นหาด้วยหมายเลขคำสั่งซื้อ",
    loading: "กำลังโหลด...",

    ordersSummaryActive: "กำลังดำเนินการ",
    ordersSummaryActiveHelper: "ชำระแล้ว / กำลังพิมพ์ / กำลังจัดส่ง",
    ordersSummaryDelivered: "จัดส่งสำเร็จ",
    ordersSummaryDeliveredHelper: "คำสั่งซื้อที่เสร็จสมบูรณ์",
    ordersSummaryTotal: "ทั้งหมด",
    ordersSummaryTotalHelper: "ทั้งหมดที่ผ่านมา",

    noOrdersTitle: "ยังไม่มีคำสั่งซื้อ",
    noOrdersSubtitle: "หลังจากชำระเงิน คำสั่งซื้อของคุณจะแสดงที่นี่พร้อมสถานะและตัวอย่างรูป",
    startNewOrder: "เริ่มสั่งซื้อใหม่",

    statusPaid: "ชำระเงินแล้ว",
    statusPrinting: "กำลังพิมพ์",
    statusPrinted: "พิมพ์เสรจ",
    statusShipping: "กำลังจัดส่ง",
    statusDelivered: "จัดส่งสำเร็จ",
    statusCancelled: "ยกเลิกแล้ว",
    statusProcessing: "กำลังดำเนินการ",

    tilesUnit: "แผ่น",
    view: "ดู",

    // ✅ My-order detail page keys
    backToMyOrders: "กลับไปที่คำสั่งซื้อของฉัน",
    order: "คำสั่งซื้อ",
    yourTiles: "รูปของคุณ",
    tilePreviews: "ตัวอย่างรูป",
    noPreviewImages: "ไม่พบรูปตัวอย่าง",
    shippingTitle: "การจัดส่ง",
    shippingSubtitle: "ที่อยู่สำหรับจัดส่งสินค้า",
    tracking: "ติดตามพัสดุ",
    needHelp: "ต้องการความช่วยเหลือ?",
    contactUs: "ติดต่อเรา",
    viewFAQ: "ดูคำถามที่พบบ่อย",
    orderNotFound: "ไม่พบคำสั่งซื้อ",
    orderNotFoundDesc: "คำสั่งซื้อนี้อาจถูกบันทึกไว้ในเบราว์เซอร์คีย์อื่น",
    startNewOrderCta: "เริ่มสั่งซื้อใหม่",
    orderDate: "วันที่สั่งซื้อ",

    // ✅ Toss Success Page
    paymentSuccessTitle: "ขอบคุณ!",
    paymentConfirmed: "คำสั่งซื้อของคุณได้รับการยืนยันแล้ว",
    paymentPreparing: "เราจะเริ่มเตรียมไทล์ของคุณทันที",
    goToMyOrders: "ไปที่คำสั่งซื้อของฉัน",

    // ✅ Verify Email (추가)
    verifyTitle: "ยืนยันอีเมลของคุณ",
    verifySubtitle: "อีกหนึ่งขั้นตอนเพื่อความปลอดภัยของบัญชีคุณ",
    verifySentToEmail: "ส่งอีเมลยืนยันไปที่ {email} แล้ว",
    verifyPleaseClick: "กรุณาตรวจสอบอีเมลและกดลิงก์ยืนยัน",
    verifyGenericDesc: "กรุณาตรวจสอบอีเมลและกดลิงก์ยืนยัน",
    verifyTip: "หากไม่พบอีเมล กรุณาตรวจสอบโฟลเดอร์สแปมหรือจดหมายขยะ",
    verifyResend: "ส่งอีเมลอีกครั้ง",
    verifyResentOk: "ส่งอีเมลยืนยันอีกครั้งแล้ว กรุณาตรวจสอบกล่องจดหมาย",
    verifyResentFail: "ไม่สามารถส่งอีเมลยืนยันอีกครั้งได้",
    verifyAlreadyVerified: "ยืนยันแล้ว",
    verifyChecking: "กำลังตรวจสอบ…",
    verifyNotYet: "ยังไม่ยืนยัน กรุณากดลิงก์ในอีเมลแล้วลองใหม่",
    verifyCheckFail: "ตรวจสอบสถานะการยืนยันไม่สำเร็จ",
    verifySending: "กำลังส่ง…",
    verifyHintBox: "กรุณายืนยันอีเมลเพื่อดำเนินการต่อ",
    verifyBackToLogin: "กลับไปหน้าเข้าสู่ระบบ",
    verifyPreparing: "กำลังเตรียมการยืนยัน…",
    verifyVerifiedRedirecting: "ยืนยันแล้ว! กำลังไปต่อ…",
    verifyConfirmBtn: "ยืนยันแล้ว",
    verifyResendBtn: "ส่งอีเมลอีกครั้ง",

  },
};
