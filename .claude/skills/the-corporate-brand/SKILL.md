---
name: the-corporate-brand
description: The Corporate brand system for the Supplier Sustainability Portal 2026. Invoke for ANY UI work — landing page, Door Picker, S1–S7 stepper, both Review screens, and the Confirmation view. Enforces fonts, colour tokens, square corners, no shadows, and voice rules. No new visual patterns may be introduced outside this system.
---

# The Corporate — Brand System

Corporate minimalism: restraint over decoration. Precise, direct, composed,
authoritative. No gradients, no shadows, no rounded corners. Every new view
reuses the patterns already established on the landing page — do not invent new
visual language for the questionnaire flow.

## Typography

Import from the Google Fonts CDN.

| Role | Font | Weight |
|------|------|--------|
| Headlines | Playfair Display | 400 / 700 |
| Body | DM Sans | 300 |
| Labels / emphasis | DM Sans | 500 |

- Headlines use `Playfair Display, Georgia, serif`.
- Body and UI use `DM Sans, system-ui, sans-serif`.
- Labels, eyebrows, and buttons are uppercase with wide letter-spacing.

## Colour tokens

| Token | Hex | Use |
|-------|-----|-----|
| Ink | `#000000` | Primary text, dark surfaces, buttons |
| Stone | `#B6B09F` | Muted text, borders, secondary detail |
| Linen | `#EAE4D5` | Card / surface background |
| Chalk | `#F2F2F2` | Page background, text on Ink |
| White | `#FFFFFF` | Elevated card background |
| Acid Lime | `#C8F135` | Single accent — see rule below |

**Acid Lime rules (hard):**
- Maximum **2 uses per page**.
- Always against `#000000` (Ink). Never place Lime directly on a light
  background.

## Components

- **Buttons:** square corners (`border-radius: 0`), no shadows. Primary =
  Ink fill, Chalk text. Secondary = transparent, 0.5px Ink border. Ghost =
  transparent, 0.5px Stone border.
- **Cards:** square corners, `0.5px` Stone border, Linen or White background.
  Never a shadow.
- **Dividers:** `0.5px` Stone (or a translucent Stone) hairlines.
- **Links:** underline + Ink colour only. **No blue links.** No colour change
  on links other than Ink.

## Voice

- Short, declarative sentences. Active voice.
- No exclamation points. No emoji.
- Plain, authoritative, respectful of the reader's time.

## Scope

Applies equally to: the Door Picker cards, the S1–S7 stepper, the progress
indicator, both Review screens, and the Confirmation screen. If a pattern is
not already on the landing page, build it from these tokens — do not add a new
visual style.
