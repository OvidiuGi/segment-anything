#!/bin/bash

# SAM Demo Setup Script
# This script sets up the environment for the Segment Anything Model demo

set -e  # Exit on any error

# Configuration
MODEL_URL="https://dl.fbaipublicfiles.com/segment_anything/sam_vit_h_4b8939.pth"
MODEL_TYPE="vit_h"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
VENV_DIR="$PROJECT_ROOT/venv"
CHECKPOINT_DIR="$PROJECT_ROOT/checkpoints"
DEMO_MODEL_DIR="$PROJECT_ROOT/demo/model"
CHECKPOINT_PATH="$CHECKPOINT_DIR/sam_vit_h_4b8939.pth"
ONNX_OUTPUT_PATH="$DEMO_MODEL_DIR/output.onnx"

echo "🚀 Setting up SAM Demo Environment"
echo "=================================================="

# Create Python virtual environment
echo ""
echo "🔧 Creating Python virtual environment..."
if [ ! -d "$VENV_DIR" ]; then
    python3 -m venv "$VENV_DIR"
    echo "✅ Virtual environment created at $VENV_DIR"
else
    echo "Virtual environment already exists at $VENV_DIR"
fi

# Activate virtual environment
source "$VENV_DIR/bin/activate"

# Upgrade pip and install dependencies
echo ""
echo "📦 Installing Python dependencies..."
pip install --upgrade pip

# Install required packages
pip install opencv-python pycocotools matplotlib onnxruntime onnx torch torchvision

# Install segment_anything in development mode
cd "$PROJECT_ROOT"
pip install -e .

echo "✅ All dependencies installed successfully"

# Create directories
mkdir -p "$CHECKPOINT_DIR"
mkdir -p "$DEMO_MODEL_DIR"

# Download model checkpoint
echo ""
echo "⬇️ Downloading ViT-H SAM model checkpoint..."
if [ ! -f "$CHECKPOINT_PATH" ]; then
    echo "Downloading from: $MODEL_URL"
    echo "Saving to: $CHECKPOINT_PATH"
    curl -L "$MODEL_URL" -o "$CHECKPOINT_PATH" --progress-bar
    echo "✅ Model downloaded successfully"
else
    echo "Model checkpoint already exists at $CHECKPOINT_PATH"
fi

# Export model to ONNX format
echo ""
echo "🔄 Exporting model to ONNX format..."
cd "$PROJECT_ROOT"
python scripts/export_onnx_model.py \
    --checkpoint "$CHECKPOINT_PATH" \
    --model-type "$MODEL_TYPE" \
    --output "$ONNX_OUTPUT_PATH"

echo "✅ Model exported successfully to $ONNX_OUTPUT_PATH"

# Verify installation
echo ""
echo "🔍 Verifying installation..."
if [ -f "$ONNX_OUTPUT_PATH" ]; then
    MODEL_SIZE=$(du -h "$ONNX_OUTPUT_PATH" | cut -f1)
    echo "📊 ONNX model size: $MODEL_SIZE"
    echo "✅ Installation verification complete"
else
    echo "❌ ONNX model not found at $ONNX_OUTPUT_PATH"
    exit 1
fi

echo ""
echo "🎉 Demo setup completed successfully!"
echo "📁 ONNX model available at: $ONNX_OUTPUT_PATH"
echo "🐍 Virtual environment at: $VENV_DIR"
echo ""
echo "To activate the virtual environment:"
echo "   source $VENV_DIR/bin/activate"

# Deactivate virtual environment
deactivate
