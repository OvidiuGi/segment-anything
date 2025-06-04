// Copyright (c) Meta Platforms, Inc. and affiliates.
// All rights reserved.

// This source code is licensed under the license found in the
// LICENSE file in the root directory of this source tree.

import React, { useContext } from "react";
import AppContext from "./hooks/createContext";

const ImageSwitcher = () => {
    const {
        selectedImageId: [selectedImageId, setSelectedImageId],
        savedMasks: [savedMasks, setSavedMasks],
    } = useContext(AppContext)!;

    const images = [
        { id: "1", name: "Image 1", extension: "jpg" },
        { id: "2", name: "Image 2", extension: "png" },
        { id: "3", name: "Image 3", extension: "jpg" },
    ];

    const handleImageChange = (imageId: string) => {
        // Clear saved masks when switching images
        setSavedMasks([]);
        setSelectedImageId(imageId);
    };

    return (
        <div className="absolute top-4 left-4 bg-white/90 p-3 rounded-lg shadow-lg">
            <div className="text-sm font-semibold text-gray-800 mb-2">
                Select Image:
            </div>
            <div className="flex gap-2">
                {images.map((img) => (
                    <button
                        key={img.id}
                        onClick={() => handleImageChange(img.id)}
                        className={`px-3 py-2 rounded text-sm font-medium transition-colors ${selectedImageId === img.id
                                ? "bg-blue-500 text-white"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                    >
                        {img.name}
                    </button>
                ))}
            </div>
            <div className="mt-2 text-xs text-gray-600">
                Current: {images.find(img => img.id === selectedImageId)?.name}
            </div>
        </div>
    );
};

export default ImageSwitcher;
