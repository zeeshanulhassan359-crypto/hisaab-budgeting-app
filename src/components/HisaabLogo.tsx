import React, { useEffect, useRef, useState } from "react";
import logoSrc from "../assets/hisaab-logo.svg";

interface HisaabLogoProps {
  className?: string;
  size?: number;
}

export const HisaabLogo: React.FC<HisaabLogoProps> = ({ className = "", size = 40 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Check if dark mode is active on document root
  useEffect(() => {
    const checkDark = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    };
    checkDark();

    // Set up a MutationObserver to listen for class changes on the html tag (theme switching)
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.src = logoSrc;
    img.onload = () => {
      // 1. Create a temporary off-screen canvas to analyze original image pixels
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = img.width;
      tempCanvas.height = img.height;
      const tempCtx = tempCanvas.getContext("2d");
      if (!tempCtx) return;
      tempCtx.drawImage(img, 0, 0);

      const tempImgData = tempCtx.getImageData(0, 0, img.width, img.height);
      const tempData = tempImgData.data;

      // Find the bounding box of non-white and non-transparent pixels to crop margins
      let minX = img.width;
      let maxX = 0;
      let minY = img.height;
      let maxY = 0;

      for (let y = 0; y < img.height; y++) {
        for (let x = 0; x < img.width; x++) {
          const idx = (y * img.width + x) * 4;
          const r = tempData[idx];
          const g = tempData[idx + 1];
          const b = tempData[idx + 2];
          const a = tempData[idx + 3];

          // Pixel is not white and has alpha channel opacity
          const isWhite = r > 245 && g > 245 && b > 245;
          const isTransparent = a < 10;
          
          if (!isWhite && !isTransparent) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      // Fallback if no non-white pixels are found (e.g. image is completely white)
      if (maxX < minX || maxY < minY) {
        minX = 0;
        maxX = img.width - 1;
        minY = 0;
        maxY = img.height - 1;
      }

      // Add small safety margin padding to prevent edge clipping (e.g. 8 pixels)
      const padding = 8;
      minX = Math.max(0, minX - padding);
      minY = Math.max(0, minY - padding);
      maxX = Math.min(img.width - 1, maxX + padding);
      maxY = Math.min(img.height - 1, maxY + padding);

      const croppedWidth = maxX - minX + 1;
      const croppedHeight = maxY - minY + 1;

      // 2. Set main canvas size matching the cropped logo's aspect ratio
      const aspect = croppedWidth / croppedHeight;
      canvas.width = 400 * aspect;
      canvas.height = 400;

      // Draw only the cropped bounding box region onto the target canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, minX, minY, croppedWidth, croppedHeight, 0, 0, canvas.width, canvas.height);

      // 3. Process target canvas pixels (Background stripping and dark-mode inverting)
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Remove white background (convert to alpha transparent)
        if (r > 240 && g > 240 && b > 240) {
          data[i + 3] = 0; // alpha = 0
        } else if (isDarkMode) {
          // Adjust dark text color to off-white/silver-blue for readability in dark mode
          // Dark blue/black text: R < 100, G < 100, B < 120 (excludes high G green and high B blue)
          if (r < 100 && g < 110 && b < 130) {
            data[i] = 241;     // R
            data[i + 1] = 245; // G
            data[i + 2] = 249; // B
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);
    };
  }, [isDarkMode]);

  return (
    <canvas
      ref={canvasRef}
      style={{ height: size, width: "auto" }}
      className={`shrink-0 select-none max-w-full object-contain transition-all duration-300 ${className}`}
    />
  );
};

export default HisaabLogo;
