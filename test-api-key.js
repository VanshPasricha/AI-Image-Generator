// Test script to verify your Hugging Face API key
const API_KEY = "YOUR_HF_API_KEY_HERE"; // Replace with your actual key

async function testAPIKey() {
  try {
    const response = await fetch('https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: 'a simple red apple',
        parameters: { width: 512, height: 512 },
        options: { wait_for_model: true, user_cache: false }
      })
    });

    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    if (response.ok) {
      console.log('✅ API Key is working!');
    } else {
      const error = await response.text();
      console.log('❌ API Key failed:', error);
    }
  } catch (error) {
    console.log('❌ Network error:', error);
  }
}

testAPIKey();
