import React, { useState } from 'react';
import './App.css';
import Navbar from './components/Navbar';
import InputContainer from './components/InputContainer';
import Card from './components/Card';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { marked } from 'marked';

const App = () => {
  const [text, setText] = useState('');
  const [messages, setMessages] = useState([]);
  const [headings, setHeadings] = useState([]);
  const [apiResponseParts, setApiResponseParts] = useState([null, null, null, null]); // Store response parts
  const [tabNames, setTabNames] = useState(['', '', '', '']); // Store dynamic tab names
  const [activeTab, setActiveTab] = useState(0); // Track active tab
  const [isLoading, setIsLoading] = useState(false); // Track loading state

  const getTabContent = (index) => {
    return apiResponseParts[index] || ''; // Return the content of the selected tab
  };

  const generateInfo = async () => {
    const userMessage = `<div class="message">${text}</div>`;
    setMessages((prev) => [...prev, userMessage]);
    setText('');
    setIsLoading(true); // Start loading

    const data = {
      contents: [
        {
          parts: [
            {
              text: text,
            },
          ],
        },
      ],
    };

    try {
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=AIzaSyCaT_uul8cwbfsRF-DZsW6P0YWl_FgXodg",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      const result = await response.json();
      const apiResponse = result.candidates[0].content.parts[0].text;

      // Divide the response into 4 equal parts without breaking words
      const partLength = Math.ceil(apiResponse.length / 4);
      const parts = [];
      let startIndex = 0;

      for (let i = 0; i < 4; i++) {
        let endIndex = startIndex + partLength;

        // Ensure we don't exceed the string length
        if (endIndex >= apiResponse.length) {
          endIndex = apiResponse.length;
        } else {
          // Adjust endIndex to the last complete word
          while (endIndex > startIndex && apiResponse[endIndex] !== ' ') {
            endIndex--;
          }
        }

        // Push the part and update the start index
        parts.push(apiResponse.slice(startIndex, endIndex).trim());
        startIndex = endIndex + 1; // Move to the next character after the space
      }

      // Store the formatted parts in state
      setApiResponseParts(parts.map(part => marked(part))); // Format with marked

      // Set dynamic tab names based on the first word of each part
      const names = parts.map(part => {
        const firstWord = part.split(' ')[0]; // Get the first word
        return firstWord || 'Part'; // Default to 'Part' if part is empty
      });
      setTabNames(names);

      // Clear previous navbar content
      const newHeadings = extractHeadings(apiResponse);
      setHeadings(newHeadings);
      
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false); // Stop loading regardless of success or error
    }
  };

  const extractHeadings = (html) => {
    const headings = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const headingElements = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');

    headingElements.forEach((heading) => {
      headings.push({
        text: heading.innerText,
        content: heading.nextElementSibling ? heading.nextElementSibling.outerHTML : ''
      });
    });

    return headings;
  };

  const clearResponse = () => {
    setMessages([]);
    setHeadings([]);
    setApiResponseParts([null, null, null, null]);
    setTabNames(['', '', '', '']); // Clear tab names
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    html2canvas(document.getElementById("card")).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      doc.addImage(imgData, 'PNG', 0, 0);
      doc.save('response.pdf');
    });
  };

const exportToWord = () => {
  // Prepare the full content from all tabs in the apiResponseParts
  let content = `
    <html>
      <head>
        <style>
          /* Add some styling to format the Word document */
          body {
            font-family: Arial, sans-serif;
          }
          h5 {
            font-size: 1.2em;
            font-weight: bold;
            margin-top: 20px;
          }
          .message {
            margin: 10px 0;
          }
          .tab-section {
            margin-top: 30px;
          }
        </style>
      </head>
      <body>
        ${messages.map(message => `<div class="message">${message}</div>`).join('')}
        ${apiResponseParts.map((part, index) => `
          <div class="tab-section">
            <h5>${tabNames[index] || `Part ${index + 1}`}</h5>
            <div>${part}</div>
          </div>
        `).join('')}
      </body>
    </html>
  `;

  // Create a Blob with the content and save it as a Word document
  const blob = new Blob(['\ufeff', content], {
    type: 'application/msword'
  });
  saveAs(blob, 'response.doc');
};
  
  return (
    <div>
      <Navbar />
      <div className="tab-container">
        <div className="tab-navigation">
          {tabNames.map((name, index) => (
            <button
              key={index}
              className={`tab-button ${activeTab === index ? 'active' : ''}`}
              onClick={() => setActiveTab(index)}
            >
              {name || `Part ${index + 1}`} {/* Use dynamic name or default */}
            </button>
          ))}
        </div>
        <div className="tab-content">
          {isLoading ? (
            <div className="loader show"></div> // Show loader if loading
          ) : (
            <div dangerouslySetInnerHTML={{ __html: getTabContent(activeTab) }} />
          )}
        </div>
      </div>
      <Card messages={messages} headings={headings} />
      <InputContainer 
        onGenerate={generateInfo} 
        onClear={clearResponse} 
        onExportPDF={exportToPDF} 
        onExportWord={exportToWord} 
        text={text} 
        setText={setText} 
      />
    </div>
  );
};

export default App;
