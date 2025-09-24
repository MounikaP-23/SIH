const express = require('express');

const router = express.Router();

// POST /api/translate
// Body: { q: string, source: 'en'|'hi'|'pa', target: 'en'|'hi'|'pa' }
router.post('/', async (req, res) => {
  try {
    const { q, source, target } = req.body || {};
    console.log('Translate request:', { q: q?.substring(0, 50), source, target });

    if (!q || !source || !target) {
      return res.status(400).json({ message: 'q, source and target are required' });
    }

    // Comprehensive translation mapping
    const translations = {
      'en-hi': {
        'Mouse': 'माउस',
        'A Computer Part': 'एक कंप्यूटर भाग',
        'Parts of a Mouse': 'माउस के भाग',
        'Left Button': 'बायां बटन',
        'Right Button': 'दायां बटन',
        'Scroll Wheel': 'स्क्रॉल व्हील',
        'Uses of Mouse': 'माउस के उपयोग',
        'Example for Students': 'छात्रों के लिए उदाहरण',
        'A computer mouse is a small device that we hold in our hand to control the computer.': 'कंप्यूटर माउस एक छोटा उपकरण है जिसे हम अपने हाथ में पकड़कर कंप्यूटर को नियंत्रित करते हैं।',
        'A mouse is a small device that helps us control the computer.': 'माउस एक छोटा उपकरण है जो हमें कंप्यूटर को नियंत्रित करने में मदद करता है।',
        'It has two buttons and a scroll wheel.': 'इसमें दो बटन और एक स्क्रॉल व्हील होता है।',
        'We use the left button to select or open things, the right button to see more options, and the scroll wheel to move the page up and down.': 'हम बाएं बटन का उपयोग चीजों को चुनने या खोलने के लिए, दाएं बटन का उपयोग अधिक विकल्प देखने के लिए, और स्क्रॉल व्हील का उपयोग पेज को ऊपर-नीचे करने के लिए करते हैं।',
        'The mouse helps us to point, click, draw, and play games on the computer.': 'माउस हमें कंप्यूटर पर पॉइंट करने, क्लिक करने, ड्रॉ करने और गेम खेलने में मदद करता है।',
        'A mouse is a small device we use to control the computer.': 'माउस एक छोटा उपकरण है जिसका उपयोग हम कंप्यूटर को नियंत्रित करने के लिए करते हैं।',
        'It is held in the hand and moved on a table.': 'इसे हाथ में पकड़ा जाता है और मेज पर हिलाया जाता है।',
        'The mouse helps us to point, click, and move things on the screen.': 'माउस हमें स्क्रीन पर पॉइंट करने, क्लिक करने और चीजों को हिलाने में मदद करता है।',
        'Left button – used for clicking and selecting.': 'बायां बटन - क्लिक करने और चुनने के लिए उपयोग किया जाता है।',
        'Right button - shows a menu with more options.': 'दायां बटन - अधिक विकल्पों के साथ एक मेन्यू दिखाता है।',
        'Scroll Wheel - used to move up and down on the screen.': 'स्क्रॉल व्हील - स्क्रीन पर ऊपर-नीचे जाने के लिए उपयोग किया जाता है।',
        'To open programs (by clicking).': 'प्रोग्राम खोलने के लिए (क्लिक करके)।',
        'To move things (drag and drop)': 'चीजों को हिलाने के लिए (ड्रैग और ड्रॉप)',
        'We use the mouse to select, open, point, click, draw, and play games.': 'हम माउस का उपयोग चुनने, खोलने, इंगित करने, क्लिक करने, चित्र बनाने और गेम खेलने के लिए करते हैं।',
        'The mouse is a small device that helps us control the computer.': 'माउस एक छोटा उपकरण है जो हमें कंप्यूटर को नियंत्रित करने में मदद करता है।',
        'We move the mouse to move the cursor on the screen.': 'हम स्क्रीन पर कर्सर को हिलाने के लिए माउस को हिलाते हैं।',
        'The left button is used to select and open things.': 'बायां बटन चीजों को चुनने और खोलने के लिए उपयोग किया जाता है।',
        'The right button shows us more options.': 'दायां बटन हमें अधिक विकल्प दिखाता है।',
        'The scroll wheel helps us move up and down on the page.': 'स्क्रॉल व्हील पेज पर ऊपर-नीचे जाने में हमारी मदद करता है।',
        'We can open programs by clicking on them.': 'हम उन पर क्लिक करके प्रोग्राम खोल सकते हैं।',
        'We can move things by dragging and dropping.': 'हम चीजों को खींचकर और छोड़कर हिला सकते हैं।',
        'We can play games using the mouse.': 'हम माउस का उपयोग करके गेम खेल सकते हैं।',
        'We can draw pictures using the mouse.': 'हम माउस का उपयोग करके चित्र बना सकते हैं।',
        'Click the left button to open a picture.': 'चित्र खोलने के लिए बायां बटन क्लिक करें।',
        // Add more comprehensive translations for common computer terms
        'computer': 'कंप्यूटर',
        'keyboard': 'कीबोर्ड',
        'screen': 'स्क्रीन',
        'cursor': 'कर्सर',
        'button': 'बटन',
        'click': 'क्लिक',
        'program': 'प्रोग्राम',
        'software': 'सॉफ्टवेयर',
        'hardware': 'हार्डवेयर',
        'internet': 'इंटरनेट',
        'website': 'वेबसाइट',
        'email': 'ईमेल',
        'file': 'फाइल',
        'folder': 'फोल्डर',
        'desktop': 'डेस्कटॉप',
        'window': 'विंडो',
        'menu': 'मेन्यू',
        'icon': 'आइकन',
        'learn': 'सीखें',
        'practice': 'अभ्यास',
        'use': 'उपयोग',
        'open': 'खोलें',
        'close': 'बंद करें',
        'save': 'सेव करें',
        'delete': 'डिलीट करें',
        'create': 'बनाएं',
        'edit': 'एडिट करें',
        'type': 'टाइप करें',
        'how to': 'कैसे',
        'step by step': 'चरणबद्ध तरीके से',
        'important': 'महत्वपूर्ण',
        'remember': 'याद रखें',
        'note': 'नोट',
        'example': 'उदाहरण',
        'tutorial': 'ट्यूटोरियल',
        'lesson': 'पाठ',
        'course': 'कोर्स',
        'skill': 'कौशल',
        'Learn how to use mouse and keyboard effectively': 'माउस और कीबोर्ड का प्रभावी उपयोग करना सीखें',
        'The mouse helps us point, click, and open programs. We can move the mouse to move the cursor on the screen.': 'माउस हमें पॉइंट करने, क्लिक करने और प्रोग्राम खोलने में मदद करता है। हम स्क्रीन पर कर्सर को हिलाने के लिए माउस को हिला सकते हैं।',
        'Using the Keyboard': 'कीबोर्ड का उपयोग',
        'The keyboard is used for typing words, numbers, and symbols. Important keys include:': 'कीबोर्ड का उपयोग शब्दों, संख्याओं और प्रतीकों को टाइप करने के लिए किया जाता है। महत्वपूर्ण कुंजियाँ शामिल हैं:',
        'Spacebar: Adds spaces between words': 'स्पेसबार: शब्दों के बीच रिक्त स्थान जोड़ता है',
        'Enter key: Moves to the next line': 'एंटर कुंजी: अगली पंक्ति में ले जाती है',
        'Letters and Numbers: For typing text': 'अक्षर और संख्याएं: पाठ टाइप करने के लिए',
        'Practice Makes Perfect': 'अभ्यास परिपूर्ण बनाता है',
        'Learning how to use the mouse and keyboard makes us better at using computers. Practice regularly to improve your skills!': 'माउस और कीबोर्ड का उपयोग करना सीखने से हम कंप्यूटर का बेहतर उपयोग करने में सक्षम होते हैं। अपने कौशल में सुधार करने के लिए नियमित रूप से अभ्यास करें!'
      },
      'en-pa': {
        'Mouse': 'ਮਾਊਸ',
        'A Computer Part': 'ਇੱਕ ਕੰਪਿਊਟਰ ਭਾਗ',
        'Parts of a Mouse': 'ਮਾਊਸ ਦੇ ਹਿੱਸੇ',
        'Left Button': 'ਖੱਬਾ ਬਟਨ',
        'Right Button': 'ਸੱਜਾ ਬਟਨ',
        'Scroll Wheel': 'ਸਕ੍ਰੌਲ ਵ੍ਹੀਲ',
        'Uses of Mouse': 'ਮਾਊਸ ਦੇ ਉਪਯੋਗ',
        'Example for Students': 'ਵਿਦਿਆਰਥੀਆਂ ਲਈ ਉਦਾਹਰਣ',
        'A computer mouse is a small device that we hold in our hand to control the computer.': 'ਕੰਪਿਊਟਰ ਮਾਊਸ ਇੱਕ ਛੋਟਾ ਉਪਕਰਣ ਹੈ ਜਿਸਨੂੰ ਅਸੀਂ ਆਪਣੇ ਹੱਥ ਵਿੱਚ ਪਕੜ ਕੇ ਕੰਪਿਊਟਰ ਨੂੰ ਨਿਯੰਤਰਿਤ ਕਰਦੇ ਹਾਂ।',
        'A mouse is a small device that helps us control the computer.': 'ਮਾਊਸ ਇੱਕ ਛੋਟਾ ਉਪਕਰਣ ਹੈ ਜੋ ਸਾਨੂੰ ਕੰਪਿਊਟਰ ਨੂੰ ਨਿਯੰਤਰਿਤ ਕਰਨ ਵਿੱਚ ਮਦਦ ਕਰਦਾ ਹੈ।',
        'It has two buttons and a scroll wheel.': 'ਇਸ ਵਿੱਚ ਦੋ ਬਟਨ ਅਤੇ ਇੱਕ ਸਕ੍ਰੌਲ ਵ੍ਹੀਲ ਹੁੰਦਾ ਹੈ।',
        'We use the left button to select or open things, the right button to see more options, and the scroll wheel to move the page up and down.': 'ਅਸੀਂ ਖੱਬੇ ਬਟਨ ਦਾ ਉਪਯੋਗ ਚੀਜ਼ਾਂ ਨੂੰ ਚੁਣਨ ਜਾਂ ਖੋਲ੍ਹਣ ਲਈ, ਸੱਜੇ ਬਟਨ ਦਾ ਉਪਯੋਗ ਹੋਰ ਵਿਕਲਪ ਦੇਖਣ ਲਈ, ਅਤੇ ਸਕ੍ਰੌਲ ਵ੍ਹੀਲ ਦਾ ਉਪਯੋਗ ਪੇਜ ਨੂੰ ਉੱਪਰ-ਹੇਠਾਂ ਕਰਨ ਲਈ ਕਰਦੇ ਹਾਂ।',
        'The mouse helps us to point, click, draw, and play games on the computer.': 'ਮਾਊਸ ਸਾਨੂੰ ਕੰਪਿਊਟਰ ਉੱਤੇ ਪੁਆਇੰਟ ਕਰਨ, ਕਲਿਕ ਕਰਨ, ਡਰਾਅ ਕਰਨ ਅਤੇ ਗੇਮ ਖੇਡਣ ਵਿੱਚ ਮਦਦ ਕਰਦਾ ਹੈ।',
        'A mouse is a small device we use to control the computer.': 'ਮਾਊਸ ਇੱਕ ਛੋਟਾ ਉਪਕਰਣ ਹੈ ਜਿਸਦਾ ਉਪਯੋਗ ਅਸੀਂ ਕੰਪਿਊਟਰ ਨੂੰ ਨਿਯੰਤਰਿਤ ਕਰਨ ਲਈ ਕਰਦੇ ਹਾਂ।',
        'It is held in the hand and moved on a table.': 'ਇਸਨੂੰ ਹੱਥ ਵਿੱਚ ਪਕੜਿਆ ਜਾਂਦਾ ਹੈ ਅਤੇ ਮੇਜ਼ ਉੱਤੇ ਹਿਲਾਇਆ ਜਾਂਦਾ ਹੈ।',
        'The mouse helps us to point, click, and move things on the screen.': 'ਮਾਊਸ ਸਾਨੂੰ ਸਕ੍ਰੀਨ ਉੱਤੇ ਪੁਆਇੰਟ ਕਰਨ, ਕਲਿਕ ਕਰਨ ਅਤੇ ਚੀਜ਼ਾਂ ਨੂੰ ਹਿਲਾਉਣ ਵਿੱਚ ਮਦਦ ਕਰਦਾ ਹੈ।',
        'Left button – used for clicking and selecting.': 'ਖੱਬਾ ਬਟਨ - ਕਲਿਕ ਕਰਨ ਅਤੇ ਚੁਣਨ ਲਈ ਵਰਤਿਆ ਜਾਂਦਾ ਹੈ।',
        'Right button - shows a menu with more options.': 'ਸੱਜਾ ਬਟਨ - ਹੋਰ ਵਿਕਲਪਾਂ ਦੇ ਸਾਥ ਇੱਕ ਮੈਨੂ ਦਿਖਾਉਂਦਾ ਹੈ।',
        'Scroll Wheel - used to move up and down on the screen.': 'ਸਕ੍ਰੌਲ ਵ੍ਹੀਲ - ਸਕ੍ਰੀਨ ਉੱਤੇ ਉੱਪਰ-ਹੇਠਾਂ ਜਾਣ ਲਈ ਵਰਤਿਆ ਜਾਂਦਾ ਹੈ।',
        'To open programs (by clicking).': 'ਪ੍ਰੋਗਰਾਮ ਖੋਲ੍ਹਣ ਲਈ (ਕਲਿਕ ਕਰਕੇ)।',
        'To move things (drag and drop)': 'ਚੀਜ਼ਾਂ ਨੂੰ ਹਿਲਾਉਣ ਲਈ (ਡ੍ਰੈਗ ਅਤੇ ਡ੍ਰੌਪ)',
        'We use the mouse to select, open, point, click, draw, and play games.': 'ਅਸੀਂ ਮਾਊਸ ਦਾ ਉਪਯੋਗ ਚੁਣਨ, ਖੋਲ੍ਹਣ, ਇਸ਼ਾਰਾ ਕਰਨ, ਕਲਿਕ ਕਰਨ, ਚਿੱਤਰ ਬਣਾਉਣ ਅਤੇ ਗੇਮ ਖੇਡਣ ਲਈ ਕਰਦੇ ਹਾਂ।',
        'The mouse is a small device that helps us control the computer.': 'ਮਾਊਸ ਇੱਕ ਛੋਟਾ ਉਪਕਰਣ ਹੈ ਜੋ ਸਾਨੂੰ ਕੰਪਿਊਟਰ ਨੂੰ ਨਿਯੰਤਰਿਤ ਕਰਨ ਵਿੱਚ ਮਦਦ ਕਰਦਾ ਹੈ।',
        'We move the mouse to move the cursor on the screen.': 'ਅਸੀਂ ਸਕ੍ਰੀਨ \'ਤੇ ਕਰਸਰ ਨੂੰ ਹਿਲਾਉਣ ਲਈ ਮਾਊਸ ਨੂੰ ਹਿਲਾਉਂਦੇ ਹਾਂ।',
        'The left button is used to select and open things.': 'ਖੱਬਾ ਬਟਨ ਚੀਜ਼ਾਂ ਨੂੰ ਚੁਣਨ ਅਤੇ ਖੋਲ੍ਹਣ ਲਈ ਵਰਤਿਆ ਜਾਂਦਾ ਹੈ।',
        'The right button shows us more options.': 'ਸੱਜਾ ਬਟਨ ਸਾਨੂੰ ਹੋਰ ਵਿਕਲਪ ਦਿਖਾਉਂਦਾ ਹੈ।',
        'The scroll wheel helps us move up and down on the page.': 'ਸਕ੍ਰੌਲ ਵ੍ਹੀਲ ਪੇਜ \'ਤੇ ਉੱਪਰ-ਹੇਠਾਂ ਜਾਣ ਵਿੱਚ ਸਾਡੀ ਮਦਦ ਕਰਦਾ ਹੈ।',
        'We can open programs by clicking on them.': 'ਅਸੀਂ ਉਨ੍ਹਾਂ \'ਤੇ ਕਲਿਕ ਕਰਕੇ ਪ੍ਰੋਗਰਾਮ ਖੋਲ੍ਹ ਸਕਦੇ ਹਾਂ।',
        'We can move things by dragging and dropping.': 'ਅਸੀਂ ਚੀਜ਼ਾਂ ਨੂੰ ਖਿੱਚ ਕੇ ਅਤੇ ਛੱਡ ਕੇ ਹਿਲਾ ਸਕਦੇ ਹਾਂ।',
        'We can play games using the mouse.': 'ਅਸੀਂ ਮਾਊਸ ਦਾ ਉਪਯੋਗ ਕਰਕੇ ਗੇਮ ਖੇਡ ਸਕਦੇ ਹਾਂ।',
        'We can draw pictures using the mouse.': 'ਅਸੀਂ ਮਾਊਸ ਦਾ ਉਪਯੋਗ ਕਰਕੇ ਚਿੱਤਰ ਬਣਾ ਸਕਦੇ ਹਾਂ।',
        'Click the left button to open a picture.': 'ਚਿੱਤਰ ਖੋਲ੍ਹਣ ਲਈ ਖੱਬਾ ਬਟਨ ਕਲਿਕ ਕਰੋ।',
        // Add more comprehensive translations for common computer terms
        'computer': 'ਕੰਪਿਊਟਰ',
        'keyboard': 'ਕੀਬੋਰਡ',
        'screen': 'ਸਕ੍ਰੀਨ',
        'cursor': 'ਕਰਸਰ',
        'button': 'ਬਟਨ',
        'click': 'ਕਲਿਕ',
        'program': 'ਪ੍ਰੋਗਰਾਮ',
        'software': 'ਸਾਫਟਵੇਅਰ',
        'hardware': 'ਹਾਰਡਵੇਅਰ',
        'internet': 'ਇੰਟਰਨੈੱਟ',
        'website': 'ਵੈੱਬਸਾਈਟ',
        'email': 'ਈਮੇਲ',
        'file': 'ਫਾਈਲ',
        'folder': 'ਫੋਲਡਰ',
        'desktop': 'ਡੈਸਕਟਾਪ',
        'window': 'ਵਿੰਡੋ',
        'menu': 'ਮੈਨੂ',
        'icon': 'ਆਈਕਨ',
        'learn': 'ਸਿੱਖੋ',
        'practice': 'ਅਭਿਆਸ',
        'use': 'ਇਸਤੇਮਾਲ',
        'open': 'ਖੋਲੋ',
        'close': 'ਬੰਦ ਕਰੋ',
        'save': 'ਸੇਵ ਕਰੋ',
        'delete': 'ਡਿਲੀਟ ਕਰੋ',
        'create': 'ਬਣਾਓ',
        'edit': 'ਐਡਿਟ ਕਰੋ',
        'type': 'ਟਾਈਪ ਕਰੋ',
        'how to': 'ਕਿਵੇਂ',
        'step by step': 'ਕਦਮ ਦਰ ਕਦਮ',
        'important': 'ਮਹੱਤਵਪੂਰਨ',
        'remember': 'ਯਾਦ ਰੱਖੋ',
        'note': 'ਨੋਟ',
        'example': 'ਉਦਾਹਰਣ',
        'tutorial': 'ਟਿਊਟੋਰੀਅਲ',
        'lesson': 'ਪਾਠ',
        'course': 'ਕੋਰਸ',
        'skill': 'ਹੁਨਰ',
        'Learn how to use mouse and keyboard effectively': 'ਮਾਊਸ ਅਤੇ ਕੀਬੋਰਡ ਦਾ ਪ੍ਰਭਾਵਸ਼ਾਲੀ ਢੰਗ ਨਾਲ ਇਸਤੇਮਾਲ ਕਰਨਾ ਸਿੱਖੋ',
        'The mouse helps us point, click, and open programs. We can move the mouse to move the cursor on the screen.': 'ਮਾਊਸ ਸਾਨੂੰ ਪੁਆਇੰਟ ਕਰਨ, ਕਲਿਕ ਕਰਨ ਅਤੇ ਪ੍ਰੋਗਰਾਮ ਖੋਲ੍ਹਣ ਵਿੱਚ ਮਦਦ ਕਰਦਾ ਹੈ। ਅਸੀਂ ਸਕ੍ਰੀਨ ਉੱਤੇ ਕਰਸਰ ਨੂੰ ਹਿਲਾਉਣ ਲਈ ਮਾਊਸ ਨੂੰ ਹਿਲਾ ਸਕਦੇ ਹਾਂ।',
        'Using the Keyboard': 'ਕੀਬੋਰਡ ਦਾ ਇਸਤੇਮਾਲ',
        'The keyboard is used for typing words, numbers, and symbols. Important keys include:': 'ਕੀਬੋਰਡ ਦਾ ਇਸਤੇਮਾਲ ਸ਼ਬਦਾਂ, ਅੰਕਾਂ ਅਤੇ ਪ੍ਰਤੀਕਾਂ ਨੂੰ ਟਾਈਪ ਕਰਨ ਲਈ ਕੀਤਾ ਜਾਂਦਾ ਹੈ। ਮਹੱਤਵਪੂਰਨ ਕੁੰਜੀਆਂ ਸ਼ਾਮਲ ਹਨ:',
        'Spacebar: Adds spaces between words': 'ਸਪੇਸਬਾਰ: ਸ਼ਬਦਾਂ ਦੇ ਵਿਚਕਾਰ ਖਾਲੀ ਥਾਂਵਾਂ ਜੋੜਦਾ ਹੈ',
        'Enter key: Moves to the next line': 'ਐਂਟਰ ਕੁੰਜੀ: ਅਗਲੀ ਲਾਈਨ ਵਿੱਚ ਲੈ ਜਾਂਦੀ ਹੈ',
        'Letters and Numbers: For typing text': 'ਅੱਖਰ ਅਤੇ ਅੰਕ: ਪਾਠ ਟਾਈਪ ਕਰਨ ਲਈ',
        'Practice Makes Perfect': 'ਅਭਿਆਸ ਨਾਲ ਪਰਫੈਕਟ ਬਣਦਾ ਹੈ',
        'Learning how to use the mouse and keyboard makes us better at using computers. Practice regularly to improve your skills!': 'ਮਾਊਸ ਅਤੇ ਕੀਬੋਰਡ ਦਾ ਇਸਤੇਮਾਲ ਕਰਨਾ ਸਿੱਖਣ ਨਾਲ ਅਸੀਂ ਕੰਪਿਊਟਰਾਂ ਦਾ ਬਿਹਤਰ ਇਸਤੇਮਾਲ ਕਰਨ ਵਿੱਚ ਸਮਰੱਥ ਹੁੰਦੇ ਹਾਂ। ਆਪਣੇ ਹੁਨਰਾਂ ਵਿੱਚ ਸੁਧਾਰ ਕਰਨ ਲਈ ਨਿਯਮਤ ਤੌਰ ਉੱਤੇ ਅਭਿਆਸ ਕਰੋ!'
      }
    };

    const key = `${source}-${target}`;
    const translationMap = translations[key] || {};

    // Try to find exact match first, then partial match
    let translated = translationMap[q] || q;

    // If no exact match, try to translate common words
    if (translated === q && key === 'en-hi') {
      translated = q.replace(/Mouse/g, 'माउस')
                   .replace(/computer/gi, 'कंप्यूटर')
                   .replace(/keyboard/gi, 'कीबोर्ड')
                   .replace(/screen/gi, 'स्क्रीन')
                   .replace(/cursor/gi, 'कर्सर')
                   .replace(/button/gi, 'बटन')
                   .replace(/click/gi, 'क्लिक')
                   .replace(/program/gi, 'प्रोग्राम')
                   .replace(/software/gi, 'सॉफ्टवेयर')
                   .replace(/hardware/gi, 'हार्डवेयर')
                   .replace(/internet/gi, 'इंटरनेट')
                   .replace(/website/gi, 'वेबसाइट')
                   .replace(/email/gi, 'ईमेल')
                   .replace(/file/gi, 'फाइल')
                   .replace(/folder/gi, 'फोल्डर')
                   .replace(/desktop/gi, 'डेस्कटॉप')
                   .replace(/window/gi, 'विंडो')
                   .replace(/menu/gi, 'मेन्यू')
                   .replace(/icon/gi, 'आइकन')
                   .replace(/learn/gi, 'सीखें')
                   .replace(/practice/gi, 'अभ्यास')
                   .replace(/use/gi, 'उपयोग')
                   .replace(/open/gi, 'खोलें')
                   .replace(/close/gi, 'बंद करें')
                   .replace(/save/gi, 'सेव करें')
                   .replace(/delete/gi, 'डिलीट करें')
                   .replace(/create/gi, 'बनाएं')
                   .replace(/edit/gi, 'एडिट करें')
                   .replace(/type/gi, 'टाइप करें')
                   .replace(/how to/gi, 'कैसे')
                   .replace(/step by step/gi, 'चरणबद्ध तरीके से')
                   .replace(/important/gi, 'महत्वपूर्ण')
                   .replace(/remember/gi, 'याद रखें')
                   .replace(/note/gi, 'नोट')
                   .replace(/example/gi, 'उदाहरण')
                   .replace(/tutorial/gi, 'ट्यूटोरियल')
                   .replace(/lesson/gi, 'पाठ')
                   .replace(/course/gi, 'कोर्स')
                   .replace(/skill/gi, 'कौशल');
    } else if (translated === q && key === 'en-pa') {
      translated = q.replace(/Mouse/g, 'ਮਾਊਸ')
                   .replace(/computer/gi, 'ਕੰਪਿਊਟਰ')
                   .replace(/keyboard/gi, 'ਕੀਬੋਰਡ')
                   .replace(/screen/gi, 'ਸਕ੍ਰੀਨ')
                   .replace(/cursor/gi, 'ਕਰਸਰ')
                   .replace(/button/gi, 'ਬਟਨ')
                   .replace(/click/gi, 'ਕਲਿਕ')
                   .replace(/program/gi, 'ਪ੍ਰੋਗਰਾਮ')
                   .replace(/software/gi, 'ਸਾਫਟਵੇਅਰ')
                   .replace(/hardware/gi, 'ਹਾਰਡਵੇਅਰ')
                   .replace(/internet/gi, 'ਇੰਟਰਨੈੱਟ')
                   .replace(/website/gi, 'ਵੈੱਬਸਾਈਟ')
                   .replace(/email/gi, 'ਈਮੇਲ')
                   .replace(/file/gi, 'ਫਾਈਲ')
                   .replace(/folder/gi, 'ਫੋਲਡਰ')
                   .replace(/desktop/gi, 'ਡੈਸਕਟਾਪ')
                   .replace(/window/gi, 'ਵਿੰਡੋ')
                   .replace(/menu/gi, 'ਮੈਨੂ')
                   .replace(/icon/gi, 'ਆਈਕਨ')
                   .replace(/learn/gi, 'ਸਿੱਖੋ')
                   .replace(/practice/gi, 'ਅਭਿਆਸ')
                   .replace(/use/gi, 'ਇਸਤੇਮਾਲ')
                   .replace(/open/gi, 'ਖੋਲੋ')
                   .replace(/close/gi, 'ਬੰਦ ਕਰੋ')
                   .replace(/save/gi, 'ਸੇਵ ਕਰੋ')
                   .replace(/delete/gi, 'ਡਿਲੀਟ ਕਰੋ')
                   .replace(/create/gi, 'ਬਣਾਓ')
                   .replace(/edit/gi, 'ਐਡਿਟ ਕਰੋ')
                   .replace(/type/gi, 'ਟਾਈਪ ਕਰੋ')
                   .replace(/how to/gi, 'ਕਿਵੇਂ')
                   .replace(/step by step/gi, 'ਕਦਮ ਦਰ ਕਦਮ')
                   .replace(/important/gi, 'ਮਹੱਤਵਪੂਰਨ')
                   .replace(/remember/gi, 'ਯਾਦ ਰੱਖੋ')
                   .replace(/note/gi, 'ਨੋਟ')
                   .replace(/example/gi, 'ਉਦਾਹਰਣ')
                   .replace(/tutorial/gi, 'ਟਿਊਟੋਰੀਅਲ')
                   .replace(/lesson/gi, 'ਪਾਠ')
                   .replace(/course/gi, 'ਕੋਰਸ')
                   .replace(/skill/gi, 'ਹੁਨਰ');
    }

    console.log('Translation result:', translated);
    return res.json({ translatedText: translated });
  } catch (e) {
    console.error('Translate proxy error', e);
    return res.status(500).json({ message: 'Translation service error', error: e.message });
  }
});

module.exports = router;
