import { useEffect, useState, useRef, useMemo } from "react"
import { supabase } from "../lib/supabase"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import PageHeader from "../components/PageHeader"
import StatsCard from "../components/StatsCard"
import ChartCard from "../components/ChartCard"
import { motion, AnimatePresence, type Variants } from "framer-motion"
import { getPaletteSync } from "colorthief";
import { 
  Upload, 
  Save, 
  RefreshCw, 
  Palette, 
  Award,
  TrendingUp,
  CheckCircle,
  XCircle,
  Loader
} from "lucide-react"

interface Brand {
  brand_id: string;
  client_name: string;
  mission_statement: string;
  core_values: string;
  brand_personality: string;
  tone_of_voice: string;
  messaging_style: string;
  slogan: string;
  logo_url_primary: string;
  logo_url_secondary: string;
  color_palette: {
    primary: string;
    secondary: string;
    accent: string;
  };
  created_at: string;
  updated_at: string;
}

interface BrandForm {
  client_name: string;
  mission_statement: string;
  core_values: string;
  brand_personality: string;
  tone_of_voice: string;
  messaging_style: string;
  slogan: string;
}

const BrandIdentity = () => {
  const [brand, setBrand] = useState<Brand | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("view")
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null)
  const [dominantColors, setDominantColors] = useState<string[]>(["#6366f1", "#8b5cf6", "#ec4899"])

  // form state
  const [form, setForm] = useState<BrandForm>({
    client_name: "",
    mission_statement: "",
    core_values: "",
    brand_personality: "",
    tone_of_voice: "",
    messaging_style: "",
    slogan: "",
  })

  const [logoPrimary, setLogoPrimary] = useState<File | null>(null)
  const [logoSecondary, setLogoSecondary] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoForColorPicker, setLogoForColorPicker] = useState<string | null>(null);
  const [pickedColor, setPickedColor] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const colorPieGradient = useMemo(() => {
    if (!dominantColors.length) return "conic-gradient(#e5e7eb 0 100%)";
    const slice = 100 / dominantColors.length;
    let current = 0;
    const stops = dominantColors.map((c) => {
      const start = current;
      const end = Math.min(100, current + slice);
      current = end;
      return `${c} ${start}% ${end}%`;
    });
    return `conic-gradient(${stops.join(", ")})`;
  }, [dominantColors]);

  // 🔹 FETCH DATA
  const fetchBrand = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from("brand_identity")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (error) {
      console.error(error)
      showNotification("error", "Failed to load brand data")
    } else {
      setBrand(data)
      setForm({
        client_name: data.client_name || "",
        mission_statement: data.mission_statement || "",
        core_values: data.core_values || "",
        brand_personality: data.brand_personality || "",
        tone_of_voice: data.tone_of_voice || "",
        messaging_style: data.messaging_style || "",
        slogan: data.slogan || "",
      })
      
      // Extract colors from logo if available
      if (data.logo_url_primary) {
        extractColorsFromImage(data.logo_url_primary)
      }
    }

    setLoading(false)
  }

  // 🔹 EXTRACT COLORS FROM IMAGE (simplified - in production use a color extraction library)
  const extractColorsFromImage = (imageUrl: string) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imageUrl;
    img.onload = () => {
      try {
        const palette = getPaletteSync(img, { colorCount: 5 });

        if (palette && palette.length) {
          const hexPalette = palette.map((color) => color.hex());
          setDominantColors(hexPalette);
          return;
        }
      } catch (error) {
        console.error("Error extracting colors:", error);
      }

      // fallback to default colors
      setDominantColors(["#3b82f6", "#8b5cf6", "#ec4899", "#10b981", "#f59e0b"]);
    };
    img.onerror = (error) => {
      console.error("Error loading image for color extraction:", error);
      // fallback to default colors
      setDominantColors(["#3b82f6", "#8b5cf6", "#ec4899", "#10b981", "#f59e0b"]);
    }
  }

  // 🔹 SHOW NOTIFICATION
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }

  // 🔹 UPLOAD FILE
  const uploadFile = async (file: File, path: string) => {
    const { error } = await supabase.storage
      .from("brand_identity")
      .upload(path, file, { upsert: true })

    if (error) throw error

    const { data } = supabase.storage
      .from("brand_identity")
      .getPublicUrl(path)

    return data.publicUrl
  }

  // 🔹 HANDLE LOGO PREVIEW
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'primary' | 'secondary') => {
    const file = e.target.files?.[0] || null
    
    if (type === 'primary') {
      setLogoPrimary(file)
      if (file) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setLogoPreview(reader.result as string)
          setLogoForColorPicker(reader.result as string);
          setShowColorPicker(true);
          setPickedColor(null);
          // In production, extract colors from the actual image
          extractColorsFromImage(reader.result as string)
        }
        reader.readAsDataURL(file)
      } else {
        setLogoPreview(null)
      }
    } else {
      setLogoSecondary(file)
    }
  }

  // 🔹 SUBMIT FORM
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      let logo_url_primary = brand?.logo_url_primary || null
      let logo_url_secondary = brand?.logo_url_secondary || null

      if (logoPrimary) {
        logo_url_primary = await uploadFile(
          logoPrimary,
          `logos/primary-${Date.now()}`
        )
      }

      if (logoSecondary) {
        logo_url_secondary = await uploadFile(
          logoSecondary,
          `logos/secondary-${Date.now()}`
        )
      }

      const payload = {
        ...form,
        logo_url_primary,
        logo_url_secondary,
        color_palette: {
          primary: dominantColors[0] || "#000000",
          secondary: dominantColors[1] || "#ffffff",
          accent: dominantColors[2] || "#f59e0b",
        },
        updated_at: new Date().toISOString(),
      }

      let response

      if (brand) {
        response = await supabase
          .from("brand_identity")
          .update(payload)
          .eq("brand_id", brand.brand_id)
      } else {
        response = await supabase.from("brand_identity").insert(payload)
      }

      if (response.error) throw response.error

      showNotification("success", "Brand identity saved successfully!")
      fetchBrand()
      setActiveTab("view")
    } catch (err: unknown) {
      console.error(err)
      showNotification("error", "Error saving brand identity")
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    if (logoForColorPicker && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = logoForColorPicker;
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
      };
    }
  }, [logoForColorPicker]);

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const hex = `#${("000000" + ((pixel[0] << 16) | (pixel[1] << 8) | pixel[2]).toString(16)).slice(-6)}`;
    setPickedColor(hex);
  };


  useEffect(() => {
    fetchBrand()
  }, [])

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900">
      <Sidebar />
      
      <div className="flex flex-1 flex-col">
        <Topbar />

        <main className="relative space-y-6 p-6 lg:p-8">
          {/* Animated Background */}
          <div className="fixed inset-0 -z-10 overflow-hidden">
            <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-gradient-to-br from-purple-200 to-pink-200 opacity-20 blur-3xl" />
            <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-gradient-to-tr from-blue-200 to-cyan-200 opacity-20 blur-3xl" />
          </div>

          {/* Notification */}
          <AnimatePresence>
            {notification && (
              <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                className={`fixed top-20 right-6 z-50 flex items-center gap-2 rounded-lg px-4 py-3 shadow-lg ${
                  notification.type === 'success' 
                    ? 'bg-green-50 text-green-800 border border-green-200' 
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {notification.type === 'success' ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <XCircle className="h-5 w-5" />
                )}
                <span>{notification.message}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header with Color Strip */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
          >
            <div className="absolute inset-x-0 -top-6 h-2 rounded-t-xl bg-gradient-to-r" 
              style={{ 
                background: `linear-gradient(90deg, ${dominantColors.join(', ')})` 
              }} 
            />
            <PageHeader
              title="Brand Identity"
              subtitle="Define and manage your brand's visual and verbal identity"
              actions={
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab(activeTab === "view" ? "edit" : "view")}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                  >
                    <RefreshCw className={`h-4 w-4 transition-transform ${activeTab === "edit" ? 'rotate-180' : ''}`} />
                    {activeTab === "view" ? "Edit Brand" : "View Brand"}
                  </motion.button>
                </div>
              }
            />
          </motion.div>

          {/* Color Palette Display */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex h-2 overflow-hidden rounded-lg"
          >
            {dominantColors.map((color, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="h-full flex-1"
                style={{ backgroundColor: color }}
                whileHover={{ flex: 2, transition: { duration: 0.2 } }}
              />
            ))}
          </motion.div>

          {/* Color Pie */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="rounded-2xl bg-white p-6 shadow-md flex flex-col gap-4 md:flex-row md:items-center"
          >
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">Color distribution</h3>
              <p className="text-sm text-gray-600">Quick visual of your palette balance.</p>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {dominantColors.map((c, i) => (
                  <div key={c + i} className="flex items-center gap-2">
                    <span
                      className="h-4 w-4 rounded-full border"
                      style={{ backgroundColor: c, borderColor: c }}
                    />
                    <span className="text-sm text-gray-700 break-all">{c}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-center md:justify-end">
              <div
                className="h-40 w-40 rounded-full border border-gray-100 shadow-inner"
                style={{ backgroundImage: colorPieGradient }}
                aria-label="Color palette pie"
              />
            </div>
          </motion.div>

          {/* STATS CARDS with brand colors */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 gap-4 md:grid-cols-3"
          >
            <motion.div variants={itemVariants}>
              <StatsCard 
                label="Brand recall" 
                value="73%" 
                delta="+4pp"
                icon={<TrendingUp className="h-5 w-5" />}
                color={dominantColors[0]}
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <StatsCard 
                label="Asset compliance" 
                value="96%" 
                delta="+2pp"
                icon={<CheckCircle className="h-5 w-5" />}
                color={dominantColors[1]}
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <StatsCard 
                label="NPS" 
                value="58" 
                delta="+3 pts"
                icon={<Award className="h-5 w-5" />}
                color={dominantColors[2]}
              />
            </motion.div>
          </motion.div>

          {/* Main Content */}
          <AnimatePresence mode="wait">
            {activeTab === "view" ? (
              <motion.div
                key="view"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="grid gap-6 lg:grid-cols-2"
              >
                {/* Brand Info Card */}
                <motion.div
                  variants={itemVariants}
                  className="overflow-hidden rounded-2xl bg-white shadow-xl"
                >
                  <div className="bg-gradient-to-r p-6 text-white"
                    style={{ 
                      background: `linear-gradient(135deg, ${dominantColors[0]}, ${dominantColors[2]})` 
                    }}
                  >
                    <h2 className="text-xl font-semibold">Brand Overview</h2>
                    <p className="text-white/80">Current brand identity details</p>
                  </div>
                  
                  <div className="p-6">
                    {loading ? (
                      <div className="flex justify-center py-12">
                        <Loader className="h-8 w-8 animate-spin" style={{ color: dominantColors[0] }} />
                      </div>
                    ) : brand ? (
                      <motion.div 
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="space-y-4"
                      >
                        <motion.div variants={itemVariants} className="group cursor-pointer rounded-lg p-4 transition-all hover:bg-gray-50">
                          <p className="text-sm text-gray-500">Client Name</p>
                          <p className="font-semibold">{brand.client_name}</p>
                        </motion.div>
                        
                        <motion.div variants={itemVariants} className="group cursor-pointer rounded-lg p-4 transition-all hover:bg-gray-50">
                          <p className="text-sm text-gray-500">Mission Statement</p>
                          <p className="text-gray-700">{brand.mission_statement}</p>
                        </motion.div>
                        
                        <motion.div variants={itemVariants} className="group cursor-pointer rounded-lg p-4 transition-all hover:bg-gray-50">
                          <p className="text-sm text-gray-500">Core Values</p>
                          <div className="flex flex-wrap gap-2">
                            {brand.core_values?.split(',').map((value: string, i: number) => (
                              <span 
                                key={i}
                                className="rounded-full px-3 py-1 text-sm"
                                style={{ 
                                  backgroundColor: `${dominantColors[i % dominantColors.length]}20`,
                                  color: dominantColors[i % dominantColors.length]
                                }}
                              >
                                {value.trim()}
                              </span>
                            ))}
                          </div>
                        </motion.div>
                        
                        <motion.div variants={itemVariants} className="group cursor-pointer rounded-lg p-4 transition-all hover:bg-gray-50">
                          <p className="text-sm text-gray-500">Brand Personality</p>
                          <p className="text-gray-700">{brand.brand_personality}</p>
                        </motion.div>
                        
                        <motion.div variants={itemVariants} className="group cursor-pointer rounded-lg p-4 transition-all hover:bg-gray-50">
                          <p className="text-sm text-gray-500">Slogan</p>
                          <p className="text-lg italic" style={{ color: dominantColors[1] }}>"{brand.slogan}"</p>
                        </motion.div>
                      </motion.div>
                    ) : (
                      <div className="py-12 text-center text-gray-500">
                        <Palette className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-4">No brand identity yet. Click "Edit Brand" to create one.</p>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Logos Card */}
                <motion.div
                  variants={itemVariants}
                  className="overflow-hidden rounded-2xl bg-white shadow-xl"
                >
                  <div className="border-b border-gray-100 bg-gray-50 p-6">
                    <h2 className="text-xl font-semibold">Brand Assets</h2>
                    <p className="text-gray-500">Logos and visual elements</p>
                  </div>
                  
                  <div className="p-6">
                    {brand?.logo_url_primary || brand?.logo_url_secondary ? (
                      <div className="space-y-6">
                        {brand.logo_url_primary && (
                          <motion.div 
                            variants={itemVariants}
                            className="space-y-2"
                          >
                            <p className="text-sm font-medium text-gray-700">Primary Logo</p>
                            <motion.div 
                              whileHover={{ scale: 1.02 }}
                              className="flex items-center justify-center rounded-lg border-2 border-dashed p-6"
                              style={{ borderColor: dominantColors[0] }}
                            >
                              <img
                                src={brand.logo_url_primary}
                                alt="Primary Logo"
                                className="max-h-24 object-contain"
                              />
                            </motion.div>
                          </motion.div>
                        )}
                        
                        {brand.logo_url_secondary && (
                          <motion.div 
                            variants={itemVariants}
                            className="space-y-2"
                          >
                            <p className="text-sm font-medium text-gray-700">Secondary Logo</p>
                            <motion.div 
                              whileHover={{ scale: 1.02 }}
                              className="flex items-center justify-center rounded-lg border-2 border-dashed p-6"
                              style={{ borderColor: dominantColors[1] }}
                            >
                              <img
                                src={brand.logo_url_secondary}
                                alt="Secondary Logo"
                                className="max-h-16 object-contain"
                              />
                            </motion.div>
                          </motion.div>
                        )}
                      </div>
                    ) : (
                      <div className="py-12 text-center text-gray-500">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-4">No logos uploaded yet</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            ) : (
              <motion.form
                key="edit"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Brand Details Form */}
                  <motion.div
                    variants={itemVariants}
                    className="overflow-hidden rounded-2xl bg-white shadow-xl"
                  >
                    <div className="border-b border-gray-100 bg-gray-50 p-6">
                      <h2 className="text-xl font-semibold">Brand Details</h2>
                      <p className="text-gray-500">Define your brand's core identity</p>
                    </div>
                    
                    <div className="space-y-4 p-6">
                      <motion.div variants={itemVariants}>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Client Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={form.client_name}
                          onChange={(e) => setForm({ ...form, client_name: e.target.value })}
                          className="w-full rounded-lg border border-gray-200 p-3 transition-all focus:border-transparent focus:outline-none focus:ring-2"
                          placeholder="Enter client name"
                          required
                        />
                      </motion.div>

                      <motion.div variants={itemVariants}>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Mission Statement
                        </label>
                        <textarea
                          value={form.mission_statement}
                          onChange={(e) => setForm({ ...form, mission_statement: e.target.value })}
                          rows={3}
                          className="w-full rounded-lg border border-gray-200 p-3 transition-all focus:border-transparent focus:outline-none focus:ring-2"
                          placeholder="What is your brand's mission?"
                        />
                      </motion.div>

                      <motion.div variants={itemVariants}>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Core Values (comma-separated)
                        </label>
                        <input
                          type="text"
                          value={form.core_values}
                          onChange={(e) => setForm({ ...form, core_values: e.target.value })}
                          className="w-full rounded-lg border border-gray-200 p-3 transition-all focus:border-transparent focus:outline-none focus:ring-2"
                          placeholder="Innovation, Quality, Integrity"
                        />
                      </motion.div>

                      <motion.div variants={itemVariants}>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Brand Personality
                        </label>
                        <input
                          type="text"
                          value={form.brand_personality}
                          onChange={(e) => setForm({ ...form, brand_personality: e.target.value })}
                          className="w-full rounded-lg border border-gray-200 p-3 transition-all focus:border-transparent focus:outline-none focus:ring-2"
                          placeholder="Friendly, Professional, Innovative"
                        />
                      </motion.div>

                      <motion.div variants={itemVariants}>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Slogan
                        </label>
                        <input
                          type="text"
                          value={form.slogan}
                          onChange={(e) => setForm({ ...form, slogan: e.target.value })}
                          className="w-full rounded-lg border border-gray-200 p-3 transition-all focus:border-transparent focus:outline-none focus:ring-2"
                          placeholder="Your brand's tagline"
                        />
                      </motion.div>
                    </div>
                  </motion.div>

                  {/* Logo Upload Section */}
                  <motion.div
                    variants={itemVariants}
                    className="overflow-hidden rounded-2xl bg-white shadow-xl"
                  >
                    <div className="border-b border-gray-100 bg-gray-50 p-6">
                      <h2 className="text-xl font-semibold">Logo Upload</h2>
                      <p className="text-gray-500">Upload your brand logos</p>
                    </div>
                    
                    <div className="space-y-6 p-6">
                      {/* Primary Logo Upload */}
                      <motion.div variants={itemVariants}>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Primary Logo
                        </label>
                        <div className="relative">
                          <input
                            type="file"
                            id="primary-logo"
                            accept="image/*"
                            onChange={(e) => handleLogoChange(e, 'primary')}
                            className="hidden"
                          />
                          <label
                            htmlFor="primary-logo"
                            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-all hover:bg-gray-50"
                            style={{ borderColor: dominantColors[0] }}
                          >
                            {logoPreview || brand?.logo_url_primary ? (
                              <div className="relative w-full">
                                <img
                                  src={logoPreview || brand?.logo_url_primary}
                                  alt="Logo preview"
                                  className="mx-auto max-h-32 object-contain"
                                />
                                <button
                                  type="button"
                                  onClick={() => setLogoPrimary(null)}
                                  className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                                >
                                  <XCircle className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <Upload className="h-8 w-8 text-gray-400" />
                                <p className="mt-2 text-sm text-gray-500">
                                  Click to upload or drag and drop
                                </p>
                                <p className="text-xs text-gray-400">
                                  PNG, JPG, SVG up to 10MB
                                </p>
                              </>
                            )}
                          </label>
                          {showColorPicker && logoForColorPicker && (
                            <div className="mt-4">
                              <canvas ref={canvasRef} className="hidden" />
                              <p className="mb-2 text-sm font-medium text-gray-700">Click the logo to pick a color:</p>
                              <img
                                src={logoForColorPicker}
                                alt="Color picker"
                                className="cursor-pointer object-contain max-h-48"
                                onClick={handleImageClick}
                              />
                              {pickedColor && (
                                <div className="mt-4 flex items-center gap-4">
                                  <div
                                    className="h-10 w-10 rounded-full border-2 border-white shadow-lg"
                                    style={{ backgroundColor: pickedColor }}
                                  />
                                  <div className="font-medium text-lg">{pickedColor}</div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (pickedColor && !dominantColors.includes(pickedColor)) {
                                        setDominantColors([...dominantColors, pickedColor]);
                                      }
                                    }}
                                    className="rounded-lg bg-indigo-600 px-4 py-2 text-white text-sm font-semibold hover:bg-indigo-700 transition-all"
                                  >
                                    Add to Palette
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setShowColorPicker(false)}
                                    className="rounded-lg bg-gray-500 px-4 py-2 text-white text-sm font-semibold hover:bg-gray-600 transition-all"
                                  >
                                    Done
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>

                      {/* Secondary Logo Upload */}
                      <motion.div variants={itemVariants}>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Secondary Logo
                        </label>
                        <div className="relative">
                          <input
                            type="file"
                            id="secondary-logo"
                            accept="image/*"
                            onChange={(e) => handleLogoChange(e, 'secondary')}
                            className="hidden"
                          />
                          <label
                            htmlFor="secondary-logo"
                            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-all hover:bg-gray-50"
                            style={{ borderColor: dominantColors[1] }}
                          >
                            {logoSecondary || brand?.logo_url_secondary ? (
                              <div className="relative w-full">
                                <img
                                  src={
                                    logoSecondary 
                                      ? URL.createObjectURL(logoSecondary) 
                                      : brand?.logo_url_secondary
                                  }
                                  alt="Secondary logo preview"
                                  className="mx-auto max-h-24 object-contain"
                                />
                                <button
                                  type="button"
                                  onClick={() => setLogoSecondary(null)}
                                  className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                                >
                                  <XCircle className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <Upload className="h-8 w-8 text-gray-400" />
                                <p className="mt-2 text-sm text-gray-500">
                                  Click to upload or drag and drop
                                </p>
                                <p className="text-xs text-gray-400">
                                  PNG, JPG, SVG up to 10MB
                                </p>
                              </>
                            )}
                          </label>
                        </div>
                      </motion.div>

                      {/* Extracted Colors Preview */}
                      <motion.div variants={itemVariants} className="rounded-lg bg-gray-50 p-4">
                        <p className="mb-2 text-sm font-medium text-gray-700">Extracted Brand Colors</p>
                        <div className="flex gap-2">
                          {dominantColors.map((color, index) => (
                            <motion.div
                              key={index}
                              className="h-8 w-8 rounded-full shadow-lg"
                              style={{ backgroundColor: color }}
                              whileHover={{ scale: 1.2 }}
                              title={color}
                            />
                          ))}
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                </div>

                {/* Form Actions */}
                <motion.div
                  variants={itemVariants}
                  className="flex justify-end gap-3 rounded-2xl bg-white p-6 shadow-xl"
                >
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab("view")}
                    className="rounded-lg border border-gray-200 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </motion.button>
                  
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={saving}
                    className="flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                    style={{ backgroundColor: dominantColors[0] }}
                  >
                    {saving ? (
                      <>
                        <Loader className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Brand Identity
                      </>
                    )}
                  </motion.button>
                </motion.div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Charts Section */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid gap-6 lg:grid-cols-2"
          >
            <motion.div variants={itemVariants}>
              <ChartCard 
                title="Share of voice"
                subtitle="Competitive share across key categories"
                color={dominantColors[0]}
              >
                <div className="h-64 w-full">
                  {/* Chart implementation would go here */}
                  <div className="flex h-full items-center justify-center rounded-lg bg-gray-50">
                    <p className="text-gray-500">Chart visualization placeholder</p>
                  </div>
                </div>
              </ChartCard>
            </motion.div>

            <motion.div variants={itemVariants}>
              <ChartCard 
                title="Asset usage"
                subtitle="Top-performing creatives and adherence"
                color={dominantColors[1]}
              >
                <div className="h-64 w-full">
                  {/* Chart implementation would go here */}
                  <div className="flex h-full items-center justify-center rounded-lg bg-gray-50">
                    <p className="text-gray-500">Chart visualization placeholder</p>
                  </div>
                </div>
              </ChartCard>
            </motion.div>
          </motion.div>
        </main>
      </div>
    </div>
  )
}

export default BrandIdentity
