#!/usr/bin/env python3

# Exact code from the README to generate the embedding
import cv2
import numpy as np
import sys
import os

# Add the parent directory to the path to import segment_anything
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from segment_anything import sam_model_registry, SamPredictor

# Initialize the predictor (from README)
checkpoint = "../../models/sam_vit_h_4b8939.pth"
model_type = "vit_h"

print("Loading SAM model...")
sam = sam_model_registry[model_type](checkpoint=checkpoint)
sam.to(device='cpu')  # Use CPU for compatibility
predictor = SamPredictor(sam)

# Set the new image and export the embedding (from README)
print("Loading image...")
image = cv2.imread('src/assets/data/casaTest.png')
if image is None:
    print("Error: Could not load casaTest.png")
    sys.exit(1)

print("Setting image and generating embedding...")
predictor.set_image(image)
image_embedding = predictor.get_image_embedding().cpu().numpy()

print("Saving embedding...")
np.save("src/assets/data/casaTest_embedding.npy", image_embedding)

print(f"Successfully generated casaTest_embedding.npy with shape: {image_embedding.shape}")
