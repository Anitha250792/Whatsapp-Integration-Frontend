import { useState, useEffect } from "react";
import axios from "axios";
import { FaEye, FaEyeSlash, FaFacebook, FaInstagram } from "react-icons/fa";
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

  /* 🔐 Email login */
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

  /* 🔐 Google login */
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await axios.post(
        "https://whatsapp-integration-u7tq.onrender.com/accounts/google/",
        { token: credentialResponse.credential }
      );

      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);
      navigate("/dashboard");
    } catch {
      alert("Google login failed");
    }
  };

  /* ------------------------------------
     🔵 Facebook Login (JWT – NO redirect)
  ------------------------------------ */
  const handleFacebookResponse = (response) => {
    if (!response.authResponse) {
      alert("Facebook login cancelled");
      return;
    }

    const accessToken = response.authResponse.accessToken;
    loginWithFacebookToken(accessToken);
  };

  const loginWithFacebookToken = async (accessToken) => {
    try {
      const res = await axios.post(
        "https://whatsapp-integration-u7tq.onrender.com/accounts/facebook/",
        { access_token: accessToken }
      );

      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Facebook login failed");
    }
  };

  const handleFacebookLogin = () => {
    console.log("Facebook login clicked");

    if (!window.FB) {
      alert("Facebook SDK still loading, please try again");
      return;
    }

    window.FB.login(handleFacebookResponse, {
      scope: "email,public_profile", // ✅ SAFE
    });
  };

  /* ------------------------------------
     🟣 Instagram Login (via Facebook)
   
  ------------------------------------ */
 const handleInstagramLogin = () => {
  window.FB.login(handleFacebookResponse, {
    scope: "email,public_profile,instagram_basic",
  });
};



  /* Load Facebook SDK safely */
  useEffect(() => {
    if (window.FB) return;

    window.fbAsyncInit = function () {
      window.FB.init({
        appId: "855828883746213",
        cookie: true,
        xfbml: false,
        version: "v19.0",
      });
      console.log("Facebook SDK initialized");
    };

    const script = document.createElement("script");
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log("Facebook SDK loaded");
    };
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
          <div className="social-item">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => alert("Google Login Failed")}
              useOneTap={false}
              size="large"
              width="100%"
            />
          </div>

          {/* Facebook */}
          <button
            type="button"
            className="facebook-btn social-item"
            onClick={handleFacebookLogin}
          >
            <FaFacebook /> Facebook
          </button>

          {/* Instagram (visible but disabled until approval) */}
          <button
  type="button"
  className="instagram-btn social-item"
  onClick={handleInstagramLogin}
>
  <FaInstagram /> Instagram
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

          <button className="login-btn">Login</button>
        </form>

        <p className="register-text" onClick={() => navigate("/register")}>
          Create Account
        </p>
      </div>
    </div>
  );
};

export default Login;
