import os
from PIL import Image

def generate_icons():
    # Source image path
    source_path = "src/assets/brand/syndicate-source.png"
    
    # Output directory
    output_dir = "public"
    
    # Ensure output directory exists
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    # Icon sizes and names
    icons = [
        ("favicon.ico", (32, 32)),
        ("favicon-16x16.png", (16, 16)),
        ("favicon-32x32.png", (32, 32)),
        ("apple-touch-icon.png", (180, 180)),
        ("android-chrome-192x192.png", (192, 192)),
        ("android-chrome-512x512.png", (512, 512))
    ]
    
    try:
        # Open source image
        img = Image.open(source_path)
        
        # Convert to RGBA if not already
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
            
        print(f"Processing {source_path}...")
        
        for name, size in icons:
            output_path = os.path.join(output_dir, name)
            
            # Resize image
            # Use LANCZOS for high-quality downsampling
            resized_img = img.resize(size, Image.Resampling.LANCZOS)
            
            # Save image
            if name.endswith('.ico'):
                resized_img.save(output_path, format='ICO')
            else:
                resized_img.save(output_path, format='PNG')
                
            print(f"Generated {name} ({size[0]}x{size[1]})")
            
        print("Icon generation complete!")
        
    except Exception as e:
        print(f"Error generating icons: {str(e)}")

if __name__ == "__main__":
    generate_icons()
