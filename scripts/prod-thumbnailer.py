#!/usr/bin/env python3
"""prod-thumbnailer.py — Generate thumbnail for .prod files.

Usage: prod-thumbnailer.py [size] [input.prod] [output.png]

Follows the Freedesktop thumbnailer spec:
  Exec=prod-thumbnailer -s %s %i %o

Where %s = size (pixels), %i = input file, %o = output file path.
"""

import struct
import json
import os
import sys
import io
import PIL.Image
import PIL.ImageDraw
import PIL.ImageFont
import urllib.parse


MAGIC = b"PROD\x02"


def get_first_photo(prod_path: str) -> bytes | None:
    """Extract the first embedded photo from a .prod file."""
    try:
        with open(prod_path, "rb") as f:
            magic = f.read(len(MAGIC))
            if magic != MAGIC:
                return None

            hdr_len = struct.unpack("<I", f.read(4))[0]
            f.seek(4 + hdr_len, os.SEEK_CUR)  # skip header json

            # Skip price history
            if f.read(1) != b"\x00":
                price_count = struct.unpack("<I", f.read(4))[0]
                # Each price record: 8 (ts) + 4 (var_idx) + 8 (price) + var_len bytes
                for _ in range(price_count):
                    f.read(8 + 4 + 8)
                    var_len = struct.unpack("<I", f.read(4))[0]
                    f.read(var_len)
            else:
                f.read(1)  # consume the flag byte we already peeked

            # Photos: 4-byte count, then offset table, then data
            raw = f.read(4)
            if len(raw) < 4:
                return None
            photo_count = struct.unpack("<I", raw)[0]
            if photo_count == 0:
                return None

            # Skip offset table (photo_count * 4 bytes)
            f.seek(photo_count * 4, os.SEEK_CUR)

            # Read first photo: 4-byte length + data
            raw = f.read(4)
            if len(raw) < 4:
                return None
            photo_len = struct.unpack("<I", raw)[0]
            if photo_len == 0 or photo_len > 50_000_000:  # sanity: max 50MB
                return None
            return f.read(photo_len)
    except Exception:
        return None


def main():
    if len(sys.argv) < 4:
        print(f"Usage: {sys.argv[0]} size input.prod output.png", file=sys.stderr)
        sys.exit(1)

    size_arg = sys.argv[1]
    if size_arg.startswith("-s"):
        size_arg = size_arg[2:]

    try:
        size = int(size_arg)
    except ValueError:
        # Could be "-s %s" placeholder — default to 256
        size = 256

    input_path = sys.argv[2]
    # Handle file:// URIs (Freedesktop spec passes %i as URI)
    if input_path.startswith("file://"):
        input_path = urllib.parse.unquote(input_path[7:])
    output_path = sys.argv[3]

    if not os.path.isfile(input_path):
        sys.exit(1)

    photo_data = get_first_photo(input_path)
    if not photo_data:
        # No photo — create a placeholder thumbnail with the product title
        try:
            with open(input_path, "rb") as f:
                magic = f.read(len(MAGIC))
                if magic != MAGIC:
                    sys.exit(1)
                hdr_len = struct.unpack("<I", f.read(4))[0]
                hdr_buf = f.read(hdr_len)
                raw = json.loads(hdr_buf.decode("utf-8", errors="replace"))
                title = raw.get("title", "PROD")
                code = raw.get("code", "")
        except Exception:
            title = "PROD"
            code = ""

        img = PIL.Image.new("RGB", (size, size), (240, 240, 240))
        draw = PIL.ImageDraw.Draw(img)
        # Use default font if available, otherwise minimal text
        try:
            font = PIL.ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", size=max(12, size // 10))
        except Exception:
            font = PIL.ImageFont.load_default()
        # Draw file type badge
        text = ".prod"
        bbox = draw.textbbox((0, 0), text, font=font)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        draw.text(((size - tw) // 2, (size - th) // 2), text, fill=(180, 180, 180), font=font)
        # Draw title if present
        if title:
            short_title = title[:30]
            bbox2 = draw.textbbox((0, 0), short_title, font=font)
            tw2 = bbox2[2] - bbox2[0]
            draw.text(((size - tw2) // 2, size - th - 8), short_title, fill=(80, 80, 80), font=font)

        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        img.save(output_path, "PNG")
        sys.exit(0)

    try:
        img = PIL.Image.open(io.BytesIO(photo_data))
    except Exception:
        sys.exit(1)

    # Convert to RGB if needed
    if img.mode not in ("RGB", "RGBA"):
        img = img.convert("RGBA")

    # Square-crop the center and resize
    w, h = img.size
    if w != h:
        min_dim = min(w, h)
        left = (w - min_dim) // 2
        top = (h - min_dim) // 2
        img = img.crop((left, top, left + min_dim, top + min_dim))

    img = img.resize((size, size), PIL.Image.LANCZOS)

    # Ensure RGB for output
    if img.mode == "RGBA":
        bg = PIL.Image.new("RGB", img.size, (255, 255, 255))
        bg.paste(img, mask=img.split()[3])
        img = bg

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    img.save(output_path, "PNG")
    sys.exit(0)


if __name__ == "__main__":
    main()
