import React from "react";

const Loading = ({ isLoading, children }) => {
  return isLoading ? <div>Loading... Please Wait</div> : children;
};

export default Loading;
