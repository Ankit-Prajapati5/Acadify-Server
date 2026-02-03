export const generateQuiz = async (req, res) => {
  try {
    let { transcript, questionCount = 10, difficulty = "medium" } = req.body;

    if (!transcript) {
      return res.status(400).json({ message: "Transcript required" });
    }

    // 1. Clean Difficulty
    const allowedDifficulties = ["easy", "medium", "hard"];
    const selectedDifficulty = difficulty.toLowerCase().trim();
    difficulty = allowedDifficulties.includes(selectedDifficulty) ? selectedDifficulty : "medium";

    // 2. Transcript Handling
    if (Array.isArray(transcript)) transcript = transcript.join(" ");
    if (typeof transcript === "object") transcript = JSON.stringify(transcript);
    transcript = transcript.slice(0, 12000);

    // 3. Count Handling
    const rawCount = Number(req.body.questionCount);
    questionCount = (!Number.isInteger(rawCount) || rawCount < 1) ? 10 : rawCount;

    // 4. Batch Logic
    const BATCH_SIZE = 20;
    const totalBatches = Math.ceil(questionCount / BATCH_SIZE);
    let allQuestions = [];

    for (let i = 0; i < totalBatches; i++) {
      const remaining = questionCount - allQuestions.length;
      const currentBatchSize = remaining > BATCH_SIZE ? BATCH_SIZE : remaining;

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          temperature: 0.8,
          messages: [
            {
              role: "system",
              content: `Generate exactly ${currentBatchSize} ${difficulty.toUpperCase()} level MCQ questions.
              Rules:
              - Exactly 4 options.
              - Return ONLY valid JSON. No markdown.
              - IMPORTANT: Each question object MUST include "level": "${difficulty}"
              
              Format:
              {
                "questions": [
                  {
                    "question": "",
                    "options": ["", "", "", ""],
                    "correctAnswer": "",
                    "level": "${difficulty}"
                  }
                ]
              }`,
            },
            { role: "user", content: transcript },
          ],
        }),
      });

      if (!response.ok) throw new Error("AI request failed");
      const data = await response.json();
      
      let content = data.choices[0].message.content;
      content = content.replace(/```json/g, "").replace(/```/g, "").trim();

      let parsed = JSON.parse(content);

      if (parsed?.questions?.length) {
        // 🔥 CRITICAL FIX: Ensure every question has the correct 'level' property
        // This ensures the Frontend Tabs (Easy/Medium/Hard) can find the questions
        const questionsWithLevel = parsed.questions.map(q => ({
          ...q,
          level: difficulty // Force the level selected by the user
        }));
        allQuestions.push(...questionsWithLevel);
      }
    }

    // 5. Final Safety Cleanup
    allQuestions = allQuestions.map((q) => {
      if (!q.options.includes(q.correctAnswer)) {
        q.correctAnswer = q.options[0];
      }
      return q;
    });

    // 6. Return the data WITH the difficulty field
    return res.json({
      title: "Generated Quiz",
      totalQuestions: allQuestions.length,
      questions: allQuestions,
      difficulty: difficulty // 🔥 This tells the frontend which tab to open
    });

  } catch (error) {
    console.log("AI ERROR:", error);
    return res.status(500).json({ message: "Quiz generation failed", error: error.message });
  }
};