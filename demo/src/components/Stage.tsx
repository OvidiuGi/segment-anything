// Copyright (c) Meta Platforms, Inc. and affiliates.
// All rights reserved.

// This source code is licensed under the license found in the
// LICENSE file in the root directory of this source tree.

import React, { useContext, useEffect, useState } from "react";
import * as _ from "underscore";
import Tool from "./Tool";
import ImageSwitcher from "./ImageSwitcher";
import { modelInputProps } from "./helpers/Interfaces";
import AppContext from "./hooks/createContext";

const Stage = () => {
  const {
    clicks: [, setClicks],
    image: [image],
    maskImg: [maskImg],
    savedMasks: [savedMasks, setSavedMasks],
  } = useContext(AppContext)!;

  const [notification, setNotification] = useState<string | null>(null);

  // Show notification and auto-hide it
  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 2000);
  };  // Function to save image with all masks
  const saveImageWithMasks = () => {
    if (!image || savedMasks.length === 0) {
      showNotification("No image or masks to save!");
      return;
    }

    showNotification("Generating image...");

    // Create a canvas to combine the image and masks
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      showNotification("Canvas not supported!");
      return;
    }

    // Set canvas size to match the original image
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    // Draw the original image
    ctx.drawImage(image, 0, 0);

    // Define colors for different mask groups
    const colors = [
      'rgba(255, 0, 0, 0.4)',    // Red
      'rgba(0, 255, 0, 0.4)',    // Green
      'rgba(0, 0, 255, 0.4)',    // Blue
      'rgba(255, 255, 0, 0.4)',  // Yellow
      'rgba(255, 0, 255, 0.4)',  // Magenta
      'rgba(0, 255, 255, 0.4)',  // Cyan
    ];

    // Process masks one by one
    let processedMasks = 0;

    const processMask = (maskIndex: number) => {
      if (maskIndex >= savedMasks.length) {
        // All masks processed, download the image
        const link = document.createElement('a');
        link.download = `segmented-image-${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        showNotification(`Image saved with ${savedMasks.length} masks!`);
        return;
      }

      const { mask, colorGroup } = savedMasks[maskIndex];
      const color = colors[colorGroup % colors.length];

      // Create a temporary canvas for the current mask
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) {
        processMask(maskIndex + 1);
        return;
      }

      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;

      // Draw the mask and apply color overlay
      tempCtx.globalCompositeOperation = 'source-over';
      tempCtx.drawImage(mask, 0, 0, canvas.width, canvas.height);

      // Apply color overlay
      tempCtx.globalCompositeOperation = 'source-atop';
      tempCtx.fillStyle = color;
      tempCtx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw the colored mask onto the main canvas
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(tempCanvas, 0, 0);

      processedMasks++;

      // Process next mask after a short delay to prevent blocking
      setTimeout(() => processMask(maskIndex + 1), 50);
    };

    // Start processing masks
    processMask(0);
  };

  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'c':
          // Clear all saved masks
          if (savedMasks.length > 0) {
            setSavedMasks([]);
            showNotification("All masks cleared!");
          } else {
            showNotification("No masks to clear!");
          }
          break;
        case 's':
          // Save current mask with new color group
          if (!maskImg) {
            showNotification("No mask to save - hover over an area first!");
            return;
          }
          if (savedMasks.some(savedMask => savedMask.mask.src === maskImg.src)) {
            showNotification("Mask already saved!");
            return;
          }

          // Determine next color group (highest + 1)
          const nextColorGroup = savedMasks.length > 0
            ? Math.max(...savedMasks.map(sm => sm.colorGroup)) + 1
            : 0;

          console.log('Debug - Saving mask with new color group:', {
            currentMaskSrc: maskImg.src,
            currentSavedMasksCount: savedMasks.length,
            nextColorGroup
          });

          const maskCopy = new Image();
          maskCopy.src = maskImg.src;
          maskCopy.onload = () => {
            setSavedMasks([...savedMasks, { mask: maskCopy, colorGroup: nextColorGroup }]);
            showNotification(`Mask saved! Total: ${savedMasks.length + 1} (Color group ${nextColorGroup})`);
            console.log('Debug - Mask saved, new count:', savedMasks.length + 1);
          };
          break;
        case 'g':
          // Save current mask with same color group as last mask
          if (!maskImg) {
            showNotification("No mask to save - hover over an area first!");
            return;
          }
          if (savedMasks.length === 0) {
            showNotification("No previous mask to group with - use 'S' to save first mask!");
            return;
          }
          if (savedMasks.some(savedMask => savedMask.mask.src === maskImg.src)) {
            showNotification("Mask already saved!");
            return;
          }

          // Use the same color group as the last saved mask
          const lastColorGroup = savedMasks[savedMasks.length - 1].colorGroup;

          console.log('Debug - Saving mask with same color group:', {
            currentMaskSrc: maskImg.src,
            currentSavedMasksCount: savedMasks.length,
            lastColorGroup
          });

          const groupMaskCopy = new Image();
          groupMaskCopy.src = maskImg.src;
          groupMaskCopy.onload = () => {
            setSavedMasks([...savedMasks, { mask: groupMaskCopy, colorGroup: lastColorGroup }]);
            showNotification(`Mask grouped! Total: ${savedMasks.length + 1} (Same color as previous)`);
            console.log('Debug - Grouped mask saved, new count:', savedMasks.length + 1);
          };
          break;
        case 'd':
          // Download/save image with masks
          if (savedMasks.length === 0) {
            showNotification("No masks to save - add some masks first!");
            return;
          }
          saveImageWithMasks();
          break;
        case 'x':
          // Delete the mask you're currently hovering over
          if (!maskImg) {
            showNotification("No mask to delete - hover over an area first!");
            return;
          }

          console.log('Debug - Trying to delete mask:', {
            currentMaskSrc: maskImg.src,
            savedMasksCount: savedMasks.length,
            savedMasksSrcs: savedMasks.map(savedMask => savedMask.mask.src)
          });

          // Find the saved mask that matches the current hover mask
          const matchingMaskIndex = savedMasks.findIndex(savedMask => savedMask.mask.src === maskImg.src);
          if (matchingMaskIndex !== -1) {
            const newSavedMasks = savedMasks.filter((_, index) => index !== matchingMaskIndex);
            setSavedMasks(newSavedMasks);
            showNotification(`Mask deleted! Remaining: ${newSavedMasks.length}`);
          } else {
            showNotification(`Current hover mask is not saved - nothing to delete! (Found ${savedMasks.length} saved masks)`);
          }
          break;
        case 'escape':
          // Clear current hover mask
          setClicks(null);
          showNotification("Preview cleared!");
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [maskImg, savedMasks, setSavedMasks, setClicks, showNotification, saveImageWithMasks]);

  const getClick = (x: number, y: number): modelInputProps => {
    const clickType = 1;
    return { x, y, clickType };
  };

  // Get mouse position and scale the (x, y) coordinates back to the natural
  // scale of the image. Update the state of clicks with setClicks to trigger
  // the ONNX model to run and generate a new mask via a useEffect in App.tsx
  const handleMouseMove = _.throttle((e: any) => {
    let el = e.nativeEvent.target;
    const rect = el.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;
    const imageScale = image ? image.width / el.offsetWidth : 1;
    x *= imageScale;
    y *= imageScale;
    const click = getClick(x, y);
    if (click) setClicks([click]);
  }, 15);

  // Handle left click to save the current mask
  const handleClick = (e: any) => {
    e.preventDefault();
    if (!maskImg) {
      showNotification("No mask to save - hover over an area first!");
      return;
    }

    if (savedMasks.some(savedMask => savedMask.mask.src === maskImg.src)) {
      showNotification("Mask already saved!");
      return;
    }

    // Determine next color group (highest + 1)
    const nextColorGroup = savedMasks.length > 0
      ? Math.max(...savedMasks.map(sm => sm.colorGroup)) + 1
      : 0;

    console.log('Debug - Click saving mask:', {
      currentMaskSrc: maskImg.src,
      currentSavedMasksCount: savedMasks.length,
      nextColorGroup
    });

    // Create a copy of the current mask and add it to saved masks
    const maskCopy = new Image();
    maskCopy.src = maskImg.src;
    maskCopy.onload = () => {
      setSavedMasks([...savedMasks, { mask: maskCopy, colorGroup: nextColorGroup }]);
      showNotification(`Mask saved! Total: ${savedMasks.length + 1} (Color group ${nextColorGroup})`);
      console.log('Debug - Click mask saved, new count:', savedMasks.length + 1);
    };
  };

  const flexCenterClasses = "flex items-center justify-center";
  return (
    <div className={`${flexCenterClasses} w-full h-full`}>
      <div className={`${flexCenterClasses} relative w-[90%] h-[90%]`}>
        <Tool handleMouseMove={handleMouseMove} handleClick={handleClick} />

        {/* Image Switcher */}
        <ImageSwitcher />

        {/* Control Panel */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 bg-white/90 p-3 rounded-lg shadow-lg">
          <div className="text-sm font-semibold text-gray-800">
            Saved Masks: {savedMasks.length}
          </div>

          {/* Color Groups Legend */}
          {savedMasks.length > 0 && (
            <div className="text-xs text-gray-600">
              <div className="font-semibold mb-1">Color Groups:</div>
              {Array.from(new Set(savedMasks.map(sm => sm.colorGroup))).sort().map(colorGroup => {
                const maskCount = savedMasks.filter(sm => sm.colorGroup === colorGroup).length;
                const colors = ['Red', 'Green', 'Blue', 'Yellow', 'Magenta', 'Cyan'];
                return (
                  <div key={colorGroup} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded border border-gray-400"
                      style={{
                        backgroundColor: ['rgb(255,0,0)', 'rgb(0,255,0)', 'rgb(0,0,255)', 'rgb(255,255,0)', 'rgb(255,0,255)', 'rgb(0,255,255)'][colorGroup % 6]
                      }}
                    ></div>
                    <span>{colors[colorGroup % 6]}: {maskCount} mask{maskCount !== 1 ? 's' : ''}</span>
                  </div>
                );
              })}
            </div>
          )}

          <button
            onClick={() => {
              if (savedMasks.length > 0) {
                setSavedMasks([]);
                showNotification("All masks cleared!");
              } else {
                showNotification("No masks to clear!");
              }
            }}
            disabled={savedMasks.length === 0}
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
          >
            Clear All
          </button>

          {maskImg && (
            <button
              onClick={() => {
                if (maskImg && !savedMasks.some(savedMask => savedMask.mask.src === maskImg.src)) {
                  // Determine next color group (highest + 1)
                  const nextColorGroup = savedMasks.length > 0
                    ? Math.max(...savedMasks.map(sm => sm.colorGroup)) + 1
                    : 0;

                  const maskCopy = new Image();
                  maskCopy.src = maskImg.src;
                  maskCopy.onload = () => {
                    setSavedMasks([...savedMasks, { mask: maskCopy, colorGroup: nextColorGroup }]);
                    showNotification(`Mask saved! Total: ${savedMasks.length + 1} (Color group ${nextColorGroup})`);
                  };
                }
              }}
              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
            >
              Save Current
            </button>
          )}

          {maskImg && savedMasks.length > 0 && !savedMasks.some(savedMask => savedMask.mask.src === maskImg.src) && (
            <button
              onClick={() => {
                // Save with same color group as last mask
                const lastColorGroup = savedMasks[savedMasks.length - 1].colorGroup;
                const maskCopy = new Image();
                maskCopy.src = maskImg.src;
                maskCopy.onload = () => {
                  setSavedMasks([...savedMasks, { mask: maskCopy, colorGroup: lastColorGroup }]);
                  showNotification(`Mask grouped! Total: ${savedMasks.length + 1} (Same color as previous)`);
                };
              }}
              className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm"
            >
              Group with Last
            </button>
          )}

          {maskImg && savedMasks.some(savedMask => savedMask.mask.src === maskImg.src) && (
            <button
              onClick={() => {
                const matchingMaskIndex = savedMasks.findIndex(savedMask => savedMask.mask.src === maskImg.src);
                if (matchingMaskIndex !== -1) {
                  const newSavedMasks = savedMasks.filter((_, index) => index !== matchingMaskIndex);
                  setSavedMasks(newSavedMasks);
                  showNotification(`Mask deleted! Remaining: ${newSavedMasks.length}`);
                }
              }}
              className="px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm"
            >
              Delete Hovering
            </button>
          )}

          <button
            onClick={saveImageWithMasks}
            disabled={savedMasks.length === 0}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
          >
            💾 Save Image
          </button>
        </div>

        {/* Instructions */}
        <div className="absolute bottom-4 left-4 bg-white/90 p-3 rounded-lg shadow-lg max-w-sm">
          <div className="text-sm text-gray-800">
            <div className="font-semibold mb-2">Instructions:</div>
            <div>• Use Image Switcher to change images</div>
            <div>• Hover to preview masks</div>
            <div>• Left-click to save mask (new color)</div>
            <div>• Press 'S' to save current (new color)</div>
            <div>• Press 'G' to group with last mask (same color)</div>
            <div>• Press 'C' to clear all</div>
            <div>• Press 'X' to delete hovering mask</div>
            <div>• Press 'D' to download image</div>
            <div>• Press 'Esc' to clear preview</div>
          </div>
        </div>

        {/* Notification */}
        {notification && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white px-4 py-2 rounded-lg z-50">
            {notification}
          </div>
        )}
      </div>
    </div>
  );
};

export default Stage;
