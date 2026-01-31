export const generateQuiz = async (req, res) => {
  try {
    const { transcript } = req.body;

    if (!transcript) {
      return res.status(400).json({ message: "Transcript required" });
    }

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://acadify-server.onrender.com",
          "X-Title": "Acadify",
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          temperature: 0.9,
          messages: [
            {
              role: "system",
              content: `
Generate exactly 10 MCQ questions from the text.Generate different questions each time.
Do not repeat wording.
Use varied phrasing.Focus on different aspects of the text each time.
Avoid repeating previously common questions.

Rules:
- Each question must have exactly 4 options.
- The correctAnswer must EXACTLY match one of the options.
- Do not include explanations.
- Return ONLY valid JSON.
- No markdown.
- No backticks.

Format:
{
  "title": "Quiz Title",
  "questions": [
    {
      "question": "",
      "options": ["", "", "", ""],
      "correctAnswer": ""
    }
  ]
}`,
            },
            {
              role: "user",
              content: transcript,
            },
          ],
        }),
      },
    );

    const data = await response.json();

    console.log("DEBUG RESPONSE:", data); 

    if (!data?.choices?.length) {
      return res.status(500).json({
        message: "AI response invalid",
      });
    }

    let content = data.choices[0].message.content;

    if (content.includes("```")) {
      content = content
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
    }

    const parsed = JSON.parse(content);
    parsed.questions = parsed.questions.map((q) => {
      if (!q.options.includes(q.correctAnswer)) {
        q.correctAnswer = q.options[0]; // fallback safety
      }
      return q;
    });

    res.json(parsed);
  } catch (error) {
    console.log("AI ERROR:", error);
    res.status(500).json({ message: "Quiz generation failed" });
  }
};
console.log("DEBUG RESPONSE:", data);console.log("KEY FULL CHECK:", process.env.OPENROUTER_API_KEY);
