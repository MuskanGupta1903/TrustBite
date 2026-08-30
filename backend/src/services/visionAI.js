// This is a service wrapper for the Vision API (e.g., Google Gemini Pro Vision).
// For the local development/demo phase without API keys, it simulates the analysis.

const analyzeImage = async (imagePath, category, explicitItemName = null) => {
  console.log(`Analyzing image at ${imagePath} for category ${category}. User specified item: ${explicitItemName}`);
  
  // Simulate network delay for AI processing
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Mock logic based on category for the demo
  if (category === 'dairy') {
    // Randomly assign a risk for demo purposes
    const risks = ['low', 'caution', 'high'];
    const risk = risks[Math.floor(Math.random() * risks.length)];
    
    let reasoning = '';
    let itemName = explicitItemName || 'Milk Product';
    
    if (risk === 'low') {
      itemName = explicitItemName || 'Curd';
      reasoning = 'Thick consistency, slight whey separation which is natural. No thickeners detected visually.';
    } else if (risk === 'caution') {
      itemName = explicitItemName || 'Paneer';
      reasoning = 'Unusually bright white and rubbery texture. Could contain starch or palm oil.';
    } else {
      itemName = explicitItemName || 'Milk - Loose';
      reasoning = 'Yellowish tint and thin consistency detected. Possible adulteration with water and urea.';
    }
    
    return {
      itemName,
      riskLevel: risk,
      reasoning
    };
  } else {
    // Produce mock
    const isHighRisk = Math.random() > 0.5;
    
    if (isHighRisk) {
      return {
        itemName: explicitItemName || 'Apples',
        riskLevel: 'high',
        reasoning: 'Unnatural gloss and uniform coloring across all fruits. High probability of wax coating and artificial ripening.'
      };
    } else {
      return {
        itemName: explicitItemName || 'Tomatoes',
        riskLevel: 'low',
        reasoning: 'Natural red color, no artificial wax shine detected. Stems look naturally dried.'
      };
    }
  }
};

module.exports = {
  analyzeImage
};
