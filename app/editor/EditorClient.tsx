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
import { getOrders, canEdit } from "@/utils/orders";

type UploadItem = {
  id: string;
  status?: string;
  isCropped?: boolean;

  src?: string; // objectURL (편집화면용)
  fileName?: string;

  previewUrl?: string; // dataURL (주문/리스트용 영구) - ✅ 크롭 결과
};

type CropState = {
  zoom: number; // 1 ~ 3
  dragPos: { x: number; y: number }; // ✅ frame(px) 기준 이동량
  filter: string;
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

type ImgMeta = { w: number; h: number };

const EDITOR_STATE_KEY = "MYTILE_EDITOR_STATE";
const ORDER_ITEMS_KEY = "MYTILE_ORDER_ITEMS";
const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15MB

export default function EditorPage() {
  const app = useApp() as any;
  const { t } = app || {};
  const setCart = app?.setCart as ((v: any[]) => void) | undefined;

  const router = useRouter();
  const searchParams = useSearchParams();

  const tr = (key: string, fallback: string) => {
    const v = t?.(key);
    if (!v || v === key) return fallback;
    return v;
  };

  const editOrderId = searchParams.get("editOrderId");
  const hasDevParam = searchParams.get("dev") === "1";

  // --- STATE ---
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

  // ✅ 업로드 직후부터 "cover 기준"으로 정확히 렌더링/클램프하기 위한 메타
  const [imgMetaMap, setImgMetaMap] = useState<Record<string, ImgMeta>>({});
  const imgMetaRef = useRef<Record<string, ImgMeta>>({});
  useEffect(() => {
    imgMetaRef.current = imgMetaMap;
  }, [imgMetaMap]);

  const [frameSize, setFrameSize] = useState<number>(480);

  const [labState, setLabState] = useState({
    uploadState: "idle",
    loadState: "loaded",
    interactionState: "ready",
    checkoutState: "ready",
    validationError: "off",
  });

  const [validationMessage, setValidationMessage] = useState<string>(
    tr("errorLoadingPhoto", "Unsupported file type or file too large.")
  );

  // ✅ cropper frame size를 얻기 위한 ref
  const frameRef = useRef<HTMLDivElement | null>(null);

  // ✅ hidden file input (하나만)
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pendingTargetIdRef = useRef<string | null>(null);

  // ✅ file picker 중복 오픈 방지
  const isFilePickerOpeningRef = useRef(false);
  const lastPickerOpenAtRef = useRef(0);

  // ✅ objectURL 관리
  const objectUrlMapRef = useRef<Record<string, string>>({}); // id -> objectURL

  // ✅ drag state
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const preventClickUntilRef = useRef(0);
  const didPointerDownRef = useRef(false);
  const movedEnoughRef = useRef(false);

  // ✅ stale 방지 refs
  const uploadsRef = useRef<UploadItem[]>(uploads);
  useEffect(() => {
    uploadsRef.current = uploads;
  }, [uploads]);

  const cropsRef = useRef<Record<string, CropState>>(crops);
  useEffect(() => {
    cropsRef.current = crops;
  }, [crops]);

  const saveStatusesRef = useRef<Record<string, SaveStatus>>(saveStatuses);
  useEffect(() => {
    saveStatusesRef.current = saveStatuses;
  }, [saveStatuses]);

  // ✅ 타이머 유틸
  const timeoutsRef = useRef<number[]>([]);
  const setSafeTimeout = (fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timeoutsRef.current.push(id);
    return id;
  };

  // ✅ cleanup + objectURL revoke
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

  // ✅ 파일 다이얼로그 Cancel 시 lock 해제
  useEffect(() => {
    const onFocus = () => {
      window.setTimeout(() => {
        isFilePickerOpeningRef.current = false;
      }, 200);
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  // ✅ frame size 실시간 측정(ResizeObserver)
  useEffect(() => {
    if (!frameRef.current) return;

    const el = frameRef.current;
    const apply = () => {
      const rect = el.getBoundingClientRect();
      const w = Math.round(rect.width || 480);
      if (w > 0) setFrameSize(w);
    };
    apply();

    const ro = new ResizeObserver(() => apply());
    ro.observe(el);
    return () => ro.disconnect();
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

  const getFilterStyle = (filterName: string) => {
    return FILTERS.find((f) => f.name === filterName)?.style || "none";
  };

  // ---------------------------
  // ✅ editor 상태 저장/복원
  // ---------------------------
  const persistEditorState = () => {
    try {
      const payload = { uploads, crops, saveStatuses, selectedUploadId };
      sessionStorage.setItem(EDITOR_STATE_KEY, JSON.stringify(payload));
    } catch {}
  };

  useEffect(() => {
    if (editOrderId) return;
    persistEditorState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploads, crops, saveStatuses, selectedUploadId, editOrderId]);

  // --- INIT ---
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

        return {
          ...item,
          status: "cropped",
          isCropped: true,
          previewUrl: item.previewUrl || item.src,
        };
      });

      setUploads(loadedUploads);
      setCrops(initialCrops);
      setSaveStatuses(initialStatuses);
      if (loadedUploads.length > 0) setSelectedUploadId(loadedUploads[0].id);
      return;
    }

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
    } catch {}

    const firstId = `u-${Date.now()}`;
    setUploads([{ id: firstId, status: "needs-crop", isCropped: false }]);
    setCrops({ [firstId]: { zoom: 1.2, dragPos: { x: 0, y: 0 }, filter: "Original" } });
    setSaveStatuses({});
    setSelectedUploadId(firstId);
  }, [editOrderId, router]);

  // Dev toggle
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

  const isValidationError = labState.validationError === "on";
  const isUploading = labState.uploadState === "uploading";
  const isLoadingImage = labState.loadState === "loading";

  const hasPhoto = !!selectedUpload?.src;

  const canInteractWithImage =
    hasPhoto && !isUploading && !isLoadingImage && labState.interactionState !== "disabled";
  const interactionsDisabled = !canInteractWithImage;

  // ✅ "사진 있는 슬롯"만 대상으로 allSaved 판단
  const photos = useMemo(() => uploads.filter((u) => !!u.src), [uploads]);
  const savedCount = useMemo(() => photos.filter((u) => saveStatuses[u.id] === "saved").length, [photos, saveStatuses]);
  const allPhotosSaved = useMemo(() => photos.length > 0 && photos.every((u) => saveStatuses[u.id] === "saved"), [photos, saveStatuses]);

  const checkoutDisabled =
    !allPhotosSaved || isLoadingImage || labState.checkoutState === "disabled" || isNavigating;

  // ---------------------------
  // ✅ cover 기반 실제 clamp (Mixtiles처럼 "원본 끝까지" 이동 가능)
  // ---------------------------
  const getCoverSizePx = (imgMeta?: ImgMeta) => {
    const size = frameSize || 480;
    if (!imgMeta || !imgMeta.w || !imgMeta.h) {
      // 메타 없으면 fallback: frame 기준(기존처럼 보수적으로)
      return { w: size, h: size, baseScale: 1 };
    }
    const baseScale = Math.max(size / imgMeta.w, size / imgMeta.h);
    return { w: imgMeta.w * baseScale, h: imgMeta.h * baseScale, baseScale };
  };

  const clampDrag = (id: string, next: { x: number; y: number }, zoom: number) => {
    const size = frameSize || 480;

    const meta = imgMetaRef.current[id];
    const cover = getCoverSizePx(meta);

    // zoom 적용 후 실제 렌더링 크기
    const zw = cover.w * (zoom || 1);
    const zh = cover.h * (zoom || 1);

    // 프레임보다 큰 만큼만 이동 허용 (빈 공간 방지)
    const maxX = Math.max(0, (zw - size) / 2);
    const maxY = Math.max(0, (zh - size) / 2);

    const cx = Math.max(-maxX, Math.min(maxX, next.x));
    const cy = Math.max(-maxY, Math.min(maxY, next.y));
    return { x: cx, y: cy };
  };

  const updateCurrentCrop = (updates: Partial<CropState>) => {
    if (!selectedUploadId) return;

    setCrops((prev) => {
      const base = prev[selectedUploadId] || currentCrop;
      const next = { ...base, ...updates };

      // drag 변경 시 clamp
      if (updates.dragPos) {
        next.dragPos = clampDrag(selectedUploadId, updates.dragPos, next.zoom);
      }

      // zoom 변경 시에도 clamp(현재 drag 유지하되 범위 재계산)
      if (typeof updates.zoom === "number") {
        next.dragPos = clampDrag(selectedUploadId, next.dragPos, next.zoom);
      }

      return { ...prev, [selectedUploadId]: next };
    });

    if (currentSaveStatus === "saved") {
      setSaveStatuses((prev) => ({ ...prev, [selectedUploadId]: "idle" }));
    }
  };

  // ---------------------------
  // ✅ 업로드 로직
  // ---------------------------
  const ensureSlot = (): string => {
    if (selectedUploadId) return selectedUploadId;

    const newId = `u-${Date.now()}`;
    setUploads((prev) => [...prev, { id: newId, status: "needs-crop", isCropped: false }]);
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

    if (fileInputRef.current) fileInputRef.current.value = "";

    requestAnimationFrame(() => {
      fileInputRef.current?.click();
    });

    setSafeTimeout(() => {
      isFilePickerOpeningRef.current = false;
    }, 1500);
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

    // ✅ 업로드 초기 crop: "가운데 기준"
    setUploads((prev) =>
      prev.map((u) =>
        u.id === slotId
          ? {
              ...u,
              src: nextUrl,
              fileName: file.name,
              status: "needs-crop",
              isCropped: false,
              previewUrl: undefined,
            }
          : u
      )
    );

    // ✅ 메타는 새로 로드될 때 다시 채움
    setImgMetaMap((prev) => {
      const next = { ...prev };
      delete next[slotId];
      return next;
    });

    setSaveStatuses((prev) => ({ ...prev, [slotId]: "idle" }));
    setCrops((prev) => ({
      ...prev,
      [slotId]: { zoom: 1.2, dragPos: { x: 0, y: 0 }, filter: "Original" },
    }));
    setSelectedUploadId(slotId);

    setLabState((ps) => ({ ...ps, uploadState: "idle", loadState: "loaded", validationError: "off" }));
  };

  const isHeicLike = (file: File) => {
    const name = (file.name || "").toLowerCase();
    const type = (file.type || "").toLowerCase();
    return name.endsWith(".heic") || name.endsWith(".heif") || type.includes("heic") || type.includes("heif");
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

    if (isHeicLike(file)) {
      setValidationMessage(tr("heicNotSupported", "HEIC/HEIF is not supported yet. Please upload JPG, PNG, or WebP."));
      setLabState((ps) => ({ ...ps, validationError: "on" }));
      setSafeTimeout(() => setLabState((ps) => ({ ...ps, validationError: "off" })), 3500);
      pendingTargetIdRef.current = null;
      return;
    }

    if (!file.type.startsWith("image/")) {
      setValidationMessage(tr("errorLoadingPhoto", "Unsupported file type. Please upload an image."));
      setLabState((ps) => ({ ...ps, validationError: "on" }));
      setSafeTimeout(() => setLabState((ps) => ({ ...ps, validationError: "off" })), 2500);
      pendingTargetIdRef.current = null;
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      const mb = Math.round((MAX_FILE_BYTES / (1024 * 1024)) * 10) / 10;
      setValidationMessage(`File too large. Please upload under ${mb}MB.`);
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
    setUploads((prev) => [...prev, { id: newId, status: "needs-crop", isCropped: false }]);
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
        u.id === id ? { ...u, src: undefined, fileName: undefined, isCropped: false, status: "needs-crop", previewUrl: undefined } : u
      )
    );

    setSaveStatuses((prev) => ({ ...prev, [id]: "idle" }));
    setCrops((prev) => ({ ...prev, [id]: { zoom: 1.2, dragPos: { x: 0, y: 0 }, filter: "Original" } }));

    setImgMetaMap((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  // ---------------------------
  // ✅ "보이는 그대로" 캔버스에 렌더링 (좌표계 정확히 맞춤)
  // ---------------------------
  const createCroppedPreviewDataUrl = async (src: string, crop: CropState): Promise<string> => {
    const SIZE = 640;

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("Image load failed"));
      i.src = src;
    });

    const canvas = document.createElement("canvas");
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");

    const filterStyle = getFilterStyle(crop.filter);
    ctx.filter = filterStyle === "none" ? "none" : filterStyle;

    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;

    // ✅ cover(가운데 정렬) 기본 스케일
    const baseScale = Math.max(SIZE / iw, SIZE / ih);

    // ✅ 최종 스케일 = cover * zoom
    const scale = baseScale * (crop.zoom || 1);

    const drawW = iw * scale;
    const drawH = ih * scale;

    // ✅ drag(px)는 frame 기준 → canvas 기준으로 변환
    const toCanvas = SIZE / (frameSize || 480);
    const dx = (crop.dragPos?.x || 0) * toCanvas;
    const dy = (crop.dragPos?.y || 0) * toCanvas;

    // ✅ "가운데 기준" 배치
    const centerX = SIZE / 2 + dx;
    const centerY = SIZE / 2 + dy;

    const drawX = centerX - drawW / 2;
    const drawY = centerY - drawH / 2;

    // background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, SIZE, SIZE);

    ctx.drawImage(img, drawX, drawY, drawW, drawH);

    return canvas.toDataURL("image/jpeg", 0.92);
  };

  // --- HANDLERS ---
  const handleSaveCrop = () => {
    if (!hasPhoto || interactionsDisabled || currentSaveStatus === "saving" || !selectedUploadId) return;

    const savingId = selectedUploadId;

    setIsDragging(false);
    setSaveStatuses((prev) => ({ ...prev, [savingId]: "saving" }));

    setSafeTimeout(async () => {
      try {
        const latestUploads = uploadsRef.current;
        const u = latestUploads.find((x) => x.id === savingId);
        const crop = cropsRef.current[savingId];
        if (!u?.src || !crop) throw new Error("Missing src/crop");

        const previewDataUrl = await createCroppedPreviewDataUrl(u.src, crop);

        setUploads((prev) =>
          prev.map((item) =>
            item.id === savingId ? { ...item, isCropped: true, previewUrl: previewDataUrl, status: "cropped" } : item
          )
        );

        setSaveStatuses((prev) => ({ ...prev, [savingId]: "saved" }));

        try {
          const nextStatuses = { ...(saveStatusesRef.current || {}), [savingId]: "saved" as SaveStatus };
          const orderItems = uploadsRef.current
            .filter((x) => !!x.src && nextStatuses[x.id] === "saved")
            .map((x) => ({
              id: x.id,
              previewUrl: x.id === savingId ? previewDataUrl : x.previewUrl,
              src: x.src,
              fileName: x.fileName,
              zoom: cropsRef.current[x.id]?.zoom,
              dragPos: cropsRef.current[x.id]?.dragPos,
              filter: cropsRef.current[x.id]?.filter,
              qty: 1,
            }));
          sessionStorage.setItem(ORDER_ITEMS_KEY, JSON.stringify(orderItems));
        } catch {}
      } catch {
        setSaveStatuses((prev) => ({ ...prev, [savingId]: "error" }));
        setSafeTimeout(() => setSaveStatuses((prev) => ({ ...prev, [savingId]: "idle" })), 1200);
      }
    }, 80);
  };

  const handleContinueToCheckout = () => {
    if (isNavigating) return;

    if (photos.length === 0) {
      setShowGuidance({ title: "Upload a photo to continue", subtitle: "You need at least 1 tile for an order." });
      setSafeTimeout(() => setShowGuidance(null), 3000);
      return;
    }

    if (isLoadingImage) {
      setShowGuidance({
        title: tr("loadingEditor", "Loading photo..."),
        subtitle: tr("selectPhotoToEdit", "Please wait until your photo is ready."),
      });
      setSafeTimeout(() => setShowGuidance(null), 3000);
      return;
    }

    if (!allPhotosSaved) {
      setShowGuidance({ title: "Save all crops to continue", subtitle: "Every uploaded photo must be saved." });
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
        .filter((u) => !!u.src && saveStatuses[u.id] === "saved")
        .map((u) => ({
          id: u.id,
          previewUrl: u.previewUrl,
          src: u.src,
          qty: 1,
          zoom: crops[u.id]?.zoom,
          dragPos: crops[u.id]?.dragPos,
          filter: crops[u.id]?.filter,
        }));

      sessionStorage.setItem(ORDER_ITEMS_KEY, JSON.stringify(orderItems));

      if (typeof setCart === "function") {
        setCart(orderItems);
      }

      router.push("/checkout");
    }, 250);
  };

  const handleReset = () => {
    if (!selectedUploadId) return;
    updateCurrentCrop({ zoom: 1.2, dragPos: { x: 0, y: 0 }, filter: "Original" });
  };

  // --- POINTER DRAG ---
  const startDragging = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canInteractWithImage || !selectedUploadId) return;

    didPointerDownRef.current = true;
    movedEnoughRef.current = false;

    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);

    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - currentCrop.dragPos.x, y: e.clientY - currentCrop.dragPos.y };
  };

  const onDragging = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !canInteractWithImage || !selectedUploadId) return;

    const nextX = e.clientX - dragStartRef.current.x;
    const nextY = e.clientY - dragStartRef.current.y;

    const dx = nextX - currentCrop.dragPos.x;
    const dy = nextY - currentCrop.dragPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (!movedEnoughRef.current && dist >= 2) movedEnoughRef.current = true;

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

  // ✅ 선택된 이미지의 cover 렌더 사이즈(프레임 px 기준)
  const selectedMeta = selectedUploadId ? imgMetaMap[selectedUploadId] : undefined;
  const coverPx = getCoverSizePx(selectedMeta);

  return (
    <AppLayout showFooter={false}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: "none" }}
        onChange={onFileChange}
      />

      <div style={{ backgroundColor: "#F9FAFB", minHeight: "100vh", paddingBottom: "120px" }}>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              .editor-grid { display: grid; grid-template-columns: 1fr 360px; gap: 3rem; padding-top: 1rem; }
              @media (max-width: 1023px) { .editor-grid { grid-template-columns: 1fr; gap: 1.5rem; padding-top: 0; } }

              .cropper-frame { 
                aspect-ratio: 1/1; 
                width: 100%; 
                max-width: 520px; 
                margin: 0 auto; 
                position: relative; 
                overflow: hidden; 
                background-color: #F3F4F6; 
                border: 1px solid rgba(0,0,0,0.06); 
                transition: all 0.2s; 
                touch-action: none; 
                border-radius: 16px;
              }
              .cropper-frame.ready { cursor: grab; }
              .cropper-frame.ready:active { cursor: grabbing; border-color: rgba(17,24,39,0.4); }

              .album-strip { display: grid; grid-template-columns: repeat(10, 1fr); gap: 10px; margin-top: 2rem; }
              @media (max-width: 600px) { .album-strip { grid-template-columns: repeat(5, 1fr); } }

              .filter-chip { 
                padding: 8px 18px; 
                border-radius: 999px; 
                font-size: 14px; 
                font-weight: 800; 
                border: 1px solid var(--border); 
                background: white; 
                color: var(--text-secondary); 
                cursor: pointer; 
                white-space: nowrap; 
                transition: all 0.2s; 
              }
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
                min-width: 260px;
                z-index: 50;
                animation: slide-up 0.3s ease-out;
              }
              @keyframes slide-up {
                from { opacity: 0; transform: translateX(-50%) translateY(0); }
                to { opacity: 1; transform: translateX(-50%) translateY(-12px); }
              }

              /* ✅ Upload card: 효과 다시 강하게 + 가독성 업 */
              .upload-card { height: 100%; display: flex; align-items: center; justify-content: center; padding: 2rem; }
              .upload-inner {
                width: 100%;
                max-width: 460px;
                border-radius: 22px;
                border: 1px solid rgba(0,0,0,0.10);
                background: #fff;
                box-shadow: 0 10px 28px rgba(0,0,0,0.08);
                padding: 30px;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 14px;
                cursor: pointer;
                transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
                position: relative;
                isolation: isolate;
                outline: none;
              }
              .upload-inner:hover { transform: translateY(-2px); box-shadow: 0 16px 40px rgba(0,0,0,0.10); border-color: rgba(17,24,39,0.25); }
              .upload-inner:active { transform: translateY(0px) scale(0.992); }
              .upload-inner:focus-visible {
                box-shadow: 0 0 0 5px rgba(17,24,39,0.12), 0 16px 40px rgba(0,0,0,0.10);
                border-color: rgba(17,24,39,0.30);
              }
              .upload-icon {
                width: 54px;
                height: 54px;
                border-radius: 16px;
                background: rgba(17,24,39,0.08);
                display: flex;
                align-items: center;
                justify-content: center;
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
              gap: "0.35rem",
              color: "var(--text-tertiary)",
              fontSize: "0.95rem",
              fontWeight: 800,
            }}
          >
            <ChevronLeft size={18} /> {t?.("backToHome") || tr("cancel", "Back")}
          </Link>
        </div>

        <div className="container editor-grid">
          <div>
            {isValidationError && (
              <div
                style={{
                  marginBottom: "1.2rem",
                  padding: "0.9rem 1.1rem",
                  background: "#FEF2F2",
                  border: "1px solid #FEE2E2",
                  borderRadius: "12px",
                  color: "#991B1B",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                }}
              >
                <AlertCircle size={18} /> {validationMessage}
              </div>
            )}

            {/* ✅ 크롭 영역 */}
            <div
              ref={frameRef}
              className={`cropper-frame ${canInteractWithImage ? "ready" : ""}`}
              onPointerDown={startDragging}
              onPointerMove={onDragging}
              onPointerUp={stopDragging}
              onPointerCancel={stopDragging}
              onPointerLeave={stopDragging}
              onClick={(e) => {
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
              style={{ cursor: hasPhoto ? "grab" : "pointer" }}
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
                    <div className="upload-icon">
                      <Upload size={26} />
                    </div>
                    <div style={{ fontSize: "22px", fontWeight: 950, color: "#111827", letterSpacing: "-0.02em" }}>
                      {tr("uploadPhotos", "Upload Photos")}
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: 800, color: "rgba(17,24,39,0.60)" }}>
                      {tr("selectPhotoToEdit", "Pick a moment you love")}
                    </div>
                    <div style={{ marginTop: 6, fontSize: 12, color: "rgba(17,24,39,0.45)", fontWeight: 800 }}>
                      JPG / PNG / WebP only
                    </div>
                  </div>
                </div>
              ) : isLoadingImage ? (
                <div className="skeleton" style={{ width: "100%", height: "100%" }} />
              ) : (
                <>
                  {/* ✅ Mixtiles 방식: "cover 스케일"을 직접 계산해 업로드 직후 흰여백/짤림 방지 */}
                  <img
                    key={selectedUpload?.src} // src 바뀌면 확실히 리셋
                    src={selectedUpload?.src}
                    alt={selectedUpload?.fileName || "Uploaded photo"}
                    onLoad={(e) => {
                      if (!selectedUploadId) return;
                      const img = e.currentTarget;
                      const w = img.naturalWidth || 0;
                      const h = img.naturalHeight || 0;
                      if (w > 0 && h > 0) {
                        setImgMetaMap((prev) => {
                          const next = { ...prev, [selectedUploadId]: { w, h } };
                          return next;
                        });

                        // ✅ 메타 들어온 순간, 현재 drag/zoom 기준으로 clamp 한번 해서
                        // 업로드 직후에도 빈영역/짤림 없게 안정화
                        setCrops((prev) => {
                          const base = prev[selectedUploadId] || { zoom: 1.2, dragPos: { x: 0, y: 0 }, filter: "Original" };
                          const clamped = clampDrag(selectedUploadId, base.dragPos, base.zoom);
                          return { ...prev, [selectedUploadId]: { ...base, dragPos: clamped } };
                        });
                      }
                    }}
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: "50%",

                      // cover(프레임기준)로 만든 실제 px 사이즈
                      width: `${coverPx.w}px`,
                      height: `${coverPx.h}px`,

                      transform: `translate(-50%, -50%) translate(${currentCrop.dragPos.x}px, ${currentCrop.dragPos.y}px) scale(${currentCrop.zoom})`,
                      transformOrigin: "50% 50%",
                      filter: getFilterStyle(currentCrop.filter),

                      transition: isDragging ? "none" : "transform 0.12s ease-out",
                      willChange: "transform",

                      userSelect: "none",
                      pointerEvents: "none",
                      display: "block",
                    }}
                    draggable={false}
                  />
                </>
              )}
            </div>

            {/* 컨트롤 */}
            <div
              style={{
                maxWidth: "520px",
                margin: "2rem auto 0",
                opacity: canInteractWithImage ? 1 : 0.3,
                pointerEvents: canInteractWithImage ? "auto" : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.6rem" }}>
                <ZoomOut size={24} strokeWidth={1.6} />
                <div style={{ flex: 1 }}>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.01"
                    value={currentCrop.zoom}
                    onChange={(e) => updateCurrentCrop({ zoom: parseFloat(e.target.value) })}
                    style={{ width: "100%", accentColor: "var(--text-primary)", height: "3px", background: "#E5E7EB" }}
                  />
                </div>
                <ZoomIn size={24} strokeWidth={1.6} />
                <button
                  type="button"
                  onClick={handleReset}
                  style={{
                    marginLeft: "0.25rem",
                    color: "var(--text-tertiary)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 36,
                    height: 36,
                    borderRadius: 999,
                    background: "white",
                    border: "1px solid rgba(0,0,0,0.08)",
                    boxShadow: "0 6px 14px rgba(0,0,0,0.06)",
                  }}
                >
                  <RefreshCcw size={16} />
                </button>
              </div>

              <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "12px" }}>
                {FILTERS.map((f) => (
                  <button
                    type="button"
                    key={f.name}
                    className={`filter-chip ${currentCrop.filter === f.name ? "active" : ""}`}
                    onClick={() => updateCurrentCrop({ filter: f.name })}
                  >
                    {f.name}
                  </button>
                ))}
              </div>

              <div style={{ textAlign: "center", marginTop: "1.4rem" }}>
                <button
                  type="button"
                  onClick={handleSaveCrop}
                  className={`btn btn-primary ${shouldNudgeSave ? "nudge-pulse" : ""}`}
                  disabled={!hasPhoto || interactionsDisabled || currentSaveStatus === "saving" || currentSaveStatus === "saved"}
                  style={{
                    padding: "1rem 2.8rem",
                    borderRadius: "999px",
                    fontSize: "1.02rem",
                    fontWeight: 900,
                    minWidth: "210px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                  }}
                >
                  {currentSaveStatus === "saving" ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Saving...
                    </>
                  ) : currentSaveStatus === "saved" ? (
                    <>
                      <Check size={18} color="#10B981" strokeWidth={3} />
                      <span style={{ color: "#10B981" }}>{tr("success", "Saved")}</span>
                    </>
                  ) : (
                    tr("saveCrop", "Save crop")
                  )}
                </button>
              </div>
            </div>

            {/* ✅ 썸네일: previewUrl(크롭 결과) 우선 표시 */}
            <div className="album-strip">
              {uploads.map((u) => (
                <div key={u.id} style={{ position: "relative" }}>
                  {u.src && (
                    <button
                      type="button"
                      className="thumb-action"
                      aria-label={tr("deletePhoto", "Remove photo")}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleClearPhoto(u.id);
                      }}
                      title={tr("deletePhoto", "Remove photo")}
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
                      borderRadius: "0.6rem",
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
                    {u.previewUrl || u.src ? (
                      <img
                        src={(u.previewUrl || u.src) as string}
                        alt={u.fileName || "thumb"}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
                    ) : (
                      <ImageIcon size={22} color="#9CA3AF" />
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
                        width: "18px",
                        height: "18px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                        zIndex: 10,
                      }}
                    >
                      <Check size={11} color="#10B981" strokeWidth={4} />
                    </div>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddSlotAndUpload}
                style={{
                  aspectRatio: "1/1",
                  borderRadius: "0.6rem",
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-tertiary)",
                  background: "white",
                  cursor: "pointer",
                  boxShadow: "0 8px 16px rgba(0,0,0,0.05)",
                }}
                aria-label={tr("addMorePhotos", "Add photo")}
              >
                <Plus size={22} />
              </button>
            </div>
          </div>

          {/* 오른쪽 주문 요약 */}
          <div>
            <div
              style={{
                backgroundColor: "white",
                padding: "2.1rem",
                borderRadius: "1.5rem",
                border: "1px solid var(--border)",
                position: "sticky",
                top: "100px",
              }}
            >
              <h3 style={{ fontSize: "1.05rem", fontWeight: 950, marginBottom: "1.5rem" }}>
                {tr("orderSummary", "Order Summary")}
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.98rem" }}>
                  <span style={{ color: "var(--text-secondary)", fontWeight: 800 }}>{tr("tilesCount", "Quantity")}</span>
                  <span style={{ fontWeight: 950 }}>
                    {savedCount} {tr("tilesUnit", "tiles")}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.1rem", fontWeight: 950 }}>
                  <span>{tr("payment", "Price")}</span>
                  <span>฿{savedCount * 200}</span>
                </div>
              </div>

              <div style={{ position: "relative" }}>
                {showGuidance && (
                  <div className="guidance-toast">
                    <div style={{ display: "flex", gap: "0.75rem" }}>
                      <div
                        style={{
                          width: "34px",
                          height: "34px",
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
                        <p style={{ fontSize: "0.95rem", fontWeight: 950, color: "var(--text-primary)", marginBottom: "2px" }}>
                          {showGuidance.title}
                        </p>
                        <p style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--text-tertiary)" }}>
                          {showGuidance.subtitle}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleContinueToCheckout}
                  className="btn btn-primary"
                  disabled={checkoutDisabled}
                  style={{
                    width: "100%",
                    padding: "1.05rem",
                    borderRadius: "999px",
                    fontWeight: 950,
                    fontSize: "1rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    opacity: checkoutDisabled ? 0.6 : 1,
                  }}
                >
                  {isNavigating ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> {tr("loadingEditor", "Loading...")}
                    </>
                  ) : (
                    tr("proceedToCheckout", "Proceed to Checkout")
                  )}
                </button>
              </div>

              {navTimerExceeded && (
                <p style={{ marginTop: "10px", textAlign: "center", fontSize: "0.82rem", color: "var(--text-tertiary)", fontWeight: 700 }}>
                  {tr("loadingEditor", "Preparing checkout...")}
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

                <button
                  type="button"
                  className="btn"
                  style={{ marginTop: 10 }}
                  onClick={() => {
                    try {
                      sessionStorage.removeItem(EDITOR_STATE_KEY);
                      sessionStorage.removeItem(ORDER_ITEMS_KEY);
                      localStorage.removeItem("memotiles_orders");
                      localStorage.removeItem("memotiles_seeded_v2");
                      if (typeof setCart === "function") setCart([]);
                      location.reload();
                    } catch {}
                  }}
                >
                  Reset editor storage
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
