import { useState } from "react";
import axios from "axios";
import { FcGoogle } from "react-icons/fc";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import bgImage from "../assets/bg-file-convert.jpg";
import "./Login.css";
import { API_BASE_URL } from "../config";

const Register = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password1, setPassword1] = useState("");
  const [password2, setPassword2] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();

    if (password1 !== password2) {
      alert("Passwords do not match");
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/api/auth/login/`,
        {
          email,
          password1,
          password2,
        }
      );

      alert("Registered successfully");
      navigate("/login");
    } catch (err) {
      const data = err.response?.data;

      if (data?.email) {
        alert("Account already exists");
      } else if (data?.password1) {
        alert(data.password1[0]);
      } else {
        alert("Registration failed");
      }
    }
  };

  const handleGoogleLogin = () => {
  window.location.href =
    "https://whatsapp-integration-u7tq.onrender.com/accounts/google/login/";
};


  return (
    <div
      className="login-page"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="login-card">
        <h3>Create Account</h3>

        <button className="google-btn" onClick={handleGoogleRegister}>
          <FcGoogle size={22} /> Continue with Google
        </button>

        <div className="divider">or</div>

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
              value={password1}
              onChange={(e) => setPassword1(e.target.value)}
              required
            />
            <span onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <input
            type="password"
            placeholder="Confirm Password"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            required
          />

          <button className="login-btn">Register</button>
        </form>

        <p onClick={() => navigate("/login")}>
          Already have an account?
        </p>
      </div>
    </div>
  );
};

export default Register;
