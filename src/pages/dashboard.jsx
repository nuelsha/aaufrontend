import React, { useState, useEffect, useMemo } from "react";
import { Line, Bar, Pie } from "react-chartjs-2";
import { Link } from "react-router-dom";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import NavBar from "../components/NavBar";
import { getPartnerships } from "../api";
import { toast } from "react-hot-toast";
import { ComposableMap, Geographies, Geography } from "react-simple-maps"; // Uncommented import
import chroma from "chroma-js";
import { feature } from "topojson-client";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Dashboard = () => {
  // State management for filters, data, and loading status
  const [timeFilter, setTimeFilter] = useState("All Times");
  const [collegeFilter, setCollegeFilter] = useState("All Colleges");
  const [partnerships, setPartnerships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapData, setMapData] = useState(null);
  const [tooltip, setTooltip] = useState({
    show: false,
    content: "",
    x: 0,
    y: 0,
  });

  // Expanded list of colleges and institutes
  const colleges = [
    "All Colleges",
    "Central",
    "College of Business and Economics (CBE)",
    "College of Social Sciences, Arts and Humanities (CSSAH)",
    "College of Education and Language Studies (CELS)",
    "College of Veterinary Medicine & Agriculture (CVMA)",
    "College of Technology & Built Environment (CoTBE)",
    "College of Natural and Computational Sciences (CNCS)",
    "College of Health Sciences (CHS)",
    "School of Law (SoL)",
    "Institute of Water Environment & Climate Research (IWECR)",
    "Aklilu Lema Institute of Health Research (ALIHR)",
    "Institute of Geophysics Space Science & Astronomy (IGSSA)",
    "Institute for Social & Economic Research (ISER)",
    "Institute of Ethiopian Studies (IES)",
    "Institute of Advanced Science & Technology (IAST)",
    "Institute of Peace & Security (IPSS)",
  ];

  const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

  // Effect hook to fetch all partnerships using pagination
  useEffect(() => {
    const fetchAllPartnerships = async () => {
      setLoading(true);
      let allPartnerships = [];
      let currentPage = 1;
      const limit = 100; // Use the maximum allowed limit per page
      let hasMore = true;

      try {
        while (hasMore) {
          const params = { limit, page: currentPage };
          const response = await getPartnerships(params);
          console.log("Fetched partnerships:", response.data);

          const fetchedPartnerships = Array.isArray(
            response?.data?.partnerships
          )
            ? response.data.partnerships
            : [];

          if (fetchedPartnerships.length > 0) {
            allPartnerships = [...allPartnerships, ...fetchedPartnerships];
            currentPage++;
          } else {
            hasMore = false;
          }
        }
        setPartnerships(allPartnerships);
        console.log("Total partnerships fetched:", allPartnerships.length);
      } catch (error) {
        console.error("Error fetching partnerships:", error);
        toast.error(
          error.response?.data?.message || "Failed to fetch partnerships"
        );
        setPartnerships([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllPartnerships();
  }, []);

  // Fetch and parse TopoJSON for the world map
  useEffect(() => {
    fetch(geoUrl)
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load map data");
        return response.json();
      })
      .then((topology) => {
        const geoJson = feature(topology, topology.objects.countries);
        setMapData(geoJson);
      })
      .catch((error) => {
        console.error("Error loading map data:", error);
        toast.error("Failed to load map data");
        setMapData(null);
      });
  }, []);

  // Memoize the initial processing of partnerships to add a 'derivedStatus'
  const processedPartnerships = useMemo(() => {
    if (!Array.isArray(partnerships)) return [];
    const now = new Date();

    return partnerships.map((p) => {
      if (!p.createdAt) {
        console.warn("Partnership missing createdAt:", p._id);
      }
      const expirationDate = p.expirationDate
        ? new Date(p.expirationDate)
        : null;
      let derivedStatus = p.status ? p.status.toLowerCase() : "pending";

      if (expirationDate && p.status === "Active") {
        const daysUntilExpiration =
          (expirationDate - now) / (1000 * 60 * 60 * 24);
        if (daysUntilExpiration <= 0) {
          derivedStatus = "expired";
        } else if (daysUntilExpiration <= 30) {
          derivedStatus = "expiringSoon";
        } else {
          derivedStatus = "active";
        }
      } else if (derivedStatus === "rejected") {
        derivedStatus = "expired";
      } else if (derivedStatus === "pending") {
        derivedStatus = "prospect";
      }
      return { ...p, derivedStatus };
    });
  }, [partnerships]);

  // Memoize the partnerships filtered by the selected time range
  const filteredByTime = useMemo(() => {
    const now = new Date();
    let startDate;

    if (timeFilter === "Weekly") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (timeFilter === "Monthly") {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (timeFilter === "Yearly") {
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    } else {
      return processedPartnerships; // Return all for "All Times"
    }

    const filtered = processedPartnerships.filter(
      (p) => !p.createdAt || new Date(p.createdAt) >= startDate
    );
    console.log("Filtered partnerships by time:", filtered.length);
    return filtered;
  }, [processedPartnerships, timeFilter]);

  // Log college filter and data for debugging
  useEffect(() => {
    console.log("Selected college:", collegeFilter);
    console.log("Total processed partnerships:", processedPartnerships.length);
  }, [collegeFilter, processedPartnerships]);

  // Memoize aggregated data for the bar chart
  const { collegeData, totalData } = useMemo(() => {
    const collegeData = colleges.reduce((acc, college) => {
      if (college === "All Colleges") return acc;
      const collegePartnerships = filteredByTime.filter(
        (p) => p.aauContact?.interestedCollegeOrDepartment === college
      );
      acc[college] = {
        active: collegePartnerships.filter((p) => p.derivedStatus === "active")
          .length,
        expiringSoon: collegePartnerships.filter(
          (p) => p.derivedStatus === "expiringSoon"
        ).length,
        expired: collegePartnerships.filter(
          (p) => p.derivedStatus === "expired"
        ).length,
        prospect: collegePartnerships.filter(
          (p) => p.derivedStatus === "prospect"
        ).length,
      };
      return acc;
    }, {});

    const totalData = filteredByTime.reduce(
      (acc, p) => {
        acc[p.derivedStatus] = (acc[p.derivedStatus] || 0) + 1;
        return acc;
      },
      { active: 0, expiringSoon: 0, expired: 0, prospect: 0 }
    );

    return { collegeData, totalData };
  }, [filteredByTime, colleges]);

  // Memoize aggregated data for the line chart
  const { months, lineDataByCollege } = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      return date.toLocaleString("default", { month: "short" }).toUpperCase();
    });

    const initialCollegeData = colleges.reduce((acc, college) => {
      acc[college] = {
        active: new Array(12).fill(0),
        expired: new Array(12).fill(0),
        expiringSoon: new Array(12).fill(0),
        prospect: new Array(12).fill(0),
      };
      return acc;
    }, {});

    filteredByTime.forEach((p) => {
      if (!p.createdAt) return;
      const createdDate = new Date(p.createdAt);
      const monthIndex =
        (createdDate.getFullYear() - now.getFullYear()) * 12 +
        createdDate.getMonth() -
        (now.getMonth() - 11);

      if (monthIndex >= 0 && monthIndex < 12) {
        const collegeName = p.aauContact?.interestedCollegeOrDepartment;
        if (collegeName && initialCollegeData[collegeName]) {
          initialCollegeData[collegeName][p.derivedStatus][monthIndex]++;
        }
        initialCollegeData["All Colleges"][p.derivedStatus][monthIndex]++;
      }
    });

    return { months, lineDataByCollege: initialCollegeData };
  }, [filteredByTime, colleges]);

  // Memoize data for the pie chart
  const pieData = useMemo(() => {
    const collegeCounts = colleges.reduce((acc, college) => {
      if (college !== "All Colleges") {
        const count = processedPartnerships.filter(
          (p) => p.aauContact?.interestedCollegeOrDepartment === college
        ).length;
        if (count > 0) acc[college] = count;
      }
      return acc;
    }, {});

    return {
      labels: Object.keys(collegeCounts),
      datasets: [
        {
          data: Object.values(collegeCounts),
          backgroundColor: [
            "#1F2A44",
            "#3B82F6",
            "#93C5FD",
            "#D1D5DB",
            "#A855F7",
            "#F59E0B",
            "#10B981",
            "#F472B6",
            "#6B7280",
            "#EC4899",
            "#8B5CF6",
            "#F97316",
            "#22C55E",
            "#0EA5E9",
            "#E11D48",
            "#FDE047",
            "#5EEAD4",
          ],
          borderWidth: 1,
          borderColor: "#fff",
        },
      ],
    };
  }, [processedPartnerships, colleges]);

  // World map partner density data
  const countryCounts = useMemo(() => {
    if (!Array.isArray(processedPartnerships)) return {};
    const normalizeCountryName = (name) => {
      if (!name) return "Unknown";
      const normalized = name.trim().toLowerCase();
      const countryMap = {
        "united states": "United States",
        usa: "United States",
        "united states of america": "United States",
        "united kingdom": "United Kingdom",
        uk: "United Kingdom",
        "great britain": "United Kingdom",
        "south korea": "South Korea",
        "korea, republic of": "South Korea",
        russia: "Russian Federation",
        china: "China",
        taiwan: "Taiwan",
        ethiopia: "Ethiopia",
      };
      const mappedName = countryMap[normalized];
      return mappedName
        ? mappedName.charAt(0).toUpperCase() + mappedName.slice(1)
        : name.charAt(0).toUpperCase() + name.slice(1);
    };
    return processedPartnerships.reduce((acc, p) => {
      const country =
        normalizeCountryName(p.partnerInstitution?.country) || "Unknown";
      acc[country] = (acc[country] || 0) + 1;
      return acc;
    }, {});
  }, [processedPartnerships]);

  const maxCount = Math.max(...Object.values(countryCounts), 1);
  const colorScale = chroma
    .scale(["#bfdbfe", "#1e3a8a"])
    .mode("lch")
    .domain([0, maxCount]);
  const handleMouseEnter = (e, countryName, count) => {
    if (count > 0) {
      setTooltip({
        show: true,
        content: `${countryName}: ${count} partner${count > 1 ? "s" : ""}`,
        x: e.clientX + 10,
        y: e.clientY + 10,
      });
    }
  };
  const handleMouseLeave = () => {
    setTooltip({ show: false, content: "", x: 0, y: 0 });
  };

  // Chart Configurations
  const totalAllPartnerships = processedPartnerships.length;
  const displayedTotal = Object.values(totalData).reduce(
    (sum, count) => sum + count,
    0
  );

  const selectedCollegeData =
    collegeFilter === "All Colleges"
      ? totalData
      : collegeData[collegeFilter] || {
          active: 0,
          expiringSoon: 0,
          expired: 0,
          prospect: 0,
        };

  const barData = {
    labels: ["Active Partners", "Expiring Soon", "Expired", "Prospect"],
    datasets: [
      {
        label: "Units",
        data: [
          selectedCollegeData.active,
          selectedCollegeData.expiringSoon,
          selectedCollegeData.expired,
          selectedCollegeData.prospect,
        ],
        backgroundColor: ["#1F2A44", "#3B82F6", "#93C5FD", "#D1D5DB"],
        borderRadius: 10,
      },
    ],
  };
  const barOptions = {
    indexAxis: "y",
    scales: { x: { beginAtZero: true, ticks: { stepSize: 50 } } },
    plugins: { legend: { display: false } },
  };

  const lineChartDataSource =
    lineDataByCollege[collegeFilter] || lineDataByCollege["All Colleges"];
  const lineData = {
    labels: months,
    datasets: [
      {
        label: "Active",
        data: lineChartDataSource.active,
        borderColor: "#3B82F6",
        fill: false,
      },
      {
        label: "Expired",
        data: lineChartDataSource.expired,
        borderColor: "#A855F7",
        fill: false,
      },
      {
        label: "Expiring Soon",
        data: lineChartDataSource.expiringSoon,
        borderColor: "#F59E0B",
        fill: false,
      },
      {
        label: "Prospect",
        data: lineChartDataSource.prospect,
        borderColor: "#D1D5DB",
        fill: false,
      },
    ],
  };
  const lineOptions = {
    scales: { y: { beginAtZero: true, ticks: { stepSize: 10 } } },
    plugins: { legend: { position: "bottom" } },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: { boxWidth: 10, font: { size: 10 } },
      },
      title: { display: false },
    },
  };

  // Render JSX
  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <NavBar />
      <div className="p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <h1 className="text-xl lg:text-2xl font-bold text-gray-800">
            Partnership Statistics
          </h1>
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <select
              value={collegeFilter}
              onChange={(e) => setCollegeFilter(e.target.value)}
              className="w-full sm:w-64 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {colleges.map((college) => (
                <option key={college} value={college}>
                  {college}
                </option>
              ))}
            </select>
            <Link
              to="/add-partnership"
              className="bg-[#004165] hover:bg-[#00334e] text-white rounded-full px-6 py-2 flex items-center justify-center transition-colors"
            >
              + New Partner
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#004165]"></div>
            <span className="ml-3 text-[#004165] font-medium">Loading...</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6 mb-6">
              <div className="bg-white p-4 lg:p-6 rounded-xl shadow-md lg:col-span-1">
                <h2 className="text-2xl lg:text-4xl font-bold text-gray-800">
                  {totalAllPartnerships} Total Partners ({displayedTotal} in{" "}
                  {timeFilter})
                </h2>
                <p className="text-gray-600 mt-2">
                  Units Per Status ({timeFilter})
                </p>
                <div className="mt-4">
                  <Bar data={barData} options={barOptions} height={100} />
                </div>
              </div>

              <div className="lg:col-span-2 flex flex-col space-y-4 lg:space-y-6">
                <div className="bg-white p-4 lg:p-6 rounded-xl shadow-md">
                  <h2 className="text-2xl lg:text-3xl font-bold text-gray-800">
                    {selectedCollegeData.active}
                  </h2>
                  <p className="text-gray-600 mt-2">Active Partners</p>
                </div>
                <div className="bg-white p-4 lg:p-6 rounded-xl shadow-md">
                  <h2 className="text-2xl lg:text-3xl font-bold text-gray-800">
                    {selectedCollegeData.prospect}
                  </h2>
                  <p className="text-gray-600 mt-2">Pending Applications</p>
                </div>
              </div>

              <div className="bg-white p-4 lg:p-6 rounded-xl shadow-md lg:col-span-1">
                <h2 className="text-lg font-medium text-gray-800 mb-2">
                  College Distribution
                </h2>
                <div className="h-52 flex items-center justify-center">
                  {pieData.labels.length > 0 ? (
                    <Pie data={pieData} options={pieOptions} />
                  ) : (
                    <span className="text-gray-400 text-sm">
                      No data available
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
                <h2 className="text-lg font-medium text-gray-800">
                  Partnership Status Trend
                </h2>
                <div className="flex flex-wrap gap-1">
                  {["Weekly", "Monthly", "Yearly", "All Times"].map(
                    (filter) => (
                      <button
                        key={filter}
                        onClick={() => setTimeFilter(filter)}
                        className={`px-3 py-1 rounded-md text-sm ${
                          timeFilter === filter
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-600"
                        } cursor-pointer`}
                      >
                        {filter}
                      </button>
                    )
                  )}
                </div>
              </div>
              <Line data={lineData} options={lineOptions} height={80} />
            </div>

            <div className="bg-white p-4 lg:p-6 rounded-xl shadow-md mb-6 mt-6">
              <h2 className="text-lg font-medium text-gray-800 mb-4">
                Partner Density by Country
              </h2>
              <div className="h-[500px] w-full relative px-2 lg:px-4">
                {mapData ? (
                  <ComposableMap
                    projectionConfig={{ scale: 180, center: [0, 20] }}
                    style={{ width: "100%", height: "100%" }}
                  >
                    <Geographies geography={mapData}>
                      {({ geographies }) =>
                        geographies.map((geo) => {
                          const countryName = geo.properties.name;
                          const count = countryCounts[countryName] || 0;
                          const fillColor =
                            count > 0 ? colorScale(count).hex() : "#ECEFF1";
                          return (
                            <Geography
                              key={geo.rsmKey}
                              geography={geo}
                              fill={fillColor}
                              stroke="#ffffff"
                              strokeWidth={0.5}
                              style={{
                                default: { outline: "none" },
                                hover: {
                                  outline: "none",
                                  fill: "#93C5FD",
                                },
                                pressed: { outline: "none" },
                              }}
                              onMouseEnter={(e) =>
                                handleMouseEnter(e, countryName, count)
                              }
                              onMouseLeave={handleMouseLeave}
                            />
                          );
                        })
                      }
                    </Geographies>
                  </ComposableMap>
                ) : (
                  <div className="text-red-500 text-center h-full flex items-center justify-center">
                    Failed to load map data. Please try again later.
                  </div>
                )}
                {tooltip.show && (
                  <div
                    className="absolute bg-black/80 text-white text-sm px-3 py-1 rounded-md shadow-xl z-50 border border-white"
                    style={{ left: tooltip.x, top: tooltip.y }}
                  >
                    {tooltip.content}
                  </div>
                )}
              </div>
              <div className="w-full flex flex-col items-center mt-6">
                <div className="h-4 w-full max-w-3xl bg-gradient-to-r from-[#bfdbfe] to-[#1e3a8a] rounded-full"></div>
                <div className="flex justify-between text-sm text-gray-700 w-full max-w-3xl mt-1">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>
              {countryCounts["Unknown"] > 0 && (
                <p className="text-sm text-red-500 mt-2 text-center">
                  {countryCounts["Unknown"]} partners have unknown or invalid
                  country data
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
