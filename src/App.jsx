import React, { useState } from 'react';
import './App.css';
import Navbar from './components/Navbar';
import InputContainer from './components/InputContainer';
import Card from './components/Card';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { marked } from 'marked';
import html2pdf from 'html2pdf'


const App = () => {
  const [text, setText] = useState('');
  const [messages, setMessages] = useState([]);
  const [headings, setHeadings] = useState([]);
  const [apiResponseParts, setApiResponseParts] = useState([null, null, null, null]); // Store response parts
  const [tabNames, setTabNames] = useState(['', '', '', '']); // Store dynamic tab names
  const [activeTab, setActiveTab] = useState(0); // Track active tab
  const [isLoading, setIsLoading] = useState(false); // Track loading state
  const [totalWordCount, setTotalWordCount] = useState(0); // Store total word count

  // Function to get the content for the currently active tab
  const getTabContent = (index) => {
    return apiResponseParts[index] || ''; // Return the content of the selected tab
  };

  // Function to generate content based on user input
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
      const formattedParts = parts.map(part => marked(part)); // Format with marked
      setApiResponseParts(formattedParts); 

      // Calculate total word count
      const totalCount = formattedParts.reduce((acc, part) => acc + part.split(/\s+/).filter(word => word.length > 0).length, 0);
      setTotalWordCount(totalCount); // Update the total word count

      // Set dynamic tab names
      const names = parts.map((part, index) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(marked(part), 'text/html');
        
        if (index === 0) {
          // Get the <h2> content for the first tab name
          const h2Element = doc.querySelector('h2');
          return h2Element ? h2Element.innerText.trim() : 'Part 1'; // Default to 'Part 1' if no <h2> is found
        } else {
          // Find the first <p> that contains <strong> for subsequent tabs
          const strongElement = doc.querySelector('p strong');
          const strongText = strongElement ? strongElement.innerText.trim() : '';
          return strongText || `Part ${index + 1}`; // Default to 'Part X' if no <strong> is found
        }
      });
      setTabNames(names);

      // If total word count exceeds 500, generate additional content for the fifth tab
      if (totalCount > 500) {
        const additionalData = {
          contents: [
            {
              parts: [
                {
                  text: "Generate additional content because word count exceeded 500 words.",
                },
              ],
            },
          ],
        };

        const additionalResponse = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=AIzaSyCaT_uul8cwbfsRF-DZsW6P0YWl_FgXodg",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(additionalData),
          }
        );

        const additionalResult = await additionalResponse.json();
        const additionalApiResponse = additionalResult.candidates[0].content.parts[0].text;

        // Store additional content in fifth tab
        const additionalFormattedContent = marked(additionalApiResponse);
        setApiResponseParts(prevParts => [...prevParts, additionalFormattedContent]); // Add fifth tab content

        // Determine the tab name for the fifth tab
        const additionalDoc = new DOMParser().parseFromString(additionalFormattedContent, 'text/html');
        const additionalStrongElement = additionalDoc.querySelector('p strong');
        const additionalStrongText = additionalStrongElement ? additionalStrongElement.innerText.trim() : '';
        setTabNames(prevNames => [...prevNames, additionalStrongText || 'Part 5']); // Set the name or default to 'Part 5'
      }

      // Clear previous navbar content and extract new headings
      const newHeadings = extractHeadings(apiResponse);
      setHeadings(newHeadings);
      
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false); // Stop loading regardless of success or error
    }
  };

  // Function to extract headings from HTML content
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

  // Function to clear responses and reset state
  const clearResponse = () => {
    setMessages([]);
    setHeadings([]);
    setApiResponseParts([null, null, null, null]); // Reset to initial state
    setTabNames(['', '', '', '']); // Clear tab names
    setTotalWordCount(0); // Reset total word count
  };

  // Function to export content to PDF


  const onExportPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4'); // Create a new jsPDF document
  
    // Set margin and page configurations
    const leftMargin = 10;
    const lineHeight = 10;
    let yPosition = 20; // Start at 20mm from the top
  
    // Add title or custom header if necessary
    doc.setFontSize(14);
    doc.text("Generated API Response", leftMargin, yPosition);
    yPosition += 10;
  
    // Loop through each part of the API response and add to the PDF
    apiResponseParts.forEach((part, index) => {
      if (part) {
        // Add the tab name as a heading
        doc.setFontSize(12);
        doc.text(`${tabNames[index] || `Part ${index + 1}`}`, leftMargin, yPosition);
        yPosition += 10;
  
        // Convert the HTML-formatted content from Marked to plain text
        const parser = new DOMParser();
        const htmlDoc = parser.parseFromString(part, 'text/html');
        const plainText = htmlDoc.body.innerText; // Extract plain text from the HTML
  
        // Split the text into lines that fit into the PDF
        const lines = doc.splitTextToSize(plainText, 180); // Adjust 180 for width of page content
        lines.forEach(line => {
          if (yPosition + lineHeight > 280) {
            // Add a new page if content exceeds page height
            doc.addPage();
            yPosition = 20;
          }
          doc.text(line, leftMargin, yPosition);
          yPosition += lineHeight;
        });
  
        yPosition += 10; // Add some space before the next part
      }
    });
  
    // Save the PDF document
    doc.save('response.pdf');
  };
      
  // Function to export content to Word document
  const onExportWord = () => {
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
          <div style="margin-top: 30px;">
            <h5>Total Word Count: ${totalWordCount}</h5>
          </div>
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
        onExportPDF={onExportPDF} 
        onExportWord={onExportWord} 
        text={text} 
        setText={setText} 
      />
    </div>
  );
};

export default App;
