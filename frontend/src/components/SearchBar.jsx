import { Search, X } from "lucide-react";
import { useState } from "react";

// Child -> parent: the search text is sent up to the parent through onSearch.
export default function SearchBar({ placeholder = "Search...", onSearch }) {
  const [text, setText] = useState("");

  function handleChange(e) {
    setText(e.target.value);
    onSearch(e.target.value.trim());
  }

  function clear() {
    setText("");
    onSearch("");
  }

  return (
    <div className="search">
      <Search size={18} className="search-icon" />
      <input type="text" placeholder={placeholder} value={text} onChange={handleChange} />
      {text && (
        <button type="button" className="search-clear" onClick={clear} aria-label="Clear search">
          <X size={16} />
        </button>
      )}
    </div>
  );
}
