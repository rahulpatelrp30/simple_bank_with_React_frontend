import { useEffect } from "react";

// Sets the text shown in the browser tab
export default function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | Simple Bank` : "Simple Bank";
  }, [title]);
}
