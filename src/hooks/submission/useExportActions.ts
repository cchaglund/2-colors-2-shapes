import { useCallback, type RefObject } from 'react';
import { CANVAS_SIZE } from '../../types/canvas';

/**
 * Hook for submission export actions (download SVG/PNG, copy share link)
 */
export function useExportActions(
  svgRef: RefObject<SVGSVGElement | null>,
  challengeDate: string
) {
  const downloadSVG = useCallback(() => {
    if (!svgRef.current || !challengeDate) return;

    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `submission-${challengeDate}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [svgRef, challengeDate]);

  const downloadPNG = useCallback(() => {
    if (!svgRef.current || !challengeDate) return;

    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_SIZE * 2; // 2x for retina
    canvas.height = CANVAS_SIZE * 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.scale(2, 2);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      canvas.toBlob((blob) => {
        if (!blob) return;
        const pngUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = `submission-${challengeDate}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(pngUrl);
      }, 'image/png');
    };

    img.src = url;
  }, [svgRef, challengeDate]);

  const copyShareLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
  }, []);

  return {
    downloadSVG,
    downloadPNG,
    copyShareLink,
  };
}
