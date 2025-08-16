import React, { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { fileApi } from '../api/endpoints';
import { X, User, Camera } from 'lucide-react';

interface ProfileImageUploadProps {
  currentImageId?: number;
  onImageChange: (imageId: number | null) => void;
  disabled?: boolean;
}

const ProfileImageUpload: React.FC<ProfileImageUploadProps> = ({
  currentImageId,
  onImageChange,
  disabled = false,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedImageId, setUploadedImageId] = useState<number | null>(currentImageId || null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load current image when currentImageId changes
  useEffect(() => {
    if (currentImageId && currentImageId !== uploadedImageId) {
      setUploadedImageId(currentImageId);
      // Ensure parent state is in sync
      onImageChange(currentImageId);
      // Load the current image
      fileApi.download(currentImageId)
        .then(url => {
          setCurrentImageUrl(url);
          setPreviewUrl(null); // Clear preview if showing current image
        })
        .catch(error => {
          console.error('Error loading current image:', error);
          setCurrentImageUrl(null);
        });
    } else if (!currentImageId) {
      setCurrentImageUrl(null);
      setUploadedImageId(null);
      // Ensure parent state is in sync
      onImageChange(null);
    }
  }, [currentImageId, uploadedImageId]);

  const uploadMutation = useMutation({
    mutationFn: (file: File) => fileApi.upload(file),
    onSuccess: (response) => {
      setUploadedImageId(response.id);
      onImageChange(response.id);
      setCurrentImageUrl(null); // Clear current image when new one is uploaded
    },
    onError: (error: any) => {
      console.error('Error uploading file:', error);
      alert('Error al subir la imagen: ' + (error.response?.data?.detail || error.message));
      setPreviewUrl(null);
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no puede ser mayor a 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    uploadMutation.mutate(file);
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    setCurrentImageUrl(null);
    setUploadedImageId(null);
    onImageChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        {/* Image Preview */}
        <div className="w-24 h-24 rounded-full border-2 border-gray-300 bg-gray-100 flex items-center justify-center overflow-hidden">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          ) : currentImageUrl ? (
            <img
              src={currentImageUrl}
              alt="Current profile"
              className="w-full h-full object-cover"
            />
          ) : uploadedImageId ? (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <User className="w-8 h-8 text-gray-400" />
            </div>
          ) : (
            <User className="w-8 h-8 text-gray-400" />
          )}
        </div>

        {/* Upload/Camera Button */}
        {!disabled && (
          <button
            type="button"
            onClick={handleUploadClick}
            className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center text-white shadow-lg transition-colors"
            title="Cambiar foto"
          >
            <Camera className="w-4 h-4" />
          </button>
        )}

        {/* Remove Button */}
        {(previewUrl || currentImageUrl || uploadedImageId) && !disabled && (
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center text-white shadow-lg transition-colors"
            title="Quitar foto"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Upload Status */}
      {uploadMutation.isPending && (
        <div className="text-sm text-blue-600 flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span>Subiendo imagen...</span>
        </div>
      )}

      {/* Instructions */}
      {!disabled && (
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Haz clic en la cámara para subir una foto de perfil
          </p>
          <p className="text-xs text-gray-400 mt-1">
            JPG, PNG o GIF. Máximo 5MB.
          </p>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
};

export default ProfileImageUpload;
