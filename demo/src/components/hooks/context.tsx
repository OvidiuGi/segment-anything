// Copyright (c) Meta Platforms, Inc. and affiliates.
// All rights reserved.

// This source code is licensed under the license found in the
// LICENSE file in the root directory of this source tree.

import React, { useState } from "react";
import { modelInputProps } from "../helpers/Interfaces";
import AppContext from "./createContext";

const AppContextProvider = (props: {
  children: React.ReactElement<any, string | React.JSXElementConstructor<any>>;
}) => {
  const [clicks, setClicks] = useState<Array<modelInputProps> | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [maskImg, setMaskImg] = useState<HTMLImageElement | null>(null);
  const [savedMasks, setSavedMasks] = useState<{ mask: HTMLImageElement; colorGroup: number }[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string>("2"); // Default to "2" to match current hardcoded image

  return (
    <AppContext.Provider
      value={{
        clicks: [clicks, setClicks],
        image: [image, setImage],
        maskImg: [maskImg, setMaskImg],
        savedMasks: [savedMasks, setSavedMasks],
        selectedImageId: [selectedImageId, setSelectedImageId],
      }}
    >
      {props.children}
    </AppContext.Provider>
  );
};

export default AppContextProvider;
