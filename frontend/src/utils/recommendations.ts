export interface SurveyData {
    skinType: string
    acneFrequency: string
    acneLocation: string
    painfulAcne: string
    stress: string
    sleep: string
    water: string
  }
  
  export interface ResultData {
    severity: string
    recommendations: string[]
  }
  
  export function generateRecommendation(
    prediction: string,
    survey: SurveyData
  ): ResultData {
  
    // -------- CASE 1 BLACKHEADS --------
    if (prediction === "Blackheads") {
      return {
        severity: "Mild",
        recommendations: [
          "Use salicylic acid cleanser",
          "Exfoliate 2–3 times per week",
          "Avoid heavy oily creams",
          "Use oil-free moisturizer"
        ]
      }
    }
  
    // -------- CASE 2 WHITEHEADS --------
    if (prediction === "Whiteheads") {
      return {
        severity: "Mild",
        recommendations: [
          "Use benzoyl peroxide face wash",
          "Keep pores clean",
          "Use lightweight moisturizer",
          "Avoid touching face frequently"
        ]
      }
    }
  
    // -------- CASE 3 PAPULES --------
    if (prediction === "Papules") {
      return {
        severity: "Moderate",
        recommendations: [
          "Use niacinamide serum",
          "Reduce stress levels",
          "Improve sleep schedule",
          "Avoid harsh scrubbing"
        ]
      }
    }
  
    // -------- CASE 4 PUSTULES --------
    if (prediction === "Pustules") {
      return {
        severity: "Moderate",
        recommendations: [
          "Use benzoyl peroxide treatment",
          "Apply antibacterial cream",
          "Avoid popping pimples",
          "Maintain proper skin hygiene"
        ]
      }
    }
  
    // -------- CASE 5 CYSTIC ACNE --------
    if (prediction === "Cyst") {
      return {
        severity: "Severe",
        recommendations: [
          "Consult a dermatologist",
          "Use retinoid treatment",
          "Reduce dairy and oily foods",
          "Improve sleep and hydration"
        ]
      }
    }
  
    // -------- CASE 6 LIFESTYLE ACNE --------
    if (
      survey.water === "< 1L" ||
      survey.sleep === "< 5 hours"
    ) {
      return {
        severity: "Mild",
        recommendations: [
          "Drink more water",
          "Maintain regular sleep",
          "Use gentle cleanser",
          "Apply sunscreen daily"
        ]
      }
    }
  
    // -------- CASE 7 HORMONAL ACNE --------
    if (
      survey.acneLocation === "Chin" ||
      survey.acneLocation === "Jawline"
    ) {
      return {
        severity: "Moderate",
        recommendations: [
          "Use salicylic acid treatment",
          "Maintain hormonal balance",
          "Reduce stress",
          "Maintain healthy diet"
        ]
      }
    }
  
    // -------- DEFAULT --------
    return {
      severity: "Unknown",
      recommendations: ["Consult dermatologist for proper treatment"]
    }
  }