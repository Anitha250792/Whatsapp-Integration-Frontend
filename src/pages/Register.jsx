import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { GoogleLogin } from "@react-oauth/google";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import bgImage from "../assets/bg-file-convert.jpg";
import "./Login.css";
import { API_BASE_URL } from "../config";

const Register = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password1, setPassword1] = useState("");
  const [password2, setPassword2] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  /* ================================
     🔐 GOOGLE SIGN-UP / LOGIN
  ================================= */
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/accounts/google/`,
        { token: credentialResponse.credential }
      );

      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Google sign-up failed");
    }
  };

  /* ================================
     📝 EMAIL REGISTER
  ================================= */
  const handleRegister = async (e) => {
    e.preventDefault();

    if (password1 !== password2) {
      alert("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${API_BASE_URL}/auth/registration/`, {
        email,
        password1,
        password2,
      });

      alert("Registration successful. Please login.");
      navigate("/login");
    } catch (err) {
      const data = err.response?.data;

      if (data?.email) {
        alert("An account already exists with this email");
      } else if (data?.password1) {
        alert(data.password1[0]);
      } else if (data?.non_field_errors) {
        alert(data.non_field_errors[0]);
      } else {
        alert("Registration failed");
      }
    } finally {
      setLoading(false);
    }
  };

  /* ================================
     🎨 UI
  ================================= */
  return (
    <div
      className="login-page"
      style={{
        backgroundImage: `linear-gradient(rgba(0,0,0,.45), rgba(0,0,0,.45)), url(${bgImage})`,
      }}
    >
      <div className="login-card">
        <h3 className="login-title">Create Account</h3>

        {/* 🔘 GOOGLE SIGN-UP */}
        <div className="social-grid">
          <div className="social-item">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => alert("Google Sign-up Failed")}
              useOneTap={false}
              width="100%"
            />
          </div>
        </div>

        <div className="divider">or</div>

        {/* 📝 EMAIL REGISTER */}
        <form onSubmit={handleRegister}>
          <input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className="password-field">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              required
              value={password1}
              onChange={(e) => setPassword1(e.target.value)}
            />
            <span onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <input
            type="password"
            placeholder="Confirm Password"
            required
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
          />

          <button className="login-btn" disabled={loading}>
            {loading ? "Creating..." : "Register"}
          </button>
        </form>

        <p className="register-text" onClick={() => navigate("/login")}>
          Already have an account? Login
        </p>
      </div>
    </div>
  );
};

export default Register;
