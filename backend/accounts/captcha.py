"""
Custom CAPTCHA generator — simple, readable math-challenge images using Pillow.
Stores answers in-memory with expiration (5 minutes).
"""

import io
import random
import uuid
import time
import base64
import threading
from PIL import Image, ImageDraw, ImageFont


# ── In-memory store: { captcha_id: (answer, created_at) }
_captcha_store = {}
_store_lock = threading.Lock()
CAPTCHA_TTL = 300  # 5 minutes


def _cleanup_expired():
    """Remove expired captcha entries."""
    now = time.time()
    expired = [k for k, (_, ts) in _captcha_store.items() if now - ts > CAPTCHA_TTL]
    for k in expired:
        _captcha_store.pop(k, None)


def generate_captcha():
    """
    Generate a simple math-based CAPTCHA image.
    Returns (captcha_id: str, image_base64: str).
    """
    # ── Simple addition only, small numbers ──
    a = random.randint(1, 9)
    b = random.randint(1, 9)
    answer = a + b
    challenge_text = f"{a} + {b} = ?"

    # ── Create image ──
    width, height = 200, 70
    bg_color = (245, 247, 250)
    img = Image.new('RGB', (width, height), bg_color)
    draw = ImageDraw.Draw(img)

    # ── Load font ──
    font = None
    font_paths = [
        "C:/Windows/Fonts/arialbd.ttf",
        "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/verdana.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    ]
    for fp in font_paths:
        try:
            font = ImageFont.truetype(fp, 34)
            break
        except (IOError, OSError):
            continue

    if font is None:
        try:
            font = ImageFont.load_default(size=28)
        except TypeError:
            font = ImageFont.load_default()

    # ── Light background lines (just 2-3, subtle) ──
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
    text_color = (random.randint(30, 70), random.randint(30, 70), random.randint(80, 130))
    draw.text((x, y), challenge_text, fill=text_color, font=font)

    # ── A few small dots for mild texture ──
    for _ in range(30):
        dx, dy = random.randint(0, width - 1), random.randint(0, height - 1)
        draw.point((dx, dy), fill=(180, 190, 210))

    # ── Encode as base64 PNG ──
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    image_b64 = base64.b64encode(buffer.read()).decode('utf-8')

    # ── Store answer ──
    captcha_id = str(uuid.uuid4())
    with _store_lock:
        _cleanup_expired()
        _captcha_store[captcha_id] = (str(answer), time.time())

    return captcha_id, image_b64


def verify_captcha(captcha_id: str, user_answer: str) -> bool:
    """
    Verify the user's answer for a given captcha_id.
    Each captcha can only be used once (consumed on verification attempt).
    """
    if not captcha_id or not user_answer:
        return False

    with _store_lock:
        entry = _captcha_store.pop(captcha_id, None)

    if entry is None:
        return False

    correct_answer, created_at = entry

    # Check expiration
    if time.time() - created_at > CAPTCHA_TTL:
        return False

    return user_answer.strip() == correct_answer
