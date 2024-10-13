import React from 'react';

const InputContainer = ({ onGenerate, onClear, onExportPDF, onExportWord, text, setText, isLoading }) => {
  return (
    <div className="input-container">
      <input
        type="text"
        id="text"
        placeholder="Enter your thoughts..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={isLoading} // Disable input when loading
      />
      <button type="button" onClick={onGenerate} disabled={isLoading}>
        {isLoading ? (
          <i className="fa-solid fa-spinner fa-spin"></i> // Show a spinner while loading
        ) : (
          <i className="fa-solid fa-arrow-up"></i>
        )}
      </button>
      <button type="button" onClick={onClear} id="clear-response" disabled={isLoading}>
        <i className="fa-solid fa-delete-left"></i>
      </button>
      <button type="button" onClick={onExportPDF} disabled={isLoading}>
        <i className="fa-solid fa-file-pdf"></i>
      </button>
      <button type="button" onClick={onExportWord} disabled={isLoading}>
        <i className="fa-solid fa-file-word"></i>
      </button>
    </div>
  );
};

export default InputContainer;
