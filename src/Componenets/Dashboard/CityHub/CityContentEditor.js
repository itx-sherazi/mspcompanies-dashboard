"use client";

import React, { useState, useRef, useEffect } from "react";
import { Editor } from "@tinymce/tinymce-react";
import { toast } from "react-toastify";
import { updateCityAdmin } from "@/services/api";
import axios from "axios";

const CityContentEditor = ({ cityData, onBack, refreshData }) => {
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const editorRef = useRef(null);
  const [lastSavedContent, setLastSavedContent] = useState("");

  useEffect(() => {
    if (cityData) {
      const content = cityData.content || "";
      setBody(content);
      setLastSavedContent(content);
    }
  }, [cityData]);

  const handleEditorImageUpload = (blobInfo, progress) => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append("image", blobInfo.blob(), blobInfo.filename());

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3008";

      axios
        .post(`${API_URL}/api/v1/upload-image`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
          onUploadProgress: (e) => {
            progress((e.loaded / e.total) * 100);
          },
        })
        .then((response) => {
          if (response.data && response.data.url) {
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

  const extractImageUrls = (htmlContent) => {
    if (!htmlContent) return [];
    const regex = /<img[^>]+src="([^">]+)"/g;
    const urls = [];
    let match;
    while ((match = regex.exec(htmlContent)) !== null) {
      urls.push(match[1]);
    }
    return urls;
  };

  const deleteRemovedImages = async (oldContent, newContent) => {
    const oldImages = extractImageUrls(oldContent);
    const newImages = extractImageUrls(newContent);
    const removedImages = oldImages.filter((url) => !newImages.includes(url));

    if (removedImages.length > 0) {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3008";
      await Promise.all(
        removedImages.map(async (url) => {
          if (url.includes("/uploads/post/")) {
            try {
              await axios.post(
                `${API_URL}/api/v1/delete-image`,
                { url },
                { withCredentials: true },
              );
            } catch (error) {
              console.error(`Failed to delete image: ${url}`, error);
            }
          }
        }),
      );
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await deleteRemovedImages(lastSavedContent, body);
      const res = await updateCityAdmin(cityData._id, { content: body });
      if (!res?.data?.ok) {
        toast.error(res?.data?.message || "Failed to save city content");
        return;
      }
      toast.success("City page content saved.");
      setLastSavedContent(body);
      if (refreshData) refreshData();
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Failed to save city content");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen mx-auto bg-white shadow-md rounded-lg p-6">
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="text-gray-600 hover:text-gray-900 font-semibold"
          >
            ← Back
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Page content: {cityData?.name}
          </h1>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className={`${
            loading
              ? "bg-[#1d4882] cursor-not-allowed opacity-70"
              : "bg-[#1d4882] cursor-pointer"
          } text-white px-6 py-3 rounded-lg text-lg font-semibold flex items-center gap-2 justify-center transition-all duration-200 shadow-lg`}
        >
          {loading ? "Saving…" : "Save content"}
        </button>
      </div>

      <p className="text-sm text-gray-600 mb-4 max-w-3xl">
        Paste rich content for the section below the provider list. Use{" "}
        <strong>Heading 2</strong> and <strong>Heading 3</strong> for sections
        the public page builds a table of contents from them (same as service
        pages). FAQs are edited in the city <strong>Edit</strong> dialog.
      </p>

      <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
        <Editor
          tinymceScriptSrc="https://cdnjs.cloudflare.com/ajax/libs/tinymce/6.8.3/tinymce.min.js"
          onInit={(evt, editor) => {
            editorRef.current = editor;
          }}
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
            paste_data_images: true,
            extended_valid_elements:
              "table[style|class|width|height|border],tr[style|class],td[style|class|width|height|colspan|rowspan],th[style|class|width|height|colspan|rowspan],img[style|class|src|alt|width|height],details[open|class],summary[class]",
            branding: false,
            promotion: false,
            block_formats:
              "Paragraph=p; Header 1=h1; Header 2=h2; Header 3=h3; Header 4=h4; Header 5=h5; Header 6=h6; Blockquote=blockquote; Preformatted=pre",
          }}
        />
      </div>
    </div>
  );
};

export default CityContentEditor;
