import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { CalendarIcon, Upload, Loader2 } from "lucide-react";
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
import CameraCapture from "@/components/CameraCapture";

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

  const resetForm = () => {
    setCookDate(undefined);
    setRecipeType("");
    setPhoto(null);
    setVideo(null);
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
      toast({ title: "Missing photo", description: "Please capture a cooking photo.", variant: "destructive" });
      return;
    }
    if (!video) {
      toast({ title: "Missing video", description: "Please record a cooking video.", variant: "destructive" });
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

          <CameraCapture
            mode="photo"
            label="Cooking Photo *"
            onCapture={setPhoto}
            capturedFile={photo}
            onClear={() => setPhoto(null)}
          />

          <CameraCapture
            mode="video"
            label="Cooking Video *"
            onCapture={setVideo}
            capturedFile={video}
            onClear={() => setVideo(null)}
          />

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
