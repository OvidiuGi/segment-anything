#!/bin/bash

# Script to generate image embeddings using SAM model
# Usage: ./generate_embedding.sh <image_name>

# Check if image name argument is provided
if [ $# -eq 0 ]; then
    echo "Error: Please provide an image name as an argument"
    echo "Usage: $0 <image_name>"
    echo "Example: $0 casaTest.png"
    exit 1
fi

# Variables
VENV_PATH="venv"
GENERATE_SCRIPT="demo/generate_embedding.py"
CHECKPOINT="checkpoints/sam_vit_h_4b8939.pth"
MODEL_TYPE="vit_h"
IMAGE_NAME="$1"

# Construct full image path (assuming images are in demo/src/assets/data/)
IMAGE_PATH="demo/src/assets/data/$IMAGE_NAME"

# Check if virtual environment exists
if [ ! -d "$VENV_PATH" ]; then
    echo "Error: Virtual environment not found at $VENV_PATH"
    echo "Please run ./setup_demo.sh first to set up the environment"
    exit 1
fi

# Check if checkpoint exists
if [ ! -f "$CHECKPOINT" ]; then
    echo "Error: Checkpoint not found at $CHECKPOINT"
    echo "Please run ./setup_demo.sh first to download the model"
    exit 1
fi

# Check if image exists
if [ ! -f "$IMAGE_PATH" ]; then
    echo "Error: Image not found at $IMAGE_PATH"
    echo "Please make sure the image exists in the demo/src/assets/data/ directory"
    exit 1
fi

echo "Generating embedding for: $IMAGE_NAME"
echo "Image path: $IMAGE_PATH"
echo "Using checkpoint: $CHECKPOINT"
echo "Model type: $MODEL_TYPE"
echo ""

# Activate virtual environment and run the script
source "$VENV_PATH/bin/activate" && python "$GENERATE_SCRIPT" --checkpoint "$CHECKPOINT" --model-type "$MODEL_TYPE" --image "$IMAGE_PATH"

# Check if the command was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Embedding generation completed successfully!"
    # Show the generated embedding file
    EMBEDDING_FILE="demo/src/assets/data/${IMAGE_NAME%.*}_embedding.npy"
    if [ -f "$EMBEDDING_FILE" ]; then
        echo "📁 Embedding saved to: $EMBEDDING_FILE"
    fi
else
    echo ""
    echo "❌ Embedding generation failed!"
    exit 1
fi
