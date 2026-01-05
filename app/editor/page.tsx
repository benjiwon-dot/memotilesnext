"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  ZoomIn,
  ZoomOut,
  Check,
  Image as ImageIcon,
  ChevronLeft,
  RefreshCcw,
  AlertCircle,
  Loader2,
  X,
  Settings,
  Info,
  Upload,
} from "lucide-react";

import AppLayout from "../../components/AppLayout";
import { useApp } from "../../context/AppContext";
import { getOrders, canEdit } from "../../utils/orders";

type UploadItem = {
  id: string;
  status?: string;
  isCropped?: boolean;

  // ✅ 업로드 이미지 미리보기용
  src?: string; // objectURL
  fileName?: string;
};

type CropState = {
  zoom: number;
  dragPos: { x: number; y: number };
  filter: string;
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

const EDITOR_STATE_KEY = "MYTILE_EDITOR_STATE";
const ORDER_ITEMS_KEY = "MYTILE_ORDER_ITEMS";

export default function EditorPage() {
  // ✅ addTileToCart 추가
  const { t, addTileToCart, cart } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();

  const editOrderId = searchParams.get("editOrderId");
  const hasDevParam = searchParams.get("dev") === "1";

  // --- STATE MANAGEMENT ---
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [selectedUploadId, setSelectedUploadId] = useState<string | null>(null);

  const [isDevAvailable, setIsDevAvailable] = useState(hasDevParam);
  const [isLabOpen, setIsLabOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [navTimerExceeded, setNavTimerExceeded] = useState(false);
  const [showGuidance, setShowGuidance] = useState<{ title: string; subtitle: string } | null>(null);
  const [shouldNudgeSave, setShouldNudgeSave] = useState(false);

  const [crops, setCrops] = useState<Record<string, CropState>>({});
  const [saveStatuses, setSaveStatuses] = useState<Record<string, SaveStatus>>({});

  const [labState, setLabState] = useState({
    photoSlot: "has-photo",
    uploadState: "idle",
    loadState: "loaded",
    interactionState: "ready",
    checkoutState: "ready",
    validationError: "off",
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // ✅ hidden file input (한 개만 유지: 중복 업로드 방지 핵심)
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pendingTargetIdRef = useRef<string | null>(null);

  // ✅ file picker 중복 오픈 방지
  const isFilePickerOpeningRef = useRef(false);
  const lastPickerOpenAtRef = useRef(0);

  // ✅ objectURL 정리(메모리 누수 방지)
  const objectUrlMapRef = useRef<Record<string, string>>({}); // id -> objectURL

  // ✅ 드래그 후 발생하는 ghost click 방지
  const preventClickUntilRef = useRef(0);
  const didPointerDownRef = useRef(false);
  const movedEnoughRef = useRef(false);

  // ✅ 안정화: 최신 uploads/cart 참조
  const uploadsRef = useRef<UploadItem[]>(uploads);
  useEffect(() => {
    uploadsRef.current = uploads;
  }, [uploads]);

  const cartRef = useRef<any[]>(Array.isArray(cart) ? cart : []);
  useEffect(() => {
    cartRef.current = Array.isArray(cart) ? cart : [];
  }, [cart]);

  // ✅ 타이머 정리
  const timeoutsRef = useRef<number[]>([]);
  const setSafeTimeout = (fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timeoutsRef.current.push(id);
    return id;
  };
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((id) => window.clearTimeout(id));
      timeoutsRef.current = [];

      Object.values(objectUrlMapRef.current).forEach((u) => {
        try {
          URL.revokeObjectURL(u);
        } catch {}
      });
      objectUrlMapRef.current = {};
    };
  }, []);

  const FILTERS = useMemo(
    () => [
      { name: "Original", style: "none" },
      { name: "Warm", style: "sepia(30%) saturate(140%)" },
      { name: "Cool", style: "saturate(0.5) hue-rotate(30deg)" },
      { name: "Vivid", style: "saturate(200%)" },
      { name: "B&W", style: "grayscale(100%)" },
      { name: "Soft", style: "brightness(110%) contrast(90%)" },
      { name: "Contrast", style: "contrast(150%)" },
      { name: "Fade", style: "opacity(0.8) contrast(90%)" },
      { name: "Film", style: "sepia(20%) contrast(110%) brightness(105%) saturate(80%)" },
      { name: "Bright", style: "brightness(125%) saturate(110%)" },
    ],
    []
  );

  // ---------------------------
  // ✅ editor 상태를 sessionStorage에 저장/복원
  // ---------------------------
  const persistEditorState = () => {
    try {
      const payload = {
        uploads,
        crops,
        saveStatuses,
        selectedUploadId,
      };
      sessionStorage.setItem(EDITOR_STATE_KEY, JSON.stringify(payload));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (editOrderId) return;
    persistEditorState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploads, crops, saveStatuses, selectedUploadId, editOrderId]);

  // --- INITIALIZATION ---
  useEffect(() => {
    if (editOrderId) {
      const orders = getOrders();
      const order = orders.find((o: any) => o.id === editOrderId);
      if (!order || !canEdit(order)) {
        router.push("/my-orders");
        return;
      }

      const initialCrops: Record<string, CropState> = {};
      const initialStatuses: Record<string, SaveStatus> = {};

      const loadedUploads: UploadItem[] = order.items.map((item: any) => {
        initialCrops[item.id] = {
          zoom: item.zoom || 1.2,
          dragPos: item.dragPos || { x: 0, y: 0 },
          filter: item.filter || "Original",
        };
        initialStatuses[item.id] = "saved";
        return { ...item, status: "cropped", isCropped: true };
      });

      setUploads(loadedUploads);
      setCrops(initialCrops);
      setSaveStatuses(initialStatuses);
      if (loadedUploads.length > 0) setSelectedUploadId(loadedUploads[0].id);
      return;
    }

    // ✅ (일반 진입) sessionStorage에 editor 상태가 있으면 복원
    try {
      const raw = sessionStorage.getItem(EDITOR_STATE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.uploads?.length) {
          setUploads(parsed.uploads);
          setCrops(parsed.crops || {});
          setSaveStatuses(parsed.saveStatuses || {});
          setSelectedUploadId(parsed.selectedUploadId || parsed.uploads[0]?.id || null);
          return;
        }
      }
    } catch {
      // ignore
    }

    // ✅ 초기 1슬롯 자동 생성
    const firstId = `u-${Date.now()}`;
    const firstUpload: UploadItem = { id: firstId, status: "needs-crop", isCropped: false };
    setUploads([firstUpload]);
    setCrops({
      [firstId]: { zoom: 1.2, dragPos: { x: 0, y: 0 }, filter: "Original" },
    });
    setSaveStatuses({});
    setSelectedUploadId(firstId);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editOrderId, router]);

  // Keyboard trigger for Dev Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName || "";
      if (e.key.toLowerCase() === "d" && !["INPUT", "TEXTAREA"].includes(tag)) {
        setIsDevAvailable((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const selectedUpload = useMemo(() => {
    if (!selectedUploadId) return null;
    return uploads.find((u) => u.id === selectedUploadId) || null;
  }, [uploads, selectedUploadId]);

  const currentCrop = useMemo<CropState>(() => {
    if (!selectedUploadId) return { zoom: 1.2, dragPos: { x: 0, y: 0 }, filter: "Original" };
    return crops[selectedUploadId] || { zoom: 1.2, dragPos: { x: 0, y: 0 }, filter: "Original" };
  }, [crops, selectedUploadId]);

  const currentSaveStatus: SaveStatus = selectedUploadId ? saveStatuses[selectedUploadId] || "idle" : "idle";

  const updateCurrentCrop = (updates: Partial<CropState>) => {
    if (!selectedUploadId) return;
    setCrops((prev) => ({
      ...prev,
      [selectedUploadId]: { ...(prev[selectedUploadId] || currentCrop), ...updates },
    }));
    if (currentSaveStatus === "saved") {
      setSaveStatuses((prev) => ({ ...prev, [selectedUploadId]: "idle" }));
    }
  };

  // ---------------------------
  // ✅ 업로드 핵심 로직 (중복 방지)
  // ---------------------------

  const ensureSlot = (): string => {
    if (selectedUploadId) return selectedUploadId;

    const newId = `u-${Date.now()}`;
    const newUpload: UploadItem = { id: newId, status: "needs-crop", isCropped: false };
    setUploads((prev) => [...prev, newUpload]);
    setCrops((prev) => ({ ...prev, [newId]: { zoom: 1.2, dragPos: { x: 0, y: 0 }, filter: "Original" } }));
    setSelectedUploadId(newId);
    return newId;
  };

  const openFilePickerFor = (targetId?: string) => {
    const now = Date.now();

    if (isFilePickerOpeningRef.current) return;
    if (now - lastPickerOpenAtRef.current < 700) return;

    isFilePickerOpeningRef.current = true;
    lastPickerOpenAtRef.current = now;

    const id = targetId || ensureSlot();
    pendingTargetIdRef.current = id;

    requestAnimationFrame(() => {
      fileInputRef.current?.click();
    });
  };

  const applyFileToSlot = (slotId: string, file: File) => {
    const nextUrl = URL.createObjectURL(file);

    const prevUrl = objectUrlMapRef.current[slotId];
    if (prevUrl) {
      try {
        URL.revokeObjectURL(prevUrl);
      } catch {}
    }
    objectUrlMapRef.current[slotId] = nextUrl;

    setUploads((prev) =>
      prev.map((u) =>
        u.id === slotId
          ? {
              ...u,
              src: nextUrl,
              fileName: file.name,
              status: "needs-crop",
              isCropped: false,
            }
          : u
      )
    );

    setSaveStatuses((prev) => ({ ...prev, [slotId]: "idle" }));
    setCrops((prev) => ({
      ...prev,
      [slotId]: prev[slotId] || { zoom: 1.2, dragPos: { x: 0, y: 0 }, filter: "Original" },
    }));
    setSelectedUploadId(slotId);

    setLabState((ps) => ({ ...ps, uploadState: "idle", loadState: "loaded", photoSlot: "has-photo" }));
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    isFilePickerOpeningRef.current = false;

    const file = e.target.files?.[0];
    const slotId = pendingTargetIdRef.current || selectedUploadId;

    e.target.value = "";

    if (!file || !slotId) {
      pendingTargetIdRef.current = null;
      return;
    }

    if (!file.type.startsWith("image/")) {
      setLabState((ps) => ({ ...ps, validationError: "on" }));
      setSafeTimeout(() => setLabState((ps) => ({ ...ps, validationError: "off" })), 2500);
      pendingTargetIdRef.current = null;
      return;
    }

    applyFileToSlot(slotId, file);
    pendingTargetIdRef.current = null;
  };

  const handleAddSlotAndUpload = () => {
    if (uploads.length >= 20) return;

    const newId = `u-${Date.now()}`;
    const newUpload: UploadItem = { id: newId, status: "needs-crop", isCropped: false };
    setUploads((prev) => [...prev, newUpload]);
    setCrops((prev) => ({ ...prev, [newId]: { zoom: 1.2, dragPos: { x: 0, y: 0 }, filter: "Original" } }));
    setSelectedUploadId(newId);

    setSafeTimeout(() => openFilePickerFor(newId), 0);
  };

  const handleClearPhoto = (id: string) => {
    const prevUrl = objectUrlMapRef.current[id];
    if (prevUrl) {
      try {
        URL.revokeObjectURL(prevUrl);
      } catch {}
      delete objectUrlMapRef.current[id];
    }

    setUploads((prev) =>
      prev.map((u) =>
        u.id === id
          ? {
              ...u,
              src: undefined,
              fileName: undefined,
              isCropped: false,
              status: "needs-crop",
            }
          : u
      )
    );

    setSaveStatuses((prev) => ({ ...prev, [id]: "idle" }));
    setCrops((prev) => ({
      ...prev,
      [id]: { zoom: 1.2, dragPos: { x: 0, y: 0 }, filter: "Original" },
    }));

    if (selectedUploadId !== id) return;
  };

  const [showAllSavedToast, setShowAllSavedToast] = useState(false);

  const savedCount = useMemo(
    () => uploads.filter((u) => saveStatuses[u.id] === "saved").length,
    [uploads, saveStatuses]
  );

  const isValidationError = labState.validationError === "on";
  const isUploading = labState.uploadState === "uploading";
  const isLoadingImage = labState.loadState === "loading";

  const hasPhoto = !!selectedUpload?.src;

  const canInteractWithImage = hasPhoto && !isUploading && !isLoadingImage && labState.interactionState !== "disabled";
  const interactionsDisabled = !canInteractWithImage;

  const checkoutDisabled = savedCount === 0 || isLoadingImage || labState.checkoutState === "disabled" || isNavigating;

  // --- HANDLERS ---

  // ✅ (경고 해결) addTileToCart는 "상태 업데이트 계산 함수" 안에서 호출하지 않는다.
  const enqueueAddToCart = (tile: any) => {
    // 다음 tick에서 실행 -> 렌더 중 setState 경고 회피
    setSafeTimeout(() => {
      try {
        const already = cartRef.current?.some((x: any) => x?.id === tile?.id);
        if (!already) addTileToCart(tile);
      } catch {
        // ignore
      }
    }, 0);
  };

  const handleSaveCrop = () => {
    if (!hasPhoto || interactionsDisabled || currentSaveStatus === "saving" || !selectedUploadId) return;

    const savingId = selectedUploadId;

    setIsDragging(false);
    setSaveStatuses((prev) => ({ ...prev, [savingId]: "saving" }));

    setSafeTimeout(() => {
      // 1) 업로드 상태 업데이트
      setUploads((prev) => prev.map((u) => (u.id === savingId ? { ...u, isCropped: true } : u)));

      // 2) SaveStatus 업데이트 (여기서는 "상태"만 처리)
      setSaveStatuses((prev) => {
        const newStatuses: Record<string, SaveStatus> = { ...prev, [savingId]: "saved" };

        // ✅ Save = checkout용 sessionStorage 저장
        try {
          const orderItems = uploadsRef.current
            .filter((u) => newStatuses[u.id] === "saved")
            .map((u) => ({ ...u, ...crops[u.id] }));
          sessionStorage.setItem(ORDER_ITEMS_KEY, JSON.stringify(orderItems));
        } catch {
          // ignore
        }

        return newStatuses;
      });

      // 3) cart 추가는 "상태 업데이트 밖"에서 처리 (경고 원인 제거)
      try {
        const u = uploadsRef.current.find((x) => x.id === savingId);
        const crop = crops[savingId];
        if (u?.src && crop) {
          enqueueAddToCart({
            id: savingId,
            previewUrl: u.src,
            fileName: u.fileName,
            zoom: crop.zoom,
            dragPos: crop.dragPos,
            filter: crop.filter,
            createdAt: new Date().toISOString(),
            status: "paid", // 기본값: admin에서 변경 예정
          });
        }
      } catch {
        // ignore
      }

      // 4) 다음 편집 대상으로 이동 / 토스트
      setSafeTimeout(() => {
        const latestUploads = uploadsRef.current;

        // 최신 saveStatuses는 아직 React state에 반영되기 전일 수 있으니
        // "저장된 것" 판단을 위해 현재 저장 id만 확실히 saved로 보고
        const nextUnsaved = latestUploads.find((u) => u.id !== savingId && saveStatuses[u.id] !== "saved");

        if (nextUnsaved) {
          setSelectedUploadId(nextUnsaved.id);
        } else {
          const allSaved = latestUploads.every((u) => u.id === savingId || saveStatuses[u.id] === "saved");
          if (allSaved) {
            setShowAllSavedToast(true);
            setSafeTimeout(() => setShowAllSavedToast(false), 3000);
          }
        }
      }, 600);
    }, 500);
  };

  const handleContinueToCheckout = () => {
    if (isNavigating) return;

    if (uploads.length === 0) {
      setShowGuidance({ title: "Upload a photo to continue", subtitle: "You need at least 1 tile for an order." });
      setSafeTimeout(() => setShowGuidance(null), 3000);
      return;
    }

    if (isLoadingImage) {
      setShowGuidance({ title: "Loading photo...", subtitle: "Please wait until your photo is ready." });
      setSafeTimeout(() => setShowGuidance(null), 3000);
      return;
    }

    if (savedCount === 0) {
      setShowGuidance({ title: "Save at least 1 crop", subtitle: "Tap 'Save This Crop' to continue." });
      setShouldNudgeSave(true);
      setSafeTimeout(() => {
        setShowGuidance(null);
        setShouldNudgeSave(false);
      }, 3000);
      return;
    }

    if (checkoutDisabled) return;

    setIsNavigating(true);
    const navTimer = setSafeTimeout(() => setNavTimerExceeded(true), 600);

    setSafeTimeout(() => {
      window.clearTimeout(navTimer);

      const orderItems = uploads
        .filter((u) => saveStatuses[u.id] === "saved")
        .map((u) => ({ ...u, ...crops[u.id] }));

      sessionStorage.setItem(ORDER_ITEMS_KEY, JSON.stringify(orderItems));
      router.push("/checkout");
    }, 300);
  };

  const handleReset = () => {
    updateCurrentCrop({ zoom: 1.2, dragPos: { x: 0, y: 0 }, filter: "Original" });
  };

  // --- POINTER DRAG LOGIC ---
  const startDragging = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canInteractWithImage) return;

    didPointerDownRef.current = true;
    movedEnoughRef.current = false;

    e.preventDefault();

    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - currentCrop.dragPos.x, y: e.clientY - currentCrop.dragPos.y };
  };

  const onDragging = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !canInteractWithImage) return;

    const nextX = e.clientX - dragStartRef.current.x;
    const nextY = e.clientY - dragStartRef.current.y;

    const dx = nextX - currentCrop.dragPos.x;
    const dy = nextY - currentCrop.dragPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (!movedEnoughRef.current && dist >= 4) movedEnoughRef.current = true;

    if (movedEnoughRef.current) {
      updateCurrentCrop({ dragPos: { x: nextX, y: nextY } });
    }
  };

  const stopDragging = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    if (didPointerDownRef.current) {
      preventClickUntilRef.current = Date.now() + 650;
      didPointerDownRef.current = false;
      movedEnoughRef.current = false;
    }
  };

  return (
    <AppLayout showFooter={false}>
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onFileChange} />

      <div style={{ backgroundColor: "#F9FAFB", minHeight: "100vh", paddingBottom: "120px" }}>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              .editor-grid { display: grid; grid-template-columns: 1fr 340px; gap: 3rem; padding-top: 1rem; }
              @media (max-width: 1023px) { .editor-grid { grid-template-columns: 1fr; gap: 1.5rem; padding-top: 0; } }

              .cropper-frame { aspect-ratio: 1/1; width: 100%; max-width: 480px; margin: 0 auto; position: relative; overflow: hidden; background-color: #F3F4F6; border: 1px solid rgba(0,0,0,0.06); transition: all 0.2s; touch-action: none; }
              .cropper-frame.ready { cursor: grab; }
              .cropper-frame.ready:active { cursor: grabbing; border-color: var(--text-primary); }

              .album-strip { display: grid; grid-template-columns: repeat(10, 1fr); gap: 10px; margin-top: 2rem; }
              @media (max-width: 600px) { .album-strip { grid-template-columns: repeat(5, 1fr); } }

              .filter-chip { padding: 6px 16px; border-radius: 999px; font-size: 13px; font-weight: 600; border: 1px solid var(--border); background: white; color: var(--text-secondary); cursor: pointer; white-space: nowrap; transition: all 0.2s; }
              .filter-chip.active { background: var(--text-primary); color: white; border-color: var(--text-primary); }

              .skeleton { background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%); background-size: 200% 100%; animation: skeleton-loading 1.5s infinite; }
              @keyframes skeleton-loading { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

              .nudge-pulse { animation: nudge-pulse 0.8s ease-in-out; }
              @keyframes nudge-pulse {
                0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(17, 24, 39, 0.4); }
                50% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(17, 24, 39, 0); }
                100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(17, 24, 39, 0); }
              }

              .guidance-toast {
                position: absolute;
                bottom: 100%;
                left: 50%;
                transform: translateX(-50%) translateY(-12px);
                background: white;
                border: 1px solid var(--border);
                padding: 1rem;
                border-radius: 1rem;
                box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
                min-width: 240px;
                z-index: 50;
                animation: slide-up 0.3s ease-out;
              }
              @keyframes slide-up {
                from { opacity: 0; transform: translateX(-50%) translateY(0); }
                to { opacity: 1; transform: translateX(-50%) translateY(-12px); }
              }

              /* =========================
                 Upload Card Effects (앱까지 고려: CSS-only, subtle)
                 (1) Soft Pulse Ring + (4) Hover 강화 + (3) 아이콘 1회 Bounce
                 ========================= */
              .upload-card {
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 2rem;
              }

              .upload-inner {
                width: 100%;
                max-width: 420px;
                border-radius: 18px;
                border: 1px solid rgba(0,0,0,0.08);
                background: #fff;
                box-shadow: 0 6px 18px rgba(0,0,0,0.06);
                padding: 26px;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 14px;
                cursor: pointer;
                transition: transform .16s ease, box-shadow .16s ease, border-color .16s ease;
                position: relative;
                isolation: isolate;
                outline: none;
              }

              /* (4) Hover 강화 */
              .upload-inner:hover {
                transform: translateY(-1px);
                box-shadow: 0 12px 30px rgba(0,0,0,0.08);
                border-color: rgba(17,24,39,0.22);
              }

              .upload-inner:active { transform: translateY(0px) scale(0.995); }
              .upload-inner:focus-visible {
                box-shadow: 0 0 0 4px rgba(17,24,39,0.12), 0 12px 30px rgba(0,0,0,0.08);
                border-color: rgba(17,24,39,0.28);
              }

              /* (1) Soft Pulse Ring */
              .upload-inner::before {
                content: "";
                position: absolute;
                inset: -10px;
                border-radius: 22px;
                border: 2px solid rgba(17,24,39,0.18);
                opacity: 0;
                transform: scale(0.98);
                z-index: -1;
                animation: upload-pulse 2.6s ease-in-out infinite;
              }
              @keyframes upload-pulse {
                0%   { opacity: 0; transform: scale(0.98); }
                25%  { opacity: 0.65; transform: scale(1.00); }
                55%  { opacity: 0; transform: scale(1.02); }
                100% { opacity: 0; transform: scale(1.02); }
              }

              /* reduce motion */
              @media (prefers-reduced-motion: reduce) {
                .upload-inner { transition: none; }
                .upload-inner::before { animation: none; }
                .upload-icon { animation: none !important; }
              }

              .upload-icon {
                width: 46px;
                height: 46px;
                border-radius: 14px;
                background: rgba(17,24,39,0.08);
                display: flex;
                align-items: center;
                justify-content: center;
              }

              /* (3) 아이콘 1회 Bounce (Upload 카드 mount 시 1회) */
              .upload-icon.bounce-once {
                animation: icon-bounce 620ms cubic-bezier(0.2, 0.9, 0.2, 1) 1;
              }
              @keyframes icon-bounce {
                0%   { transform: translateY(0); }
                35%  { transform: translateY(-5px); }
                65%  { transform: translateY(1px); }
                100% { transform: translateY(0); }
              }

              .thumb-action {
                position: absolute;
                top: 6px;
                left: 6px;
                width: 22px;
                height: 22px;
                border-radius: 999px;
                background: rgba(255,255,255,0.92);
                border: 1px solid rgba(0,0,0,0.08);
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 2px 6px rgba(0,0,0,0.12);
                cursor: pointer;
                z-index: 20;
              }
            `,
          }}
        />

        <div className="container" style={{ padding: "1rem 0", display: "flex", justifyContent: "flex-end" }}>
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
              color: "var(--text-tertiary)",
              fontSize: "0.8125rem",
              fontWeight: "600",
            }}
          >
            <ChevronLeft size={16} /> {t("backToHome") || "Back"}
          </Link>
        </div>

        <div className="container editor-grid">
          <div>
            {isValidationError && (
              <div
                style={{
                  marginBottom: "1.5rem",
                  padding: "0.75rem 1rem",
                  background: "#FEF2F2",
                  border: "1px solid #FEE2E2",
                  borderRadius: "8px",
                  color: "#991B1B",
                  fontSize: "0.8125rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <AlertCircle size={14} /> Unsupported file type or file too large.
              </div>
            )}

            {/* ✅ 큰 크롭 영역 */}
            <div
              className={`cropper-frame ${canInteractWithImage ? "ready" : ""}`}
              onPointerDown={startDragging}
              onPointerMove={onDragging}
              onPointerUp={stopDragging}
              onPointerCancel={stopDragging}
              onPointerLeave={stopDragging}
              onClickCapture={(e) => {
                if (isFilePickerOpeningRef.current) {
                  e.preventDefault();
                  e.stopPropagation();
                  return;
                }

                if (Date.now() < preventClickUntilRef.current) {
                  e.preventDefault();
                  e.stopPropagation();
                  return;
                }

                if (hasPhoto) {
                  e.preventDefault();
                  e.stopPropagation();
                  return;
                }

                openFilePickerFor(selectedUploadId || undefined);
              }}
              style={{
                cursor: hasPhoto ? "grab" : "pointer",
              }}
            >
              {!hasPhoto ? (
                <div className="upload-card">
                  <div
                    className="upload-inner"
                    role="button"
                    tabIndex={0}
                    aria-label="Upload Photos"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        if (Date.now() < preventClickUntilRef.current) return;
                        openFilePickerFor(selectedUploadId || undefined);
                      }
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (Date.now() < preventClickUntilRef.current) return;
                      openFilePickerFor(selectedUploadId || undefined);
                    }}
                  >
                    {/* 아이콘 1회 bounce: 카드가 보이는 순간(=hasPhoto false) mount되니 1회 실행됨 */}
                    <div className="upload-icon bounce-once">
                      <Upload size={22} />
                    </div>
                    <div style={{ fontSize: "18px", fontWeight: 900, color: "#111827" }}>Upload Photos</div>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "rgba(17,24,39,0.55)" }}>
                      Pick a moment you love
                    </div>
                  </div>
                </div>
              ) : isLoadingImage ? (
                <div className="skeleton" style={{ width: "100%", height: "100%" }} />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    transform: `translate(${currentCrop.dragPos.x}px, ${currentCrop.dragPos.y}px) scale(${currentCrop.zoom})`,
                    filter: FILTERS.find((f) => f.name === currentCrop.filter)?.style || "none",
                    transition: isDragging ? "none" : "transform 0.15s ease-out",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedUpload?.src}
                    alt={selectedUpload?.fileName || "Uploaded photo"}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                      userSelect: "none",
                      pointerEvents: "none",
                    }}
                    draggable={false}
                  />
                </div>
              )}
            </div>

            {/* 컨트롤 영역 */}
            <div
              style={{
                maxWidth: "480px",
                margin: "2rem auto 0",
                opacity: canInteractWithImage ? 1 : 0.3,
                pointerEvents: canInteractWithImage ? "auto" : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
                <ZoomOut size={22} strokeWidth={1.5} />
                <div style={{ flex: 1 }}>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.01"
                    value={currentCrop.zoom}
                    onChange={(e) => updateCurrentCrop({ zoom: parseFloat(e.target.value) })}
                    style={{ width: "100%", accentColor: "var(--text-primary)", height: "2px", background: "#E5E7EB" }}
                  />
                </div>
                <ZoomIn size={22} strokeWidth={1.5} />
                <button onClick={handleReset} style={{ marginLeft: "0.5rem", color: "var(--text-tertiary)" }}>
                  <RefreshCcw size={14} />
                </button>
              </div>

              <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "12px" }}>
                {FILTERS.map((f) => (
                  <button
                    key={f.name}
                    className={`filter-chip ${currentCrop.filter === f.name ? "active" : ""}`}
                    onClick={() => updateCurrentCrop({ filter: f.name })}
                  >
                    {f.name}
                  </button>
                ))}
              </div>

              <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
                <button
                  onClick={handleSaveCrop}
                  className={`btn btn-primary ${shouldNudgeSave ? "nudge-pulse" : ""}`}
                  disabled={!hasPhoto || interactionsDisabled || currentSaveStatus === "saving" || currentSaveStatus === "saved"}
                  style={{
                    padding: "0.875rem 2.5rem",
                    borderRadius: "999px",
                    fontSize: "0.9375rem",
                    fontWeight: "700",
                    minWidth: "180px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  {currentSaveStatus === "saving" ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Saving...
                    </>
                  ) : currentSaveStatus === "saved" ? (
                    <>
                      <Check size={18} color="#10B981" strokeWidth={3} />{" "}
                      <span style={{ color: "#10B981" }}>Saved</span>
                    </>
                  ) : (
                    "Save This Crop"
                  )}
                </button>
              </div>
            </div>

            {/* ✅ 썸네일 스트립 (선택/재업로드/삭제) */}
            <div className="album-strip">
              {uploads.map((u) => (
                <div key={u.id} style={{ position: "relative" }}>
                  {u.src && (
                    <button
                      className="thumb-action"
                      aria-label="Remove photo"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleClearPhoto(u.id);
                      }}
                      title="Remove photo"
                      type="button"
                    >
                      <X size={14} />
                    </button>
                  )}

                  <div
                    onClick={() => {
                      if (selectedUploadId !== u.id) {
                        setSelectedUploadId(u.id);
                        return;
                      }
                      openFilePickerFor(u.id);
                    }}
                    style={{
                      aspectRatio: "1/1",
                      borderRadius: "0.5rem",
                      backgroundColor: "#E5E7EB",
                      cursor: "pointer",
                      border: selectedUploadId === u.id ? "2px solid var(--text-primary)" : "2px solid transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    {u.src ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={u.src}
                        alt={u.fileName || "thumb"}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
                    ) : (
                      <ImageIcon size={20} color="#9CA3AF" />
                    )}
                  </div>

                  {saveStatuses[u.id] === "saved" && (
                    <div
                      style={{
                        position: "absolute",
                        top: 4,
                        right: 4,
                        background: "white",
                        border: "1px solid #10B981",
                        borderRadius: "50%",
                        width: "16px",
                        height: "16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                        zIndex: 10,
                      }}
                    >
                      <Check size={10} color="#10B981" strokeWidth={4} />
                    </div>
                  )}
                </div>
              ))}

              <button
                onClick={handleAddSlotAndUpload}
                style={{
                  aspectRatio: "1/1",
                  borderRadius: "0.5rem",
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-tertiary)",
                  background: "white",
                  cursor: "pointer",
                }}
                aria-label="Add photo"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>

          {/* 오른쪽 주문 요약 */}
          <div>
            <div
              style={{
                backgroundColor: "white",
                padding: "2rem",
                borderRadius: "1.5rem",
                border: "1px solid var(--border)",
                position: "sticky",
                top: "100px",
              }}
            >
              <h3 style={{ fontSize: "0.9375rem", fontWeight: "800", marginBottom: "1.5rem" }}>Order Summary</h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem", marginBottom: "2rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Quantity</span>
                  <span style={{ fontWeight: "700" }}>{savedCount} tiles</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1rem", fontWeight: "800" }}>
                  <span>Price</span>
                  <span>฿{savedCount * 200}</span>
                </div>
              </div>

              <div style={{ position: "relative" }}>
                {showGuidance && (
                  <div className="guidance-toast">
                    <div style={{ display: "flex", gap: "0.75rem" }}>
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          backgroundColor: "#F3F4F6",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Info size={16} />
                      </div>
                      <div>
                        <p style={{ fontSize: "0.875rem", fontWeight: "800", color: "var(--text-primary)", marginBottom: "2px" }}>
                          {showGuidance.title}
                        </p>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>{showGuidance.subtitle}</p>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleContinueToCheckout}
                  className="btn btn-primary"
                  style={{
                    width: "100%",
                    padding: "1rem",
                    borderRadius: "999px",
                    fontWeight: "800",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  {isNavigating ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Loading...
                    </>
                  ) : (
                    "Continue to checkout"
                  )}
                </button>
              </div>

              {navTimerExceeded && (
                <p style={{ marginTop: "8px", textAlign: "center", fontSize: "11px", color: "var(--text-tertiary)" }}>
                  Preparing checkout...
                </p>
              )}
            </div>
          </div>
        </div>

        {isDevAvailable && (
          <div className="dev-badge" onClick={() => setIsLabOpen(true)}>
            <Settings size={14} /> ⚙︎ Dev Only
          </div>
        )}

        {isLabOpen && (
          <div className="lab-overlay" onClick={() => setIsLabOpen(false)}>
            <div className="lab-modal" onClick={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h2 style={{ fontSize: "14px", fontWeight: "900" }}>DEV ONLY: STATE LAB</h2>
                <X size={20} onClick={() => setIsLabOpen(false)} style={{ cursor: "pointer" }} />
              </div>

              <div style={{ display: "grid", gap: "12px" }}>
                {[
                  { label: "Upload State", key: "uploadState", options: ["idle", "uploading", "error"] },
                  { label: "Image Load", key: "loadState", options: ["loaded", "loading", "error"] },
                  { label: "Validation", key: "validationError", options: ["off", "on"] },
                  { label: "Checkout", key: "checkoutState", options: ["ready", "disabled"] },
                ].map((row) => (
                  <div key={row.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "12px", fontWeight: "600" }}>{row.label}</span>
                    <select
                      style={{ fontSize: "12px" }}
                      value={(labState as any)[row.key]}
                      onChange={(e) => setLabState((ps) => ({ ...ps, [row.key]: e.target.value }))}
                    >
                      {row.options.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div style={{ position: "fixed", top: "100px", left: "50%", transform: "translateX(-50%)", zIndex: 1000 }}>
          {showAllSavedToast && (
            <div
              style={{
                padding: "0.625rem 1.25rem",
                backgroundColor: "#111827",
                color: "white",
                borderRadius: "999px",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.8125rem",
                fontWeight: "600",
                boxShadow: "0 10px 15px -3px rgba(0,0,0,0.3)",
              }}
            >
              <Check size={14} color="#10B981" /> All photos saved
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
