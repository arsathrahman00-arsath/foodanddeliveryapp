import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { CalendarIcon, Camera, Video, Upload, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cookingApi, recipeTypeListApi } from "@/lib/api";

interface RecipeTypeOption {
  recipe_type: string;
  recipe_code: number;
}

const CookingPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cookDate, setCookDate] = useState<Date>();
  const [recipeType, setRecipeType] = useState("");
  const [recipeTypes, setRecipeTypes] = useState<RecipeTypeOption[]>([]);
  const [photo, setPhoto] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchRecipeTypes = async () => {
      try {
        const response = await recipeTypeListApi.getAll();
        if (response.status === "success" && response.data) {
          setRecipeTypes(response.data);
        }
      } catch (error) {
        toast({ title: "Error", description: "Failed to load recipe types.", variant: "destructive" });
      } finally {
        setIsLoadingTypes(false);
      }
    };
    fetchRecipeTypes();
  }, []);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "photo" | "video",
    setter: (f: File | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isPhoto = type === "photo";
    const prefix = isPhoto ? "image/" : "video/";
    const maxMB = isPhoto ? 10 : 50;
    if (!file.type.startsWith(prefix)) {
      toast({ title: "Invalid file", description: `Please select a ${type} file.`, variant: "destructive" });
      return;
    }
    if (file.size > maxMB * 1024 * 1024) {
      toast({ title: "File too large", description: `${type === "photo" ? "Image" : "Video"} must be under ${maxMB}MB.`, variant: "destructive" });
      return;
    }
    setter(file);
  };

  const resetForm = () => {
    setCookDate(undefined);
    setRecipeType("");
    setPhoto(null);
    setVideo(null);
    if (photoRef.current) photoRef.current.value = "";
    if (videoRef.current) videoRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!cookDate) {
      toast({ title: "Missing date", description: "Please select a cooking date.", variant: "destructive" });
      return;
    }
    if (!recipeType) {
      toast({ title: "Missing recipe type", description: "Please select a recipe type.", variant: "destructive" });
      return;
    }
    if (!photo) {
      toast({ title: "Missing photo", description: "Please upload a cooking photo.", variant: "destructive" });
      return;
    }
    if (!video) {
      toast({ title: "Missing video", description: "Please upload a cooking video.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("cook_date", format(cookDate, "yyyy-MM-dd"));
      formData.append("created_by", user?.user_name || "");
      formData.append("recipe_type", recipeType);
      formData.append("cook_photo", photo);
      formData.append("cook_video", video);

      await cookingApi.submit(formData);
      toast({ title: "Success", description: "Cooking record submitted successfully." });
      resetForm();
    } catch (error) {
      toast({ title: "Error", description: "Failed to submit cooking record. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Cooking</h1>
        <p className="text-muted-foreground">Document cooking activities with recipe details and media evidence</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Log Cooking Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date Picker */}
          <div className="space-y-2">
            <Label>Cooking Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !cookDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {cookDate ? format(cookDate, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={cookDate}
                  onSelect={setCookDate}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Recipe Type */}
          <div className="space-y-2">
            <Label>Recipe Type *</Label>
            <Select value={recipeType} onValueChange={setRecipeType} disabled={isLoadingTypes}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={isLoadingTypes ? "Loading..." : "Select recipe type"} />
              </SelectTrigger>
              <SelectContent>
                {recipeTypes.map((rt) => (
                  <SelectItem key={rt.recipe_code} value={rt.recipe_type}>
                    {rt.recipe_type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Photo Upload */}
          <div className="space-y-2">
            <Label>Cooking Photo *</Label>
            <div
              onClick={() => photoRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors",
                photo ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/30"
              )}
            >
              <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, "photo", setPhoto)} />
              {photo ? (
                <div className="flex items-center justify-center gap-2 text-primary">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm font-medium">{photo.name}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Camera className="w-8 h-8" />
                  <span className="text-sm">Click to upload photo</span>
                  <span className="text-xs">JPG, PNG, WebP (max 10MB)</span>
                </div>
              )}
            </div>
          </div>

          {/* Video Upload */}
          <div className="space-y-2">
            <Label>Cooking Video *</Label>
            <div
              onClick={() => videoRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors",
                video ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/30"
              )}
            >
              <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={(e) => handleFileChange(e, "video", setVideo)} />
              {video ? (
                <div className="flex items-center justify-center gap-2 text-primary">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm font-medium">{video.name}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Video className="w-8 h-8" />
                  <span className="text-sm">Click to upload video</span>
                  <span className="text-xs">MP4, MOV, WebM (max 50MB)</span>
                </div>
              )}
            </div>
          </div>

          <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Submit Cooking Record
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default CookingPage;
