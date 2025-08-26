import { useNavigate } from "react-router-dom";
import React from "react";

const Index = () => {
  const navigate = useNavigate();
  
  // Redirect to home on initial load
  React.useEffect(() => {
    navigate("/home", { replace: true });
  }, [navigate]);

  return null;
};

export default Index;
