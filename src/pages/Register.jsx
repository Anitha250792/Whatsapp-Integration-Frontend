import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { GoogleLogin } from "@react-oauth/google";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import bgImage from "../assets/bg-file-convert.jpg";
import "./Login.css";

const Register = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password1, setPassword1] = useState("");
  const [password2, setPassword2] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  /* 🔐 Google Register / Login */
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await axios.post(
        "https://whatsapp-integration-u7tq.onrender.com/accounts/google/login/",
        {
          token: credentialResponse.credential,
        }
      );

      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);

      navigate("/dashboard");
    } catch (err) {
      console.error("Google login failed", err);
      alert("Google login failed");
    }
  };

  /* 📝 Email Register */
  const handleRegister = async (e) => {
    e.preventDefault();

    if (password1 !== password2) {
      alert("Passwords do not match");
      return;
    }

    try {
      await axios.post(
        "https://whatsapp-integration-u7tq.onrender.com/auth/registration/",
        {
          email,
          password1,
          password2,
        }
      );

      alert("Registration successful");
      navigate("/login");
    } catch (err) {
      const data = err.response?.data;

      if (data?.email) {
        alert("Account already exists with this email");
      } else if (data?.password1) {
        alert(data.password1[0]);
      } else {
        alert("Registration failed");
      }
    }
  };

  return (
    <div
      className="login-page"
      style={{
        backgroundImage: `linear-gradient(rgba(0,0,0,.45), rgba(0,0,0,.45)), url(${bgImage})`,
      }}
    >
      <div className="login-card">
        <h3>Create Account</h3>

        {/* ✅ GOOGLE LOGIN */}
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => alert("Google Login Failed")}
          useOneTap={false}
        />

        <div className="divider">or</div>

        {/* EMAIL REGISTER */}
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

          <button className="login-btn">Register</button>
        </form>

        <p onClick={() => navigate("/login")}>
          Already have an account? Login
        </p>
      </div>
    </div>
  );
};

export default Register;
