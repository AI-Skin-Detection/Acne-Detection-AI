import os
os.environ['STREAMLIT_SERVER_FILE_WATCHER_TYPE'] = 'none'

import streamlit as st
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import io

# Define class names
CLASS_NAMES = ['Blackheads', 'Cyst', 'Papules', 'Pustules', 'Whiteheads']

# Set page configuration
st.set_page_config(
    page_title="AI Acne Detection System",
    page_icon="🔬",
    layout="centered"
)

@st.cache_resource
def load_model():
    """Load the trained ResNet50 model"""
    # Create ResNet50 architecture
    model = models.resnet50(weights=None)
    
    # Replace the final fully connected layer with 5 output classes
    num_features = model.fc.in_features
    model.fc = nn.Linear(num_features, 5)
    
    # Load the trained weights
    try:
        model.load_state_dict(torch.load('acne_model_best.pth', map_location=torch.device('cpu')))
        model.eval()  # Set to evaluation mode
        return model
    except FileNotFoundError:
        st.error("Model file 'acne_model_best.pth' not found. Please ensure the model file is in the same directory.")
        return None
    except Exception as e:
        st.error(f"Error loading model: {str(e)}")
        return None

def preprocess_image(image):
    """Preprocess the uploaded image for model input"""
    # Define preprocessing transforms - matching Colab code exactly
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor()
    ])
    
    # Convert to RGB if needed
    if image.mode != 'RGB':
        image = image.convert('RGB')
    
    # Apply transforms
    img_tensor = transform(image)
    
    # Add batch dimension
    img_tensor = img_tensor.unsqueeze(0)
    
    return img_tensor

def predict(model, image_tensor):
    """Run prediction on the preprocessed image"""
    with torch.no_grad():
        # Get model output
        outputs = model(image_tensor)
        
        # Apply softmax to get probabilities
        probabilities = torch.nn.functional.softmax(outputs, dim=1)
        
        # Get predicted class and confidence
        confidence, predicted_idx = torch.max(probabilities, 1)
        
        predicted_class = CLASS_NAMES[predicted_idx.item()]
        confidence_score = confidence.item() * 100
        
        return predicted_class, confidence_score

# Main App UI
def main():
    # Header
    st.title("🔬 AI Acne Detection System")
    st.markdown("""
    ### Welcome to the AI-powered Acne Detection Application
    
    This application uses a deep learning model (ResNet50) trained to classify different types of acne.
    Simply upload an image of acne, and our AI will identify the type and provide a confidence score.
    
    **Detectable Acne Types:**
    - Blackheads
    - Cyst
    - Papules
    - Pustules
    - Whiteheads
    """)
    
    st.markdown("---")
    
    # Load model
    model = load_model()
    
    if model is None:
        st.stop()
    
    # File uploader
    st.subheader("📤 Upload Acne Image")
    uploaded_file = st.file_uploader(
        "Choose an image file (JPG or PNG)",
        type=['jpg', 'jpeg', 'png'],
        help="Upload a clear image of acne for detection"
    )
    
    if uploaded_file is not None:
        # Display uploaded image
        image = Image.open(uploaded_file)
        
        col1, col2, col3 = st.columns([1, 2, 1])
        with col2:
            st.image(image, caption="Uploaded Image", use_container_width=True)
        
        st.markdown("---")
        
        # Predict button
        if st.button("🔍 Predict Acne Type", type="primary", use_container_width=True):
            with st.spinner("🔄 Analyzing image... Please wait..."):
                try:
                    # Preprocess image
                    image_tensor = preprocess_image(image)
                    
                    # Run prediction
                    predicted_class, confidence_score = predict(model, image_tensor)
                    
                    # Display results
                    st.markdown("### 📊 Prediction Results")
                    
                    # Show result with appropriate styling
                    if confidence_score >= 70:
                        st.success(f"**Detected Acne Type:** {predicted_class}")
                    else:
                        st.info(f"**Detected Acne Type:** {predicted_class}")
                    
                    # Display confidence score
                    st.metric(
                        label="Confidence Score",
                        value=f"{confidence_score:.2f}%"
                    )
                    
                    # Progress bar for confidence
                    st.progress(confidence_score / 100)
                    
                    # Additional information
                    if confidence_score < 60:
                        st.warning("⚠️ Low confidence detected. Consider uploading a clearer image or consulting a dermatologist.")
                    
                except Exception as e:
                    st.error(f"Error during prediction: {str(e)}")
    
    # Footer
    st.markdown("---")
    st.markdown("""
    <div style='text-align: center; color: gray; font-size: 14px;'>
        <p>💡 <b>Note:</b> This is an AI-based detection system for educational purposes. 
        Always consult a dermatologist for professional medical advice.</p>
    </div>
    """, unsafe_allow_html=True)

if __name__ == "__main__":
    main()
