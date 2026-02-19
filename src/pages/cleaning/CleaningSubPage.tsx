import React, { useState, useRef } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { cleaningApi, CleaningType } from "@/lib/api";

interface CleaningSubPageProps {
  type: CleaningType;
  title: string;
  description: string;
}

const CleaningSubPage: React.FC<CleaningSubPageProps> = ({ type, title, description }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cleanDate, setCleanDate] = useState<Date>();
  const [photo, setPhoto] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    fileType: "photo" | "video",
    setter: (f: File | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isPhoto = fileType === "photo";
    const prefix = isPhoto ? "image/" : "video/";
    const maxMB = isPhoto ? 10 : 50;
    if (!file.type.startsWith(prefix)) {
      toast({ title: "Invalid file", description: `Please select a ${fileType} file.`, variant: "destructive" });
      return;
    }
    if (file.size > maxMB * 1024 * 1024) {
      toast({ title: "File too large", description: `${isPhoto ? "Image" : "Video"} must be under ${maxMB}MB.`, variant: "destructive" });
      return;
    }
    setter(file);
  };

  const resetForm = () => {
    setCleanDate(undefined);
    setPhoto(null);
    setVideo(null);
    if (photoRef.current) photoRef.current.value = "";
    if (videoRef.current) videoRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!cleanDate) {
      toast({ title: "Missing date", description: "Please select a cleaning date.", variant: "destructive" });
      return;
    }
    if (!photo) {
      toast({ title: "Missing photo", description: "Please upload a cleaning photo.", variant: "destructive" });
      return;
    }
    if (!video) {
      toast({ title: "Missing video", description: "Please upload a cleaning video.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("clean_date", format(cleanDate, "yyyy-MM-dd"));
      formData.append("created_by", user?.user_name || "");
      formData.append("clean_photo", photo);
      formData.append("clean_video", video);

      await cleaningApi.submit(type, formData);
      toast({ title: "Success", description: `${title} record submitted successfully.` });
      resetForm();
    } catch (error) {
      toast({ title: "Error", description: "Failed to submit cleaning record. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Log {title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Cleaning Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !cleanDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {cleanDate ? format(cleanDate, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={cleanDate}
                  onSelect={setCleanDate}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Cleaning Photo *</Label>
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

          <div className="space-y-2">
            <Label>Cleaning Video *</Label>
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
                Submit {title}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default CleaningSubPage;
