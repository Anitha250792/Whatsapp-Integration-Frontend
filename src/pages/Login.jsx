import { useEffect, useState } from "react";
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

  /* ------------------------------------
     🔐 Email / Password Login
  ------------------------------------ */
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

  /* ------------------------------------
     🔐 Google Login (JWT – unchanged)
  ------------------------------------ */
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await axios.post(
        "https://whatsapp-integration-u7tq.onrender.com/accounts/google/",
        { token: credentialResponse.credential }
      );

      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Google login failed");
    }
  };

  /* ------------------------------------
     🔵 Facebook Login (JWT – NO redirect)
  ------------------------------------ */
  const handleFacebookLogin = () => {
    if (!window.FB) {
      alert("Facebook SDK not loaded");
      return;
    }

    window.FB.login(
      async (response) => {
        if (response.authResponse) {
          try {
            const res = await axios.post(
              "https://whatsapp-integration-u7tq.onrender.com/accounts/facebook/",
              {
                access_token: response.authResponse.accessToken,
              }
            );

            localStorage.setItem("access", res.data.access);
            localStorage.setItem("refresh", res.data.refresh);
            navigate("/dashboard");
          } catch (err) {
            console.error(err);
            alert("Facebook login failed");
          }
        } else {
          alert("Facebook login cancelled");
        }
      },
      { scope: "email,public_profile" }
    );
  };

  /* ------------------------------------
     📦 Load Facebook SDK once
  ------------------------------------ */
  useEffect(() => {
    if (window.FB) return;

    window.fbAsyncInit = function () {
      window.FB.init({
        appId: "855828883746213",
        cookie: true,
        xfbml: false,
        version: "v19.0",
      });
    };

    const script = document.createElement("script");
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <div
      className="login-page"
      style={{
        backgroundImage: `linear-gradient(rgba(0,0,0,.45), rgba(0,0,0,.45)), url(${bgImage})`,
      }}
    >
      <div className="login-card">
        <h3 className="login-title">Login</h3>

        {/* 🔘 SOCIAL LOGIN */}
        <div className="social-grid">
          {/* Google */}
          <div className="google-wrapper">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => alert("Google Login Failed")}
              useOneTap={false}
              theme="outline"
              size="large"
              width="100%"
            />
          </div>

          {/* Facebook */}
          <button
            type="button"
            className="facebook-btn"
            onClick={handleFacebookLogin}
          >
            <FaFacebook /> Facebook
          </button>
        </div>

        <div className="divider">or</div>

        {/* 🔐 EMAIL LOGIN */}
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

          <button type="submit" className="login-btn">
            Login
          </button>
        </form>

        <p
          className="register-text"
          onClick={() => navigate("/register")}
          style={{ cursor: "pointer" }}
        >
          Create Account
        </p>
      </div>
    </div>
  );
};

export default Login;
