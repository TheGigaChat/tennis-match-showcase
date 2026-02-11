-- Add Cloudinary public_id for photo cleanup
ALTER TABLE photo
    ADD COLUMN public_id VARCHAR(512);
