
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
      <button type="button" onClick={onClear} id="clear-response"><i class="fa-solid fa-delete-left"></i></button>
      <button type="button" onClick={onExportPDF}><i class="fa-solid fa-file-pdf"></i></button>
      <button type="button" onClick={onExportWord}><i class="fa-solid fa-file-word"></i></button>
    </div>
  );
};

export default InputContainer;
