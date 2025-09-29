export default async function handler(req, res) {
  const apiKey = process.env.HF_API_KEY;
  
  return res.status(200).json({
    hasApiKey: !!apiKey,
    keyLength: apiKey ? apiKey.length : 0,
    keyPrefix: apiKey ? apiKey.substring(0, 3) : 'none',
    allEnvKeys: Object.keys(process.env).filter(key => key.includes('HF'))
  });
}
