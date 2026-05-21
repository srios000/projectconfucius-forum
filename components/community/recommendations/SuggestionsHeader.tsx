import React from "react";

const SuggestionsHeader: React.FC = () => {
  return (
    <div
      className="flex items-end text-white p-2.5 h-[70px] rounded-t-lg font-bold bg-cover bg-center"
      style={{
        backgroundImage:
          "linear-gradient(to bottom, rgba(28, 104, 94, 0), rgba(28, 104, 94, 0.85)), url('/images/banners/large.png')",
      }}
    >
      Top Communities
    </div>
  );
};

/**
 * Banner header for the recommendations card.
 * @returns Gradient overlay with title text.
 */
export default SuggestionsHeader;
