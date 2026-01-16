import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import bgImage from "../assets/bg-file-convert.jpg";
import "./Login.css";

const API_BASE = "https://whatsapp-integration-u7tq.onrender.com";

const Register = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password1, setPassword1] = useState("");
  const [password2, setPassword2] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ GOOGLE REGISTER
  const handleGoogleRegister = () => {
    window.location.href = `${API_BASE}/accounts/google/login/`;
  };

  // ✅ LOCAL REGISTER
  const handleRegister = async (e) => {
    e.preventDefault();

    if (password1 !== password2) {
      alert("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${API_BASE}/api/auth/registration/`, {
        email,
        password1,
        password2,
      });

      alert("Registered successfully. Please login.");
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
    } finally {
      setLoading(false);
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
        <h3 className="login-title">Create Account</h3>

        {/* ✅ GOOGLE SIGNUP */}
        <button className="google-btn" onClick={handleGoogleRegister}>
          <FcGoogle size={22} />
          Continue with Google
        </button>

        <div className="divider">or</div>

        {/* ✅ LOCAL SIGNUP */}
        <form onSubmit={handleRegister}>
          <label>Email</label>
          <input
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password</label>
          <div className="password-field">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter password"
              value={password1}
              onChange={(e) => setPassword1(e.target.value)}
              required
            />
            <span onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <label>Confirm Password</label>
          <input
            type="password"
            placeholder="Confirm password"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            required
          />

          <button className="login-btn" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <p className="register-text">
          Already have an account?{" "}
          <span onClick={() => navigate("/login")}>Login</span>
        </p>
      </div>
    </div>
  );
};

export default Register;
