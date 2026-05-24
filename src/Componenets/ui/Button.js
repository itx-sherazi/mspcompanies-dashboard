"use client";
import React from "react";

const Button = ({ label, icon, onClick, className, loading, disabled }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-md 
        bg-[#26ABE3] px-4 py-2 text-white 
        hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed
        ${className}`}
    >
      {loading ? (
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
      ) : (
        <>
          {label}
          {icon && <span className="ml-2">{icon}</span>}
        </>
      )}
    </button>
  );
};

export default Button;
