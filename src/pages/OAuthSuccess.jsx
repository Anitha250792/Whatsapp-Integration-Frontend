import { useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE = "https://whatsapp-integration-u7tq.onrender.com";

const OAuthSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const exchangeToken = async () => {
      try {
        const res = await axios.post(
          `${API_BASE}/api/auth/google/`,
          {},
          { withCredentials: true }
        );

        localStorage.setItem("access", res.data.access);
        localStorage.setItem("refresh", res.data.refresh);

        navigate("/dashboard");
      } catch (err) {
        console.error("Google JWT exchange failed", err);
        navigate("/login");
      }
    };

    exchangeToken();
  }, [navigate]);

  return <p>Signing you in with Google…</p>;
};

export default OAuthSuccess;
