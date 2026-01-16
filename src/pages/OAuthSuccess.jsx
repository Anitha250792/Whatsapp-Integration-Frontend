import { useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

axios.defaults.withCredentials = true;

const OAuthSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const exchangeToken = async () => {
      try {
        const res = await axios.post(
          "https://whatsapp-integration-u7tq.onrender.com/api/auth/google/",
          {}
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
  }, []);

  return <p>Signing you in with Google…</p>;
};

export default OAuthSuccess;
