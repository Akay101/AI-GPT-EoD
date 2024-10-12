
import React from 'react';

const InputContainer = ({ onGenerate, onClear, onExportPDF, onExportWord, text, setText }) => {
  return (
    <div className="input-container">
      <input
        type="text"
        id="text"
        placeholder="Enter your thoughts..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button type="button" onClick={onGenerate}>
        <i className="fa-solid fa-arrow-up"></i>
      </button>
      <button type="button" onClick={onClear} id="clear-response">Clear</button>
      <button type="button" onClick={onExportPDF}>Export to PDF</button>
      <button type="button" onClick={onExportWord}>Export to Word</button>
    </div>
  );
};

export default InputContainer;
