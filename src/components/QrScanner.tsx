import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

const REGION_ID = "qr-reader-region";

export function QrScanner({
  onResult,
  onCancel,
}: {
  onResult: (text: string) => void;
  onCancel: () => void;
}) {
  const [erro, setErro] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const doneRef = useRef(false);

  useEffect(() => {
    const scanner = new Html5Qrcode(REGION_ID, { verbose: false });
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (text) => {
          if (doneRef.current) return;
          doneRef.current = true;
          onResult(text);
        },
        () => {},
      )
      .catch((e: unknown) => {
        setErro(
          e instanceof Error ? e.message : "Não foi possível acessar a câmera deste dispositivo.",
        );
      });

    return () => {
      const s = scannerRef.current;
      scannerRef.current = null;
      if (s?.isScanning) s.stop().then(() => s.clear()).catch(() => {});
    };
  }, [onResult]);

  return (
    <div className="w-full max-w-sm space-y-4">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
        <div id={REGION_ID} className="w-full" />
      </div>
      {erro ? (
        <p className="rounded-xl bg-destructive/15 px-4 py-3 text-sm text-destructive-foreground">
          {erro}
        </p>
      ) : (
        <p className="text-center text-sm text-muted-foreground">
          Aponte a câmera para o QR Code do ingresso
        </p>
      )}
      <button
        onClick={onCancel}
        className="w-full rounded-xl border border-border px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
      >
        Cancelar
      </button>
    </div>
  );
}
