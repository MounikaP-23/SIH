// Helper function to add digital skills lessons
export const digitalSkillsLessons = [
  {
    title: "Introduction to Computers",
    description: "Learn about computers and their basic parts",
    subject: "Computer Science",
    category: "Digital Skills",
    classLevel: 1,
    language: "en",
    content: `
      <h3>What is a Computer?</h3>
      <p>Computers are electronic machines that help us in many ways. They can be used to draw pictures, watch videos, listen to music, and play games.</p>
      
      <h3>Parts of a Computer</h3>
      <p>A computer has important parts:</p>
      <ul>
        <li><strong>Monitor (Screen):</strong> Shows pictures and videos</li>
        <li><strong>Keyboard:</strong> Used for typing letters and numbers</li>
        <li><strong>Mouse:</strong> Used for pointing and clicking</li>
      </ul>
      
      <h3>Using Computers Safely</h3>
      <p>We should always use computers carefully and keep them clean. Never hit the keyboard hard or eat food near the computer.</p>
    `,
    quiz: {
      questions: [
        {
          question: "Which part of the computer shows pictures and videos?",
          options: ["Keyboard", "Monitor", "Mouse", "Speaker"],
          correctAnswer: 1
        },
        {
          question: "Which device is used for typing letters and numbers?",
          options: ["Mouse", "Keyboard", "Monitor", "Printer"],
          correctAnswer: 1
        },
        {
          question: "What should we do while using computers?",
          options: ["Hit the keyboard", "Eat food on it", "Keep it clean", "Throw water on it"],
          correctAnswer: 2
        }
      ],
      isActive: true
    }
  },
  {
    title: "Using the Mouse and Keyboard",
    description: "Learn how to use mouse and keyboard effectively",
    subject: "Computer Science",
    category: "Digital Skills",
    classLevel: 2,
    language: "en",
    content: `
      <h3>Using the Mouse</h3>
      <p>The mouse helps us point, click, and open programs. We can move the mouse to move the cursor on the screen.</p>
      
      <h3>Using the Keyboard</h3>
      <p>The keyboard is used for typing words, numbers, and symbols. Important keys include:</p>
      <ul>
        <li><strong>Spacebar:</strong> Adds spaces between words</li>
        <li><strong>Enter key:</strong> Moves to the next line</li>
        <li><strong>Letters and Numbers:</strong> For typing text</li>
      </ul>
      
      <h3>Practice Makes Perfect</h3>
      <p>Learning how to use the mouse and keyboard makes us better at using computers. Practice regularly to improve your skills!</p>
    `,
    quiz: {
      questions: [
        {
          question: "Which key is used to move to the next line?",
          options: ["Spacebar", "Enter", "Shift", "Tab"],
          correctAnswer: 1
        },
        {
          question: "Which device helps in pointing and clicking?",
          options: ["Monitor", "Keyboard", "Mouse", "Printer"],
          correctAnswer: 2
        },
        {
          question: "Which key gives space between words?",
          options: ["Enter", "Shift", "Spacebar", "Backspace"],
          correctAnswer: 2
        }
      ],
      isActive: true
    }
  },
  {
    title: "Introduction to the Internet",
    description: "Learn about the internet and how to use it safely",
    subject: "Computer Science",
    category: "Digital Skills",
    classLevel: 3,
    language: "en",
    content: `
      <h3>What is the Internet?</h3>
      <p>The internet connects computers around the world. It helps us watch videos, read stories, and learn new things.</p>
      
      <h3>Search Engines</h3>
      <p>We can use search engines like Google to find information. Just type what you want to know and press Enter!</p>
      
      <h3>Internet Safety</h3>
      <p>We must use the internet safely:</p>
      <ul>
        <li>Never share personal details with strangers</li>
        <li>Always ask teachers or parents before using the internet</li>
        <li>Don't click on unknown links</li>
        <li>Keep your passwords secret</li>
      </ul>
    `,
    quiz: {
      questions: [
        {
          question: "Which of these is used to search on the internet?",
          options: ["Google", "MS Word", "Paint", "Calculator"],
          correctAnswer: 0
        },
        {
          question: "Should we share our password with friends?",
          options: ["Yes", "No", "Sometimes", "Only in school"],
          correctAnswer: 1
        },
        {
          question: "The internet helps us to:",
          options: ["Eat food", "Find information", "Sleep", "Clean the room"],
          correctAnswer: 1
        }
      ],
      isActive: true
    }
  },
  {
    title: "Safe Internet and Online Learning",
    description: "Learn about internet safety and online learning platforms",
    subject: "Computer Science",
    category: "Digital Skills",
    classLevel: 4,
    language: "en",
    content: `
      <h3>Internet Safety Rules</h3>
      <p>The internet is useful for learning and connecting with friends, but we should always be safe:</p>
      <ul>
        <li>Never talk to strangers online</li>
        <li>Do not open unknown emails or links</li>
        <li>Use strong passwords</li>
        <li>Respect others on the internet</li>
      </ul>
      
      <h3>Online Learning</h3>
      <p>Online learning apps help us:</p>
      <ul>
        <li>Read books and stories</li>
        <li>Practice quizzes and exercises</li>
        <li>Watch educational videos and lessons</li>
        <li>Connect with teachers and classmates</li>
      </ul>
      
      <h3>Digital Citizenship</h3>
      <p>Being a good digital citizen means using technology responsibly and treating others with respect online.</p>
    `,
    quiz: {
      questions: [
        {
          question: "Who should we share our password with?",
          options: ["Everyone", "Only teacher or parent", "Strangers", "Friends"],
          correctAnswer: 1
        },
        {
          question: "Which of these is an online learning activity?",
          options: ["Playing outside", "Watching lessons on an app", "Sleeping", "Drawing with pencil"],
          correctAnswer: 1
        },
        {
          question: "What should we avoid while using the internet?",
          options: ["Opening unknown links", "Asking teacher for help", "Using safe apps", "Learning online"],
          correctAnswer: 0
        }
      ],
      isActive: true
    }
  },
  {
    title: "Creating and Sharing Digital Content",
    description: "Learn to create and share digital content responsibly",
    subject: "Computer Science",
    category: "Digital Skills",
    classLevel: 5,
    language: "en",
    content: `
      <h3>Creating Digital Content</h3>
      <p>With computers and the internet, we can create many things:</p>
      <ul>
        <li><strong>Stories:</strong> Write creative stories and essays</li>
        <li><strong>Drawings:</strong> Create digital art and illustrations</li>
        <li><strong>Presentations:</strong> Make slideshows for projects</li>
      </ul>
      
      <h3>Useful Apps</h3>
      <p>Different apps help us create different things:</p>
      <ul>
        <li><strong>MS Word:</strong> For writing documents and stories</li>
        <li><strong>Paint:</strong> For drawing and creating art</li>
        <li><strong>PowerPoint:</strong> For making presentations and slides</li>
      </ul>
      
      <h3>Sharing Responsibly</h3>
      <p>When we share our work online, we should:</p>
      <ul>
        <li>Be respectful to others</li>
        <li>Not copy others' work without permission</li>
        <li>Give credit when using someone else's ideas</li>
        <li>Think before posting anything online</li>
      </ul>
      
      <h3>Digital Citizenship</h3>
      <p>Being a good digital citizen means using technology responsibly and treating others with respect online.</p>
    `,
    quiz: {
      questions: [
        {
          question: "Which app is used to draw on the computer?",
          options: ["MS Word", "Paint", "Google", "Calculator"],
          correctAnswer: 1
        },
        {
          question: "What do we call people who behave well on the internet?",
          options: ["Digital citizens", "Digital enemies", "Online strangers", "Password keepers"],
          correctAnswer: 0
        },
        {
          question: "Which app is used to make presentations?",
          options: ["PowerPoint", "Paint", "MS Word", "Notepad"],
          correctAnswer: 0
        }
      ],
      isActive: true
    }
  }
];

// Function to add all digital skills lessons
export const addAllDigitalSkillsLessons = async (createLesson: any) => {
  const results = [];
  
  for (const lesson of digitalSkillsLessons) {
    try {
      await createLesson(lesson);
      results.push({ success: true, title: lesson.title });
      console.log(`Added lesson: ${lesson.title}`);
    } catch (error) {
      results.push({ success: false, title: lesson.title, error });
      console.error(`Failed to add lesson: ${lesson.title}`, error);
    }
  }
  
  return results;
};
