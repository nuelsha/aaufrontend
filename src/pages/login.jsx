import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import { login } from "../api.jsx";
import toast from "react-hot-toast";
import { Eye, EyeClosed } from "lucide-react";
import aauLogo from "../assets/aauLogo.png";
import aauimg from "../assets/aauimg.png";
import logo1 from "../assets/logo1.png";
import logo2 from "../assets/logo2.png";
import logo3 from "../assets/logo3.png";
import logo4 from "../assets/logo4.png";
import logo5 from "../assets/logo5.png";
import logo6 from "../assets/logo6.png";
import logo7 from "../assets/logo7.png";
import logo8 from "../assets/logo8.png";
import logo9 from "../assets/logo9.png";

// Validation helpers
const isEmailValid = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isPasswordValid = (password) => password.length >= 8;

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lockoutRemaining, setLockoutRemaining] = useState(null);
  const { login: loginContext } = useContext(UserContext);
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ email: "", password: "" });

  const validateField = (name, value) => {
    let error = "";
    if (!value.trim()) {
      error = `${name.charAt(0).toUpperCase() + name.slice(1)} is required!`;
    } else if (name === "email" && !isEmailValid(value)) {
      error = "Please enter a valid email address";
    } else if (name === "password" && !isPasswordValid(value)) {
      error = "Password must be at least 8 characters long";
    }
    setFieldErrors((prev) => ({ ...prev, [name]: error }));
    return error === "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setLockoutRemaining(null);
    const emailIsValid = validateField("email", email);
    const passwordIsValid = validateField("password", password);
    if (emailIsValid && passwordIsValid) {
      try {
        const response = await login({ email, password });
        const userData = response.data;
        let token = userData?.token;
        if (!token) {
          token =
            response.headers?.authorization?.replace("Bearer ", "") ||
            response.headers?.["x-auth-token"] ||
            response.headers?.["authToken"];
        }
        if (token && userData) {
          loginContext(userData, token);
          toast.success("Logged in successfully!");
          navigate("/partnership");
        } else {
          toast.error(
            "Login failed: No authentication token received. Please contact your administrator."
          );
          console.error(
            "Login response did not include a proper token:",
            userData
          );
        }
      } catch (error) {
        console.error("Login error:", error);
        if (error.response) {
          if (error.response.status === 400) {
            const errorData = error.response.data;
            if (errorData.remainingAttempts !== undefined) {
              toast.error(errorData.error);
              if (errorData.remainingAttempts <= 2) {
                toast.error(
                  `Warning: Only ${errorData.remainingAttempts} attempts remaining before account lockout!`
                );
              }
            } else {
              toast.error("Invalid email or password");
            }
          } else if (error.response.status === 423) {
            const errorData = error.response.data;
            setLockoutRemaining(errorData.lockoutRemaining || 15);
            toast.error(errorData.error);
          } else if (error.response.status === 500) {
            toast.error("Server error. Please try again later.");
          } else {
            toast.error(error.response.data.error || "Login failed");
          }
        } else {
          toast.error("Network error. Please check your connection.");
        }
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="main-container bg-white w-full min-h-screen relative overflow-hidden flex flex-col">
      {/* Top Bar */}
      <div className="w-full bg-[#014166] shadow-md z-10 py-4 px-6 flex flex-col sm:flex-row items-center sm:justify-start gap-4 text-white text-sm font-bold">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-envelope w-4 h-4"></i>
          <span>Email: vpsci@aau.edu.et</span>
        </div>
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-phone w-4 h-4"></i>
          <span>+251-118-278433 or +251-111-239706</span>
        </div>
      </div>
      {/* Main Content */}
      <div className="flex flex-col lg:flex-row flex-1 w-full">
        {/* Image */}
        <div className="relative bg-[#014166] w-full lg:w-1/2 h-[450px] lg:h-auto rounded-br-[300px] overflow-hidden">
          <img
            src={aauimg}
            alt="background"
            className="absolute top-0 left-0 w-full h-full object-cover z-10 opacity-70"
          />
        </div>
        {/* Right Content */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 py-12 text-center relative z-20">
          <img src={aauLogo} alt="logo" className="w-20 mb-4" />
          <h1 className="text-2xl lg:text-3xl font-bold text-black">
            Addis Ababa University
          </h1>
          <p className="text-lg font-medium mt-2">
            PARTNERSHIP MANAGEMENT SYSTEM
          </p>
          <p className="text-[#00578a] mt-4 text-lg">Super Admin Login</p>
          <p className="text-gray-500 mt-2 max-w-md">
            Welcome to the Addis Ababa University Partnership Management System
          </p>
          {/* Input Fields */}
          <form
            onSubmit={handleSubmit}
            className="mt-6 w-full max-w-sm flex flex-col gap-4"
          >
            <div>
              <input
                type="email"
                placeholder="Email"
                className={`border-2 w-full ${
                  fieldErrors.email ? "border-red-500" : "border-[#00588b]"
                } rounded-full px-4 py-3 placeholder:text-sm placeholder:text-gray-500`}
                onChange={(e) => {
                  setEmail(e.target.value);
                  validateField("email", e.target.value);
                }}
                value={email}
                disabled={lockoutRemaining !== null}
              />
              {fieldErrors.email && (
                <p className="text-red-500 text-sm mt-1 ml-4">
                  {fieldErrors.email}
                </p>
              )}
            </div>
            <div className="flex flex-col justify-start relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className={`border-2 w-full ${
                  fieldErrors.password ? "border-red-500" : "border-[#00588b]"
                } rounded-full px-4 py-3 placeholder:text-sm placeholder:text-gray-500`}
                onChange={(e) => {
                  setPassword(e.target.value);
                  validateField("password", e.target.value);
                }}
                value={password}
                disabled={lockoutRemaining !== null}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 cursor-pointer focus:outline-none"
                disabled={lockoutRemaining !== null}
              >
                {showPassword ? (
                  <EyeClosed className="w-5 h-5 text-gray-500" />
                ) : (
                  <Eye className="w-5 h-5 text-gray-500" />
                )}
              </button>
              {fieldErrors.password && (
                <p className="item-start text-red-500 text-sm mt-1 ml-4">
                  {fieldErrors.password}
                </p>
              )}
            </div>
            {lockoutRemaining !== null && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mt-4 text-left">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Account Locked
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>
                        Your account has been temporarily locked due to too many
                        failed login attempts. Please try again in{" "}
                        <strong>{lockoutRemaining} minutes</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <button
              type="submit"
              disabled={
                isLoading ||
                lockoutRemaining !== null ||
                !isEmailValid(email) ||
                !isPasswordValid(password)
              }
              className="flex items-center justify-center bg-[#00588b] text-white px-6 py-3 mt-6 rounded-full gap-2 hover:bg-[#004a75] transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? "Signing in..." : "Login"}
              {!isLoading && (
                <img
                  src="https://codia-f2c.s3.us-west-1.amazonaws.com/image/2025-04-04/YvWR34sXt7.png"
                  alt="arrow"
                  className="w-5 h-5"
                />
              )}
            </button>
          </form>
          <p className="mt-4 text-lg">
            Don't have an account?{" "}
            <Link
              className="text-[#00578a] underline hover:no-underline"
              to="/signup"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
      {/* Footer Logos */}
      <div className="w-full bg-white shadow-md py-6 flex flex-wrap justify-center items-center gap-4 mt-auto px-4">
        <img src={logo1} className="h-16 w-auto" alt="logo1" />
        <img src={logo2} className="h-16 w-auto" alt="logo2" />
        <img src={logo3} className="h-16 w-auto" alt="logo3" />
        <img src={logo4} className="h-16 w-auto" alt="logo4" />
        <img src={logo5} className="h-16 w-auto" alt="logo5" />
        <img src={logo6} className="h-16 w-auto" alt="logo6" />
        <img src={logo7} className="h-16 w-auto" alt="logo7" />
        <img src={logo8} className="h-16 w-auto" alt="logo8" />
        <img src={logo9} className="h-16 w-auto" alt="logo9" />
      </div>
    </div>
  );
};

export default Login;
