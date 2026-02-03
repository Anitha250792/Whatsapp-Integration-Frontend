import { useState, useEffect } from "react";
import axios from "axios";
import { FaEye, FaEyeSlash, FaFacebook } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import bgImage from "../assets/bg-file-convert.jpg";
import "./Login.css";
import { API_BASE_URL } from "../config";

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fbReady, setFbReady] = useState(false);

  /* ================= EMAIL LOGIN ================= */
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login/`, {
        email,
        password,
      });
      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);
      navigate("/dashboard");
    } catch {
      alert("Invalid email or password");
    }
  };

  /* ================= GOOGLE LOGIN ================= */
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/accounts/google/`,
        { token: credentialResponse.credential }
      );
      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);
      navigate("/dashboard");
    } catch {
      alert("Google login failed");
    }
  };

  /* ================= FACEBOOK LOGIN ================= */
  const handleFacebookLogin = () => {
    if (!window.FB || !fbReady) {
      alert("Facebook SDK still loading");
      return;
    }

    window.FB.login(
      (response) => {
        if (!response.authResponse) return;
        axios
          .post(`${API_BASE_URL}/accounts/facebook/`, {
            access_token: response.authResponse.accessToken,
          })
          .then((res) => {
            localStorage.setItem("access", res.data.access);
            localStorage.setItem("refresh", res.data.refresh);
            navigate("/dashboard");
          })
          .catch(() => alert("Facebook login failed"));
      },
      { scope: "email,public_profile" }
    );
  };

  /* ================= LOAD FACEBOOK SDK ================= */
  useEffect(() => {
    if (window.FB) {
      setFbReady(true);
      return;
    }

    window.fbAsyncInit = function () {
      window.FB.init({
        appId: "855828883746213",
        cookie: true,
        xfbml: false,
        version: "v19.0",
      });
      setFbReady(true);
    };

    const script = document.createElement("script");
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  /* ================= UI ================= */
  return (
    <div
      className="login-page"
      style={{
        backgroundImage: `linear-gradient(rgba(0,0,0,.45), rgba(0,0,0,.45)), url(${bgImage})`,
      }}
    >
      <div className="login-card">
        <h3 className="login-title">Login</h3>

        <div className="social-grid">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => alert("Google Login Failed")}
            width="100%"
          />

          <button
            className="facebook-btn"
            onClick={handleFacebookLogin}
            disabled={!fbReady}
          >
            <FaFacebook /> Facebook
          </button>
        </div>

        <div className="divider">or</div>

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="password-field">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <button className="login-btn">Login</button>
        </form>

        <p className="register-text" onClick={() => navigate("/register")}>
          Create Account
        </p>
      </div>

      {/* ℹ️ WhatsApp Explanation */}
      <div className="whatsapp-info">
        <h4>ℹ️ WhatsApp Delivery Explained</h4>
        <ul>
          <li>1 WhatsApp conversation = 24-hour window</li>
          <li>Multiple conversions = <b>1 conversation</b></li>
          <li>10 files converted → 1 conversation</li>
          <li>Free tier: <b>1,000 conversations / month</b></li>
        </ul>
      </div>
    </div>
  );
};

export default Login;
