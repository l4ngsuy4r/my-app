import React from "react";
import "./Editor.css";

const Editor = ({ file, onFileUpdate }) => {
  return file ? (
    <div className="container">
      <input
        placeholder="Title"
        type="text"
        value={file.title}
        onChange={event => onFileUpdate({ ...file, title: event.target.value })}
      />
      <textarea
        placeholder="Whats on your mind?"
        value={file.body}
        onChange={event => onFileUpdate({ ...file, body: event.target.value })}
      />
    </div>
  ) : (
    <div>Select a file</div>
  );
};

export default Editor;
