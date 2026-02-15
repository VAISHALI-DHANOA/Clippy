import { useState, useCallback } from "react";
import { QUIZ_QUESTIONS } from "../data/quizQuestions.js";

export function useQuiz(showMessage) {
  const [quizActive, setQuizActive] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [quizResult, setQuizResult] = useState(null);

  const triggerQuiz = useCallback(() => {
    const q = QUIZ_QUESTIONS[Math.floor(Math.random() * QUIZ_QUESTIONS.length)];
    setCurrentQuiz(q);
    setQuizActive(true);
    setQuizResult(null);
    showMessage(`POP QUIZ TIME! 🎓\n${q.q}`, "shocked", "quiz");
  }, [showMessage]);

  const handleQuizAnswer = useCallback((answer) => {
    if (!currentQuiz) return;

    if (answer === currentQuiz.a) {
      setQuizResult("correct");
      showMessage(
        "Lucky guess! 🎉 ...I mean, well done! You may resume your mediocre typing.",
        "winking",
        "correct"
      );
    } else {
      setQuizResult("wrong");
      showMessage(
        `WRONG! The answer was "${currentQuiz.a}". I expected nothing and I'm still disappointed. 😏`,
        "mischievous",
        "wrong"
      );
    }

    setTimeout(() => {
      setQuizActive(false);
      setCurrentQuiz(null);
      setQuizResult(null);
    }, 4000);
  }, [currentQuiz, showMessage]);

  return {
    quizActive,
    currentQuiz,
    quizResult,
    triggerQuiz,
    handleQuizAnswer,
  };
}
