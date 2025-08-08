use wasm_bindgen::prelude::*;
use image::{
    ImageFormat,
    imageops::{self, FilterType},
    DynamicImage,
    RgbaImage,
};
use std::io::Cursor;
use std::panic;

#[wasm_bindgen]
pub fn img2ico(buffer: &[u8], sizes: &[u32]) -> Result<Vec<u8>, JsValue> {
    panic::set_hook(Box::new(console_error_panic_hook::hook));

    let img = image::load_from_memory(buffer)
        .map_err(|e| JsValue::from_str(&format!("Failed to decode image: {}", e)))?;

    let mut png_buffers: Vec<Vec<u8>> = Vec::new();
    for &size in sizes {
        // Create a new transparent canvas of the target size
        let mut canvas = RgbaImage::new(size, size);

        // Scale the image to fit within the target size while maintaining aspect ratio
        let scaled_image = img.resize(size, size, FilterType::Lanczos3);

        // Calculate offsets to center the scaled image on the canvas
        let x = (size as i64 - scaled_image.width() as i64) / 2;
        let y = (size as i64 - scaled_image.height() as i64) / 2;

        // Overlay the scaled image onto the canvas
        imageops::overlay(&mut canvas, &scaled_image, x, y);

        let dynamic_canvas = DynamicImage::ImageRgba8(canvas);

        let mut png_buffer = Cursor::new(Vec::new());
        dynamic_canvas.write_to(&mut png_buffer, ImageFormat::Png)
            .map_err(|e| JsValue::from_str(&format!("Failed to encode frame to PNG: {}", e)))?;
        
        png_buffers.push(png_buffer.into_inner());
    }

    // --- ICO file structure ---
    // 1. ICONDIR header (6 bytes)
    // 2. ICONDIRENTRY for each image (16 bytes per image)
    // 3. Image data (PNG data for each image)

    let header_size = 6;
    let directory_entry_size = 16;
    let header_and_directory_size = header_size + png_buffers.len() * directory_entry_size;

    let mut ico_buf = Vec::with_capacity(header_and_directory_size + png_buffers.iter().map(|b| b.len()).sum::<usize>());

    // ICONDIR header
    ico_buf.extend_from_slice(&0u16.to_le_bytes()); // Reserved, must be 0
    ico_buf.extend_from_slice(&1u16.to_le_bytes()); // Image type: 1 for ICO
    ico_buf.extend_from_slice(&(png_buffers.len() as u16).to_le_bytes()); // Number of images

    let mut current_offset = header_and_directory_size as u32;

    for i in 0..png_buffers.len() {
        let png_buffer = &png_buffers[i];
        let size = sizes[i];

        // The size (width/height) in the ICONDIRENTRY is 1 byte.
        // A value of 0 means 256 pixels.
        // If the size is greater than 256, we set it to 0.
        let width = if size >= 256 { 0 } else { size as u8 };
        let height = if size >= 256 { 0 } else { size as u8 };
        let image_size_in_bytes = png_buffer.len() as u32;

        // ICONDIRENTRY
        ico_buf.push(width);         // bWidth
        ico_buf.push(height);        // bHeight
        ico_buf.push(0);             // bColorCount (0 for true color)
        ico_buf.push(0);             // bReserved
        ico_buf.extend_from_slice(&0u16.to_le_bytes());       // wPlanes (0 when using PNG)
        ico_buf.extend_from_slice(&0u16.to_le_bytes());       // wBitCount (0 when using PNG)
        ico_buf.extend_from_slice(&image_size_in_bytes.to_le_bytes()); // dwBytesInRes
        ico_buf.extend_from_slice(&current_offset.to_le_bytes()); // dwImageOffset

        current_offset += image_size_in_bytes;
    }

    // Append PNG data
    for png_buffer in png_buffers {
        ico_buf.extend_from_slice(&png_buffer);
    }

    Ok(ico_buf)
}
