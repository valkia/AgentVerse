import { Button } from "@/components/ui/button";
import { Loader2, Share2 } from "lucide-react";
import { lazy, Suspense, useState } from "react";

// 懒加载预览对话框组件
const MessagePreviewDialog = lazy(() =>
  import("./message-preview-dialog").then((module) => ({
    default: module.MessagePreviewDialog,
  }))
);

interface MessageCaptureProps {
  containerRef: React.RefObject<HTMLElement>;
  className?: string;
}

export function MessageCapture({
  containerRef,
  className,
}: MessageCaptureProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const generatePreview = async () => {
    if (!containerRef.current || isCapturing) return;

    try {
      setIsCapturing(true);
      setShowPreview(true);

      // 动态导入 html2canvas
      const html2canvas = (await import("html2canvas")).default;

      // 准备截图：展开所有消息
      const container = containerRef.current;
      const originalHeight = container.style.height;
      const originalOverflow = container.style.overflow;

      // 临时修改样式以确保完整捕获
      container.style.height = "auto";
      container.style.overflow = "visible";

      // 生成截图
      const canvas = await html2canvas(container, {
        backgroundColor: null,
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
      });

      // 恢复原始样式
      container.style.height = originalHeight;
      container.style.overflow = originalOverflow;

      // 生成预览URL
      const imageUrl = canvas.toDataURL("image/png");
      setPreviewUrl(imageUrl);
    } catch (error) {
      console.error("Failed to capture messages:", error);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleDownload = () => {
    if (!previewUrl) return;

    const link = document.createElement("a");
    link.download = `chat-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = previewUrl;
    link.click();
  };

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className={className}
        onClick={generatePreview}
        disabled={isCapturing}
      >
        {isCapturing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Share2 className="h-4 w-4" />
        )}
      </Button>

      {showPreview && (
        <Suspense fallback={null}>
          <MessagePreviewDialog
            open={showPreview}
            onOpenChange={setShowPreview}
            imageUrl={previewUrl}
            onDownload={handleDownload}
            isGenerating={isCapturing}
          />
        </Suspense>
      )}
    </>
  );
}
