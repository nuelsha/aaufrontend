import React from "react";

const LoadingSpinner = () => {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#014166]"></div>
      <span className="ml-3 text-[#014166] font-medium">Loading...</span>
    </div>
  );
};

export default LoadingSpinner;
