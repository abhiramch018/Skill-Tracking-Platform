"""
Custom CAPTCHA generator — simple, readable math-challenge images using Pillow.
Stores answers in Django's cache framework (works across Gunicorn workers).
"""

import io
import random
import uuid
import base64
from PIL import Image, ImageDraw, ImageFont

from django.core.cache import cache

CAPTCHA_TTL = 300  # 5 minutes


def _cache_key(captcha_id):
    """Return a consistent cache key for the given captcha_id."""
    return f'captcha_{captcha_id}'


def _get_font(size=34):
    """Load the best available font, with cross-platform fallbacks."""
    font_paths = [
        # Linux (Render, Ubuntu, Debian)
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        # Windows
        "C:/Windows/Fonts/arialbd.ttf",
        "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/verdana.ttf",
        # macOS
        "/System/Library/Fonts/Helvetica.ttc",
    ]
    for fp in font_paths:
        try:
            return ImageFont.truetype(fp, size)
        except (IOError, OSError):
            continue

    # Pillow >= 10.1 supports size parameter
    try:
        return ImageFont.load_default(size=size)
    except TypeError:
        return ImageFont.load_default()


def generate_captcha():
    """
    Generate a simple math-based CAPTCHA image.
    Returns (captcha_id: str, image_base64: str).
    """
    # ── Simple addition, small numbers ──
    a = random.randint(1, 9)
    b = random.randint(1, 9)
    answer = a + b
    challenge_text = f"{a} + {b} = ?"

    # ── Create image ──
    width, height = 200, 70
    bg_color = (245, 247, 250)
    img = Image.new('RGB', (width, height), bg_color)
    draw = ImageDraw.Draw(img)

    font = _get_font(34)

    # ── Light background lines (subtle noise) ──
    for _ in range(random.randint(2, 3)):
        x1, y1 = random.randint(0, width), random.randint(0, height)
        x2, y2 = random.randint(0, width), random.randint(0, height)
        draw.line([(x1, y1), (x2, y2)], fill=(200, 210, 225), width=1)

    # ── Draw text centered, clean and bold ──
    bbox = draw.textbbox((0, 0), challenge_text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    x = (width - text_w) // 2
    y = (height - text_h) // 2

    # Dark readable color
    text_color = (
        random.randint(30, 70),
        random.randint(30, 70),
        random.randint(80, 130),
    )
    draw.text((x, y), challenge_text, fill=text_color, font=font)

    # ── Small dots for mild texture ──
    for _ in range(30):
        dx, dy = random.randint(0, width - 1), random.randint(0, height - 1)
        draw.point((dx, dy), fill=(180, 190, 210))

    # ── Encode as base64 PNG ──
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    image_b64 = base64.b64encode(buffer.read()).decode('utf-8')

    # ── Store answer in Django cache (shared across workers) ──
    captcha_id = str(uuid.uuid4())
    cache.set(_cache_key(captcha_id), str(answer), timeout=CAPTCHA_TTL)

    return captcha_id, image_b64


def verify_captcha(captcha_id: str, user_answer: str) -> bool:
    """
    Verify the user's answer for a given captcha_id.
    Each captcha can only be used once (consumed on verification attempt).
    """
    if not captcha_id or not user_answer:
        return False

    # Fetch and delete from cache (one-time use)
    correct_answer = cache.get(_cache_key(captcha_id))
    if correct_answer is None:
        return False

    # Delete so it can't be reused
    cache.delete(_cache_key(captcha_id))

    return user_answer.strip() == correct_answer
