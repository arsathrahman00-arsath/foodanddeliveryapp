import React, { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { cleaningApi, CleaningType } from "@/lib/api";
import CameraCapture from "@/components/CameraCapture";

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

  const resetForm = () => {
    setCleanDate(undefined);
    setPhoto(null);
    setVideo(null);
  };

  const handleSubmit = async () => {
    if (!cleanDate) {
      toast({ title: "Missing date", description: "Please select a cleaning date.", variant: "destructive" });
      return;
    }
    if (!photo) {
      toast({ title: "Missing photo", description: "Please capture a cleaning photo.", variant: "destructive" });
      return;
    }
    if (!video) {
      toast({ title: "Missing video", description: "Please record a cleaning video.", variant: "destructive" });
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

          <CameraCapture
            mode="photo"
            label="Cleaning Photo *"
            onCapture={setPhoto}
            capturedFile={photo}
            onClear={() => setPhoto(null)}
          />

          <CameraCapture
            mode="video"
            label="Cleaning Video *"
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
