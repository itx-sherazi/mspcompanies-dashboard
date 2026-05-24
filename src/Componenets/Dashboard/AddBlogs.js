"use client";

import React, { useState, useRef, useEffect } from "react";
import { Editor } from "@tinymce/tinymce-react";
import { AddBlog, updateBlog } from "@/services/api";
import { toast } from "react-hot-toast";
import { handleApiError, showSuccess } from "@/utils/errorHandler";
import Image from "next/image";
import axios from "axios";

const Addblogs = ({ blogData, setEditingBlog, setActiveTab }) => {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [body, setBody] = useState("");

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState("");
  const [category, setCategory] = useState("General");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");

  const [faqs, setFaqs] = useState([]);
  const editorRef = useRef(null);

  // Predefined categories for better UX
  const predefinedCategories = [
    "Technology",
    "Business",
    "Marketing",
    "Sales",
    "Productivity",
    "Industry Trends",
    "Case Studies",
    "Best Practices",
    "General",
  ];

  useEffect(() => {
    if (blogData) {
      setTitle(blogData.title || "");
      setSlug(blogData.slug || "");
      setSlugTouched(true);
      setBody(blogData.body || "");

      setTags(
        Array.isArray(blogData.tags)
          ? blogData.tags.join(", ")
          : blogData.tags || "",
      );
      setCategory(blogData.category || "General");
      setMetaTitle(blogData.metaTitle || "");
      setMetaDescription(blogData.metaDescription || "");

      setFaqs(blogData.faqs || []);

      if (blogData.image) {
        const API_URL =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3008";
        const imgUrl = blogData.image.startsWith("http")
          ? blogData.image
          : `${API_URL}${blogData.image}`;
        setPreview(imgUrl);
      }
    }
  }, [blogData]);

  const slugify = (input) => {
    return (input || "")
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s\W-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  useEffect(() => {
    // Auto-generate slug for NEW posts until user edits it
    if (!blogData && !slugTouched) {
      setSlug(slugify(title));
    }
  }, [title, blogData, slugTouched]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  // Custom Image Upload Handler for TinyMCE
  const handleEditorImageUpload = (blobInfo, progress) => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append("image", blobInfo.blob(), blobInfo.filename());

      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3008";

      axios
        .post(`${API_URL}/api/v1/upload-image`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          withCredentials: true,
          onUploadProgress: (e) => {
            progress((e.loaded / e.total) * 100);
          },
        })
        .then((response) => {
          if (response.data && response.data.url) {
            // Ensure the URL is absolute if it's relative
            let url = response.data.url;
            if (url.startsWith("/")) {
              url = `${API_URL}${url}`;
            }
            resolve(url);
          } else {
            reject("Invalid response from server");
          }
        })
        .catch((error) => {
          console.error("Image upload failed:", error);
          reject(
            "Image upload failed: " +
              (error.response?.data?.message || error.message),
          );
        });
    });
  };

  const handleSubmit = async () => {
    if (!title || !body) {
      toast.error("Please fill in all required fields (Title, Content).");
      return;
    }

    const normalizedSlug = slugify(slug);
    if (slug && !normalizedSlug) {
      toast.error("Slug is invalid. Please enter a valid URL slug.");
      return;
    }

    if (!blogData && !image) {
      toast.error("Please upload a cover image.");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    if (normalizedSlug) {
      formData.append("slug", normalizedSlug);
    }
    formData.append("body", body);
    if (image) {
      formData.append("image", image);
    }

    formData.append("tags", tags);
    formData.append("category", category);
    formData.append("metaTitle", metaTitle);
    formData.append("metaDescription", metaDescription);

    formData.append("faqs", JSON.stringify(faqs));

    setLoading(true);

    try {
      if (blogData) {
        await updateBlog(blogData._id, formData);
        showSuccess("Blog post updated successfully!");
        if (setEditingBlog) setEditingBlog(null);
        if (setActiveTab) setActiveTab("blog");
      } else {
        await AddBlog(formData);
        showSuccess("Blog post created successfully!");
        // Reset form
        setTitle("");
        setSlug("");
        setSlugTouched(false);
        setBody("");

        setImage(null);
        setPreview(null);
        setTags("");
        setCategory("General");
        setMetaTitle("");
        setMetaDescription("");

        setFaqs([]);
        if (editorRef.current) {
          editorRef.current.setContent("");
        }
      }
    } catch (error) {
      console.error("Submit error:", error);
      handleApiError(
        error,
        blogData ? "Updating Blog Post" : "Creating Blog Post",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (setEditingBlog) setEditingBlog(null);
    if (setActiveTab) setActiveTab("blog");
  };

  return (
    <div className="w-full min-h-screen mx-auto bg-white shadow-md rounded-lg p-6">
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <h1 className="text-4xl font-bold text-gray-800">
          {blogData ? "✍️ Edit Blog" : "✍️ Write New Blog"}
        </h1>
        <div className="flex gap-2">
          {blogData && (
            <button
              onClick={handleCancel}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg text-lg font-semibold transition-all duration-200 shadow-lg"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`${
              loading
                ? "bg-[#1d4882] cursor-not-allowed opacity-70"
                : "bg-[#1d4882]  cursor-pointer"
            } text-white px-6 py-3 rounded-lg text-lg font-semibold flex items-center gap-2 justify-center transition-all duration-200 shadow-lg`}
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 11-8 8h4l-3 3-3-3h4z"
                  ></path>
                </svg>
                {blogData ? "Updating..." : "Publishing..."}
              </>
            ) : (
              <>{blogData ? "📝 Update Blog" : "📝 Publish Blog"}</>
            )}
          </button>
        </div>
      </div>

      {/* Form Content */}
      <div className="space-y-6">
        {/* Title */}
        <div>
          <label className="block mb-3 font-semibold text-gray-700 text-lg">
            Blog Title *
          </label>
          <input
            type="text"
            placeholder="Enter an engaging title for your blog..."
            className="w-full p-4 border-2 border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-[#1e477f] focus:border-[#1e477f] transition-all duration-200"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        {/* Slug (Custom URL) */}
        <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <label className="block font-bold text-gray-800 text-lg">
                Custom URL Slug
              </label>
              <p className="text-sm text-gray-500">
                This will be the web address of your blog post.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const newSlug = slugify(title);
                setSlug(newSlug);
                setSlugTouched(true);
                toast.success("Slug generated based on title!");
              }}
              className="text-white bg-[#1d4882] hover:bg-[#15325b] px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm flex items-center gap-2"
              disabled={!title}
              title={title ? "Generate slug from title" : "Add a title first"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Auto-generate
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="text-gray-400 font-medium">/blog/</span>
            </div>
            <input
              type="text"
              placeholder="e.g. my-awesome-post-2026"
              className="w-full pl-16 p-4 border-2 border-gray-300 rounded-lg text-lg font-medium text-[#1d4882] focus:outline-none focus:ring-2 focus:ring-[#1e477f] focus:border-[#1e477f] transition-all bg-white"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTouched(true);
              }}
              onBlur={() => {
                if (slug) setSlug(slugify(slug));
              }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Full URL: <span className="font-semibold text-[#1d4882]">https://chaneldatabase.com/blog/{slugify(slug || title) || "..."}</span>
            </p>
            {slugTouched && (
              <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full border border-orange-100 flex items-center gap-1">
                <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></span>
                Custom Slug Active
              </span>
            )}
          </div>
        </div>

        {/* Meta Title */}
        <div>
          <label className="block mb-3 font-semibold text-gray-700 text-lg">
            Meta Title
          </label>
          <input
            type="text"
            placeholder="SEO meta title (60 characters max)..."
            className="w-full p-4 border-2 border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-[#1e477f] focus:border-[#1e477f] transition-all duration-200"
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
          />
        </div>

        {/* Meta Description */}
        <div>
          <label className="block mb-3 font-semibold text-gray-700 text-lg">
            Meta Description
          </label>
          <textarea
            placeholder="SEO meta description (160 characters max)..."
            className="w-full p-4 border-2 border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-[#1e477f] focus:border-[#1e477f] transition-all duration-200 resize-vertical"
            rows={3}
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block mb-3 font-semibold text-gray-700 text-lg">
            Tags
          </label>
          <input
            type="text"
            placeholder="Enter tags separated by commas..."
            className="w-full p-4 border-2 border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-[#1e477f] focus:border-[#1e477f] transition-all duration-200"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
          <p className="text-sm text-gray-500 mt-1">
            Example: technology, marketing, sales
          </p>
        </div>

        {/* Category */}
        <div>
          <label className="block mb-3 font-semibold text-gray-700 text-lg">
            Category
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {predefinedCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-3 py-1 rounded-full text-sm ${
                  category === cat
                    ? "bg-[#1d4882] text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Or enter a custom category"
            className="w-full p-4 border-2 border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-[#1e477f] focus:border-[#1e477f] transition-all duration-200"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </div>

        {/* FAQ Section */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="font-semibold text-gray-700 text-lg">
              Frequently Asked Questions
            </label>
            <button
              type="button"
              onClick={() => setFaqs([...faqs, { question: "", answer: "" }])}
              className="text-[#1d4882] hover:text-[#15325b] font-medium flex items-center gap-1"
            >
              + Add FAQ
            </button>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-gray-50 p-4 rounded-lg border border-gray-200 relative group"
              >
                <button
                  type="button"
                  onClick={() => {
                    const newFaqs = faqs.filter((_, i) => i !== index);
                    setFaqs(newFaqs);
                  }}
                  className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors"
                  title="Remove FAQ"
                >
                  ✕
                </button>

                <div className="mb-3">
                  <input
                    type="text"
                    placeholder="Question"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e477f] focus:border-[#1e477f]"
                    value={faq.question}
                    onChange={(e) => {
                      const newFaqs = [...faqs];
                      newFaqs[index].question = e.target.value;
                      setFaqs(newFaqs);
                    }}
                  />
                </div>
                <div>
                  <textarea
                    placeholder="Answer"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e477f] focus:border-[#1e477f] resize-vertical"
                    rows={2}
                    value={faq.answer}
                    onChange={(e) => {
                      const newFaqs = [...faqs];
                      newFaqs[index].answer = e.target.value;
                      setFaqs(newFaqs);
                    }}
                  />
                </div>
              </div>
            ))}
            {faqs.length === 0 && (
              <p className="text-gray-500 text-sm italic">No FAQs added yet.</p>
            )}
          </div>
        </div>

        {/* Image Upload */}
        <div>
          <label className="block mb-3 font-semibold text-gray-700 text-lg">
            Cover Image {blogData ? "(Leave empty to keep existing)" : "*"}
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full p-3 border-2 border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#1d4882] file:text-white file:cursor-pointer hover:file:bg-[#17807d] transition-all duration-200"
            required={!blogData}
          />
          {preview && (
            <div className="mt-4">
              <Image
                src={preview}
                alt="Cover image preview"
                width={400}
                height={250}
                className="rounded-lg max-h-64 w-full object-cover border-2 border-gray-200 shadow-md"
                unoptimized
              />
            </div>
          )}
        </div>

        {/* Blog Content - TinyMCE */}
        <div>
          <label className="block mb-3 font-semibold text-gray-700 text-lg">
            Blog Content *
          </label>
          <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
            <Editor
              tinymceScriptSrc="https://cdnjs.cloudflare.com/ajax/libs/tinymce/6.8.3/tinymce.min.js"
              onInit={(evt, editor) => (editorRef.current = editor)}
              value={body}
              onEditorChange={(newValue) => setBody(newValue)}
              init={{
                height: 600,
                menubar: true,
                plugins: [
                  "advlist",
                  "autolink",
                  "lists",
                  "link",
                  "image",
                  "charmap",
                  "preview",
                  "anchor",
                  "searchreplace",
                  "visualblocks",
                  "code",
                  "fullscreen",
                  "insertdatetime",
                  "media",
                  "table",
                  "code",
                  "help",
                  "wordcount",
                  "codesample",
                ],
                toolbar:
                  "undo redo | blocks | " +
                  "bold italic forecolor | alignleft aligncenter " +
                  "alignright alignjustify | bullist numlist outdent indent | " +
                  "image media link table | code codesample | " +
                  "removeformat | help | fullscreen preview",
                content_style:
                  "body { font-family:Helvetica,Arial,sans-serif; font-size:16px; line-height: 1.6; }",
                images_upload_handler: handleEditorImageUpload,
                paste_data_images: true, // Allow pasting images
                extended_valid_elements:
                  "table[style|class|width|height|border],tr[style|class],td[style|class|width|height|colspan|rowspan],th[style|class|width|height|colspan|rowspan],img[style|class|src|alt|width|height]",
                branding: false,
                promotion: false,
                block_formats:
                  "Paragraph=p; Header 1=h1; Header 2=h2; Header 3=h3; Header 4=h4; Header 5=h5; Header 6=h6; Blockquote=blockquote; Preformatted=pre",
              }}
            />
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-8 pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-500 flex items-center gap-1">
          <span className="text-red-500">*</span>
          indicates required fields
        </p>
      </div>
    </div>
  );
};

export default Addblogs;
