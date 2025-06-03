#!/usr/bin/env python3

# Generate image embeddings for SAM model
import cv2
import numpy as np
import sys
import os
import argparse

# Add the parent directory to the path to import segment_anything
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from segment_anything import sam_model_registry, SamPredictor

def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='Generate image embeddings for SAM model')
    parser.add_argument('--checkpoint', required=True, help='Path to SAM model checkpoint')
    parser.add_argument('--model-type', required=True, choices=['vit_h', 'vit_l', 'vit_b'], 
                       help='Model type (vit_h, vit_l, vit_b)')
    parser.add_argument('--image', required=True, help='Path to input image')
    parser.add_argument('--output', help='Output path for embedding (default: same as image with _embedding.npy suffix)')
    return parser.parse_args()

def main():
    args = parse_args()
    
    # Generate output path if not provided
    if args.output is None:
        image_path = args.image
        base_name = os.path.splitext(image_path)[0]
        args.output = f"{base_name}_embedding.npy"
    
    # Initialize the predictor
    checkpoint = args.checkpoint
    model_type = args.model_type
    
    print("Loading SAM model...")
    sam = sam_model_registry[model_type](checkpoint=checkpoint)
    sam.to(device='cpu')  # Use CPU for compatibility
    predictor = SamPredictor(sam)
    
    # Load the image
    print(f"Loading image: {args.image}")
    image = cv2.imread(args.image)
    if image is None:
        print(f"Error: Could not load image from {args.image}")
        sys.exit(1)
    
    print("Setting image and generating embedding...")
    predictor.set_image(image)
    image_embedding = predictor.get_image_embedding().cpu().numpy()
    
    print(f"Saving embedding to: {args.output}")
    np.save(args.output, image_embedding)
    
    print(f"Successfully generated embedding with shape: {image_embedding.shape}")

if __name__ == "__main__":
    main()
