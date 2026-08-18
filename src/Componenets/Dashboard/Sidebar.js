import { Menu, X } from "lucide-react";
import {
  FaRegNewspaper,
  FaPenFancy,
  FaFileSignature,
  FaUsers,
  FaUserPlus,
  FaMapMarkedAlt,
  FaGlobeAmericas,
  FaGlobe,
  FaListAlt,
  FaBuilding,
  FaShieldAlt,
  FaLayerGroup,
} from "react-icons/fa";

// Tabs visible to the "seo" role  everything else is admin-only.
const SEO_ALLOWED_TABS = new Set([
  "blog",
  "Addblog",
  "CityHub",
  "CountryHub",
  "MsspCountryHub",
  "ManagedIT",
  "CyberSecurity",
  "VendorDirectory",
]);

export default function Sidebar({
  activeTab,
  setActiveTab,
  sidebarOpen,
  toggleSidebar,
  role,
}) {
  const isSeo = role === "seo";
  const show = (tab) => !isSeo || SEO_ALLOWED_TABS.has(tab);

  return (
    <div
      className={`${
        sidebarOpen ? "w-64" : "w-20"
      } transition-all duration-300 bg-white text-white  shadow-xl rounded-r-lg flex flex-col min-h-screen overflow-y-auto`}
    >
      {/* Header */}
      <div className="flex justify-between p-4 pl-10">
        <button onClick={toggleSidebar} className="text-black cursor-pointer">
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-col mt-6 space-y-2 px-2">
        
        {show("blog") && (
          <SidebarButton
            icon={<FaRegNewspaper size={20} />}
            label="All Blogs"
            isActive={activeTab === "blog"}
            onClick={() => setActiveTab("blog")}
            sidebarOpen={sidebarOpen}
          />
        )}

        {show("Addblog") && (
          <SidebarButton
            icon={<FaPenFancy size={20} />}
            label="Add Blogs"
            isActive={activeTab === "Addblog"}
            onClick={() => setActiveTab("Addblog")}
            sidebarOpen={sidebarOpen}
          />
        )}

        {show("DataRequest") && (
          <SidebarButton
            icon={<FaFileSignature size={20} />}
            label="Data Request"
            isActive={activeTab === "DataRequest"}
            onClick={() => setActiveTab("DataRequest")}
            sidebarOpen={sidebarOpen}
          />
        )}

        {show("AddUser") && (
          <SidebarButton
            icon={<FaUserPlus size={20} />}
            label="Add User"
            isActive={activeTab === "AddUser"}
            onClick={() => setActiveTab("AddUser")}
            sidebarOpen={sidebarOpen}
          />
        )}

        {show("Users") && (
          <SidebarButton
            icon={<FaUsers size={20} />}
            label="All Users"
            isActive={activeTab === "Users"}
            onClick={() => setActiveTab("Users")}
            sidebarOpen={sidebarOpen}
          />
        )}

        {show("CityHub") && (
          <SidebarButton
            icon={<FaMapMarkedAlt size={20} />}
            label="City hub (MSP)"
            isActive={activeTab === "CityHub"}
            onClick={() => setActiveTab("CityHub")}
            sidebarOpen={sidebarOpen}
          />
        )}

        {show("CountryHub") && (
          <SidebarButton
            icon={<FaGlobeAmericas size={20} />}
            label="Top MSPs (Country)"
            isActive={activeTab === "CountryHub"}
            onClick={() => setActiveTab("CountryHub")}
            sidebarOpen={sidebarOpen}
          />
        )}

        {show("MsspCountryHub") && (
          <SidebarButton
            icon={<FaGlobe size={20} />}
            label="Top MSSPs (Country)"
            isActive={activeTab === "MsspCountryHub"}
            onClick={() => setActiveTab("MsspCountryHub")}
            sidebarOpen={sidebarOpen}
          />
        )}

        {show("ManagedIT") && (
          <SidebarButton
            icon={<FaBuilding size={20} />}
            label="Managed IT Services"
            isActive={activeTab === "ManagedIT"}
            onClick={() => setActiveTab("ManagedIT")}
            sidebarOpen={sidebarOpen}
          />
        )}

        {show("CyberSecurity") && (
          <SidebarButton
            icon={<FaShieldAlt size={20} />}
            label="Cybersecurity"
            isActive={activeTab === "CyberSecurity"}
            onClick={() => setActiveTab("CyberSecurity")}
            sidebarOpen={sidebarOpen}
          />
        )}

        {show("VendorDirectory") && (
          <SidebarButton
            icon={<FaLayerGroup size={20} />}
            label="Vendor Directory"
            isActive={activeTab === "VendorDirectory"}
            onClick={() => setActiveTab("VendorDirectory")}
            sidebarOpen={sidebarOpen}
          />
        )}

        {show("ListingRequests") && (
          <SidebarButton
            icon={<FaListAlt size={20} />}
            label="Listing Requests"
            isActive={activeTab === "ListingRequests"}
            onClick={() => setActiveTab("ListingRequests")}
            sidebarOpen={sidebarOpen}
          />
        )}
      </div>
    </div>
  );
}

// Reusable Button Component
function SidebarButton({ icon, label, isActive, onClick, sidebarOpen }) {
  return (
    <button
      className={`flex items-center p-3 rounded-lg transition-colors duration-200 ${
        isActive
          ? "bg-[#1d4882] text-white font-semibold"
          : "hover:bg-[#798fab] text-black"
      }`}
      onClick={onClick}
    >
      {icon}
      {sidebarOpen && <span className="ml-3">{label}</span>}
    </button>
  );
}
