"use client";

import { AlertCircle, Link as LinkIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import type { GalleryMediaItem } from "~/ui/components/blocks/bento-media-gallery";

// Mock upload button component
const UploadButton = ({ endpoint, onClientUploadComplete, onUploadError }: { 
  endpoint: string; 
  onClientUploadComplete: (res: any) => void; 
  onUploadError: (error: Error) => void 
}) => {
  return (
    <Button 
      onClick={() => {
        // Mock successful upload
        setTimeout(() => {
          onClientUploadComplete([{ 
            name: 'mock-file.jpg',
            url: `https://picsum.photos/seed/${Math.random()}/800/600`
          }]);
        }, 1000);
      }}
    >
      Upload {endpoint === 'imageUploader' ? 'Image' : 'Video'}
    </Button>
  );
};
import { BentoMediaGallery } from "~/ui/components/blocks/bento-media-gallery";
import { Alert, AlertDescription, AlertTitle } from "~/ui/primitives/alert";
import { Button } from "~/ui/primitives/button";
import { Input } from "~/ui/primitives/input";
import { Skeleton } from "~/ui/primitives/skeleton";

export default function UploadsPageClient() {
  const [mediaGalleryItems, setMediaGalleryItems] = useState<
    GalleryMediaItem[]
  >([]);
  const [isMediaLoading, setIsMediaLoading] = useState(true);
  const [error, setError] = useState<null | string>(null);
  const [mediaUrlInput, setMediaUrlInput] = useState("");
  const [isUploadingFromUrl, setIsUploadingFromUrl] = useState(false);

  // Mock data for the media gallery
  const mockMediaItems = [
    {
      id: '1',
      type: 'image' as const,
      url: 'https://picsum.photos/seed/1/800/600',
      title: 'Image sample-1',
      desc: `Uploaded on ${new Date().toLocaleDateString()}`,
      span: 'md:col-span-1 md:row-span-2 sm:col-span-1 sm:row-span-2'
    },
    {
      id: '2',
      type: 'image' as const,
      url: 'https://picsum.photos/seed/2/800/600',
      title: 'Image sample-2',
      desc: `Uploaded on ${new Date().toLocaleDateString()}`,
      span: 'md:col-span-1 md:row-span-2 sm:col-span-1 sm:row-span-2'
    },
    {
      id: '3',
      type: 'image' as const,
      url: 'https://picsum.photos/seed/3/800/600',
      title: 'Image sample-3',
      desc: `Uploaded on ${new Date().toLocaleDateString()}`,
      span: 'md:col-span-1 md:row-span-2 sm:col-span-1 sm:row-span-2'
    },
    {
      id: '4',
      type: 'video' as const,
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      title: 'Video sample-1',
      desc: `Uploaded on ${new Date().toLocaleDateString()}`,
      span: 'md:col-span-1 md:row-span-2 sm:col-span-1 sm:row-span-2'
    }
  ];

  const loadMediaGallery = useCallback(async () => {
    setIsMediaLoading(true);
    setError(null);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Use mock data instead of fetching from API
      setMediaGalleryItems(mockMediaItems);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load media");
      setError(
        err instanceof Error ? err.message : "An unknown error occurred",
      );
    } finally {
      setIsMediaLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMediaGallery();
  }, [loadMediaGallery]);

  const uploadMediaFromUrl = async () => {
    if (!mediaUrlInput) return;

    setIsUploadingFromUrl(true);
    setError(null);

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Validate URL format
      const isValidUrl = /^(https?:\/\/)([\w-]+\.)+[\w-]+(\/[\w- ./?%&=]*)?$/.test(mediaUrlInput);
      if (!isValidUrl) {
        throw new Error("Please enter a valid URL");
      }

      // Add new mock item
      const newItem = {
        id: `url-${Date.now()}`,
        type: mediaUrlInput.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? 'image' as const : 'video' as const,
        url: mediaUrlInput,
        title: `${mediaUrlInput.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? 'Image' : 'Video'} from URL`,
        desc: `Uploaded on ${new Date().toLocaleDateString()}`,
        span: 'md:col-span-1 md:row-span-2 sm:col-span-1 sm:row-span-2'
      };
      
      setMediaGalleryItems(prev => [newItem, ...prev]);
      setMediaUrlInput("");
      toast.success("URL uploaded successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload from URL");
      setError(
        err instanceof Error ? err.message : "Failed to upload from URL",
      );
    } finally {
      setIsUploadingFromUrl(false);
    }
  };

  const deleteMediaItem = async (id: number | string) => {
    if (!confirm("Are you sure you want to delete this media?")) {
      return;
    }

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Remove item from state
      setMediaGalleryItems((prev) => prev.filter((item) => item.id !== id));
      toast.success("Media deleted successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete media");
      setError(err instanceof Error ? err.message : "Failed to delete media");
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex gap-4">
          <UploadButton
            endpoint="imageUploader"
            onClientUploadComplete={(res) => {
              console.log("Image(s) uploaded: ", res);
              void loadMediaGallery();
            }}
            onUploadError={(uploadError: Error) => {
              toast.error(`Image Upload ERROR! ${uploadError.message}`);
            }}
          />
          <UploadButton
            endpoint="videoUploader"
            onClientUploadComplete={(res) => {
              console.log("Video(s) uploaded: ", res);
              void loadMediaGallery();
            }}
            onUploadError={(uploadError: Error) => {
              toast.error(`Video Upload ERROR! ${uploadError.message}`);
            }}
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <LinkIcon
              className={`
                absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2 transform
                text-muted-foreground
              `}
            />
            <Input
              className="pl-8"
              onChange={(e) => setMediaUrlInput(e.target.value)}
              placeholder="Enter media URL (image or video)..."
              type="url"
              value={mediaUrlInput}
            />
          </div>
          <Button
            disabled={!mediaUrlInput || isUploadingFromUrl}
            onClick={uploadMediaFromUrl}
          >
            {isUploadingFromUrl ? "Uploading..." : "Upload URL"}
          </Button>
        </div>
      </div>
      <div>
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {isMediaLoading ? (
          <div
            className={`
              grid grid-cols-1 gap-4
              sm:grid-cols-2
              md:grid-cols-3
              lg:grid-cols-4
            `}
          >
            {[...Array(4)].map((_, i) => (
              <Skeleton
                className="aspect-square w-full rounded-md"
                key={`skeleton-${i}`}
              />
            ))}
          </div>
        ) : mediaGalleryItems.length > 0 ? (
          <BentoMediaGallery
            description="Explore your uploaded images and videos below."
            mediaItems={mediaGalleryItems}
            onDelete={deleteMediaItem}
            title="Your Uploaded Media"
          />
        ) : (
          !error && (
            <p className="text-muted-foreground">No media uploaded yet.</p>
          )
        )}
      </div>
    </div>
  );
}
