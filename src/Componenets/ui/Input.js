"use client";
import React from "react";

const Input = ({
  label,
  type = "text",
  onChange,
  className = "",
  value,
  placeholder,
  accept,
  name,
  textarea = false,
  selectedItem,
  ...props
}) => {
  return (
    <div>
      {label && (
        <label className="block mb-2 font-medium text-black">{label}</label>
      )}

      {textarea ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          rows={5}
          className={`block w-full border rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-[#26ABE3] sm:text-sm/6 ${className}`}
          placeholder={placeholder}
          {...props}
        />
      ) : (
        <input
          name={name}
          type={type}
          value={value}
          autoComplete="off"
          onChange={onChange}
          accept={accept}
          placeholder={placeholder}
          disabled={!!selectedItem}
          className={`block w-full border rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-[#26ABE3] sm:text-sm/6 ${className}`}
          {...props}
        />
      )}
    </div>
  );
};

export default Input;
