// Copyright (c) Meta Platforms, Inc. and affiliates.
// All rights reserved.

// This source code is licensed under the license found in the
// LICENSE file in the root directory of this source tree.

import React, { useContext, useEffect, useState } from "react";
import AppContext from "./hooks/createContext";
import { ToolProps } from "./helpers/Interfaces";
import * as _ from "underscore";

const Tool = ({ handleMouseMove, handleClick }: ToolProps) => {
  const {
    image: [image],
    maskImg: [maskImg, setMaskImg],
    savedMasks: [savedMasks],
  } = useContext(AppContext)!;

  // Determine if we should shrink or grow the images to match the
  // width or the height of the page and setup a ResizeObserver to
  // monitor changes in the size of the page
  const [shouldFitToWidth, setShouldFitToWidth] = useState(true);
  const bodyEl = document.body;
  const fitToPage = () => {
    if (!image) return;
    const imageAspectRatio = image.width / image.height;
    const screenAspectRatio = window.innerWidth / window.innerHeight;
    setShouldFitToWidth(imageAspectRatio > screenAspectRatio);
  };
  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      if (entry.target === bodyEl) {
        fitToPage();
      }
    }
  });
  useEffect(() => {
    fitToPage();
    resizeObserver.observe(bodyEl);
    return () => {
      resizeObserver.unobserve(bodyEl);
    };
  }, [image]);

  const imageClasses = "";
  const maskImageClasses = `absolute opacity-40 pointer-events-none`;
  const savedMaskClasses = `absolute opacity-30 pointer-events-none`;

  // Render the image and the predicted mask image on top
  return (
    <>
      {image && (
        <img
          onMouseMove={handleMouseMove}
          onMouseOut={() => _.defer(() => setMaskImg(null))}
          onTouchStart={handleMouseMove}
          onClick={handleClick}
          src={image.src}
          className={`${shouldFitToWidth ? "w-full" : "h-full"
            } ${imageClasses} cursor-crosshair`}
        ></img>
      )}
      {/* Render saved masks */}
      {savedMasks.map((savedMaskObj, index) => (
        <img
          key={index}
          src={savedMaskObj.mask.src}
          className={`${shouldFitToWidth ? "w-full" : "h-full"
            } ${savedMaskClasses}`}
          style={{
            filter: `hue-rotate(${savedMaskObj.colorGroup * 60}deg) saturate(1.5)`,
          }}
        ></img>
      ))}
      {/* Render current hover mask */}
      {maskImg && (
        <img
          src={maskImg.src}
          className={`${shouldFitToWidth ? "w-full" : "h-full"
            } ${maskImageClasses}`}
        ></img>
      )}
    </>
  );
};

export default Tool;
