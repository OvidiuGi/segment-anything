// Copyright (c) Meta Platforms, Inc. and affiliates.
// All rights reserved.

// This source code is licensed under the license found in the
// LICENSE file in the root directory of this source tree.

import { InferenceSession, Tensor, env } from "onnxruntime-web";
import React, { useContext, useEffect, useState } from "react";
import "./assets/scss/App.scss";
import { handleImageScale } from "./components/helpers/scaleHelper";
import { modelScaleProps } from "./components/helpers/Interfaces";
import { onnxMaskToImage } from "./components/helpers/maskUtils";
import { modelData } from "./components/helpers/onnxModelAPI";
import Stage from "./components/Stage";
import AppContext from "./components/hooks/createContext";
const ort = require("onnxruntime-web");
/* @ts-ignore */
import npyjs from "npyjs";

// Define image, embedding and model paths
const IMAGE_PATH = "/assets/data/casaTest.png";
const IMAGE_EMBEDDING = "/assets/data/casaTest_embedding.npy";
const MODEL_DIR = "/model/output.onnx";

const App = () => {
  const {
    clicks: [clicks],
    image: [, setImage],
    maskImg: [, setMaskImg],
  } = useContext(AppContext)!;
  const [model, setModel] = useState<InferenceSession | null>(null); // ONNX model
  const [tensor, setTensor] = useState<Tensor | null>(null); // Image embedding tensor

  // The ONNX model expects the input to be rescaled to 1024. 
  // The modelScale state variable keeps track of the scale values.
  const [modelScale, setModelScale] = useState<modelScaleProps | null>(null);

  // Configure ONNX Runtime for SIMD-threaded WASM
  useEffect(() => {
    // Configure ONNX Runtime to use threaded WASM files
    env.wasm.wasmPaths = '/';
    env.wasm.numThreads = navigator.hardwareConcurrency || 4; // Use available CPU cores
    env.wasm.simd = true; // Enable SIMD instructions for better performance

    // Configure for Cross-Origin Isolation (needed for SharedArrayBuffer in threaded WASM)
    if (typeof SharedArrayBuffer === 'undefined') {
      console.warn('SharedArrayBuffer not available - threaded WASM may not work');
      env.wasm.numThreads = 1; // Fallback to single-threaded
    }

    console.log("ONNX Runtime configured for SIMD-threaded execution");
    console.log("Threads:", env.wasm.numThreads, "SIMD:", env.wasm.simd);
    console.log("SharedArrayBuffer available:", typeof SharedArrayBuffer !== 'undefined');
  }, []);

  // Initialize the ONNX model. load the image, and load the SAM
  // pre-computed image embedding
  useEffect(() => {
    // Initialize the ONNX model
    const initModel = async () => {
      try {
        console.log("1. Starting model initialization...");

        // Configure execution providers in order of preference
        const sessionOptions = {
          executionProviders: [
            'wasm', // Standard WebAssembly provider (most compatible)
          ]
        };

        // Try simple loading first with explicit execution providers
        const model = await InferenceSession.create(MODEL_DIR, sessionOptions);
        console.log("2. Model loaded successfully:", model);
        setModel(model);

      } catch (e) {
        console.error("3. Simple loading failed:", e);

        // Fallback to fetch approach with explicit options
        try {
          console.log("4. Trying fetch approach...");
          const response = await fetch(MODEL_DIR);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const modelArrayBuffer = await response.arrayBuffer();
          const modelData = new Uint8Array(modelArrayBuffer);

          const model = await InferenceSession.create(modelData, {
            executionProviders: ['wasm'],
            graphOptimizationLevel: 'basic' as const,
            executionMode: 'sequential' as const,
          });
          console.log("5. Model loaded via fetch:", model);
          setModel(model);
        } catch (fallbackError) {
          console.error("6. All loading attempts failed:", fallbackError);
        }
      }
    };
    initModel();

    // Load the image
    const url = new URL(IMAGE_PATH, location.origin);
    loadImage(url);

    // Load the Segment Anything pre-computed embedding
    Promise.resolve(loadNpyTensor(IMAGE_EMBEDDING, "float32")).then(
      (embedding) => setTensor(embedding)
    );
  }, []);

  const loadImage = async (url: URL) => {
    try {
      const img = new Image();
      img.src = url.href;
      img.onload = () => {
        const { height, width, samScale } = handleImageScale(img);
        setModelScale({
          height: height,  // original image height
          width: width,  // original image width
          samScale: samScale, // scaling factor for image which has been resized to longest side 1024
        });
        img.width = width;
        img.height = height;
        setImage(img);
      };
    } catch (error) {
      console.log(error);
    }
  };

  // Decode a Numpy file into a tensor. 
  const loadNpyTensor = async (tensorFile: string, dType: string) => {
    let npLoader = new npyjs();
    const npArray = await npLoader.load(tensorFile);
    const tensor = new ort.Tensor(dType, npArray.data, npArray.shape);
    return tensor;
  };

  // Run the ONNX model every time clicks has changed
  useEffect(() => {
    runONNX();
  }, [clicks]);

  const runONNX = async () => {
    try {
      if (
        model === null ||
        clicks === null ||
        tensor === null ||
        modelScale === null
      )
        return;
      else {
        // Preapre the model input in the correct format for SAM. 
        // The modelData function is from onnxModelAPI.tsx.
        const feeds = modelData({
          clicks,
          tensor,
          modelScale,
        });
        if (feeds === undefined) return;
        // Run the SAM ONNX model with the feeds returned from modelData()
        const results = await model.run(feeds);
        const output = results[model.outputNames[0]];
        // The predicted mask returned from the ONNX model is an array which is 
        // rendered as an HTML image using onnxMaskToImage() from maskUtils.tsx.
        setMaskImg(onnxMaskToImage(output.data, output.dims[2], output.dims[3]));
      }
    } catch (e) {
      console.log(e);
    }
  };

  return <Stage />;
};

export default App;
