"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/Componenets/Dashboard/Sidebar";
import Header from "@/Componenets/Dashboard/Header";
import AllBlogs from "@/Componenets/Dashboard/AllBlogs";
import AddBlogs from "@/Componenets/Dashboard/AddBlogs";
import DataRequest from "@/Componenets/Dashboard/DataRequest";
import AddUser from "@/Componenets/Dashboard/AddUser";
import AllUsers from "@/Componenets/Dashboard/Users";
import CityHubManagement from "@/Componenets/Dashboard/CityHub";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("blog");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingBlog, setEditingBlog] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      router.replace("/");
    } else {
      setAuthChecked(true);
    }
  }, []);

  const handleEditBlog = (blog) => {
    setEditingBlog(blog);
    setActiveTab("Addblog");
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case "blog":
        return <AllBlogs onEdit={handleEditBlog} />;
      case "Addblog":
        return (
          <AddBlogs
            blogData={editingBlog}
            setEditingBlog={setEditingBlog}
            setActiveTab={setActiveTab}
          />
        );
      case "DataRequest":
        return <DataRequest />;
      case "AddUser":
        return <AddUser />;
        
        
      case "Users":
        return <AllUsers />;
     
        case "CityHub":
        return <CityHubManagement />;
     
      default:
        return <AllBlogs onEdit={handleEditBlog} />;
    }
  };

  if (!authChecked) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header toggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-y-auto p-4 bg-gray-100">
          {renderActiveTab()}
        </main>
      </div>
    </div>
  );
}
