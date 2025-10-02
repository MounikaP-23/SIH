import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useData } from '../../contexts/DataContext';
import { addAllDigitalSkillsLessons } from '../../utils/addDigitalSkillsLessons';

const AddLessonPage: React.FC = () => {
  const navigate = useNavigate();
  const { createLesson } = useData();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResults, setBulkResults] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    category: 'Digital Skills' as 'Digital Skills' | 'School Subjects' | 'Life Skills',
    classLevel: 0,
    language: 'en' as 'en' | 'hi' | 'pa',
    content: '',
    videoLink: '',
    images: [] as string[],
    quiz: {
      questions: [] as Array<{
        question: string;
        options: string[];
        correctAnswer: number;
      }>,
      isActive: true
    }
  });

  const [newImage, setNewImage] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0
  });

  // const subjects = ['Math', 'Science', 'English', 'Punjabi', 'Social Studies', 'Computer Science'];
  // const categories = ['Digital Skills', 'School Subjects', 'Life Skills'];
  // const classLevels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  // const languages = [
  //   { code: 'en', name: 'English' },
  //   { code: 'hi', name: 'Hindi' },
  //   { code: 'pa', name: 'Punjabi' }
  // ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (error) setError('');
    setFormData(prev => ({
      ...prev,
      [name]: name === 'classLevel' ? parseInt(value) || 0 : value
    }));
  };

  const handleAddImage = () => {
    if (newImage.trim()) {
      if (error) setError('');
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, newImage.trim()]
      }));
      setNewImage('');
    }
  };

  const handleRemoveImage = (index: number) => {
    if (error) setError('');
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // Handle pasted or dropped image files and convert to data URLs
  const handleFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files);
    const imageFiles = arr.filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;
    const toDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const dataUrls = await Promise.all(imageFiles.map(toDataUrl));
    setFormData(prev => ({ ...prev, images: [...prev.images, ...dataUrls] }));
  };

  const onPasteImages = async (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }
    if (files.length > 0) {
      e.preventDefault();
      await handleFiles(files);
    }
  };

  const onDropImages = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      await handleFiles(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleQuestionChange = (field: string, value: any) => {
    setCurrentQuestion(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...currentQuestion.options];
    newOptions[index] = value;
    setCurrentQuestion(prev => ({
      ...prev,
      options: newOptions
    }));
  };

  const handleAddQuestion = () => {
    if (currentQuestion.question.trim() && currentQuestion.options.every(opt => opt.trim())) {
      setFormData(prev => ({
        ...prev,
        quiz: {
          ...prev.quiz,
          questions: [...prev.quiz.questions, { ...currentQuestion }]
        }
      }));
      setCurrentQuestion({
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0
      });
    }
  };

  const handleRemoveQuestion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      quiz: {
        ...prev.quiz,
        questions: prev.quiz.questions.filter((_, i) => i !== index)
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Quick client-side required checks
      if (!formData.title?.trim()) throw new Error('Please enter a lesson title.');
      if (!formData.subject) throw new Error('Please select a subject.');
      if (!formData.classLevel || formData.classLevel < 1) throw new Error('Please select a class level.');
      if (!formData.description?.trim()) throw new Error('Please enter a description.');
      if (!formData.content?.trim()) throw new Error('Please enter lesson content.');

      // Basic payload size guard for pasted/dragged images (approx.)
      const approxBytes = formData.images.reduce((sum, img) => sum + (img.startsWith('data:') ? img.length * 0.75 : img.length), 0);
      if (approxBytes > 9 * 1024 * 1024) { // ~9MB to leave headroom for 10MB server limit
        throw new Error('Total embedded images are too large. Please remove some images or upload smaller ones.');
      }
      await createLesson(formData);
      setSuccess(true);
      setTimeout(() => {
        navigate('/teacher/lessons');
      }, 2000);
    } catch (err: any) {
      const status = err?.response?.status;
      const serverMsg = err?.response?.data?.message;
      if (status === 413) {
        setError('Payload too large. Please remove some images or use smaller images.');
      } else if (serverMsg) {
        setError(serverMsg);
      } else if (status) {
        setError(`Request failed with status ${status}. ${err?.response?.statusText || ''}`.trim());
      } else {
        setError(err?.message || 'Error creating lesson');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBulkImport = async () => {
    setBulkLoading(true);
    setBulkResults([]);
    setError('');
    
    try {
      const results = await addAllDigitalSkillsLessons(createLesson);
      setBulkResults(results);
      
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;
      
      if (successCount > 0) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/teacher/lessons');
        }, 2000);
      }
      
      if (failCount > 0) {
        setError(`${failCount} lessons failed to import. Check console for details.`);
      }
    } catch (error: any) {
      setError(error?.message || 'Bulk import failed');
    } finally {
      setBulkLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center">
        <i className="fas fa-check-circle fa-4x text-success mb-3"></i>
        <h3 className="text-success">Lesson Created Successfully!</h3>
        <p className="text-muted">Redirecting to your lessons...</p>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div>
      <Row>
        <Col lg={12}>
          <Card className="form-container">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h4 className="mb-0">
                  <i className="fas fa-plus me-2"></i>
                  Create New Lesson
                </h4>
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={handleBulkImport}
                  disabled={bulkLoading}
                >
                  {bulkLoading ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-download me-2"></i>
                      Import Digital Skills Lessons (Classes 1-5)
                    </>
                  )}
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              {error && (
                <Alert variant="danger" dismissible onClose={() => setError('')}>
                  {error}
                </Alert>
              )}

              {bulkResults.length > 0 && (
                <Alert variant="info">
                  <h6>Import Results:</h6>
                  <ul className="mb-0">
                    {bulkResults.map((result, index) => (
                      <li key={index} className={result.success ? 'text-success' : 'text-danger'}>
                        {result.success ? '✅' : '❌'} {result.title}
                      </li>
                    ))}
                  </ul>
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={8}>
                    <Form.Group className="mb-3">
                      <Form.Label>Lesson Title *</Form.Label>
                      <Form.Control
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="Enter lesson title"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Subject *</Form.Label>
                      <Form.Select
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select Subject</option>
                        {['Math','Science','English','Punjabi','Social Studies','Computer Science'].map(subject => (
                          <option key={subject} value={subject}>{subject}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Category *</Form.Label>
                      <Form.Select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        required
                      >
                        {['Digital Skills','School Subjects','Life Skills'].map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Class Level *</Form.Label>
                      <Form.Select
                        name="classLevel"
                        value={formData.classLevel}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select Class</option>
                        {[1,2,3,4,5,6,7,8,9,10,11,12].map(level => (
                          <option key={level} value={level}>Class {level}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Language</Form.Label>
                      <Form.Select
                        name="language"
                        value={formData.language}
                        onChange={handleInputChange}
                      >
                        {[{code:'en',name:'English'},{code:'hi',name:'Hindi'},{code:'pa',name:'Punjabi'}].map(({ code, name }) => (
                          <option key={code} value={code}>{name}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Video Link</Form.Label>
                      <Form.Control
                        type="url"
                        name="videoLink"
                        value={formData.videoLink}
                        onChange={handleInputChange}
                        placeholder="https://youtube.com/watch?v=..."
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Description *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter lesson description"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Content *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={8}
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    placeholder="Enter lesson content"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Images</Form.Label>
                  {/* URL add */}
                  <div className="d-flex gap-2 mb-2">
                    <Form.Control
                      type="url"
                      value={newImage}
                      onChange={(e) => setNewImage(e.target.value)}
                      placeholder="Paste image URL or use the area below to paste/drag-drop files"
                    />
                    <Button type="button" variant="outline-primary" onClick={handleAddImage}>
                      Add URL
                    </Button>
                  </div>

                  {/* File picker */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={(e) => e.target.files && handleFiles(e.target.files)}
                  />
                  <div className="d-flex gap-2 mb-3">
                    <Button type="button" variant="outline-secondary" onClick={() => fileInputRef.current?.click()}>
                      <i className="fas fa-upload me-1"></i>
                      Choose Images
                    </Button>
                    <div className="text-muted small d-flex align-items-center">or paste / drag-and-drop images below</div>
                  </div>

                  {/* Drop/Paste zone */}
                  <div
                    onPaste={onPasteImages}
                    onDrop={onDropImages}
                    onDragOver={onDragOver}
                    className="border rounded p-3 mb-3 text-center"
                    style={{ background: '#fafafa' }}
                  >
                    <div className="text-muted">
                      <i className="fas fa-images fa-lg mb-2 d-block"></i>
                      Paste images from clipboard, or drag and drop image files here
                    </div>
                  </div>

                  {formData.images.map((image, index) => (
                    <div key={index} className="d-flex align-items-center gap-2 mb-2">
                      <img src={image} alt={`Upload ${index + 1}`} style={{ width: '50px', height: '50px', objectFit: 'cover' }} className="rounded" />
                      <span className="flex-grow-1 text-truncate">{image.startsWith('data:') ? 'Pasted image' : image}</span>
                      <Button type="button" variant="outline-danger" size="sm" onClick={() => handleRemoveImage(index)}>
                        <i className="fas fa-times"></i>
                      </Button>
                    </div>
                  ))}
                </Form.Group>

                <hr />

                {/* Sample Prompts card removed as requested */}

                <h5>Quiz Questions</h5>
                {formData.quiz.questions.map((question, index) => (
                  <Card key={index} className="mb-3">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <strong>Question {index + 1}</strong>
                        <Button type="button" variant="outline-danger" size="sm" onClick={() => handleRemoveQuestion(index)}>
                          <i className="fas fa-trash"></i>
                        </Button>
                      </div>
                      <p className="mb-2">{question.question}</p>
                      <div className="row">
                        {question.options.map((option, optIndex) => (
                          <div key={optIndex} className="col-6 mb-1">
                            <span className={`badge ${optIndex === question.correctAnswer ? 'bg-success' : 'bg-secondary'}`}>
                              {String.fromCharCode(65 + optIndex)}. {option}
                            </span>
                          </div>
                        ))}
                      </div>
                    </Card.Body>
                  </Card>
                ))}

                <Card className="mb-3">
                  <Card.Header>
                    <h6 className="mb-0">Add New Question</h6>
                  </Card.Header>
                  <Card.Body>
                    <Form.Group className="mb-3">
                      <Form.Label>Question</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        value={currentQuestion.question}
                        onChange={(e) => handleQuestionChange('question', e.target.value)}
                        placeholder="Enter question"
                      />
                    </Form.Group>

                    <Row>
                      {currentQuestion.options.map((option, index) => (
                        <Col md={6} key={index} className="mb-2">
                          <div className="d-flex align-items-center gap-2">
                            <Form.Control
                              type="text"
                              value={option}
                              onChange={(e) => handleOptionChange(index, e.target.value)}
                              placeholder={`Option ${String.fromCharCode(65 + index)}`}
                            />
                            <Form.Check
                              type="radio"
                              name="correctAnswer"
                              checked={currentQuestion.correctAnswer === index}
                              onChange={() => handleQuestionChange('correctAnswer', index)}
                            />
                          </div>
                        </Col>
                      ))}
                    </Row>

                    <Button type="button" variant="primary" onClick={handleAddQuestion}>
                      Add Question
                    </Button>
                  </Card.Body>
                </Card>

                <div className="d-flex gap-2">
                  <Button type="submit" variant="primary" disabled={loading}>
                    {loading ? <Spinner size="sm" className="me-2" /> : null}
                    Create Lesson
                  </Button>
                  <Button type="button" variant="outline-secondary" onClick={() => navigate('/teacher/lessons')}>
                    Cancel
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AddLessonPage;
