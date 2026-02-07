# 🔬 AI Acne Detection System

An AI-powered web application that uses deep learning to detect and classify different types of acne from images. Built with PyTorch and Streamlit.

## 📋 Overview

This project implements a ResNet50-based deep learning model to classify acne into five different types:
- **Blackheads**
- **Cyst**
- **Papules**
- **Pustules**
- **Whiteheads**

The application provides a user-friendly web interface where users can upload images and receive instant predictions with confidence scores.

## ✨ Features

- 🖼️ **Image Upload**: Support for JPG and PNG formats
- 🤖 **AI-Powered Detection**: Uses ResNet50 architecture trained for acne classification
- 📊 **Confidence Scoring**: Displays prediction confidence as percentage with visual progress bar
- 🎨 **Clean UI**: Simple and intuitive Streamlit interface
- ⚡ **Real-time Prediction**: Instant results with loading indicators
- 📱 **Responsive Design**: Works on desktop and mobile browsers

## 🚀 Installation

### Prerequisites

- Python 3.8 or higher
- pip package manager

### Setup Instructions

1. **Clone or download this repository**
   ```bash
   cd AI-Acne-Detection
   ```

2. **Install required dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Ensure model file is present**
   - Make sure `acne_model_best.pth` is in the project directory
   - This file contains the trained ResNet50 model weights

## 💻 Usage

1. **Run the Streamlit application**
   ```bash
   streamlit run app.py
   ```

2. **Open your browser**
   - The app will automatically open at `http://localhost:8501`
   - If not, manually navigate to the URL shown in the terminal

3. **Use the application**
   - Click "Browse files" to upload an acne image
   - View the uploaded image preview
   - Click "Predict Acne Type" button
   - View the prediction results and confidence score

## 🏗️ Project Structure

```
AI-Acne-Detection/
├── app.py                    # Main Streamlit application
├── acne_model_best.pth      # Trained ResNet50 model weights
├── requirements.txt          # Python dependencies
├── README.md                # Project documentation
└── .streamlit/
    └── config.toml          # Streamlit configuration
```

## 🧠 Model Details

- **Architecture**: ResNet50
- **Framework**: PyTorch
- **Input Size**: 224×224 pixels
- **Output Classes**: 5 (Blackheads, Cyst, Papules, Pustules, Whiteheads)
- **Preprocessing**: Resize and tensor conversion (no normalization)

## 📦 Dependencies

- **streamlit**: Web application framework
- **torch**: PyTorch deep learning library
- **torchvision**: Computer vision models and transforms
- **Pillow**: Image processing library

## ⚙️ Configuration

The project includes a `.streamlit/config.toml` file to disable the file watcher for compatibility with PyTorch:

```toml
[server]
fileWatcherType = "none"
```

## 🔍 How It Works

1. **Image Upload**: User uploads an acne image through the web interface
2. **Preprocessing**: Image is resized to 224×224 and converted to tensor format
3. **Model Inference**: ResNet50 model processes the image and outputs class logits
4. **Softmax**: Converts logits to probability distribution
5. **Prediction**: Returns the class with highest probability and confidence score
6. **Display**: Shows results with appropriate styling based on confidence level

## 📝 Notes

- This is an educational/demonstration project
- Predictions should not replace professional dermatological consultation
- Always consult a qualified dermatologist for medical advice
- Model accuracy depends on image quality and training data

## 🎓 Educational Purpose

This project is developed for educational purposes to demonstrate:
- Deep learning model deployment
- Web application development with Streamlit
- Image classification pipeline
- PyTorch model integration

## 🐛 Troubleshooting

**Issue**: Model file not found
- **Solution**: Ensure `acne_model_best.pth` is in the same directory as `app.py`

**Issue**: PyTorch compatibility warnings
- **Solution**: The `.streamlit/config.toml` file should resolve this automatically

**Issue**: Low confidence predictions
- **Solution**: Try uploading clearer, well-lit images with visible acne features

## 📄 License

This project is for educational purposes. Please ensure you have the right to use any images uploaded to the system.

## 🤝 Contributing

This is a college project. For suggestions or improvements, feel free to fork and modify.

---

**⚠️ Disclaimer**: This AI system is intended for educational purposes only and should not be used as a substitute for professional medical diagnosis or treatment. Always consult with a qualified dermatologist for proper acne assessment and treatment.

