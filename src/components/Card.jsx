
import React from 'react';

const Card = ({ messages, headings }) => {
  return (
    <div id="card" className="card">
      {messages.map((message, index) => (
        <div className="message" key={index} dangerouslySetInnerHTML={{ __html: message }} />
      ))}
      <div id="navbar">
        {headings.map((heading, index) => (
          <div key={index}>
            <h5 className="text-body-emphasis h4">{heading.text}</h5>
            <span className="text-body-secondary" dangerouslySetInnerHTML={{ __html: heading.content }} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Card;
