export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Method not allowed' });
    return;
  }

  const { insight } = req.body;
  if (!insight) {
    res.status(400).json({ error: 'Missing insight in request body' });
    return;
  }

  const prompt = `
You are an expert researcher.
Take this specific insight and expand it into a Deep Dive:
- Explain the opportunity in more detail.
- Share current trends or data points.
- List potential risks.
- Suggest real-world examples or analogies.
- Format clearly in markdown, with bold headings and bullet points.
Respond ONLY in valid JSON:
{
  "deepDive": "..."
}
Insight: ${insight}
  `;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You respond ONLY in valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          },
        ],
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    try {
      const result = JSON.parse(content);
      res.status(200).json(result);
    } catch (err) {
      console.error('DeepDive parse error:', content);
      res.status(500).json({ error: 'Failed to parse JSON', raw: content });
    }
  } catch (err) {
    console.error('OpenAI API error:', err);
    res.status(500).json({ error: 'OpenAI API error', details: err.message });
  }
} 