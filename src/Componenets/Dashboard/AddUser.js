"use client";
import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, User, CheckCircle, XCircle, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { signinUser } from "@/services/api";
import { toast } from "react-hot-toast";
import { handleApiError, showSuccess } from "@/utils/errorHandler";

const UserAddPage = () => {
  const [signUpData, setSignUpData] = useState({
    name: "",
    email: "",
    password: "",
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const router = useRouter();

  const handleSignUpChange = (e) => {
    const { name, value } = e.target;
    setSignUpData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateSignupForm = () => {
    const newErrors = {};
    if (!signUpData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (signUpData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }
    
    if (!signUpData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(signUpData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    if (!signUpData.password) {
      newErrors.password = "Password is required";
    } else if (signUpData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSigninSubmit = async (e) => {
    e.preventDefault();
    if (!validateSignupForm()) return;

    setIsLoading(true);

    try {
      const data = await signinUser(signUpData);

      if (data.ok) {
        showSuccess("User added successfully! 🎉");
        setSignUpData({ name: "", email: "", password: "" });
        setErrors({});
      } else {
        handleApiError(new Error(data.message || "Failed to add user. Please try again."), 'Adding User');
        setErrors({ general: data.message || "User addition failed" });
      }
    } catch (error) {
      handleApiError(error, 'Adding User');
      setErrors({ general: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className=" w-full items-center justify-center p-4">
      <div className="relative w-full max-w-l">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-100/50 overflow-hidden">
          
          {/* Header Section */}
          <div className="text-center pt-10 pb-6 px-8">
         
            <h1 className="text-3xl font-bold bg-black bg-clip-text text-transparent mb-2">
              Add New User
            </h1>
            <p className="text-gray-600 text-base">Create a new user account for your dashboard</p>
          </div>

          <div className="px-8 pb-10">
            {/* General Error Message */}
            {errors.general && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-lg">
                <div className="flex items-center">
                  <XCircle className="w-5 h-5 text-red-400 mr-3" />
                  <p className="text-sm text-red-700 font-medium">{errors.general}</p>
                </div>
              </div>
            )}

            {/* Form */}
            <div className="space-y-6">
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-bold text-gray-800 mb-3">
                  Full Name
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className={`h-5 w-5 transition-colors ${errors.name ? 'text-red-400' : 'text-gray-400 group-focus-within:text-blue-500'}`} />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={signUpData.name}
                    onChange={handleSignUpChange}
                    className={`w-full pl-12 pr-4 py-4 border-2 rounded-2xl bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 ${
                      errors.name ? "border-red-400 bg-red-50/50" : "border-gray-200 hover:border-gray-300 focus:bg-blue-50/30"
                    }`}
                    placeholder="Enter full name"
                  />
                </div>
                {errors.name && (
                  <p className="mt-2 text-sm text-red-600 flex items-center font-medium">
                    <span className="w-1.5 h-1.5 bg-red-600 rounded-full mr-2"></span>
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-bold text-gray-800 mb-3">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className={`h-5 w-5 transition-colors ${errors.email ? 'text-red-400' : 'text-gray-400 group-focus-within:text-blue-500'}`} />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={signUpData.email}
                    onChange={handleSignUpChange}
                    className={`w-full pl-12 pr-4 py-4 border-2 rounded-2xl bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 ${
                      errors.email ? "border-red-400 bg-red-50/50" : "border-gray-200 hover:border-gray-300 focus:bg-blue-50/30"
                    }`}
                    placeholder="Enter email address"
                  />
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600 flex items-center font-medium">
                    <span className="w-1.5 h-1.5 bg-red-600 rounded-full mr-2"></span>
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-bold text-gray-800 mb-3">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className={`h-5 w-5 transition-colors ${errors.password ? 'text-red-400' : 'text-gray-400 group-focus-within:text-blue-500'}`} />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={signUpData.password}
                    onChange={handleSignUpChange}
                    className={`w-full pl-12 pr-12 py-4 border-2 rounded-2xl bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 ${
                      errors.password ? "border-red-400 bg-red-50/50" : "border-gray-200 hover:border-gray-300 focus:bg-blue-50/30"
                    }`}
                    placeholder="Create a strong password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className={`h-5 w-5 ${errors.password ? 'text-red-400' : 'text-gray-400'}`} />
                    ) : (
                      <Eye className={`h-5 w-5 ${errors.password ? 'text-red-400' : 'text-gray-400'}`} />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600 flex items-center font-medium">
                    <span className="w-1.5 h-1.5 bg-red-600 rounded-full mr-2"></span>
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSigninSubmit}
                disabled={isLoading}
                className={`w-full py-4 px-6 rounded-2xl font-bold text-white transition-all duration-300 flex items-center justify-center ${
                  isLoading
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-500 hover:bg-blue-600 hover:shadow-lg transform hover:-translate-y-0.5"
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Account...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5 mr-2" />
                    Add User
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserAddPage;