export function stopStream(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => track.stop());
}

export async function openBackCamera(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("이 브라우저에서는 카메라를 직접 열 수 없어요.");
  }

  const attempts: MediaStreamConstraints[] = [
    { audio: false, video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } } },
    { audio: false, video: { facingMode: "environment" } },
    { audio: false, video: true },
  ];

  let lastError: unknown;
  for (const constraints of attempts) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("카메라 권한이 필요해요.");
}

export function pickNativeCameraFile(): Promise<File | undefined> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.setAttribute("capture", "environment");
    input.addEventListener("change", () => {
      resolve(input.files?.[0] ?? undefined);
    });
    input.addEventListener("cancel", () => resolve(undefined));
    input.click();
  });
}

export function pickAlbumFile(): Promise<File | undefined> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.addEventListener("change", () => {
      resolve(input.files?.[0] ?? undefined);
    });
    input.addEventListener("cancel", () => resolve(undefined));
    input.click();
  });
}

export async function snapshotFromVideo(video: HTMLVideoElement): Promise<File> {
  const width = video.videoWidth;
  const height = video.videoHeight;
  if (!width || !height) {
    throw new Error("카메라 화면을 아직 불러오지 못했어요.");
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("사진을 저장할 수 없어요.");
  ctx.drawImage(video, 0, 0, width, height);
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((value) => resolve(value), "image/jpeg", 0.9);
  });
  if (!blob) throw new Error("사진 저장에 실패했어요.");
  return new File([blob], "capture.jpg", { type: "image/jpeg" });
}
