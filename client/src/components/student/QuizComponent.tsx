import React, { useState } from 'react';
import { Modal, Button, Card, Form, ProgressBar, Alert } from 'react-bootstrap';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

interface Quiz {
  questions: QuizQuestion[];
  isActive: boolean;
}

interface QuizComponentProps {
  quiz: Quiz;
  onComplete: (score: number, totalQuestions: number) => void;
  onClose: () => void;
}

const QuizComponent: React.FC<QuizComponentProps> = ({ quiz, onComplete, onClose }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      calculateScore();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const calculateScore = () => {
    let correctAnswers = 0;
    quiz.questions.forEach((question, index) => {
      if (answers[index] === question.correctAnswer) {
        correctAnswers++;
      }
    });
    setScore(correctAnswers);
    setShowResults(true);
  };

  const handleFinish = () => {
    onComplete(score, quiz.questions.length);
    onClose();
  };

  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;

  if (showResults) {
    const percentage = Math.round((score / quiz.questions.length) * 100);
    return (
      <Modal show={true} onHide={onClose} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Quiz Results</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <div className="mb-4">
            <i className={`fas fa-${percentage >= 70 ? 'trophy' : 'certificate'} fa-4x ${percentage >= 70 ? 'text-warning' : 'text-info'} mb-3`}></i>
            <h2 className={percentage >= 70 ? 'text-success' : 'text-primary'}>
              {percentage}%
            </h2>
            <p className="text-muted">
              You scored {score} out of {quiz.questions.length} questions
            </p>
          </div>

          <div className="mb-4">
            <h5>Question Review</h5>
            {quiz.questions.map((question, index) => {
              const userAnswer = answers[index];
              const isCorrect = userAnswer === question.correctAnswer;
              return (
                <Card key={index} className={`mb-2 ${isCorrect ? 'border-success' : 'border-danger'}`}>
                  <Card.Body className="p-3">
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="flex-grow-1">
                        <strong>Q{index + 1}:</strong> {question.question}
                        <div className="mt-2">
                          <small className="text-muted">Your answer: </small>
                          <span className={isCorrect ? 'text-success' : 'text-danger'}>
                            {userAnswer !== undefined ? question.options[userAnswer] : 'Not answered'}
                          </span>
                        </div>
                        {!isCorrect && (
                          <div className="mt-1">
                            <small className="text-muted">Correct answer: </small>
                            <span className="text-success">
                              {question.options[question.correctAnswer]}
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        {isCorrect ? (
                          <i className="fas fa-check-circle text-success"></i>
                        ) : (
                          <i className="fas fa-times-circle text-danger"></i>
                        )}
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              );
            })}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" onClick={handleFinish}>
            Complete Lesson
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }

  const currentQ = quiz.questions[currentQuestion];
  const isAnswered = answers[currentQuestion] !== undefined;

  return (
    <Modal show={true} onHide={onClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Quiz - Question {currentQuestion + 1} of {quiz.questions.length}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-3">
          <ProgressBar now={progress} label={`${Math.round(progress)}%`} />
        </div>

        <Card>
          <Card.Body>
            <h5 className="mb-4">{currentQ.question}</h5>
            
            <Form>
              {currentQ.options.map((option, index) => (
                <Form.Check
                  key={index}
                  type="radio"
                  id={`option-${index}`}
                  name="answer"
                  label={option}
                  checked={answers[currentQuestion] === index}
                  onChange={() => handleAnswerSelect(index)}
                  className="mb-2 p-2 border rounded"
                />
              ))}
            </Form>
          </Card.Body>
        </Card>
      </Modal.Body>
      <Modal.Footer>
        <Button 
          variant="outline-secondary" 
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
        >
          Previous
        </Button>
        <Button 
          variant="primary" 
          onClick={handleNext}
          disabled={!isAnswered}
        >
          {currentQuestion === quiz.questions.length - 1 ? 'Finish Quiz' : 'Next'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default QuizComponent;
